"""Bookings are decoupled from room allocations and folios so a single room of a group
booking can be checked out independently (Partial Room Checkout)."""
import secrets
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, false
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantMixin, enum_column, tenant_index
from app.core.enums import AllocationStatus, BookingSource, BookingStatus, FolioStatus

_ZERO = Decimal("0")


def _new_booking_token() -> str:
    return secrets.token_urlsafe(18)


class Booking(TenantMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("booking_token", name="uq_bookings_booking_token"),
        tenant_index("bookings"),
    )

    booking_token: Mapped[str] = mapped_column(String(48), nullable=False, default=_new_booking_token)
    source: Mapped[BookingSource] = enum_column(BookingSource, nullable=False, default=BookingSource.DIRECT)
    status: Mapped[BookingStatus] = enum_column(BookingStatus, nullable=False, default=BookingStatus.CONFIRMED)
    ota_reference: Mapped[str | None] = mapped_column(String(80), index=True)
    guest_name: Mapped[str] = mapped_column(String(160), nullable=False)
    guest_phone: Mapped[str | None] = mapped_column(String(20))
    guest_email: Mapped[str | None] = mapped_column(String(200))
    check_in_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_out_date: Mapped[date] = mapped_column(Date, nullable=False)
    adults: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    children: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    advance_required: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    advance_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    advance_payment_link: Mapped[str | None] = mapped_column(Text)
    food_rules_acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)


class BookingRoomAllocation(TenantMixin, Base):
    """One row per room per booking. Check-out happens here, not on the booking."""

    __tablename__ = "booking_room_allocations"
    __table_args__ = (tenant_index("booking_room_allocations"),)

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True
    )
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True
    )
    status: Mapped[AllocationStatus] = enum_column(
        AllocationStatus, nullable=False, default=AllocationStatus.RESERVED
    )
    stay_start: Mapped[date] = mapped_column(Date, nullable=False)
    stay_end: Mapped[date] = mapped_column(Date, nullable=False)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checked_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    adults: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    ac_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # [{"at": "<iso>", "ac_required": true}] - lets checkout prorate AC vs Non-AC nights.
    ac_history: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # Tariffs are snapshotted at booking time so later price edits never change a live stay.
    rate_ac_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    rate_non_ac_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    extra_mattress_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    extra_mattress_charge_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=_ZERO)
    driver_bed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    driver_bed_charge_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=_ZERO)
    waive_extra_person_fee: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    waived_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class Folio(TenantMixin, Base):
    """The bill for one room allocation."""

    __tablename__ = "folios"
    __table_args__ = (
        UniqueConstraint("allocation_id", name="uq_folios_allocation_id"),
        tenant_index("folios"),
    )

    allocation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("booking_room_allocations.id"), nullable=False
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True
    )
    status: Mapped[FolioStatus] = enum_column(FolioStatus, nullable=False, default=FolioStatus.OPEN)
    room_charges: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    food_charges: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    extra_charges: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    balance_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    # [{"type": "ROOM|FOOD|EXTRA|DISCOUNT", "description": ..., "qty": ..., "amount": ...}]
    line_items: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # [{"mode": "UPI|CASH|CARD", "amount": ..., "at": <iso>, "reference": ...}]
    payments: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    upi_qr_string: Mapped[str | None] = mapped_column(Text)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
