"""Staff directory and the Upaad (cash advance) ledger."""
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text, true
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantMixin, enum_column, tenant_index
from app.core.enums import PayModel, UpaadEntryType

_ZERO = Decimal("0")


class StaffMember(TenantMixin, Base):
    __tablename__ = "staff_members"
    __table_args__ = (tenant_index("staff_members"),)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    role_title: Mapped[str | None] = mapped_column(String(80))  # Cook, Housekeeping, Buyer...
    pay_model: Mapped[PayModel] = enum_column(PayModel, nullable=False, default=PayModel.MONTHLY_FIXED)
    # Monthly salary, daily wage or stipend depending on pay_model.
    base_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    per_room_bonus_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=_ZERO)
    preferred_language: Mapped[str] = mapped_column(String(8), nullable=False, default="mr")
    joined_on: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())


class StaffUpaadLedger(TenantMixin, Base):
    """Append-only: an ADVANCE increases what the staff member owes, a DEDUCTION reduces it."""

    __tablename__ = "staff_upaad_ledger"
    __table_args__ = (tenant_index("staff_upaad_ledger"),)

    staff_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff_members.id"), nullable=False, index=True
    )
    entry_type: Mapped[UpaadEntryType] = enum_column(UpaadEntryType, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    payroll_period: Mapped[str | None] = mapped_column(String(7))  # "YYYY-MM" for DEDUCTION rows
    note: Mapped[str | None] = mapped_column(Text)
    recorded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
