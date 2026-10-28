"""Tenant root (Property), login Users and Rooms."""
import secrets
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, event, false, true
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, SyncColumnsMixin, TenantMixin, enum_column, tenant_index
from app.core.enums import BusinessCategory, HousekeepingStatus, PlanTier, Role

def _generate_business_code() -> str:
    # Returns human-readable code like SS-HM-8492
    return f"SS-HM-{secrets.randbelow(9000) + 1000}"


class Property(SyncColumnsMixin, Base):
    """A hospitality business. It is the tenant root: `property_id` always equals `id`."""

    __tablename__ = "properties"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_properties_slug"),
        UniqueConstraint("business_code", name="uq_properties_business_code"),
        Index("ix_properties_property_id_updated", "property_id", "updated_at"),
    )

    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    business_code: Mapped[str] = mapped_column(String(32), nullable=False, default=_generate_business_code, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    business_category: Mapped[BusinessCategory] = enum_column(
        BusinessCategory, nullable=False, default=BusinessCategory.HOMESTAY
    )
    # Category plugin output (enabled/hidden modules + rules such as meal cut-off hours).
    business_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    upi_vpa: Mapped[str | None] = mapped_column(String(100))
    is_booking_frozen: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    plan_tier: Mapped[PlanTier] = enum_column(PlanTier, nullable=False, default=PlanTier.TRIAL)
    subscription_plan: Mapped[str] = mapped_column(String(32), nullable=False, default="TRIAL")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    verification_status: Mapped[str] = mapped_column(String(32), nullable=False, default="PROVISIONAL_ACTIVE")
    feature_overrides: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(80))
    state: Mapped[str | None] = mapped_column(String(80))
    timezone: Mapped[str] = mapped_column(String(48), nullable=False, default="Asia/Kolkata")
    gstin: Mapped[str | None] = mapped_column(String(20))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    google_maps_url: Mapped[str | None] = mapped_column(String(500))
    police_station_jurisdiction: Mapped[str | None] = mapped_column(String(160))
    accessibility_metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    operational_policies: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    category_licenses: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    owner_pan_number: Mapped[str | None] = mapped_column(String(20))


@event.listens_for(Property, "before_insert")
def _property_is_its_own_tenant(_mapper, _connection, target: Property) -> None:
    if target.id is None:
        target.id = uuid.uuid4()
    if target.property_id is None:
        target.property_id = target.id
    if not target.business_code:
        cat_map = {
            BusinessCategory.HOMESTAY: "HM",
            BusinessCategory.HOTEL: "HT",
            BusinessCategory.RESORT: "RS",
            BusinessCategory.RESTAURANT: "RT",
            BusinessCategory.BAR: "BR",
            BusinessCategory.OTHER_SERVICES: "OS",
        }
        prefix = cat_map.get(target.business_category, "HM")
        target.business_code = f"SS-{prefix}-{secrets.randbelow(9000) + 1000}"


class User(TenantMixin, Base):
    """A login identity (Owner / Manager / Staff). Never synced to devices."""

    __tablename__ = "users"
    __table_args__ = (tenant_index("users"),)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[Role] = enum_column(Role, nullable=False)
    staff_member_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    avatar: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RoomCategory(TenantMixin, Base):
    """Shared specifications, tariffs, and amenities template for a category of rooms."""

    __tablename__ = "room_categories"
    __table_args__ = (
        tenant_index("room_categories"),
    )

    category_name: Mapped[str] = mapped_column(String(120), nullable=False)  # e.g. "Sea-Facing Deluxe"
    stay_template_type: Mapped[str] = mapped_column(String(64), nullable=False, default="STANDARD_ROOM")  # STANDARD_ROOM, DELUXE_AC, FAMILY_COTTAGE, DORM_BED, LUXURY_TENT, VILLA
    has_ac: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    base_tariff_ac: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("3000.00"))
    allow_guest_non_ac_toggle: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    base_tariff_non_ac: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("2200.00"))
    weekend_surge_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    base_occupancy_adults: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    max_occupancy: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    extra_mattress_charge: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("500.00"))
    driver_stay_free: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    # 1-Tap Amenities: bathroom_location, toilet_type, hot_water_type, toggles, room_view, free_value_perks
    amenities_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    # Media & 360° Tour: main_bed_photo_url, bathroom_photo_url, balcony_photo_url, gallery_urls, panorama_360_url, instagram_reel_url
    media_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())


def _new_door_qr_token() -> str:
    return secrets.token_urlsafe(24)


class Room(TenantMixin, Base):
    __tablename__ = "rooms"
    __table_args__ = (
        UniqueConstraint("property_id", "room_number", name="uq_rooms_property_room_number"),
        UniqueConstraint("door_qr_token", name="uq_rooms_door_qr_token"),
        tenant_index("rooms"),
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("room_categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    room_number: Mapped[str] = mapped_column(String(16), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    room_type: Mapped[str | None] = mapped_column(String(80))  # e.g. "Sea-Facing Deluxe"
    floor: Mapped[int | None] = mapped_column(Integer)
    floor_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    max_occupancy: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    has_ac: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    base_tariff_ac: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    base_tariff_non_ac: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    extra_mattress_charge: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    driver_bed_charge: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    housekeeping_status: Mapped[HousekeepingStatus] = enum_column(
        HousekeepingStatus, nullable=False, default=HousekeepingStatus.CLEAN
    )
    housekeeping_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    housekeeping_note: Mapped[str | None] = mapped_column(Text)
    door_qr_token: Mapped[str] = mapped_column(String(64), nullable=False, default=_new_door_qr_token)
    # Emergency freeze at room level (the property-level master switch lives on Property).
    is_frozen: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    frozen_until: Mapped[date | None] = mapped_column(Date)
    # Floor/bed metadata: {"floor_area_sqft": 220, "beds": [{"type": "queen", "count": 1}]}
    bed_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    # Plan-gated media: {"photos": [...webp urls], "panorama_360_url": ..., "reel_urls": [...], "street_view_url": ...}
    media_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())


class SeasonalOffer(TenantMixin, Base):
    """Dynamic discount deals and seasonal banners on Room Categories."""

    __tablename__ = "seasonal_offers"
    __table_args__ = (
        tenant_index("seasonal_offers"),
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("room_categories.id", ondelete="CASCADE"), nullable=True, index=True
    )
    offer_title: Mapped[str] = mapped_column(String(160), nullable=False)  # e.g. "Monsoon Magic Deal"
    badge_tag: Mapped[str] = mapped_column(String(64), nullable=False, default="SPECIAL OFFER")  # e.g. "MONSOON 20% OFF"
    discount_type: Mapped[str] = mapped_column(String(32), nullable=False, default="PERCENTAGE")  # PERCENTAGE | FLAT_INR
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("20.00"))
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_to: Mapped[date] = mapped_column(Date, nullable=False)
    min_nights: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    weekdays_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
