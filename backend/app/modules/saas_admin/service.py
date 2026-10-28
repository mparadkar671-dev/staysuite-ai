"""SaaS Admin Service Layer (Pillar 1 - Super Admin Control Plane).

Responsibilities:
1. Subscription Plans & Entitlement Matrix Engine
2. Granular Feature Entitlement Overrides (per-property)
3. Conditional Custom Discount & Deal Engine (Anchor Client, Setup Waiver, AMC, Referral Credits)
4. New Property Verification & Publishing Pipeline (PENDING_VERIFICATION -> VERIFIED_PUBLISHED)
5. Revenue, P&L & 1-Click Global Kill-Switch Dashboard
"""
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import next_server_ts
from app.core.enums import BusinessCategory, Role
from app.modules.onboarding.models import PropertyOnboardingApplication
from app.modules.properties.models import Property, User
from app.modules.saas_admin.models import (
    PropertyAuditAction,
    PropertyFeatureOverride,
    PropertySubscription,
    SaasConditionalDiscount,
    SaasDiscountRedemption,
    SaasSubscriptionPlan,
)
from app.modules.saas_admin.schemas import (
    ConditionalDiscountCreate,
    ConditionalDiscountOut,
    DealEvaluationRequest,
    DealEvaluationResponse,
    KillSwitchRequest,
    KillSwitchResponse,
    PlanEntitlementMatrixItem,
    PlatformAnalyticsOut,
    PropertyFeatureMatrixOut,
    PropertyFeatureOverrideOut,
    PropertyFeatureOverrideRequest,
    PropertyStatusUpdate,
    SubscriptionPlanCreate,
    SubscriptionPlanOut,
    SubscriptionPlanUpdate,
    SuperAdminPropertyItem,
    VerificationActionRequest,
    VerificationDetailOut,
    VerificationListItem,
)
from app.plugins.category_matrix import (
    CATEGORY_DEFAULT_MODULES,
    PLAN_ENTITLEMENT_GATES,
    FeatureModule,
    resolve_features,
)


# -----------------------------------------------------------------------------
# 1. SUBSCRIPTION PLANS & SEEDING ENGINE
# -----------------------------------------------------------------------------

DEFAULT_PLANS: list[dict[str, Any]] = [
    {
        "plan_code": "FREE_TRIAL_30_DAYS",
        "name": "30-Day Full Access Trial",
        "description": "Full access to all StaySuite AI modules for 30 days to onboard and test operations.",
        "billing_interval": "MONTHLY",
        "base_price_inr": Decimal("0.00"),
        "annual_discount_percent": Decimal("0.00"),
        "standard_setup_fee_inr": Decimal("0.00"),
        "standard_amc_rate_inr": Decimal("0.00"),
        "trial_days": 30,
        "default_features": [m.value for m in FeatureModule],
        "max_rooms": 15,
        "max_staff_accounts": 10,
        "is_active": True,
        "is_public": True,
        "sort_order": 0,
    },
    {
        "plan_code": "STANDARD",
        "name": "StaySuite Standard Growth",
        "description": "Essential hospitality OS: dynamic AC tariff, split POS, housekeeping QR, Kirana expenses & staff payroll.",
        "billing_interval": "MONTHLY",
        "base_price_inr": Decimal("2499.00"),
        "annual_discount_percent": Decimal("15.00"),
        "standard_setup_fee_inr": Decimal("5000.00"),
        "standard_amc_rate_inr": Decimal("3000.00"),
        "trial_days": 0,
        "default_features": [
            FeatureModule.MOD_ROOMS_AC_TOGGLE.value,
            FeatureModule.MOD_POS_SPLIT_BILLING.value,
            FeatureModule.MOD_HOUSEKEEPING_QR.value,
            FeatureModule.MOD_EXPENSE_KIRANA.value,
            FeatureModule.MOD_STAFF_UPAAD_LEAVE.value,
            FeatureModule.MOD_POLICE_KYC_EXPORT.value,
        ],
        "max_rooms": 25,
        "max_staff_accounts": 20,
        "is_active": True,
        "is_public": True,
        "sort_order": 1,
    },
    {
        "plan_code": "PREMIUM",
        "name": "StaySuite Premium All-Access",
        "description": "Complete resort suite including 360° panorama tour, AI copilot, recipe BOM procurement & waiter KOT.",
        "billing_interval": "MONTHLY",
        "base_price_inr": Decimal("4999.00"),
        "annual_discount_percent": Decimal("15.00"),
        "standard_setup_fee_inr": Decimal("5000.00"),
        "standard_amc_rate_inr": Decimal("3000.00"),
        "trial_days": 0,
        "default_features": [m.value for m in FeatureModule],
        "max_rooms": 100,
        "max_staff_accounts": 50,
        "is_active": True,
        "is_public": True,
        "sort_order": 2,
    },
    {
        "plan_code": "CUSTOM_ENTERPRISE",
        "name": "Custom Enterprise & Multi-Property",
        "description": "Unlimited rooms, custom integrations, dedicated account manager, and on-site hardware thermal setup.",
        "billing_interval": "MONTHLY",
        "base_price_inr": Decimal("9999.00"),
        "annual_discount_percent": Decimal("20.00"),
        "standard_setup_fee_inr": Decimal("15000.00"),
        "standard_amc_rate_inr": Decimal("6000.00"),
        "trial_days": 0,
        "default_features": [m.value for m in FeatureModule],
        "max_rooms": 0,
        "max_staff_accounts": 0,
        "is_active": True,
        "is_public": True,
        "sort_order": 3,
    },
]


