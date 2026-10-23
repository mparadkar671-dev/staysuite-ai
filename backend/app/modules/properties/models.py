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

class Property(SyncColumnsMixin, Base):
    """A hospitality business. It is the tenant root: `property_id` always equals `id`."""

    __tablename__ = "properties"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_properties_slug"),
        Index("ix_properties_property_id_updated", "property_id", "updated_at"),
    )

    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
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
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(80))
    state: Mapped[str | None] = mapped_column(String(80))
    timezone: Mapped[str] = mapped_column(String(48), nullable=False, default="Asia/Kolkata")
    gstin: Mapped[str | None] = mapped_column(String(20))


@event.listens_for(Property, "before_insert")
def _property_is_its_own_tenant(_mapper, _connection, target: Property) -> None:
    if target.id is None:
        target.id = uuid.uuid4()
    if target.property_id is None:
        target.property_id = target.id


class User(TenantMixin, Base):
    """A login identity (Owner / Manager / Staff). Never synced to devices."""

    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("phone", name="uq_users_phone"), tenant_index("users"))

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[Role] = enum_column(Role, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


def _new_door_qr_token() -> str:
    return secrets.token_urlsafe(24)


class Room(TenantMixin, Base):
    __tablename__ = "rooms"
    __table_args__ = (
        UniqueConstraint("property_id", "room_number", name="uq_rooms_property_room_number"),
        UniqueConstraint("door_qr_token", name="uq_rooms_door_qr_token"),
        tenant_index("rooms"),
    )

    room_number: Mapped[str] = mapped_column(String(16), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    room_type: Mapped[str | None] = mapped_column(String(80))  # e.g. "Sea-Facing Deluxe"
    floor: Mapped[int | None] = mapped_column(Integer)
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
