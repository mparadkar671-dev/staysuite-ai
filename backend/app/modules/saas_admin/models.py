"""SQLAlchemy models for Super Admin Subscription Plans, Feature Matrix,
Conditional Business Discounts, and Property Verification/Publish Workflow.
"""
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    false,
    true,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, SyncColumnsMixin, next_server_ts


class SaasSubscriptionPlan(SyncColumnsMixin, Base):
    """SaaS Subscription Plans configured and governed by Super Admin."""

    __tablename__ = "saas_subscription_plans"
    __table_args__ = (
        UniqueConstraint("plan_code", name="uq_saas_subscription_plans_plan_code"),
        Index("ix_saas_plans_is_active", "is_active"),
    )

    plan_code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    billing_interval: Mapped[str] = mapped_column(String(20), nullable=False, default="MONTHLY")  # MONTHLY, ANNUAL
    base_price_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    annual_discount_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("15.00"))
    standard_setup_fee_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("5000.00"))
    standard_amc_rate_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("3000.00"))
    trial_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    # Default feature flags enabled for this plan tier
    default_features: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    max_rooms: Mapped[int] = mapped_column(Integer, nullable=False, default=50)  # 0 = unlimited
    max_staff_accounts: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class PropertySubscription(SyncColumnsMixin, Base):
    """Tracks a property tenant's active SaaS subscription, billing lifecycle & rates."""

    __tablename__ = "property_subscriptions"
    __table_args__ = (
        Index("ix_prop_subs_property_id", "property_id"),
        Index("ix_prop_subs_status", "status"),
    )

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("saas_subscription_plans.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="TRIAL_ACTIVE"
    )  # TRIAL_ACTIVE, ACTIVE, PAST_DUE, GRACE_PERIOD, EXPIRED, CANCELLED, SUSPENDED
    billing_cycle: Mapped[str] = mapped_column(String(20), nullable=False, default="MONTHLY")
    current_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=next_server_ts)
    current_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    base_price_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    custom_discount_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    final_recurring_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    setup_fee_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("5000.00"))
    setup_fee_waived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    amc_rate_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("3000.00"))
    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False, default="UPI_DIRECT")
    gateway_subscription_id: Mapped[str | None] = mapped_column(String(100))


class PropertyFeatureOverride(Base):
    """Allows Super Admin to override and grant/revoke individual modules for a specific property."""

    __tablename__ = "property_feature_overrides"
    __table_args__ = (
        UniqueConstraint("property_id", "feature_key", name="uq_prop_feature_override"),
        Index("ix_prop_feature_property_id", "property_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    feature_key: Mapped[str] = mapped_column(String(64), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    reason: Mapped[str | None] = mapped_column(String(255))
    granted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=next_server_ts)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=next_server_ts, onupdate=next_server_ts
    )


class SaasConditionalDiscount(SyncColumnsMixin, Base):
    """Conditional custom discount, anchor client deals, waivers, and referral credits engine."""

    __tablename__ = "saas_conditional_discounts"
    __table_args__ = (
        Index("ix_discounts_deal_type", "deal_type"),
        Index("ix_discounts_code", "discount_code"),
        Index("ix_discounts_target_prop", "target_property_id"),
    )

    discount_code: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    deal_type: Mapped[str] = mapped_column(
        String(40), nullable=False
    )  # ANCHOR_CLIENT_OVERRIDE, SETUP_FEE_WAIVER, CUSTOM_AMC_RATE, PROMO_COUPON, OWNER_REFERRAL
    target_property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE")
    )
    target_business_category: Mapped[str | None] = mapped_column(String(40))  # HOMESTAY, RESORT, or NULL for all
    discount_mode: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PERCENTAGE"
    )  # PERCENTAGE, FLAT_INR, FIXED_PRICE_OVERRIDE, FULL_WAIVER
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    override_setup_fee_inr: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    override_amc_inr: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    override_recurring_inr: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    referrer_property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="SET NULL")
    )
    referred_property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="SET NULL")
    )
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=next_server_ts)
    valid_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    max_redemptions: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    current_redemptions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    admin_notes: Mapped[str | None] = mapped_column(Text)


class SaasDiscountRedemption(Base):
    """Audit record of discounts applied to property subscription or setup invoicing."""

    __tablename__ = "saas_discount_redemptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    discount_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("saas_conditional_discounts.id", ondelete="RESTRICT"), nullable=False
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    deal_type: Mapped[str] = mapped_column(String(40), nullable=False)
    original_amount_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_deduction_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    final_billed_inr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=next_server_ts)
    applied_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class PropertyAuditAction(Base):
    """Audit trail for Super Admin verification, status changes, and global kill-switch activations."""

    __tablename__ = "property_audit_actions"
    __table_args__ = (
        Index("ix_audit_property_id", "property_id"),
        Index("ix_audit_performed_at", "performed_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    action: Mapped[str] = mapped_column(
        String(40), nullable=False
    )  # APPROVE_PUBLISH, REJECT_APPLICATION, REQUEST_CHANGES, SUSPEND_PROPERTY, UNPUBLISH_LISTING, FREEZE_BOOKINGS, RESTORE_PROPERTY
    previous_status: Mapped[str | None] = mapped_column(String(40))
    new_status: Mapped[str] = mapped_column(String(40), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    performed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=next_server_ts)