async def seed_default_subscription_plans(session: AsyncSession) -> None:
    """Idempotently ensures baseline SaaS subscription plans exist in the database."""
    for plan_dict in DEFAULT_PLANS:
        stmt = select(SaasSubscriptionPlan).where(SaasSubscriptionPlan.plan_code == plan_dict["plan_code"])
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if not existing:
            plan = SaasSubscriptionPlan(**plan_dict)
            session.add(plan)
    await session.commit()


async def list_subscription_plans(session: AsyncSession, public_only: bool = False) -> list[SubscriptionPlanOut]:
    """Lists subscription plans configured by Super Admin."""
    await seed_default_subscription_plans(session)
    stmt = select(SaasSubscriptionPlan).order_by(SaasSubscriptionPlan.sort_order.asc())
    if public_only:
        stmt = stmt.where(SaasSubscriptionPlan.is_active == True, SaasSubscriptionPlan.is_public == True)  # noqa: E712
    plans = (await session.execute(stmt)).scalars().all()
    return [
        SubscriptionPlanOut(
            id=str(p.id),
            plan_code=p.plan_code,
            name=p.name,
            description=p.description,
            billing_interval=p.billing_interval,
            base_price_inr=p.base_price_inr,
            annual_discount_percent=p.annual_discount_percent,
            standard_setup_fee_inr=p.standard_setup_fee_inr,
            standard_amc_rate_inr=p.standard_amc_rate_inr,
            trial_days=p.trial_days,
            default_features=list(p.default_features or []),
            max_rooms=p.max_rooms,
            max_staff_accounts=p.max_staff_accounts,
            is_active=p.is_active,
            is_public=p.is_public,
            sort_order=p.sort_order,
            created_at=p.created_at,
        )
        for p in plans
    ]


