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
    CloneRoomRequest,
    CreateUserRequest,
    LoginRequest,
    PropertyOut,
    QuickTariffUpdateRequest,
    RefreshRequest,
    RegisterOwnerRequest,
    RoomCategoryBulkCreate,
    RoomCategoryOut,
    RoomOut,
    SeasonalOfferCreate,
    SeasonalOfferOut,
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


# ====================================================================
# ROOM CATEGORIES, BULK CLONING & SEASONAL OFFERS API
# ====================================================================

@router.post("/room-categories/bulk-create", status_code=status.HTTP_201_CREATED)
async def bulk_create_category(
    body: RoomCategoryBulkCreate,
    property_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Creates a RoomCategory and generates all individual physical Room rows with unique QR tokens."""
    # If property_id not passed, fetch first active property for demo
    if property_id is None:
        prop = (await session.execute(select(Property).limit(1))).scalar_one_or_none()
        if not prop:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No property found")
        property_id = prop.id

    cat = await service.bulk_create_room_category(session, property_id, body)
    return {"success": True, "category_id": str(cat.id), "category_name": cat.category_name}


@router.get("/room-categories")
async def list_categories(
    property_id: uuid.UUID | None = None,
    property_slug: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """List room categories with physical units and active seasonal offers."""
    target_property_id = property_id
    if target_property_id is None:
        if property_slug:
            prop = (await session.execute(select(Property).where(Property.slug == property_slug))).scalar_one_or_none()
        else:
            prop = (await session.execute(select(Property).limit(1))).scalar_one_or_none()
        if prop:
            target_property_id = prop.id

    if target_property_id is None:
        return []

    return await service.list_room_categories_with_units(session, target_property_id)


@router.post("/room-categories/{category_id}/clone-room")
async def clone_room(
    category_id: uuid.UUID,
    body: CloneRoomRequest,
    property_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    """1-Click Add Similar Room endpoint: creates an identical physical room unit in 1 second."""
    if property_id is None:
        prop = (await session.execute(select(Property).limit(1))).scalar_one_or_none()
        if not prop:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No property found")
        property_id = prop.id

    room = await service.clone_room_unit(session, property_id, category_id, body)
    return {
        "success": True,
        "room_id": str(room.id),
        "room_number": room.room_number,
        "door_qr_token": room.door_qr_token,
    }


@router.patch("/room-categories/{category_id}/quick-tariff")
async def quick_tariff(
    category_id: uuid.UUID,
    body: QuickTariffUpdateRequest,
    property_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Quick edit AC/Non-AC tariff, surge percentage, and availability."""
    if property_id is None:
        prop = (await session.execute(select(Property).limit(1))).scalar_one_or_none()
        if not prop:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No property found")
        property_id = prop.id

    cat = await service.update_quick_tariff(session, property_id, category_id, body)
    return {
        "success": True,
        "category_id": str(cat.id),
        "base_tariff_ac": float(cat.base_tariff_ac),
        "base_tariff_non_ac": float(cat.base_tariff_non_ac),
        "allow_guest_non_ac_toggle": cat.allow_guest_non_ac_toggle,
    }


@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: uuid.UUID,
    property_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Delete a room unit."""
    if property_id is None:
        prop = (await session.execute(select(Property).limit(1))).scalar_one_or_none()
        if not prop:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No property found")
        property_id = prop.id

    deleted = await service.delete_room_unit(session, property_id, room_id)
    return {"success": deleted}


@router.post("/offers", status_code=status.HTTP_201_CREATED)
async def create_offer(
    body: SeasonalOfferCreate,
    property_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Create a seasonal discount deal on room categories."""
    if property_id is None:
        prop = (await session.execute(select(Property).limit(1))).scalar_one_or_none()
        if not prop:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No property found")
        property_id = prop.id

    offer = await service.create_seasonal_offer(session, property_id, body)
    return {"success": True, "offer_id": str(offer.id), "offer_title": offer.offer_title}


@router.patch("/offers/{offer_id}/toggle")
async def toggle_offer(
    offer_id: uuid.UUID,
    property_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    """1-Tap toggle to activate or pause a seasonal offer."""
    if property_id is None:
        prop = (await session.execute(select(Property).limit(1))).scalar_one_or_none()
        if not prop:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No property found")
        property_id = prop.id

    offer = await service.toggle_seasonal_offer(session, property_id, offer_id)
    return {"success": True, "offer_id": str(offer.id), "is_active": offer.is_active}


# ====================================================================
# PUBLIC BOOKING MARKETPLACE & STOREFRONT ROUTES
# ====================================================================

@router.get("/explore")
async def explore_marketplace(
    category: str | None = None,
    city: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Public Booking Marketplace discovery: returns only VERIFIED_PUBLISHED active properties."""
    return await service.explore_public_properties(session, category=category, city=city)


@router.get("/by-slug/{slug}")
async def get_property_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_session),
):
    """Public Storefront Microsite: loads dedicated property profile, live rooms, and booking status."""
    return await service.get_public_property_by_slug(session, slug)
