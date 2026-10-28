"""Super Admin control plane endpoints (Pillar 1 - Main Business Model).

Endpoints:
1. Subscription Plans & Feature Entitlement Matrix
2. Granular Per-Property Feature Overrides
3. Conditional Custom Discounts & Deal Engine
4. New Property Verification & Publishing Workflow
5. 1-Click Global Kill-Switch & Revenue P&L Analytics
"""
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.enums import Role
from app.core.security import Principal, get_current_principal, require_roles
from app.modules.saas_admin import service
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
    PropertyFeatureOverrideRequest,
    PropertyStatusUpdate,
    SubscriptionPlanCreate,
    SubscriptionPlanOut,
    SuperAdminPropertyItem,
    VerificationActionRequest,
    VerificationDetailOut,
    VerificationListItem,
)

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


# -----------------------------------------------------------------------------
# 1. SUBSCRIPTION PLANS & FEATURE ENTITLEMENT MATRIX
# -----------------------------------------------------------------------------

@router.get("/plans", response_model=list[SubscriptionPlanOut])
async def list_plans(
    public_only: bool = Query(False, description="Filter only active public plans"),
    session: AsyncSession = Depends(get_session),
):
    """Lists SaaS subscription plans configured by Super Admin."""
    return await service.list_subscription_plans(session, public_only=public_only)


@router.post("/plans", response_model=SubscriptionPlanOut, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan: SubscriptionPlanCreate,
    session: AsyncSession = Depends(get_session),
):
    """Creates a new SaaS subscription plan with quota and baseline modules."""
    return await service.create_subscription_plan(session, plan)


@router.get("/matrix", response_model=list[PlanEntitlementMatrixItem])
async def get_entitlement_matrix(session: AsyncSession = Depends(get_session)):
    """Returns the multi-category x plan entitlement matrix showing enabled modules."""
    return await service.get_plan_entitlement_matrix(session)


# -----------------------------------------------------------------------------
# 2. GRANULAR PER-PROPERTY FEATURE OVERRIDES
# -----------------------------------------------------------------------------

@router.get("/properties/{property_id}/features", response_model=PropertyFeatureMatrixOut)
async def get_property_features(
    property_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    """Retrieves the effective feature capabilities and all granular overrides for a property."""
    return await service.get_property_feature_matrix(session, property_id)


@router.post("/properties/{property_id}/features/override", response_model=PropertyFeatureMatrixOut)
async def set_feature_override(
    property_id: uuid.UUID,
    req: PropertyFeatureOverrideRequest,
    session: AsyncSession = Depends(get_session),
):
    """Grants or revokes a specific feature module for a property (e.g. MOD_360_PANORAMA, MOD_AI_COPILOT)."""
    return await service.set_property_feature_override(session, property_id, req)


# -----------------------------------------------------------------------------
# 3. CONDITIONAL BUSINESS DISCOUNT ENGINE
# -----------------------------------------------------------------------------

@router.post("/discounts", response_model=ConditionalDiscountOut, status_code=status.HTTP_201_CREATED)
async def create_discount(
    req: ConditionalDiscountCreate,
    session: AsyncSession = Depends(get_session),
):
    """Configures a conditional custom discount (Anchor client, Setup fee waiver, AMC rate, Referral)."""
    return await service.create_conditional_discount(session, req)


@router.get("/discounts", response_model=list[ConditionalDiscountOut])
async def list_discounts(
    property_id: uuid.UUID | None = Query(None, description="Optional filter by property ID"),
    session: AsyncSession = Depends(get_session),
):
    """Lists configured conditional discounts and deals."""
    return await service.list_conditional_discounts(session, property_id=property_id)


@router.post("/discounts/evaluate", response_model=DealEvaluationResponse)
async def evaluate_deal(
    req: DealEvaluationRequest,
    session: AsyncSession = Depends(get_session),
):
    """Evaluates base plan price, setup fee, and AMC against applicable Super Admin deals."""
    return await service.evaluate_deal_pricing(session, req)


# -----------------------------------------------------------------------------
# 4. NEW PROPERTY VERIFICATION & PUBLISHING PIPELINE
# -----------------------------------------------------------------------------

@router.get("/verifications", response_model=list[VerificationListItem])
async def list_pending_verifications(session: AsyncSession = Depends(get_session)):
    """Lists property applications awaiting KYC and category license verification."""
    return await service.list_pending_verifications(session)


@router.get("/verifications/{application_id}", response_model=VerificationDetailOut)
async def get_verification_detail(
    application_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    """Inspects uploaded PAN, Ownership proof, Category licenses, and privacy-safe KYC ([Aadhaar Redacted])."""
    return await service.get_verification_detail(session, application_id)


@router.post("/verifications/{application_id}/approve")
async def approve_and_publish_property(
    application_id: uuid.UUID,
    req: VerificationActionRequest | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Approve & Publish: transitions property to VERIFIED_PUBLISHED and activates live marketplace listing."""
    notes = req.remarks if req else None
    return await service.approve_and_publish_property(session, application_id, notes=notes)


@router.post("/verifications/{application_id}/reject")
async def reject_property(
    application_id: uuid.UUID,
    req: VerificationActionRequest,
    session: AsyncSession = Depends(get_session),
):
    """Rejects onboarding application with remarks."""
    return await service.reject_property_application(session, application_id, req)


@router.post("/verifications/{application_id}/request-changes")
async def request_changes(
    application_id: uuid.UUID,
    req: VerificationActionRequest,
    session: AsyncSession = Depends(get_session),
):
    """Requests corrections or re-uploads of invalid licenses/KYC from property owner."""
    return await service.request_application_changes(session, application_id, req)


# -----------------------------------------------------------------------------
# 5. GLOBAL KILL-SWITCH & DASHBOARD
# -----------------------------------------------------------------------------

@router.post("/properties/{property_id}/kill-switch", response_model=KillSwitchResponse)
async def execute_kill_switch(
    property_id: uuid.UUID,
    req: KillSwitchRequest,
    session: AsyncSession = Depends(get_session),
):
    """1-Click Global Kill-Switch: SUSPEND_PROPERTY, UNPUBLISH_LISTING, FREEZE_BOOKINGS, or RESTORE_PROPERTY."""
    return await service.execute_global_kill_switch(session, property_id, req)


@router.get("/properties", response_model=list[SuperAdminPropertyItem])
async def list_properties(session: AsyncSession = Depends(get_session)):
    """Lists all registered properties with plan, status, and resolved capabilities."""
    return await service.list_all_properties(session)


@router.patch("/properties/{property_id}/status")
async def update_property_status(
    property_id: uuid.UUID,
    update: PropertyStatusUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Updates property status, verification status, and feature overrides."""
    return await service.update_property_status(session, property_id, update)


@router.get("/analytics", response_model=PlatformAnalyticsOut)
async def platform_analytics(session: AsyncSession = Depends(get_session)):
    """Super Admin Revenue, MRR, ARR, trial conversions, and platform P&L dashboard telemetry."""
    return await service.get_platform_analytics(session)
