"""Police-register guest records. By design there is NO column that can hold a raw
government ID number: only a redacted display string and a reference to a redacted image."""
import re
import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantMixin, enum_column, tenant_index
from app.core.enums import KycIdType, KycVerificationStatus

_ID_LABELS = {
    KycIdType.AADHAAR: "Aadhaar",
    KycIdType.PASSPORT: "Passport",
    KycIdType.VOTER_ID: "Voter ID",
    KycIdType.DRIVING_LICENSE: "Driving Licence",
    KycIdType.PAN: "PAN",
    KycIdType.OTHER: "ID",
}

# 12-digit Aadhaar (optionally spaced/hyphenated) and 16-digit Virtual ID.
_AADHAAR_LIKE = re.compile(r"\b\d{4}(?:[\s-]?\d{4}){2,3}\b")


def masked_display_for(id_type: KycIdType) -> str:
    return f"[{_ID_LABELS[id_type]} Redacted]"


def scrub_free_text(value: str) -> str:
    """Removes anything that looks like an Aadhaar/VID number from free-text fields."""
    return _AADHAAR_LIKE.sub("[Aadhaar Redacted]", value)


class GuestKycRecord(TenantMixin, Base):
    __tablename__ = "guest_kyc_records"
    __table_args__ = (tenant_index("guest_kyc_records"),)

    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), index=True
    )
    allocation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("booking_room_allocations.id"), index=True
    )
    guest_name: Mapped[str] = mapped_column(String(160), nullable=False)
    guest_phone: Mapped[str | None] = mapped_column(String(20))
    nationality: Mapped[str] = mapped_column(String(60), nullable=False, default="Indian")
    is_foreign_national: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    id_type: Mapped[KycIdType] = enum_column(KycIdType, nullable=False)
    # Always "[<Type> Redacted]" - enforced by the sync engine, never client-controlled.
    masked_id_display: Mapped[str] = mapped_column(String(48), nullable=False)
    verification_status: Mapped[KycVerificationStatus] = enum_column(
        KycVerificationStatus, nullable=False, default=KycVerificationStatus.PENDING
    )
    # Object-storage key of the on-device-redacted image. Visible to OWNER only.
    id_document_key: Mapped[str | None] = mapped_column(String(300))
    address: Mapped[str | None] = mapped_column(Text)
    purpose_of_visit: Mapped[str | None] = mapped_column(String(120))
    arrived_from: Mapped[str | None] = mapped_column(String(160))
    next_destination: Mapped[str | None] = mapped_column(String(160))
    # Foreign guests: Form-C filing state for the police portal.
    form_c_submitted_on: Mapped[date | None] = mapped_column(Date)
    captured_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
