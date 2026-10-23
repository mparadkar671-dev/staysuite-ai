"""JWT issuing/validation, password hashing and role-based access control."""
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_session
from app.core.enums import Role
from app.modules.properties.models import User

settings = get_settings()
_bearer = HTTPBearer(auto_error=False)

# Used to burn equal CPU time when a login names an unknown user (anti-enumeration).
_DUMMY_HASH = bcrypt.hashpw(b"staysuite-dummy", bcrypt.gensalt()).decode()


@dataclass(frozen=True)
class Principal:
    user_id: uuid.UUID
    property_id: uuid.UUID
    role: Role


TokenPayload = Principal


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str | None) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), (password_hash or _DUMMY_HASH).encode()) and password_hash is not None
    except ValueError:
        return False


def create_token(
    *,
    user_id: uuid.UUID,
    property_id: uuid.UUID,
    role: Role | str,
    token_type: str,
    business_category: str | None = None,
    staff_member_id: uuid.UUID | None = None,
    enabled_features: list[str] | None = None,
) -> tuple[str, int]:
    """Returns (jwt, ttl_seconds)."""
    ttl = (
        timedelta(minutes=settings.access_token_minutes)
        if token_type == "access"
        else timedelta(days=settings.refresh_token_days)
    )
    now = datetime.now(UTC)
    role_str = role.value if hasattr(role, "value") else str(role)
    claims = {
        "sub": str(user_id),
        "pid": str(property_id),
        "tenant_id": str(property_id),
        "role": role_str,
        "typ": token_type,
        "business_category": business_category,
        "staff_member_id": str(staff_member_id) if staff_member_id else None,
        "enabled_features": enabled_features or [],
        "iat": now,
        "exp": now + ttl,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm=settings.jwt_algorithm), int(ttl.total_seconds())


def decode_token(token: str, expected_type: str = "access") -> dict:
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired", headers={"WWW-Authenticate": "Bearer"})
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token", headers={"WWW-Authenticate": "Bearer"})
    if claims.get("typ") != expected_type:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong token type", headers={"WWW-Authenticate": "Bearer"})
    return claims


async def resolve_principal(session: AsyncSession, token: str, expected_type: str = "access") -> Principal:
    """Validates the JWT and re-checks the user row so deactivation / role changes apply at once."""
    claims = decode_token(token, expected_type)
    try:
        user_id = uuid.UUID(claims["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    row = (
        await session.execute(
            select(User.property_id, User.role, User.is_active, User.is_deleted).where(User.id == user_id)
        )
    ).one_or_none()
    if row is None or not row.is_active or row.is_deleted:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account disabled")
    return Principal(user_id=user_id, property_id=row.property_id, role=row.role)


async def get_current_principal(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> Principal:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    return await resolve_principal(session, creds.credentials)


get_current_token = get_current_principal


def require_roles(*roles: Role) -> Callable[..., Principal]:
    allowed = frozenset(roles)

    async def _dependency(principal: Principal = Depends(get_current_principal)) -> Principal:
        if principal.role not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return principal

    return _dependency
