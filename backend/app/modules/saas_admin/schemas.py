"""Pydantic schemas for Super Admin Control Plane:
- Subscription Plans & Granular Feature Entitlement Matrix
- Conditional Custom Discount & Deal Engine (Per Business / Condition)
- New Property Verification & Publishing Pipeline
- Revenue, P&L & Global Kill-Switch Dashboard
"""
from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# SUBSCRIPTION PLANS & ENTITLEMENT MATRIX
# -----------------------------------------------------------------------------

class SubscriptionPlanCreate(BaseModel):
    plan_code: str = Field(..., min_length=2, max_length=40, description="e.g. STANDARD, PREMIUM, CUSTOM_ENTERPRISE")
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = None
    billing_interval: str = Field("MONTHLY", description="MONTHLY or ANNUAL")
    base_price_inr: Decimal = Field(Decimal("0.00"), ge=0)
    annual_discount_percent: Decimal = Field(Decimal("15.00"), ge=0, le=100)
    standard_setup_fee_inr: Decimal = Field(Decimal("5000.00"), ge=0)
    standard_amc_rate_inr: Decimal = Field(Decimal("3000.00"), ge=0)
    trial_days: int = Field(30, ge=0)
    default_features: list[str] = Field(default_factory=list)
    max_rooms: int = Field(50, ge=0, description="0 = unlimited")
    max_staff_accounts: int = Field(20, ge=0)
    is_active: bool = True
    is_public: bool = True
    sort_order: int = 0


class SubscriptionPlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    billing_interval: str | None = None
    base_price_inr: Decimal | None = None
    annual_discount_percent: Decimal | None = None
    standard_setup_fee_inr: Decimal | None = None
    standard_amc_rate_inr: Decimal | None = None
    trial_days: int | None = None
    default_features: list[str] | None = None
    max_rooms: int | None = None
    max_staff_accounts: int | None = None
    is_active: bool | None = None
    is_public: bool | None = None
    sort_order: int | None = None


class SubscriptionPlanOut(BaseModel):
    id: str
    plan_code: str
    name: str
    description: str | None
    billing_interval: str
    base_price_inr: Decimal
    annual_discount_percent: Decimal
    standard_setup_fee_inr: Decimal
    standard_amc_rate_inr: Decimal
    trial_days: int
    default_features: list[str]
    max_rooms: int
    max_staff_accounts: int
    is_active: bool
    is_public: bool
    sort_order: int
    created_at: datetime


class PlanEntitlementMatrixItem(BaseModel):
    category: str
    plan_code: str
    plan_name: str
    base_price_inr: Decimal
    annual_price_inr: Decimal
    features: list[str]
    feature_flags: dict[str, bool]


# -----------------------------------------------------------------------------
# GRANULAR FEATURE ENTITLEMENT OVERRIDES
# -----------------------------------------------------------------------------

class PropertyFeatureOverrideRequest(BaseModel):
    feature_key: str = Field(..., description="e.g. MOD_360_PANORAMA, MOD_AI_COPILOT, MOD_KOT_WAITER")
    is_enabled: bool = Field(..., description="True to grant, False to revoke")
    reason: str | None = Field(None, description="Admin rationale e.g. Early Adopter Pilot")
    expires_at: datetime | None = None


class PropertyFeatureOverrideOut(BaseModel):
    id: str
    property_id: str
    feature_key: str
    is_enabled: bool
    reason: str | None
    granted_by_user_id: str | None
    expires_at: datetime | None
    created_at: datetime


class PropertyFeatureMatrixOut(BaseModel):
    property_id: str
    property_name: str
    business_code: str
    business_category: str
    subscription_plan: str
    effective_features: list[str]
    feature_overrides: dict[str, bool]
    raw_overrides: list[PropertyFeatureOverrideOut]


# -----------------------------------------------------------------------------
# CONDITIONAL BUSINESS DISCOUNT ENGINE
# -----------------------------------------------------------------------------

class ConditionalDiscountCreate(BaseModel):
    discount_code: str | None = Field(None, description="Optional coupon code or NULL for automatic rule")
    name: str = Field(..., min_length=2, max_length=120)
    deal_type: str = Field(
        ...,
        description="ANCHOR_CLIENT_OVERRIDE | SETUP_FEE_WAIVER | CUSTOM_AMC_RATE | PROMO_COUPON | OWNER_REFERRAL",
    )
    target_property_id: str | None = None
    target_business_category: str | None = Field(None, description="HOMESTAY, RESORT, etc. or NULL for all")
    discount_mode: str = Field(
        "PERCENTAGE", description="PERCENTAGE | FLAT_INR | FIXED_PRICE_OVERRIDE | FULL_WAIVER"
    )
    discount_value: Decimal = Field(Decimal("0.00"), ge=0)
    override_setup_fee_inr: Decimal | None = None
    override_amc_inr: Decimal | None = None
    override_recurring_inr: Decimal | None = None
    referrer_property_id: str | None = None
    referred_property_id: str | None = None
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    max_redemptions: int = Field(100, ge=1)
    admin_notes: str | None = None


