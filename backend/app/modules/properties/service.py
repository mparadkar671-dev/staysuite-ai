import asyncio
import re
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.enums import PlanTier, Role
from app.core.security import create_token, hash_password, verify_password
from app.modules.properties.models import Property, User
from app.modules.properties.schemas import (
    CreateUserRequest,
    LoginRequest,
    RegisterOwnerRequest,
    TokenResponse,
)
from app.plugins import default_business_config

settings = get_settings()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:60] or "property"


async def _unique_slug(session: AsyncSession, base: str) -> str:
    candidate = base
    while (await session.execute(select(Property.id).where(Property.slug == candidate))).first() is not None:
        candidate = f"{base}-{secrets.token_hex(2)}"
    return candidate


def issue_tokens(user: User) -> TokenResponse:
    access, ttl = create_token(user_id=user.id, property_id=user.property_id, role=user.role, token_type="access")
    refresh, _ = create_token(user_id=user.id, property_id=user.property_id, role=user.role, token_type="refresh")
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=ttl,
        user_id=user.id,
        property_id=user.property_id,
        role=user.role,
    )


async def register_owner(session: AsyncSession, data: RegisterOwnerRequest) -> TokenResponse:
    """Onboarding: creates the tenant, applies the category plugin and the owner login."""
    if (await session.execute(select(User.id).where(User.phone == data.phone))).first() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This mobile number is already registered")

    password_hash = await asyncio.to_thread(hash_password, data.password)
    property_ = Property(
        name=data.property_name,
        slug=await _unique_slug(session, slugify(data.property_name)),
        business_category=data.business_category,
        business_config=default_business_config(data.business_category),
        upi_vpa=data.upi_vpa,
        phone=data.phone,
        city=data.city,
        plan_tier=PlanTier.TRIAL,
        trial_ends_at=datetime.now(UTC) + timedelta(days=settings.trial_days),
    )
    session.add(property_)
    await session.flush()

    owner = User(
        property_id=property_.id,
        name=data.owner_name,
        phone=data.phone,
        email=data.email,
        password_hash=password_hash,
        role=Role.OWNER,
    )
    session.add(owner)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "This mobile number is already registered")
    return issue_tokens(owner)


async def authenticate(session: AsyncSession, data: LoginRequest) -> TokenResponse:
    user = (await session.execute(select(User).where(User.phone == data.phone))).scalar_one_or_none()
    ok = await asyncio.to_thread(verify_password, data.password, user.password_hash if user else None)
    if not ok or user is None or not user.is_active or user.is_deleted:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid mobile number or password")
    user.last_login_at = datetime.now(UTC)
    await session.commit()
    return issue_tokens(user)


async def create_team_user(session: AsyncSession, property_id, data: CreateUserRequest) -> User:
    if (await session.execute(select(User.id).where(User.phone == data.phone))).first() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This mobile number is already registered")
    user = User(
        property_id=property_id,
        name=data.name,
        phone=data.phone,
        password_hash=await asyncio.to_thread(hash_password, data.password),
        role=data.role,
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "This mobile number is already registered")
    return user
