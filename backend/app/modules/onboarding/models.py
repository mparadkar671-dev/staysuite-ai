"""SQLAlchemy models for Property Onboarding, Verification, and Category Licenses."""
import secrets
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    false,
    true,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, SyncColumnsMixin, enum_column
from app.core.enums import BusinessCategory


def generate_category_business_code(category: BusinessCategory | str) -> str:
    """Generates unique human-readable Business Code per industry standard category prefix."""
    cat_str = category.value if hasattr(category, "value") else str(category).upper()
    prefix_map = {
        "HOMESTAY": "HM",
        "HOTEL": "HT",
        "RESORT": "RS",
        "RESTAURANT": "RT",
        "BAR": "BR",
        "OTHER_SERVICES": "OS",
    }
    prefix = prefix_map.get(cat_str, "HM")
    random_num = secrets.randbelow(9000) + 1000
    return f"SS-{prefix}-{random_num}"


class PropertyOnboardingApplication(SyncColumnsMixin, Base):
    """Audit Vault and verification pipeline for property onboarding applications."""

    __tablename__ = "property_onboarding_applications"
    __table_args__ = (
        UniqueConstraint("business_code", name="uq_onboarding_business_code"),
        UniqueConstraint("slug", name="uq_onboarding_slug"),
        Index("ix_onboarding_status", "status"),
        Index("ix_onboarding_owner_mobile", "owner_mobile"),
    )

    property_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    business_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    business_category: Mapped[BusinessCategory] = enum_column(
        BusinessCategory, nullable=False, default=BusinessCategory.HOMESTAY
    )
    property_name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)

    # Owner Credentials & Identity
    owner_full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    owner_mobile: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_whatsapp: Mapped[str | None] = mapped_column(String(20))
    owner_email: Mapped[str] = mapped_column(String(200), nullable=False)
    is_mobile_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    password_hash: Mapped[str] = mapped_column(String(120), nullable=False)

    # Google Maps & Precise Location
    formatted_address: Mapped[str] = mapped_column(Text, nullable=False)
    street_landmark: Mapped[str | None] = mapped_column(String(200))
    village_city: Mapped[str] = mapped_column(String(100), nullable=False)
    taluka: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100), default="Maharashtra")
    pincode: Mapped[str] = mapped_column(String(12), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    google_maps_url: Mapped[str | None] = mapped_column(String(500))
    police_station_jurisdiction: Mapped[str | None] = mapped_column(String(160))
    accessibility_metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Owner KYC & Redacted Privacy Vault
    owner_pan_number: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_pan_doc_url: Mapped[str | None] = mapped_column(String(500))
    owner_gov_id_type: Mapped[str] = mapped_column(String(50), default="AADHAAR_REDACTED")
    owner_gov_id_masked_display: Mapped[str] = mapped_column(String(50), default="[Aadhaar Redacted]")
    owner_gov_id_doc_url: Mapped[str | None] = mapped_column(String(500))
    property_ownership_proof_type: Mapped[str | None] = mapped_column(String(50))
    property_ownership_doc_url: Mapped[str | None] = mapped_column(String(500))

    # Category Licenses & Metadata
    category_licenses: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Payout & Tax Configuration
    merchant_upi_vpa: Mapped[str] = mapped_column(String(100), nullable=False)
    bank_account_holder: Mapped[str | None] = mapped_column(String(160))
    bank_account_number: Mapped[str | None] = mapped_column(String(60))
    bank_ifsc: Mapped[str | None] = mapped_column(String(20))
    cancelled_cheque_url: Mapped[str | None] = mapped_column(String(500))
    is_gst_registered: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    gstin_number: Mapped[str | None] = mapped_column(String(20))

    # Category Operational Rules & Policies
    operational_policies: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Subscription Plan & Verification Lifecycle
    subscription_plan: Mapped[str] = mapped_column(String(32), default="30_DAY_FREE_TRIAL")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PROVISIONAL_ACTIVE")
    admin_notes: Mapped[str | None] = mapped_column(Text)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    verified_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class PropertyLicenseDocument(Base):
    """Separate verified documents uploaded for category licensing requirements."""

    __tablename__ = "property_license_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("property_onboarding_applications.id", ondelete="CASCADE"), index=True
    )
    property_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    document_type: Mapped[str] = mapped_column(String(60), nullable=False)
    document_number: Mapped[str | None] = mapped_column(String(100))
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
