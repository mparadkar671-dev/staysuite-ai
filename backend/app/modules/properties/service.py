import asyncio
import re
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

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


async def bulk_create_room_category(session: AsyncSession, property_id, data):
    from decimal import Decimal
    from app.modules.properties.models import Room, RoomCategory

    category = RoomCategory(
        property_id=property_id,
        category_name=data.category_name,
        stay_template_type=data.stay_template_type,
        has_ac=data.has_ac,
        base_tariff_ac=Decimal(str(data.base_tariff_ac)),
        allow_guest_non_ac_toggle=data.allow_guest_non_ac_toggle,
        base_tariff_non_ac=Decimal(str(data.base_tariff_non_ac)),
        weekend_surge_percent=Decimal(str(data.weekend_surge_percent)),
        base_occupancy_adults=data.base_occupancy_adults,
        max_occupancy=data.max_occupancy,
        extra_mattress_charge=Decimal(str(data.extra_mattress_charge)),
        driver_stay_free=data.driver_stay_free,
        amenities_config=data.amenities_config,
        media_config=data.media_config,
    )
    session.add(category)
    await session.flush()

    # Generate physical room units
    room_numbers = data.room_numbers or ["101"]
    for r_num in room_numbers:
        r_str = str(r_num).strip()
        room = Room(
            property_id=property_id,
            category_id=category.id,
            room_number=r_str,
            name=f"{data.category_name} - {r_str}",
            room_type=data.category_name,
            floor_label=data.floor_label or "Ground Floor",
            max_occupancy=data.max_occupancy,
            has_ac=data.has_ac,
            base_tariff_ac=Decimal(str(data.base_tariff_ac)),
            base_tariff_non_ac=Decimal(str(data.base_tariff_non_ac)),
            extra_mattress_charge=Decimal(str(data.extra_mattress_charge)),
            driver_bed_charge=Decimal("0.00") if data.driver_stay_free else Decimal("300.00"),
            bed_config={"occupancy": data.max_occupancy},
            media_config=data.media_config,
        )
        session.add(room)

    await session.commit()
    await session.refresh(category)
    return category


async def clone_room_unit(session: AsyncSession, property_id, category_id, data):
    from decimal import Decimal
    from app.modules.properties.models import Room, RoomCategory

    category = await session.get(RoomCategory, category_id)
    if not category or category.property_id != property_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room category not found")

    new_room = Room(
        property_id=property_id,
        category_id=category.id,
        room_number=data.new_room_number.strip(),
        name=f"{category.category_name} - {data.new_room_number.strip()}",
        room_type=category.category_name,
        floor_label=data.floor_label or "Ground Floor",
        max_occupancy=category.max_occupancy,
        has_ac=category.has_ac,
        base_tariff_ac=category.base_tariff_ac,
        base_tariff_non_ac=category.base_tariff_non_ac,
        extra_mattress_charge=category.extra_mattress_charge,
        driver_bed_charge=Decimal("0.00") if category.driver_stay_free else Decimal("300.00"),
        bed_config={"occupancy": category.max_occupancy},
        media_config=category.media_config,
    )
    session.add(new_room)
    try:
        await session.commit()
        await session.refresh(new_room)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, f"Room {data.new_room_number} already exists")
    return new_room


async def update_quick_tariff(session: AsyncSession, property_id, category_id, data):
    from decimal import Decimal
    from app.modules.properties.models import Room, RoomCategory

    category = await session.get(RoomCategory, category_id)
    if not category or category.property_id != property_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room category not found")

    if data.base_tariff_ac is not None:
        category.base_tariff_ac = Decimal(str(data.base_tariff_ac))
    if data.base_tariff_non_ac is not None:
        category.base_tariff_non_ac = Decimal(str(data.base_tariff_non_ac))
    if data.allow_guest_non_ac_toggle is not None:
        category.allow_guest_non_ac_toggle = data.allow_guest_non_ac_toggle
    if data.weekend_surge_percent is not None:
        category.weekend_surge_percent = Decimal(str(data.weekend_surge_percent))
    if data.is_active is not None:
        category.is_active = data.is_active

    # Also update child rooms tariffs
    rooms_stmt = select(Room).where(Room.category_id == category.id, Room.property_id == property_id)
    rooms = (await session.execute(rooms_stmt)).scalars().all()
    for r in rooms:
        r.base_tariff_ac = category.base_tariff_ac
        r.base_tariff_non_ac = category.base_tariff_non_ac
        if data.is_active is not None:
            r.is_active = data.is_active

    await session.commit()
    await session.refresh(category)
    return category