class ConditionalDiscountOut(BaseModel):
    id: str
    discount_code: str | None
    name: str
    deal_type: str
    target_property_id: str | None
    target_business_category: str | None
    discount_mode: str
    discount_value: Decimal
    override_setup_fee_inr: Decimal | None
    override_amc_inr: Decimal | None
    override_recurring_inr: Decimal | None
    referrer_property_id: str | None
    referred_property_id: str | None
    valid_from: datetime
    valid_to: datetime | None
    max_redemptions: int
    current_redemptions: int
    is_active: bool
    admin_notes: str | None
    created_at: datetime


class DealEvaluationRequest(BaseModel):
    property_id: str | None = None
    plan_code: str = Field("STANDARD", description="Target plan code")
    billing_cycle: str = Field("MONTHLY", description="MONTHLY or ANNUAL")
    promo_code: str | None = None
    referral_code: str | None = None


class DealEvaluationResponse(BaseModel):
    plan_code: str
    plan_name: str
    billing_cycle: str
    standard_base_recurring_inr: Decimal
    standard_setup_fee_inr: Decimal
    standard_amc_rate_inr: Decimal
    # Applied Deals & Discounts
    applied_deals: list[dict[str, Any]]
    recurring_discount_inr: Decimal
    setup_fee_discount_inr: Decimal
    amc_discount_inr: Decimal
    # Final Net Payable
    net_recurring_inr: Decimal
    net_setup_fee_inr: Decimal
    net_amc_rate_inr: Decimal
    total_due_today_inr: Decimal


# -----------------------------------------------------------------------------
# PROPERTY VERIFICATION & PUBLISHING PIPELINE
# -----------------------------------------------------------------------------

class VerificationListItem(BaseModel):
    application_id: str
    property_id: str | None
    business_code: str
    property_name: str
    business_category: str
    owner_full_name: str
    owner_mobile: str
    owner_email: str
    village_city: str
    state: str
    subscription_plan: str
    status: str
    verification_status: str
    owner_pan_number: str
    owner_gov_id_masked_display: str
    created_at: datetime
    google_maps_url: str | None


class VerificationDetailOut(BaseModel):
    application_id: str
    property_id: str | None
    business_code: str
    property_name: str
    slug: str
    business_category: str
    owner_full_name: str
    owner_mobile: str
    owner_email: str
    owner_whatsapp: str | None
    is_mobile_verified: bool
    is_email_verified: bool
    formatted_address: str
    street_landmark: str | None
    village_city: str
    taluka: str | None
    district: str | None
    state: str
    pincode: str
    latitude: float | None
    longitude: float | None
    google_maps_url: str | None
    police_station_jurisdiction: str | None
    # KYC Vault (Safe inspection)
    owner_pan_number: str
    owner_pan_doc_url: str | None
    owner_gov_id_type: str
    owner_gov_id_masked_display: str
    owner_gov_id_doc_url: str | None
    property_ownership_proof_type: str | None
    property_ownership_doc_url: str | None
    category_licenses: dict[str, Any]
    merchant_upi_vpa: str
    gstin_number: str | None
    operational_policies: dict[str, Any]
    subscription_plan: str
    status: str
    admin_notes: str | None
    verified_at: datetime | None
    created_at: datetime


class VerificationActionRequest(BaseModel):
    remarks: str | None = Field(None, description="Admin review notes or reason")
    requested_changes: list[str] | None = Field(
        None, description="Specific items to rectify (e.g. upload renewed FSSAI license)"
    )


# -----------------------------------------------------------------------------
# GLOBAL KILL-SWITCH & PROPERTY STATUS
# -----------------------------------------------------------------------------

class KillSwitchRequest(BaseModel):
    action: str = Field(
        ...,
        description="SUSPEND_PROPERTY | UNPUBLISH_LISTING | FREEZE_BOOKINGS | RESTORE_PROPERTY",
    )
    reason: str = Field(..., min_length=3, description="Administrative rationale for audit logs")


class KillSwitchResponse(BaseModel):
    property_id: str
    action: str
    status: str
    verification_status: str
    is_booking_frozen: bool
    message: str
    timestamp: datetime


class PropertyStatusUpdate(BaseModel):
    status: str = Field(..., description="ACTIVE, SUSPENDED, or CLOSED")
    verification_status: str | None = None
    is_booking_frozen: bool | None = None
    feature_overrides: dict[str, bool] | None = None
    reason: str | None = None


class SuperAdminPropertyItem(BaseModel):
    id: str
    business_code: str | None = None
    name: str
    slug: str
    business_category: str
    owner_name: str | None = None
    owner_phone: str | None = None
    subscription_plan: str
    status: str
    verification_status: str
    is_booking_frozen: bool
    enabled_features: list[str]
    created_at: datetime


# -----------------------------------------------------------------------------
# REVENUE & P&L DASHBOARD
# -----------------------------------------------------------------------------

class PlatformAnalyticsOut(BaseModel):
    total_properties: int
    active_properties: int
    suspended_properties: int
    pending_verification: int
    category_breakdown: dict[str, int]
    total_mrr: Decimal
    total_arr: Decimal
    total_setup_fees_collected: Decimal
    total_setup_fees_waived: Decimal
    total_amc_pipeline: Decimal
    active_trials_count: int
    expiring_trials_7_days: int
    new_listings_last_30_days: int
    paid_conversion_rate_percent: Decimal
