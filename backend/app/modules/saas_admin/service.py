"""SaaS Admin Service for Super Admin control plane and platform telemetry."""
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import Role
from app.modules.properties.models import Property, User
from app.modules.saas_admin.schemas import (
    PlatformAnalyticsOut,
    PropertyStatusUpdate,
    SuperAdminPropertyItem,
)
from app.plugins.category_matrix import resolve_features


async def get_platform_analytics(session: AsyncSession) -> PlatformAnalyticsOut:
    """Calculates live platform revenue, MRR, listings, and category breakdown."""
    properties = (await session.execute(select(Property))).scalars().all()

    total_props = len(properties)
    active_props = sum(1 for p in properties if getattr(p, "status", "ACTIVE") == "ACTIVE")
    suspended_props = sum(1 for p in properties if getattr(p, "status", "ACTIVE") == "SUSPENDED")

    cat_breakdown: dict[str, int] = {}
    for p in properties:
        cat = str(p.business_category.value if hasattr(p.business_category, "value") else p.business_category)
        cat_breakdown[cat] = cat_breakdown.get(cat, 0) + 1

    # Pricing model: TRIAL = 0, STANDARD = 2499, PREMIUM = 4999, ENTERPRISE = 9999
    plan_rates = {
        "TRIAL": Decimal("0"),
        "STANDARD": Decimal("2499"),
        "PREMIUM": Decimal("4999"),
        "ENTERPRISE": Decimal("9999"),
    }
    total_mrr = sum(
        plan_rates.get(getattr(p, "subscription_plan", "TRIAL").upper(), Decimal("0"))
        for p in properties
        if getattr(p, "status", "ACTIVE") == "ACTIVE"
    )

    # Setup fee: ₹5,000 one-time onboarding per property
    setup_fee_per_prop = Decimal("5000")
    total_setup_fees = setup_fee_per_prop * total_props

    now = datetime.now(UTC)
    thirty_days_ago = now - timedelta(days=30)
    new_listings = sum(1 for p in properties if p.created_at and p.created_at >= thirty_days_ago)

    return PlatformAnalyticsOut(
        total_properties=total_props,
        active_properties=active_props,
        suspended_properties=suspended_props,
        category_breakdown=cat_breakdown,
        total_mrr=total_mrr,
        total_setup_fees_collected=total_setup_fees,
        new_listings_last_30_days=new_listings,
    )


async def list_all_properties(session: AsyncSession) -> list[SuperAdminPropertyItem]:
    """Retrieves all properties with resolved features, owner info, and kill-switch status."""
    properties = (await session.execute(select(Property).order_by(Property.created_at.desc()))).scalars().all()

    items: list[SuperAdminPropertyItem] = []
    for p in properties:
        owner = (
            await session.execute(
                select(User).where(User.property_id == p.id, User.role == Role.OWNER)
            )
        ).scalar_one_or_none()

        plan = getattr(p, "subscription_plan", "TRIAL")
        overrides = getattr(p, "feature_overrides", {}) or {}
        cat = str(p.business_category.value if hasattr(p.business_category, "value") else p.business_category)
        features = list(resolve_features(cat, plan, overrides))

        items.append(
            SuperAdminPropertyItem(
                id=str(p.id),
                business_code=getattr(p, "business_code", f"SS-HM-{str(p.id)[:4]}"),
                name=p.name,
                business_category=cat,
                owner_name=owner.name if owner else "Unknown",
                owner_phone=owner.phone if owner and owner.phone else (p.phone or "N/A"),
                subscription_plan=plan,
                status=getattr(p, "status", "ACTIVE"),
                is_booking_frozen=p.is_booking_frozen,
                enabled_features=features,
                created_at=p.created_at or datetime.now(UTC),
            )
        )
    return items


async def update_property_status(
    session: AsyncSession, property_id: uuid.UUID, update: PropertyStatusUpdate
) -> dict:
    """Global kill-switch: suspends, freezes, or modifies features for a specific business."""
    prop = await session.get(Property, property_id)
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    prop.status = update.status
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
        "is_booking_frozen": prop.is_booking_frozen,
        "feature_overrides": getattr(prop, "feature_overrides", {}),
        "message": f"Property status updated to {prop.status}",
    }
