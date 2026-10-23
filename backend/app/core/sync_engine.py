"""Offline-first sync protocol.

POST /api/v1/sync/push   - atomically applies a device's chronological outbox batch.
GET  /api/v1/sync/pull   - delta pull of rows changed since a cursor.
WS   /api/v1/ws/{property_id} - real-time "something changed, pull now" notifications.

Design notes
* Tenant isolation: every query is scoped to the caller's JWT `property_id`; client-supplied
  `property_id` values are ignored.
* Idempotency: each mutation carries a client-generated UUID recorded in `sync_mutation_log`,
  so a retried batch can never double-apply.
* One bad mutation never blocks the queue: each runs in a SAVEPOINT and is reported as
  REJECTED while the rest of the batch commits in a single PostgreSQL transaction.
* Conflicts are last-write-wins by the client's wall-clock (`client_updated_at`, clamped to
  server-now + max skew). Losing mutations are reported as STALE; the next pull delivers the
  winning row. Payloads are partial (changed columns only) so concurrent edits to different
  columns of the same record from one device sequence merge cleanly.
* Deletes are tombstones (`is_deleted = true`) so other devices learn about them on pull.
* `updated_at` is stamped by the server (monotonic clock), never by clients.
"""
import asyncio
import json
import logging
import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field
from sqlalchemy import JSON, select
from sqlalchemy import Enum as SAEnum
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import SessionFactory, get_session, next_server_ts
from app.core.enums import Role
from app.core.realtime import hub
from app.core.security import Principal, get_current_principal, resolve_principal
from app.core.sync_models import SyncMutationLog
from app.core.sync_registry import REGISTRY, SERVER_MANAGED, TableSpec

logger = logging.getLogger("staysuite.sync")
settings = get_settings()

router = APIRouter(prefix="/sync", tags=["sync"])
ws_router = APIRouter(tags=["sync"])

EPOCH = datetime(1970, 1, 1, tzinfo=UTC)


# ======================================================================================
# Schemas
# ======================================================================================
class Mutation(BaseModel):
    mutation_id: uuid.UUID
    table: str = Field(max_length=64)
    op: Literal["UPSERT", "DELETE"]
    record_id: uuid.UUID
    payload: dict[str, Any] = Field(default_factory=dict)
    client_updated_at: datetime | None = None


class PushRequest(BaseModel):
    device_id: str = Field(min_length=1, max_length=64)
    mutations: list[Mutation] = Field(max_length=settings.sync_max_push_batch)


class MutationResult(BaseModel):
    mutation_id: uuid.UUID
    status: Literal["APPLIED", "STALE", "REJECTED"]
    duplicate: bool = False
    error: str | None = None
    server_updated_at: datetime | None = None


class PushResponse(BaseModel):
    server_time: datetime
    results: list[MutationResult]


class PullResponse(BaseModel):
    server_time: datetime
    next_since: datetime
    has_more: bool
    changes: dict[str, list[dict[str, Any]]]


# ======================================================================================
# Value coercion / serialisation
# ======================================================================================
class MutationRejected(Exception):
    """Raised for a single invalid mutation; the batch continues."""


def _coerce(column, value: Any) -> Any:
    if value is None:
        if not column.nullable:
            raise MutationRejected(f"NULL_NOT_ALLOWED:{column.name}")
        return None
    col_type = column.type
    try:
        if isinstance(col_type, SAEnum):
            return col_type.enum_class(value)
        if isinstance(col_type, JSON):
            if not isinstance(value, (dict, list)):
                raise ValueError
            return value
        py = col_type.python_type
        if py is uuid.UUID:
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        if py is datetime:
            parsed = value if isinstance(value, datetime) else datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed
        if py is date:
            return date.fromisoformat(str(value)[:10])
        if py is Decimal:
            if isinstance(value, bool):
                raise ValueError
            number = Decimal(str(value))
            if not number.is_finite():
                raise ValueError
            return number
        if py is bool:
            if not isinstance(value, bool):
                raise ValueError
            return value
        if py is int:
            if isinstance(value, bool) or not isinstance(value, int):
                raise ValueError
            return value
        if py is str:
            if not isinstance(value, str):
                raise ValueError
            if getattr(col_type, "length", None) and len(value) > col_type.length:
                raise ValueError
            return value
    except (ValueError, TypeError, ArithmeticError, NotImplementedError):
        raise MutationRejected(f"INVALID_VALUE:{column.name}") from None
    return value


def _jsonable(value: Any) -> Any:
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, Enum):
        return value.value
    return value


def _serialize(spec: TableSpec, row: Any, role: Role) -> dict[str, Any]:
    hidden = spec.hidden_columns.get(role, frozenset())
    return {
        column.name: _jsonable(getattr(row, column.name))
        for column in spec.model.__table__.columns
        if column.name not in hidden
    }


_required_cache: dict[str, tuple[str, ...]] = {}


