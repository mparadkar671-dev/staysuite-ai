"""Schemas for Multi-Person RBAC, 4-step login, approval workflows, and staff self-service."""
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field


class BusinessRolesOut(BaseModel):
    property_id: str
    property_name: str
    business_code: str
    business_category: str
    active_roles: list[str]


class StaffMemberProfileOut(BaseModel):
    id: str
    full_name: str
    role: str
    role_title: str | None = None
    avatar: str | None = None
    phone: str | None = None
    status: str = "ACTIVE"


class MultiPersonLoginRequest(BaseModel):
    business_code: str = Field(..., description="e.g. SS-HM-1001 or property slug")
    role: str = Field(..., description="OWNER, MANAGER, STAFF_HOUSEKEEPING, COOK, etc.")
    staff_member_id: str | None = Field(None, description="UUID of the exact person, or email/phone")
    password: str


class ScopedTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    tenant_id: str
    business_code: str
    business_category: str
    role: str
    staff_member_id: str | None = None
    full_name: str
    enabled_features: list[str]


class OwnerCreateStaffRequest(BaseModel):
    name: str
    role: str
    role_title: str | None = None
    phone: str | None = None
    email: str | None = None
    password: str
    pay_model: str = "MONTHLY_FIXED"
    base_amount: Decimal = Decimal("15000.00")
    per_room_bonus_amount: Decimal = Decimal("50.00")
    preferred_language: str = "mr"


class StaffSelfSignupRequest(BaseModel):
    business_code: str
    role: str
    name: str
    phone: str
    email: str
    password: str
    preferred_language: str = "mr"


class StaffApprovalRequest(BaseModel):
    status: str = Field(..., description="ACTIVE or REJECTED")
    note: str | None = None


class ForgotPasswordRequest(BaseModel):
    email_or_phone: str


class ResetPasswordRequest(BaseModel):
    email_or_phone: str
    otp: str
    new_password: str


class StaffTaskOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    priority: str
    status: str
    due_date: date | None = None


class StaffTaskStatusUpdate(BaseModel):
    status: str = Field(..., description="PENDING, IN_PROGRESS, COMPLETED")


class StaffUpaadLedgerItemOut(BaseModel):
    id: str
    entry_type: str
    amount: Decimal
    entry_date: date
    payroll_period: str | None = None
    note: str | None = None


class StaffLeaveRequestCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str


class StaffLeaveRequestOut(BaseModel):
    id: str
    start_date: date
    end_date: date
    reason: str
    status: str
    review_note: str | None = None
    created_at: datetime | None = None
