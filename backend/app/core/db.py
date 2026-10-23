"""Async SQLAlchemy 2.0 engine, session factory and declarative base with sync mixins."""
import threading
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, MetaData, String, false, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import get_settings

settings = get_settings()

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

engine = create_async_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False,
)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency. Callers commit explicitly; uncommitted work is rolled back."""
    async with SessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


# --------------------------------------------------------------------------------------
# Monotonic server clock. Every write is stamped with a strictly increasing timestamp so
# the delta-pull cursor (updated_at > since) can never skip rows that tie on the same
# microsecond within this process.
# --------------------------------------------------------------------------------------
_clock_lock = threading.Lock()
_last_stamp = datetime.min.replace(tzinfo=UTC)


def next_server_ts() -> datetime:
    global _last_stamp
    with _clock_lock:
        now = datetime.now(UTC)
        if now <= _last_stamp:
            now = _last_stamp + timedelta(microseconds=1)
        _last_stamp = now
        return now


def enum_column(enum_cls: type[Enum], **kwargs):
    """VARCHAR-backed enum column validated by SQLAlchemy at flush time."""
    return mapped_column(
        SAEnum(
            enum_cls,
            native_enum=False,
            length=32,
            validate_strings=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        **kwargs,
    )


def tenant_index(table_name: str) -> Index:
    """(property_id, updated_at) powers the tenant-scoped delta pull."""
    return Index(f"ix_{table_name}_tenant_updated", "property_id", "updated_at")


class SyncColumnsMixin:
    """Primary key + the three sync columns required by the offline-first protocol."""

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=next_server_ts
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=next_server_ts,
        onupdate=next_server_ts,
        index=True,
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    # 'SYNCED' | 'PENDING_PUSH'. Rows on the server are always SYNCED; the column exists so
    # the schema mirrors the client's Drift tables 1:1.
    sync_status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="SYNCED", server_default=text("'SYNCED'")
    )
    # Client wall-clock of the last accepted mutation; used for last-write-wins arbitration.
    client_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TenantMixin(SyncColumnsMixin):
    """Adds multi-tenant isolation to every business table."""

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True
    )
