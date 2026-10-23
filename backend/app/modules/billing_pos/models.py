"""Customer Khata (Credit Ledger) models for Vyapar++ Split Billing."""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, TenantMixin, tenant_index

_ZERO = Decimal("0")


class CustomerKhata(TenantMixin, Base):
    """Credit ledger account for a trusted guest/customer."""

    __tablename__ = "customer_khatas"
    __table_args__ = (
        UniqueConstraint("property_id", "customer_phone", name="uq_customer_khatas_property_phone"),
        tenant_index("customer_khatas"),
    )

    customer_name: Mapped[str] = mapped_column(String(160), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    total_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=_ZERO)
    notes: Mapped[str | None] = mapped_column(Text)

    entries: Mapped[list["KhataEntry"]] = relationship(
        "KhataEntry", back_populates="khata", cascade="all, delete-orphan", lazy="selectin"
    )


class KhataEntry(TenantMixin, Base):
    """Credit or settlement transaction under a customer's khata account."""

    __tablename__ = "khata_entries"
    __table_args__ = (tenant_index("khata_entries"),)

    khata_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_khatas.id"), nullable=False, index=True
    )
    folio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("folios.id"), nullable=True, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    entry_type: Mapped[str] = mapped_column(String(16), nullable=False, default="CREDIT")  # CREDIT | PAYMENT
    recorded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    whatsapp_reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)

    khata: Mapped[CustomerKhata] = relationship("CustomerKhata", back_populates="entries")