async def delete_room_unit(session: AsyncSession, property_id, room_id: uuid.UUID) -> bool:
    from app.modules.properties.models import Room

    room = await session.get(Room, room_id)
    if not room or room.property_id != property_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room unit not found")
    await session.delete(room)
    await session.commit()
    return True


async def list_room_categories_with_units(session: AsyncSession, property_id):
    from app.modules.properties.models import Room, RoomCategory, SeasonalOffer

    stmt = (
        select(RoomCategory)
        .where(RoomCategory.property_id == property_id, RoomCategory.is_deleted == False)  # noqa: E712
        .order_by(RoomCategory.category_name)
    )
    categories = (await session.execute(stmt)).scalars().all()

    result = []
    for cat in categories:
        rooms_stmt = (
            select(Room)
            .where(Room.category_id == cat.id, Room.property_id == property_id, Room.is_deleted == False)  # noqa: E712
            .order_by(Room.room_number)
        )
        rooms = (await session.execute(rooms_stmt)).scalars().all()

        offers_stmt = select(SeasonalOffer).where(
            SeasonalOffer.property_id == property_id,
            (SeasonalOffer.category_id == cat.id) | (SeasonalOffer.category_id == None),  # noqa: E711
            SeasonalOffer.is_active == True,  # noqa: E712
            SeasonalOffer.is_deleted == False,  # noqa: E712
        )
        offers = (await session.execute(offers_stmt)).scalars().all()

        result.append({
            "id": cat.id,
            "property_id": cat.property_id,
            "category_name": cat.category_name,
            "stay_template_type": cat.stay_template_type,
            "has_ac": cat.has_ac,
            "base_tariff_ac": float(cat.base_tariff_ac),
            "allow_guest_non_ac_toggle": cat.allow_guest_non_ac_toggle,
            "base_tariff_non_ac": float(cat.base_tariff_non_ac),
            "weekend_surge_percent": float(cat.weekend_surge_percent),
            "base_occupancy_adults": cat.base_occupancy_adults,
            "max_occupancy": cat.max_occupancy,
            "extra_mattress_charge": float(cat.extra_mattress_charge),
            "driver_stay_free": cat.driver_stay_free,
            "amenities_config": cat.amenities_config or {},
            "media_config": cat.media_config or {},
            "is_active": cat.is_active,
            "rooms": [
                {
                    "id": r.id,
                    "property_id": r.property_id,
                    "category_id": r.category_id,
                    "room_number": r.room_number,
                    "name": r.name,
                    "floor_label": r.floor_label,
                    "housekeeping_status": (
                        r.housekeeping_status.value
                        if hasattr(r.housekeeping_status, "value")
                        else str(r.housekeeping_status)
                    ),
                    "door_qr_token": r.door_qr_token,
                    "is_active": r.is_active,
                }
                for r in rooms
            ],
            "seasonal_offers": [
                {
                    "id": o.id,
                    "property_id": o.property_id,
                    "category_id": o.category_id,
                    "offer_title": o.offer_title,
                    "badge_tag": o.badge_tag,
                    "discount_type": o.discount_type,
                    "discount_value": float(o.discount_value),
                    "valid_from": str(o.valid_from),
                    "valid_to": str(o.valid_to),
                    "min_nights": o.min_nights,
                    "weekdays_only": o.weekdays_only,
                    "is_active": o.is_active,
                }
                for o in offers
            ],
        })
    return result