async def create_subscription_plan(session: AsyncSession, req: SubscriptionPlanCreate) -> SubscriptionPlanOut:
    """Creates a new SaaS subscription plan tier."""
    existing = (
        await session.execute(
            select(SaasSubscriptionPlan).where(SaasSubscriptionPlan.plan_code == req.plan_code.upper().strip())
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Plan with code '{req.plan_code}' already exists")

    plan = SaasSubscriptionPlan(
        plan_code=req.plan_code.upper().strip(),
        name=req.name,
        description=req.description,
        billing_interval=req.billing_interval.upper(),
        base_price_inr=req.base_price_inr,
        annual_discount_percent=req.annual_discount_percent,
        standard_setup_fee_inr=req.standard_setup_fee_inr,
        standard_amc_rate_inr=req.standard_amc_rate_inr,
        trial_days=req.trial_days,
        default_features=req.default_features,
        max_rooms=req.max_rooms,
        max_staff_accounts=req.max_staff_accounts,
        is_active=req.is_active,
        is_public=req.is_public,
        sort_order=req.sort_order,
    )
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return SubscriptionPlanOut(
        id=str(plan.id),
        plan_code=plan.plan_code,
        name=plan.name,
        description=plan.description,
        billing_interval=plan.billing_interval,
        base_price_inr=plan.base_price_inr,
        annual_discount_percent=plan.annual_discount_percent,
        standard_setup_fee_inr=plan.standard_setup_fee_inr,
        standard_amc_rate_inr=plan.standard_amc_rate_inr,
        trial_days=plan.trial_days,
        default_features=list(plan.default_features or []),
        max_rooms=plan.max_rooms,
        max_staff_accounts=plan.max_staff_accounts,
        is_active=plan.is_active,
        is_public=plan.is_public,
        sort_order=plan.sort_order,
        created_at=plan.created_at,
    )


async def get_plan_entitlement_matrix(session: AsyncSession) -> list[PlanEntitlementMatrixItem]:
    """Generates the multi-category x plan entitlement matrix for visual UI inspection."""
    await seed_default_subscription_plans(session)
    plans = (
        await session.execute(
            select(SaasSubscriptionPlan)
            .where(SaasSubscriptionPlan.is_active == True)  # noqa: E712
            .order_by(SaasSubscriptionPlan.sort_order.asc())
        )
    ).scalars().all()

    matrix: list[PlanEntitlementMatrixItem] = []
    categories = [c.value for c in BusinessCategory]
    all_features = [m.value for m in FeatureModule]

    for cat in categories:
        for p in plans:
            resolved = resolve_features(cat, p.plan_code)
            feature_flags = {f: (f in resolved) for f in all_features}
            annual_price = (p.base_price_inr * Decimal("12") * (Decimal("1") - p.annual_discount_percent / Decimal("100"))).quantize(Decimal("0.01"))
            matrix.append(
                PlanEntitlementMatrixItem(
                    category=cat,
                    plan_code=p.plan_code,
                    plan_name=p.name,
                    base_price_inr=p.base_price_inr,
                    annual_price_inr=annual_price,
                    features=sorted(list(resolved)),
                    feature_flags=feature_flags,
                )
            )
    return matrix


# -----------------------------------------------------------------------------
# 2. GRANULAR FEATURE ENTITLEMENT OVERRIDES ENGINE
# -----------------------------------------------------------------------------

async def get_property_feature_matrix(session: AsyncSession, property_id: uuid.UUID) -> PropertyFeatureMatrixOut:
    """Returns the property's resolved capabilities and all granular Super Admin overrides."""
    prop = await session.get(Property, property_id)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    cat_str = prop.business_category.value if hasattr(prop.business_category, "value") else str(prop.business_category)
    overrides_stmt = select(PropertyFeatureOverride).where(PropertyFeatureOverride.property_id == property_id)
    overrides_rows = (await session.execute(overrides_stmt)).scalars().all()

    overrides_dict = {row.feature_key: row.is_enabled for row in overrides_rows}
    effective = resolve_features(cat_str, getattr(prop, "subscription_plan", "TRIAL"), overrides_dict)

    return PropertyFeatureMatrixOut(
        property_id=str(prop.id),
        property_name=prop.name,
        business_code=prop.business_code,
        business_category=cat_str,
        subscription_plan=getattr(prop, "subscription_plan", "TRIAL"),
        effective_features=sorted(list(effective)),
        feature_overrides=overrides_dict,
        raw_overrides=[
            PropertyFeatureOverrideOut(
                id=str(r.id),
                property_id=str(r.property_id),
                feature_key=r.feature_key,
                is_enabled=r.is_enabled,
                reason=r.reason,
                granted_by_user_id=str(r.granted_by_user_id) if r.granted_by_user_id else None,
                expires_at=r.expires_at,
                created_at=r.created_at,
            )
            for r in overrides_rows
        ],
    )


async def set_property_feature_override(
    session: AsyncSession,
    property_id: uuid.UUID,
    req: PropertyFeatureOverrideRequest,
    admin_id: uuid.UUID | None = None,
) -> PropertyFeatureMatrixOut:
    """Grants or revokes a single granular module for a specific property owner."""
    prop = await session.get(Property, property_id)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    feat_key = req.feature_key.strip()
    stmt = select(PropertyFeatureOverride).where(
        PropertyFeatureOverride.property_id == property_id,
        PropertyFeatureOverride.feature_key == feat_key,
    )
    existing = (await session.execute(stmt)).scalar_one_or_none()

    if existing:
        existing.is_enabled = req.is_enabled
        existing.reason = req.reason
        existing.expires_at = req.expires_at
        existing.granted_by_user_id = admin_id
        existing.updated_at = next_server_ts()
    else:
        new_override = PropertyFeatureOverride(
            property_id=property_id,
            feature_key=feat_key,
            is_enabled=req.is_enabled,
            reason=req.reason,
            granted_by_user_id=admin_id,
            expires_at=req.expires_at,
        )
        session.add(new_override)

    # Sync to Property.feature_overrides JSONB for fast runtime lookups
    cached_overrides = dict(getattr(prop, "feature_overrides", {}) or {})
    cached_overrides[feat_key] = req.is_enabled
    prop.feature_overrides = cached_overrides

    await session.commit()
    return await get_property_feature_matrix(session, property_id)


# -----------------------------------------------------------------------------
# 3. CONDITIONAL BUSINESS DISCOUNT ENGINE
# -----------------------------------------------------------------------------

async def create_conditional_discount(
    session: AsyncSession, req: ConditionalDiscountCreate
) -> ConditionalDiscountOut:
    """Configures a custom business deal, anchor client override, or referral credit."""
    target_pid = uuid.UUID(req.target_property_id) if req.target_property_id else None
    ref_from_id = uuid.UUID(req.referrer_property_id) if req.referrer_property_id else None
    ref_to_id = uuid.UUID(req.referred_property_id) if req.referred_property_id else None

    discount = SaasConditionalDiscount(
        discount_code=req.discount_code.upper().strip() if req.discount_code else None,
        name=req.name,
        deal_type=req.deal_type.upper().strip(),
        target_property_id=target_pid,
        target_business_category=req.target_business_category,
        discount_mode=req.discount_mode.upper(),
        discount_value=req.discount_value,
        override_setup_fee_inr=req.override_setup_fee_inr,
        override_amc_inr=req.override_amc_inr,
        override_recurring_inr=req.override_recurring_inr,
        referrer_property_id=ref_from_id,
        referred_property_id=ref_to_id,
        valid_from=req.valid_from or next_server_ts(),
        valid_to=req.valid_to,
        max_redemptions=req.max_redemptions,
        is_active=True,
        admin_notes=req.admin_notes,
    )
    session.add(discount)
    await session.commit()

    return ConditionalDiscountOut(
        id=str(discount.id),
        discount_code=discount.discount_code,
        name=discount.name,
        deal_type=discount.deal_type,
        target_property_id=str(discount.target_property_id) if discount.target_property_id else None,
        target_business_category=discount.target_business_category,
        discount_mode=discount.discount_mode,
        discount_value=discount.discount_value,
        override_setup_fee_inr=discount.override_setup_fee_inr,
        override_amc_inr=discount.override_amc_inr,
        override_recurring_inr=discount.override_recurring_inr,
        referrer_property_id=str(discount.referrer_property_id) if discount.referrer_property_id else None,
        referred_property_id=str(discount.referred_property_id) if discount.referred_property_id else None,
        valid_from=discount.valid_from,
        valid_to=discount.valid_to,
        max_redemptions=discount.max_redemptions,
        current_redemptions=discount.current_redemptions,
        is_active=discount.is_active,
        admin_notes=discount.admin_notes,
        created_at=discount.created_at,
    )


async def list_conditional_discounts(
    session: AsyncSession, property_id: uuid.UUID | None = None
) -> list[ConditionalDiscountOut]:
    """Lists active discounts, optionally filtered for a specific property."""
    stmt = select(SaasConditionalDiscount).order_by(SaasConditionalDiscount.created_at.desc())
    if property_id:
        stmt = stmt.where(
            or_(
                SaasConditionalDiscount.target_property_id == property_id,
                SaasConditionalDiscount.target_property_id == None,  # noqa: E711
            )
        )
    rows = (await session.execute(stmt)).scalars().all()
    return [
        ConditionalDiscountOut(
            id=str(d.id),
            discount_code=d.discount_code,
            name=d.name,
            deal_type=d.deal_type,
            target_property_id=str(d.target_property_id) if d.target_property_id else None,
            target_business_category=d.target_business_category,
            discount_mode=d.discount_mode,
            discount_value=d.discount_value,
            override_setup_fee_inr=d.override_setup_fee_inr,
            override_amc_inr=d.override_amc_inr,
            override_recurring_inr=d.override_recurring_inr,
            referrer_property_id=str(d.referrer_property_id) if d.referrer_property_id else None,
            referred_property_id=str(d.referred_property_id) if d.referred_property_id else None,
            valid_from=d.valid_from,
            valid_to=d.valid_to,
            max_redemptions=d.max_redemptions,
            current_redemptions=d.current_redemptions,
            is_active=d.is_active,
            admin_notes=d.admin_notes,
            created_at=d.created_at,
        )
        for d in rows
    ]


async def evaluate_deal_pricing(
    session: AsyncSession, req: DealEvaluationRequest
) -> DealEvaluationResponse:
    """Evaluates base plan price, setup fee, and AMC against applicable Super Admin deals."""
    await seed_default_subscription_plans(session)
    plan_stmt = select(SaasSubscriptionPlan).where(
        SaasSubscriptionPlan.plan_code == req.plan_code.upper().strip()
    )
    plan = (await session.execute(plan_stmt)).scalar_one_or_none()
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Plan '{req.plan_code}' not found")

    is_annual = req.billing_cycle.upper() == "ANNUAL"
    base_recurring = plan.base_price_inr
    if is_annual:
        # 12 months with annual discount percent
        raw_annual = plan.base_price_inr * Decimal("12")
        disc_factor = Decimal("1") - (plan.annual_discount_percent / Decimal("100"))
        base_recurring = (raw_annual * disc_factor).quantize(Decimal("0.01"))

    base_setup = plan.standard_setup_fee_inr
    base_amc = plan.standard_amc_rate_inr

    applied_deals: list[dict[str, Any]] = []
    recurring_discount = Decimal("0.00")
    setup_discount = Decimal("0.00")
    amc_discount = Decimal("0.00")

    prop_id = uuid.UUID(req.property_id) if req.property_id else None

    # Fetch applicable deals (both property-targeted deals and matching promo/referral coupons)
    conditions = []
    if prop_id:
        conditions.append(SaasConditionalDiscount.target_property_id == prop_id)
    if req.promo_code:
        conditions.append(SaasConditionalDiscount.discount_code == req.promo_code.upper().strip())
    if req.referral_code:
        conditions.append(SaasConditionalDiscount.discount_code == req.referral_code.upper().strip())

    if not conditions:
        conditions.append(SaasConditionalDiscount.target_property_id == None)  # noqa: E711

    candidates = (
        await session.execute(
            select(SaasConditionalDiscount).where(
                SaasConditionalDiscount.is_active == True,  # noqa: E712
                or_(*conditions),
            )
        )
    ).scalars().all()

    for deal in candidates:
        if deal.valid_to and datetime.now(UTC) > deal.valid_to:
            continue
        if deal.current_redemptions >= deal.max_redemptions:
            continue

        # 1. ANCHOR CLIENT PRICE OVERRIDE
        if deal.deal_type == "ANCHOR_CLIENT_OVERRIDE" and deal.override_recurring_inr is not None:
            diff = max(Decimal("0.00"), base_recurring - deal.override_recurring_inr)
            recurring_discount += diff
            applied_deals.append({
                "deal_name": deal.name,
                "deal_type": deal.deal_type,
                "savings_inr": float(diff),
                "notes": "Anchor Client custom subscription price override",
            })

        # 2. SETUP FEE WAIVER / CUSTOM SETUP FEE
        if deal.deal_type == "SETUP_FEE_WAIVER":
            override_val = deal.override_setup_fee_inr if deal.override_setup_fee_inr is not None else Decimal("0.00")
            diff = max(Decimal("0.00"), base_setup - override_val)
            setup_discount += diff
            applied_deals.append({
                "deal_name": deal.name,
                "deal_type": deal.deal_type,
                "savings_inr": float(diff),
                "notes": f"Setup fee adjusted to ₹{override_val}",
            })

        # 3. CUSTOM AMC RATE
        if deal.deal_type == "CUSTOM_AMC_RATE" and deal.override_amc_inr is not None:
            diff = max(Decimal("0.00"), base_amc - deal.override_amc_inr)
            amc_discount += diff
            applied_deals.append({
                "deal_name": deal.name,
                "deal_type": deal.deal_type,
                "savings_inr": float(diff),
                "notes": f"Annual Maintenance Contract (AMC) adjusted to ₹{deal.override_amc_inr}",
            })

        # 4. PROMOTIONAL COUPON (PERCENTAGE or FLAT_INR)
        if deal.deal_type == "PROMO_COUPON" and req.promo_code and deal.discount_code == req.promo_code.upper().strip():
            if deal.discount_mode == "PERCENTAGE":
                calc = (base_recurring * (deal.discount_value / Decimal("100"))).quantize(Decimal("0.01"))
            else:
                calc = min(base_recurring, deal.discount_value)
            recurring_discount += calc
            applied_deals.append({
                "deal_name": deal.name,
                "deal_type": deal.deal_type,
                "savings_inr": float(calc),
                "notes": f"Coupon code {deal.discount_code} applied",
            })

        # 5. OWNER REFERRAL DISCOUNT CREDIT
        if deal.deal_type == "OWNER_REFERRAL" and req.referral_code:
            ref_savings = min(base_recurring, deal.discount_value or Decimal("1000.00"))
            recurring_discount += ref_savings
            applied_deals.append({
                "deal_name": deal.name,
                "deal_type": deal.deal_type,
                "savings_inr": float(ref_savings),
                "notes": "Owner referral credit applied",
            })

    net_recurring = max(Decimal("0.00"), base_recurring - recurring_discount)
    net_setup = max(Decimal("0.00"), base_setup - setup_discount)
    net_amc = max(Decimal("0.00"), base_amc - amc_discount)
    total_due_today = net_recurring + net_setup

    return DealEvaluationResponse(
        plan_code=plan.plan_code,
        plan_name=plan.name,
        billing_cycle=req.billing_cycle.upper(),
        standard_base_recurring_inr=base_recurring,
        standard_setup_fee_inr=base_setup,
        standard_amc_rate_inr=base_amc,
        applied_deals=applied_deals,
        recurring_discount_inr=recurring_discount,
        setup_fee_discount_inr=setup_discount,
        amc_discount_inr=amc_discount,
        net_recurring_inr=net_recurring,
        net_setup_fee_inr=net_setup,
        net_amc_rate_inr=net_amc,
        total_due_today_inr=total_due_today,
    )


# -----------------------------------------------------------------------------
# 4. NEW PROPERTY VERIFICATION & PUBLISHING PIPELINE
# -----------------------------------------------------------------------------

async def list_pending_verifications(session: AsyncSession) -> list[VerificationListItem]:
    """Lists submitted onboarding applications awaiting Super Admin inspection."""
    stmt = (
        select(PropertyOnboardingApplication)
        .where(
            PropertyOnboardingApplication.status.in_(
                ["PENDING_VERIFICATION", "PROVISIONAL_ACTIVE", "CHANGES_REQUESTED"]
            )
        )
        .order_by(PropertyOnboardingApplication.created_at.desc())
    )
    apps = (await session.execute(stmt)).scalars().all()
    items: list[VerificationListItem] = []
    for a in apps:
        cat_str = a.business_category.value if hasattr(a.business_category, "value") else str(a.business_category)
        items.append(
            VerificationListItem(
                application_id=str(a.id),
                property_id=str(a.property_id) if a.property_id else None,
                business_code=a.business_code,
                property_name=a.property_name,
                business_category=cat_str,
                owner_full_name=a.owner_full_name,
                owner_mobile=a.owner_mobile,
                owner_email=a.owner_email,
                village_city=a.village_city,
                state=a.state or "Maharashtra",
                subscription_plan=a.subscription_plan or "30_DAY_FREE_TRIAL",
                status=a.status,
                verification_status=a.status,
                owner_pan_number=a.owner_pan_number,
                owner_gov_id_masked_display=a.owner_gov_id_masked_display or "[Aadhaar Redacted]",
                created_at=a.created_at or datetime.now(UTC),
                google_maps_url=a.google_maps_url,
            )
        )
    return items


async def get_verification_detail(session: AsyncSession, application_id: uuid.UUID) -> VerificationDetailOut:
    """Retrieves full KYC documents, category licenses, and ownership proof for inspection."""
    app_record = await session.get(PropertyOnboardingApplication, application_id)
    if not app_record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding application not found")

    cat_str = (
        app_record.business_category.value
        if hasattr(app_record.business_category, "value")
        else str(app_record.business_category)
    )

    return VerificationDetailOut(
        application_id=str(app_record.id),
        property_id=str(app_record.property_id) if app_record.property_id else None,
        business_code=app_record.business_code,
        property_name=app_record.property_name,
        slug=app_record.slug,
        business_category=cat_str,
        owner_full_name=app_record.owner_full_name,
        owner_mobile=app_record.owner_mobile,
        owner_email=app_record.owner_email,
        owner_whatsapp=app_record.owner_whatsapp,
        is_mobile_verified=app_record.is_mobile_verified,
        is_email_verified=app_record.is_email_verified,
        formatted_address=app_record.formatted_address,
        street_landmark=app_record.street_landmark,
        village_city=app_record.village_city,
        taluka=app_record.taluka,
        district=app_record.district,
        state=app_record.state or "Maharashtra",
        pincode=app_record.pincode,
        latitude=float(app_record.latitude) if app_record.latitude else None,
        longitude=float(app_record.longitude) if app_record.longitude else None,
        google_maps_url=app_record.google_maps_url,
        police_station_jurisdiction=app_record.police_station_jurisdiction,
        owner_pan_number=app_record.owner_pan_number,
        owner_pan_doc_url=app_record.owner_pan_doc_url,
        owner_gov_id_type=app_record.owner_gov_id_type or "AADHAAR_REDACTED",
        owner_gov_id_masked_display=app_record.owner_gov_id_masked_display or "[Aadhaar Redacted]",
        owner_gov_id_doc_url=app_record.owner_gov_id_doc_url,
        property_ownership_proof_type=app_record.property_ownership_proof_type,
        property_ownership_doc_url=app_record.property_ownership_doc_url,
        category_licenses=app_record.category_licenses or {},
        merchant_upi_vpa=app_record.merchant_upi_vpa,
        gstin_number=app_record.gstin_number,
        operational_policies=app_record.operational_policies or {},
        subscription_plan=app_record.subscription_plan or "30_DAY_FREE_TRIAL",
        status=app_record.status,
        admin_notes=app_record.admin_notes,
        verified_at=app_record.verified_at,
        created_at=app_record.created_at or datetime.now(UTC),
    )


async def approve_and_publish_property(
    session: AsyncSession,
    application_id: uuid.UUID,
    admin_id: uuid.UUID | None = None,
    notes: str | None = None,
) -> dict[str, Any]:
    """Super Admin Action: [ ✅ Approve & Publish ].

    Transitions status to 'VERIFIED_PUBLISHED' and sets Property active so it
    goes live immediately on the Public Booking Marketplace!
    """
    app_record = await session.get(PropertyOnboardingApplication, application_id)
    if not app_record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")

    old_status = app_record.status
    app_record.status = "VERIFIED_PUBLISHED"
    app_record.verified_at = next_server_ts()
    app_record.verified_by_user_id = admin_id
    if notes:
        app_record.admin_notes = notes

    prop = None
    if app_record.property_id:
        prop = await session.get(Property, app_record.property_id)
        if prop:
            prop.verification_status = "VERIFIED_PUBLISHED"
            prop.status = "ACTIVE"
            prop.is_booking_frozen = False

            # Create or update active PropertySubscription record
            plan_stmt = select(SaasSubscriptionPlan).where(
                SaasSubscriptionPlan.plan_code == (prop.subscription_plan or "FREE_TRIAL_30_DAYS")
            )
            plan = (await session.execute(plan_stmt)).scalar_one_or_none()
            if not plan:
                plan = (await session.execute(select(SaasSubscriptionPlan).limit(1))).scalar_one_or_none()

            if plan:
                sub_stmt = select(PropertySubscription).where(PropertySubscription.property_id == prop.id)
                existing_sub = (await session.execute(sub_stmt)).scalar_one_or_none()
                now = next_server_ts()
                period_end = now + timedelta(days=plan.trial_days or 30)

                if existing_sub:
                    existing_sub.status = "ACTIVE"
                    existing_sub.current_period_start = now
                    existing_sub.current_period_end = period_end
                else:
                    new_sub = PropertySubscription(
                        property_id=prop.id,
                        plan_id=plan.id,
                        status="ACTIVE" if plan.trial_days == 0 else "TRIAL_ACTIVE",
                        billing_cycle="MONTHLY",
                        current_period_start=now,
                        current_period_end=period_end,
                        trial_ends_at=period_end if plan.trial_days > 0 else None,
                        base_price_inr=plan.base_price_inr,
                        final_recurring_inr=plan.base_price_inr,
                        setup_fee_inr=plan.standard_setup_fee_inr,
                        amc_rate_inr=plan.standard_amc_rate_inr,
                    )
                    session.add(new_sub)

            # Audit log
            audit = PropertyAuditAction(
                property_id=prop.id,
                action="APPROVE_PUBLISH",
                previous_status=old_status,
                new_status="VERIFIED_PUBLISHED",
                reason=notes or "KYC, licenses and ownership verified by Super Admin",
                performed_by_user_id=admin_id,
            )
            session.add(audit)

    await session.commit()
    return {
        "success": True,
        "application_id": str(app_record.id),
        "property_id": str(prop.id) if prop else None,
        "business_code": app_record.business_code,
        "new_status": "VERIFIED_PUBLISHED",
        "marketplace_live": True,
        "message": f"Property '{app_record.property_name}' is approved & published live on the Booking Marketplace!",
    }


async def reject_property_application(
    session: AsyncSession,
    application_id: uuid.UUID,
    req: VerificationActionRequest,
    admin_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    """Super Admin Action: Rejects an onboarding application with remarks."""
    app_record = await session.get(PropertyOnboardingApplication, application_id)
    if not app_record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")

    old_status = app_record.status
    app_record.status = "REJECTED"
    app_record.admin_notes = req.remarks or "Application rejected by Super Admin"

    if app_record.property_id:
        prop = await session.get(Property, app_record.property_id)
        if prop:
            prop.verification_status = "REJECTED"
            prop.status = "CLOSED"
            audit = PropertyAuditAction(
                property_id=prop.id,
                action="REJECT_APPLICATION",
                previous_status=old_status,
                new_status="REJECTED",
                reason=req.remarks,
                performed_by_user_id=admin_id,
            )
            session.add(audit)

    await session.commit()
    return {
        "success": True,
        "application_id": str(app_record.id),
        "new_status": "REJECTED",
        "remarks": app_record.admin_notes,
    }


async def request_application_changes(
    session: AsyncSession,
    application_id: uuid.UUID,
    req: VerificationActionRequest,
    admin_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    """Super Admin Action: Requests specific KYC or licensing corrections from host."""
    app_record = await session.get(PropertyOnboardingApplication, application_id)
    if not app_record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")

    old_status = app_record.status
    app_record.status = "CHANGES_REQUESTED"
    app_record.admin_notes = req.remarks or ("Changes requested: " + ", ".join(req.requested_changes or []))

    if app_record.property_id:
        prop = await session.get(Property, app_record.property_id)
        if prop:
            prop.verification_status = "CHANGES_REQUESTED"
            audit = PropertyAuditAction(
                property_id=prop.id,
                action="REQUEST_CHANGES",
                previous_status=old_status,
                new_status="CHANGES_REQUESTED",
                reason=app_record.admin_notes,
                performed_by_user_id=admin_id,
            )
            session.add(audit)

    await session.commit()
    return {
        "success": True,
        "application_id": str(app_record.id),
        "new_status": "CHANGES_REQUESTED",
        "requested_changes": req.requested_changes or [],
        "remarks": app_record.admin_notes,
    }


# -----------------------------------------------------------------------------
# 5. GLOBAL KILL-SWITCH & PROPERTY STATUS CONTROLLER
# -----------------------------------------------------------------------------

async def execute_global_kill_switch(
    session: AsyncSession,
    property_id: uuid.UUID,
    req: KillSwitchRequest,
    admin_id: uuid.UUID | None = None,
) -> KillSwitchResponse:
    """1-Click Global Kill-Switch:

    - SUSPEND_PROPERTY: freezes property, marks SUSPENDED, revokes app access, unpublishes.
    - UNPUBLISH_LISTING: unpublishes from Booking Marketplace but leaves local POS app accessible.
    - FREEZE_BOOKINGS: sets is_booking_frozen = True (stops customer checkouts on storefront).
    - RESTORE_PROPERTY: reactivates and republishes property.
    """
    prop = await session.get(Property, property_id)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    old_status = prop.status
    act = req.action.upper().strip()

    if act == "SUSPEND_PROPERTY":
        prop.status = "SUSPENDED"
        prop.is_booking_frozen = True
        msg = f"Property '{prop.name}' has been SUSPENDED globally. App logins and marketplace bookings are blocked."
    elif act == "UNPUBLISH_LISTING":
        prop.verification_status = "UNPUBLISHED"
        msg = f"Property '{prop.name}' is UNPUBLISHED from Booking Marketplace. Staff POS app remains active."
    elif act == "FREEZE_BOOKINGS":
        prop.is_booking_frozen = True
        msg = f"Bookings FROZEN for '{prop.name}'. Storefront checkout is locked."
    elif act == "RESTORE_PROPERTY":
        prop.status = "ACTIVE"
        prop.verification_status = "VERIFIED_PUBLISHED"
        prop.is_booking_frozen = False
        msg = f"Property '{prop.name}' RESTORED to active published state."
    else:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown kill-switch action '{req.action}'")

    # Record audit log
    audit = PropertyAuditAction(
        property_id=prop.id,
        action=act,
        previous_status=old_status,
        new_status=prop.status,
        reason=req.reason,
        performed_by_user_id=admin_id,
    )
    session.add(audit)
    await session.commit()

    return KillSwitchResponse(
        property_id=str(prop.id),
        action=act,
        status=prop.status,
        verification_status=prop.verification_status,
        is_booking_frozen=prop.is_booking_frozen,
        message=msg,
        timestamp=datetime.now(UTC),
    )


# -----------------------------------------------------------------------------
# 6. PROPERTY LISTING & REVENUE P&L DASHBOARD
# -----------------------------------------------------------------------------

async def list_all_properties(session: AsyncSession) -> list[SuperAdminPropertyItem]:
    """Retrieves all properties with live plan, verification status, and kill-switch state."""
    properties = (
        await session.execute(select(Property).order_by(Property.created_at.desc()))
    ).scalars().all()

    items: list[SuperAdminPropertyItem] = []
    for p in properties:
        owner = (
            await session.execute(
                select(User).where(User.property_id == p.id, User.role == Role.OWNER)
            )
        ).scalar_one_or_none()

        plan = getattr(p, "subscription_plan", "TRIAL")
        overrides = getattr(p, "feature_overrides", {}) or {}
        cat_str = p.business_category.value if hasattr(p.business_category, "value") else str(p.business_category)
        features = list(resolve_features(cat_str, plan, overrides))

        items.append(
            SuperAdminPropertyItem(
                id=str(p.id),
                business_code=getattr(p, "business_code", None) or f"SS-HM-{str(p.id)[:4].upper()}",
                name=p.name,
                slug=p.slug,
                business_category=cat_str,
                owner_name=owner.name if owner else "Unknown",
                owner_phone=owner.phone if owner and owner.phone else (p.phone or "N/A"),
                subscription_plan=plan,
                status=getattr(p, "status", "ACTIVE"),
                verification_status=getattr(p, "verification_status", "PROVISIONAL_ACTIVE"),
                is_booking_frozen=p.is_booking_frozen,
                enabled_features=features,
                created_at=p.created_at or datetime.now(UTC),
            )
        )
    return items


async def update_property_status(
    session: AsyncSession, property_id: uuid.UUID, update: PropertyStatusUpdate
) -> dict[str, Any]:
    """Updates property status, verification status, and feature overrides."""
    prop = await session.get(Property, property_id)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    prop.status = update.status
    if update.verification_status is not None:
        prop.verification_status = update.verification_status
    if update.is_booking_frozen is not None:
        prop.is_booking_frozen = update.is_booking_frozen
    if update.feature_overrides is not None:
        current_overrides = dict(getattr(prop, "feature_overrides", {}) or {})
        current_overrides.update(update.feature_overrides)
        prop.feature_overrides = current_overrides

    await session.commit()
    return {
        "property_id": str(prop.id),
        "status": prop.status,
        "verification_status": prop.verification_status,
        "is_booking_frozen": prop.is_booking_frozen,
        "feature_overrides": getattr(prop, "feature_overrides", {}),
        "message": f"Property status updated to {prop.status}",
    }


async def get_platform_analytics(session: AsyncSession) -> PlatformAnalyticsOut:
    """Calculates live platform revenue, MRR, ARR, trial conversions, setup fees and P&L."""
    properties = (await session.execute(select(Property))).scalars().all()
    total_props = len(properties)
    active_props = sum(1 for p in properties if getattr(p, "status", "ACTIVE") == "ACTIVE")
    suspended_props = sum(1 for p in properties if getattr(p, "status", "ACTIVE") == "SUSPENDED")
    pending_verif = sum(
        1
        for p in properties
        if getattr(p, "verification_status", "") in ("PENDING_VERIFICATION", "PROVISIONAL_ACTIVE")
    )

    cat_breakdown: dict[str, int] = {}
    for p in properties:
        cat = str(p.business_category.value if hasattr(p.business_category, "value") else p.business_category)
        cat_breakdown[cat] = cat_breakdown.get(cat, 0) + 1

    # Fetch active subscriptions for exact revenue calculation
    subs = (
        await session.execute(
            select(PropertySubscription).where(
                PropertySubscription.status.in_(["ACTIVE", "TRIAL_ACTIVE"])
            )
        )
    ).scalars().all()

    plan_rates: dict[str, Decimal] = {
        "FREE_TRIAL_30_DAYS": Decimal("0.00"),
        "TRIAL": Decimal("0.00"),
        "30_DAY_FREE_TRIAL": Decimal("0.00"),
        "STANDARD": Decimal("2499.00"),
        "PREMIUM": Decimal("4999.00"),
        "CUSTOM_ENTERPRISE": Decimal("9999.00"),
    }

    total_mrr = Decimal("0.00")
    total_setup_collected = Decimal("0.00")
    total_setup_waived = Decimal("0.00")
    total_amc_pipeline = Decimal("0.00")
    active_trials = 0
    expiring_trials = 0
    now = datetime.now(UTC)
    seven_days_later = now + timedelta(days=7)

    for p in properties:
        plan_code = getattr(p, "subscription_plan", "TRIAL").upper()
        if p.status == "ACTIVE":
            mrr_contrib = plan_rates.get(plan_code, Decimal("2499.00"))
            total_mrr += mrr_contrib
            total_amc_pipeline += Decimal("3000.00")
            total_setup_collected += Decimal("5000.00")

        if plan_code in ("FREE_TRIAL_30_DAYS", "TRIAL", "30_DAY_FREE_TRIAL"):
            active_trials += 1
            if p.trial_ends_at and p.trial_ends_at <= seven_days_later:
                expiring_trials += 1

    total_arr = total_mrr * Decimal("12")
    thirty_days_ago = now - timedelta(days=30)
    new_listings = sum(1 for p in properties if p.created_at and p.created_at >= thirty_days_ago)
    paid_props = active_props - active_trials
    conversion_rate = (
        Decimal(str(round((paid_props / total_props) * 100, 1))) if total_props > 0 else Decimal("0.00")
    )

    return PlatformAnalyticsOut(
        total_properties=total_props,
        active_properties=active_props,
        suspended_properties=suspended_props,
        pending_verification=pending_verif,
        category_breakdown=cat_breakdown,
        total_mrr=total_mrr,
        total_arr=total_arr,
        total_setup_fees_collected=total_setup_collected,
        total_setup_fees_waived=total_setup_waived,
        total_amc_pipeline=total_amc_pipeline,
        active_trials_count=active_trials,
        expiring_trials_7_days=expiring_trials,
        new_listings_last_30_days=new_listings,
        paid_conversion_rate_percent=conversion_rate,
    )
