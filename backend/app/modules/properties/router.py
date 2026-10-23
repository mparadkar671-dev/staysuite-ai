import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.enums import Role
from app.core.security import Principal, decode_token, get_current_principal, require_roles
from app.modules.properties import service
from app.modules.properties.models import Property, User
from app.modules.properties.schemas import (
    CreateUserRequest,
    LoginRequest,
    PropertyOut,
    RefreshRequest,
    RegisterOwnerRequest,
    TokenResponse,
    UserOut,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
router = APIRouter(prefix="/properties", tags=["properties"])


@auth_router.post("/register-owner", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_owner(body: RegisterOwnerRequest, session: AsyncSession = Depends(get_session)):
    return await service.register_owner(session, body)


@auth_router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    return await service.authenticate(session, body)


@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, session: AsyncSession = Depends(get_session)):
    claims = decode_token(body.refresh_token, expected_type="refresh")
    user = await session.get(User, uuid.UUID(claims["sub"]))
    if user is None or not user.is_active or user.is_deleted:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account disabled")
    return service.issue_tokens(user)


@auth_router.get("/me", response_model=UserOut)
async def me(principal: Principal = Depends(get_current_principal), session: AsyncSession = Depends(get_session)):
    return await session.get(User, principal.user_id)


@auth_router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: CreateUserRequest,
    principal: Principal = Depends(require_roles(Role.OWNER)),
    session: AsyncSession = Depends(get_session),
):
    """Owner adds a Manager or Staff login for their own property."""
    return await service.create_team_user(session, principal.property_id, body)


@router.get("/me", response_model=PropertyOut)
async def my_property(
    principal: Principal = Depends(get_current_principal), session: AsyncSession = Depends(get_session)
):
    property_ = (
        await session.execute(select(Property).where(Property.id == principal.property_id))
    ).scalar_one_or_none()
    if property_ is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    return property_