async def create_seasonal_offer(session: AsyncSession, property_id, data):
    from datetime import date
    from decimal import Decimal
    from app.modules.properties.models import SeasonalOffer

    offer = SeasonalOffer(
        property_id=property_id,
        category_id=data.category_id,
        offer_title=data.offer_title,
        badge_tag=data.badge_tag,
        discount_type=data.discount_type,
        discount_value=Decimal(str(data.discount_value)),
        valid_from=date.fromisoformat(data.valid_from),
        valid_to=date.fromisoformat(data.valid_to),
        min_nights=data.min_nights,
        weekdays_only=data.weekdays_only,
        is_active=True,
    )
    session.add(offer)
    await session.commit()
    await session.refresh(offer)
    return offer


async def toggle_seasonal_offer(session: AsyncSession, property_id, offer_id: uuid.UUID):
    from app.modules.properties.models import SeasonalOffer

    offer = await session.get(SeasonalOffer, offer_id)
    if not offer or offer.property_id != property_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offer not found")
    offer.is_active = not offer.is_active
    await session.commit()
    await session.refresh(offer)
    return offer


async def explore_public_properties(
    session: AsyncSession, category: str | None = None, city: str | None = None
) -> list[dict[str, Any]]:
    """Marketplace discovery: returns ONLY VERIFIED_PUBLISHED (or PROVISIONAL_ACTIVE) and ACTIVE properties."""
    from typing import Any
    stmt = (
        select(Property)
        .where(
            Property.status == "ACTIVE",
            Property.verification_status.in_(["VERIFIED_PUBLISHED", "PROVISIONAL_ACTIVE"]),
            Property.is_deleted == False,
        )
        .order_by(Property.created_at.desc())
    )
    if category:
        stmt = stmt.where(Property.business_category == category.upper())
    if city:
        stmt = stmt.where(Property.city.ilike(f"%{city.strip()}%"))

    props = (await session.execute(stmt)).scalars().all()
    results = []
    for p in props:
        cat_str = p.business_category.value if hasattr(p.business_category, "value") else str(p.business_category)
        results.append({
            "id": str(p.id),
            "business_code": p.business_code,
            "name": p.name,
            "slug": p.slug,
            "business_category": cat_str,
            "city": p.city,
            "state": p.state,
            "address": p.address,
            "upi_vpa": p.upi_vpa,
            "is_booking_frozen": p.is_booking_frozen,
            "operational_policies": p.operational_policies or {},
            "accessibility_metadata": p.accessibility_metadata or {},
            "latitude": float(p.latitude) if p.latitude else None,
            "longitude": float(p.longitude) if p.longitude else None,
            "google_maps_url": p.google_maps_url,
        })
    return results


async def get_public_property_by_slug(session: AsyncSession, slug: str) -> dict[str, Any]:
    """Storefront microsite: loads dedicated property profile, room categories, offers, and dining rules."""
    from typing import Any
    prop = (
        await session.execute(select(Property).where(Property.slug == slug.strip().lower()))
    ).scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Property '{slug}' not found")

    if prop.status == "SUSPENDED":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This property is temporarily unavailable")

    cat_str = prop.business_category.value if hasattr(prop.business_category, "value") else str(prop.business_category)
    room_cats = await list_room_categories_with_units(session, prop.id)

    return {
        "id": str(prop.id),
        "business_code": prop.business_code,
        "name": prop.name,
        "slug": prop.slug,
        "business_category": cat_str,
        "status": prop.status,
        "verification_status": prop.verification_status,
        "is_booking_frozen": prop.is_booking_frozen,
        "city": prop.city,
        "state": prop.state,
        "address": prop.address,
        "phone": prop.phone,
        "upi_vpa": prop.upi_vpa,
        "operational_policies": prop.operational_policies or {},
        "business_config": prop.business_config or {},
        "accessibility_metadata": prop.accessibility_metadata or {},
        "latitude": float(prop.latitude) if prop.latitude else None,
        "longitude": float(prop.longitude) if prop.longitude else None,
        "google_maps_url": prop.google_maps_url,
        "room_categories": room_cats,
    }
