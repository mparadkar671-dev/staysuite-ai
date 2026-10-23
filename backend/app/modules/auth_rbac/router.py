"""Auth RBAC router implementing the 4-step login, approval workflows, and staff self-service."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.enums import Role
from app.core.security import Principal, get_current_principal, require_roles
from app.modules.auth_rbac import service
from app.modules.auth_rbac.schemas import (
    BusinessRolesOut,
    ForgotPasswordRequest,
    MultiPersonLoginRequest,
    OwnerCreateStaffRequest,
    ResetPasswordRequest,
    ScopedTokenResponse,
    StaffApprovalRequest,
    StaffLeaveRequestCreate,
    StaffLeaveRequestOut,
    StaffMemberProfileOut,
    StaffSelfSignupRequest,
    StaffTaskOut,
    StaffTaskStatusUpdate,
)

router = APIRouter(prefix="/auth", tags=["auth_rbac"])
staff_self_service_router = APIRouter(prefix="/staff", tags=["staff_self_service"])


# ====================================================================
# 4-Step StaySuite App Login Flow
# ====================================================================

@router.get("/business/{business_code}/roles", response_model=BusinessRolesOut)
async def get_roles_for_business(business_code: str, session: AsyncSession = Depends(get_session)):
    """Step 1: Returns active operational roles for this property's business category."""
    return await service.get_business_roles(session, business_code)


@router.get("/business/{business_code}/roles/{role}/members", response_model=list[StaffMemberProfileOut])
async def get_members_for_role(
    business_code: str, role: str, session: AsyncSession = Depends(get_session)
):
    """Step 2: Returns the list of verified staff names/profiles under that specific role."""
    return await service.get_role_members(session, business_code, role)


@router.post("/multi-person-login", response_model=ScopedTokenResponse)
@router.post("/staff-login", response_model=ScopedTokenResponse)
async def multi_person_login(req: MultiPersonLoginRequest, session: AsyncSession = Depends(get_session)):
    """Step 3 & 4: Accepts business_code, role, staff_member_id, and password -> returns scoped JWT."""
    return await service.authenticate_multi_person(session, req)


# ====================================================================
# Dual Staff Creation & Verification Flow
# ====================================================================

@router.post("/staff/create", response_model=StaffMemberProfileOut, status_code=status.HTTP_201_CREATED)
async def owner_create_staff(
    req: OwnerCreateStaffRequest,
    principal: Principal = Depends(require_roles(Role.OWNER, Role.MANAGER)),
    session: AsyncSession = Depends(get_session),
):
    """Flow A (Direct by Owner): Owner/Manager creates staff member with ACTIVE status."""
    return await service.owner_create_staff(session, principal.property_id, req)


@router.post("/staff/self-signup", status_code=status.HTTP_201_CREATED)
async def staff_self_signup(req: StaffSelfSignupRequest, session: AsyncSession = Depends(get_session)):
    """Flow B (Self-Signup via App): Worker self-signs up with PENDING_OWNER_APPROVAL."""
    return await service.staff_self_signup(session, req)


@router.patch("/staff/{staff_id}/approval")
async def approve_or_reject_staff(
    staff_id: uuid.UUID,
    req: StaffApprovalRequest,
    principal: Principal = Depends(require_roles(Role.OWNER, Role.MANAGER)),
    session: AsyncSession = Depends(get_session),
):
    """Owner/Manager approves or rejects pending staff member."""
    return await service.approve_or_reject_staff(session, principal.property_id, staff_id, req)


# ====================================================================
# Email / Mobile OTP Forgot & Reset Password
# ====================================================================

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """Generate 6-digit OTP for password recovery."""
    return await service.request_password_reset(req.email_or_phone)


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, session: AsyncSession = Depends(get_session)):
    """Verify OTP and reset password."""
    return await service.verify_and_reset_password(
        session, req.email_or_phone, req.otp, req.new_password
    )


# ====================================================================
# Universal Employee Self-Service Module (Visible to ALL Staff Roles)
# ====================================================================

@staff_self_service_router.get("/me/tasks", response_model=list[StaffTaskOut])
async def get_my_tasks(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
):
    """Live status of tasks assigned to this specific logged-in staff member."""
    return await service.get_staff_tasks(session, principal.user_id)


@staff_self_service_router.patch("/tasks/{task_id}/status")
async def update_my_task_status(
    task_id: uuid.UUID,
    req: StaffTaskStatusUpdate,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
):
    """Update progress of an assigned operational task."""
    return await service.update_task_status(session, task_id, req.status)


@staff_self_service_router.get("/me/upaad-ledger")
async def get_my_upaad_ledger(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
):
    """Transparent ledger showing earned wages, mid-month advances (Upaad), and net pending payout."""
    return await service.get_staff_upaad_ledger(session, principal.user_id)


@staff_self_service_router.get("/me/leaves", response_model=list[StaffLeaveRequestOut])
async def get_my_leaves(
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
):
    """View status of requested leaves."""
    return await service.get_staff_leaves(session, principal.user_id)


@staff_self_service_router.post("/leaves/request", response_model=StaffLeaveRequestOut)
async def request_leave(
    req: StaffLeaveRequestCreate,
    principal: Principal = Depends(get_current_principal),
    session: AsyncSession = Depends(get_session),
):
    """1-tap form to submit a leave request with dates and reason."""
    return await service.create_staff_leave_request(
        session, principal.property_id, principal.user_id, req
    )