def _required_columns(spec: TableSpec) -> tuple[str, ...]:
    cached = _required_cache.get(spec.name)
    if cached is None:
        cached = tuple(
            c.name
            for c in spec.model.__table__.columns
            if c.name not in SERVER_MANAGED
            and c.name not in spec.readonly_columns
            and not c.nullable
            and c.default is None
            and c.server_default is None
        )
        _required_cache[spec.name] = cached
    return cached


# ======================================================================================
# Push
# ======================================================================================
async def _apply_one(
    session: AsyncSession, principal: Principal, mutation: Mutation
) -> tuple[Literal["APPLIED", "STALE"], datetime | None]:
    spec = REGISTRY.get(mutation.table)
    if spec is None:
        raise MutationRejected("UNKNOWN_TABLE")
    role = principal.role
    if role not in spec.write_roles:
        raise MutationRejected("FORBIDDEN_ROLE")

    model = spec.model
    row = (
        await session.execute(
            select(model)
            .where(model.id == mutation.record_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()
    if row is not None and row.property_id != principal.property_id:
        raise MutationRejected("FORBIDDEN_TENANT")

    now = datetime.now(UTC)
    ceiling = now + timedelta(seconds=settings.sync_max_client_clock_skew_seconds)
    client_ts = min(mutation.client_updated_at or now, ceiling)
    if client_ts.tzinfo is None:
        client_ts = client_ts.replace(tzinfo=UTC)

    # ---- DELETE -------------------------------------------------------------------
    if mutation.op == "DELETE":
        if not spec.allow_delete or spec.is_limited(role):
            raise MutationRejected("DELETE_NOT_ALLOWED")
        if row is None or row.is_deleted:
            return "APPLIED", None
        if row.client_updated_at and client_ts < row.client_updated_at:
            return "STALE", None
        row.is_deleted = True
        row.client_updated_at = client_ts
        row.updated_at = next_server_ts()
        await session.flush()
        return "APPLIED", row.updated_at

    # ---- UPSERT -------------------------------------------------------------------
    payload = {
        k: v for k, v in mutation.payload.items() if k not in SERVER_MANAGED and k not in spec.readonly_columns
    }
    allowed = spec.writable_for(role)
    unknown = set(payload) - spec.column_names
    if unknown:
        raise MutationRejected(f"UNKNOWN_COLUMNS:{','.join(sorted(unknown))}")
    forbidden = set(payload) - allowed
    if forbidden:
        raise MutationRejected(f"FORBIDDEN_COLUMNS:{','.join(sorted(forbidden))}")

    columns = spec.model.__table__.columns
    values = {name: _coerce(columns[name], raw) for name, raw in payload.items()}

    if row is None:
        if not spec.allow_create or spec.is_limited(role):
            raise MutationRejected("CREATE_NOT_ALLOWED")
        missing = [c for c in _required_columns(spec) if c not in values]
        if missing:
            raise MutationRejected(f"MISSING_FIELDS:{','.join(missing)}")
        if spec.before_write:
            spec.before_write(values, None)
        row = model(id=mutation.record_id, property_id=principal.property_id, client_updated_at=client_ts, **values)
        session.add(row)
    else:
        if row.is_deleted:
            return "STALE", None
        if row.client_updated_at and client_ts < row.client_updated_at:
            return "STALE", None
        if spec.before_write:
            spec.before_write(values, row)
        for name, value in values.items():
            setattr(row, name, value)
        row.client_updated_at = client_ts
        row.updated_at = next_server_ts()
    await session.flush()
    return "APPLIED", row.updated_at


async def apply_push(session: AsyncSession, principal: Principal, request: PushRequest) -> tuple[PushResponse, set[str]]:
    ids = [m.mutation_id for m in request.mutations]
    prior: dict[uuid.UUID, SyncMutationLog] = {}
    if ids:
        logs = (await session.execute(select(SyncMutationLog).where(SyncMutationLog.mutation_id.in_(ids)))).scalars()
        prior = {log.mutation_id: log for log in logs}

    results: list[MutationResult] = []
    touched: set[str] = set()
    seen: set[uuid.UUID] = set()

    for mutation in request.mutations:
        previous = prior.get(mutation.mutation_id)
        if previous is not None:
            if previous.property_id != principal.property_id:
                results.append(MutationResult(mutation_id=mutation.mutation_id, status="REJECTED", error="MUTATION_ID_COLLISION"))
            else:
                results.append(
                    MutationResult(mutation_id=mutation.mutation_id, status=previous.status, duplicate=True, error=previous.error)
                )
            continue
        if mutation.mutation_id in seen:
            results.append(MutationResult(mutation_id=mutation.mutation_id, status="APPLIED", duplicate=True))
            continue
        seen.add(mutation.mutation_id)

        outcome: Literal["APPLIED", "STALE", "REJECTED"]
        error: str | None = None
        server_ts: datetime | None = None
        try:
            async with session.begin_nested():
                outcome, server_ts = await _apply_one(session, principal, mutation)
        except MutationRejected as exc:
            outcome, error = "REJECTED", str(exc)
        except (IntegrityError, DBAPIError) as exc:
            logger.info("mutation %s rejected by database: %s", mutation.mutation_id, exc.__class__.__name__)
            outcome, error = "REJECTED", "DB_CONSTRAINT_VIOLATION"

        if outcome == "APPLIED" and server_ts is not None:
            touched.add(mutation.table)
        session.add(
            SyncMutationLog(
                mutation_id=mutation.mutation_id,
                property_id=principal.property_id,
                device_id=request.device_id,
                table_name=mutation.table[:64],
                record_id=mutation.record_id,
                status=outcome,
                error=error,
            )
        )
        results.append(
            MutationResult(
                mutation_id=mutation.mutation_id, status=outcome, error=error, server_updated_at=server_ts
            )
        )
    await session.flush()
    return PushResponse(server_time=datetime.now(UTC), results=results), touched


@router.post("/push", response_model=PushResponse)
async def push(
    request: PushRequest,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> PushResponse:
    response, touched = await apply_push(session, principal, request)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Concurrent push of the same mutations; retry")
    if touched:
        try:
            await hub.broadcast(
                principal.property_id,
                {
                    "type": "sync.changed",
                    "tables": sorted(touched),
                    "origin_device_id": request.device_id,
                    "server_time": response.server_time.isoformat(),
                },
            )
        except Exception:
            logger.warning("broadcast failed after push", exc_info=True)
    return response


# ======================================================================================
# Pull
# ======================================================================================
@router.get("/pull", response_model=PullResponse)
async def pull(
    since: datetime | None = Query(None, description="Exclusive lower bound; omit for a full initial sync"),
    limit: int = Query(500, ge=1, le=2000, description="Max rows per response across all tables"),
    tables: str | None = Query(None, description="Comma-separated table filter"),
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
) -> PullResponse:
    server_time = datetime.now(UTC)
    cursor = since or EPOCH
    if cursor.tzinfo is None:
        cursor = cursor.replace(tzinfo=UTC)

    wanted = {t.strip() for t in tables.split(",")} if tables else None
    specs = [
        s
        for s in REGISTRY.values()
        if principal.role in s.read_roles and (wanted is None or s.name in wanted)
    ]

    fetched: list[tuple[datetime, str, str, TableSpec, Any]] = []
    for spec in specs:
        model = spec.model
        rows = (
            await session.execute(
                select(model)
                .where(model.property_id == principal.property_id, model.updated_at > cursor)
                .order_by(model.updated_at, model.id)
                .limit(limit + 1)
            )
        ).scalars()
        fetched.extend((r.updated_at, spec.name, str(r.id), spec, r) for r in rows)

    fetched.sort(key=lambda item: (item[0], item[1], item[2]))
    has_more = len(fetched) > limit
    page = fetched[:limit]
    if has_more:
        # Never split rows that share the boundary timestamp across two pages.
        boundary = page[-1][0]
        page.extend(item for item in fetched[limit:] if item[0] == boundary)
        next_since = boundary
    else:
        next_since = max(cursor, server_time - timedelta(seconds=settings.sync_pull_overlap_seconds))

    changes: dict[str, list[dict[str, Any]]] = {}
    for _, name, _, spec, row in page:
        changes.setdefault(name, []).append(_serialize(spec, row, principal.role))
    return PullResponse(server_time=server_time, next_since=next_since, has_more=has_more, changes=changes)


# ======================================================================================
# WebSocket
# ======================================================================================
@ws_router.websocket("/ws/{property_id}")
async def property_events(websocket: WebSocket, property_id: uuid.UUID) -> None:
    """First client frame must be {"type": "auth", "token": "<access JWT>"} within 10 seconds.

    Authenticating in-band keeps tokens out of URLs and server logs.
    """
    await websocket.accept()
    try:
        message = json.loads(await asyncio.wait_for(websocket.receive_text(), timeout=10))
        if message.get("type") != "auth" or not isinstance(message.get("token"), str):
            raise ValueError("auth frame required")
        async with SessionFactory() as session:
            principal = await resolve_principal(session, message["token"])
    except (asyncio.TimeoutError, ValueError, KeyError, HTTPException, WebSocketDisconnect):
        await _safe_close(websocket, 4401)
        return
    if principal.property_id != property_id:
        await _safe_close(websocket, 4403)
        return

    hub.register(property_id, websocket)
    try:
        await websocket.send_text(json.dumps({"type": "ready", "server_time": datetime.now(UTC).isoformat()}))
        while True:
            frame = await websocket.receive_text()
            if frame == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        hub.unregister(property_id, websocket)


async def _safe_close(websocket: WebSocket, code: int) -> None:
    try:
        await websocket.close(code=code)
    except RuntimeError:
        pass
