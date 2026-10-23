import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.enums import BusinessCategory, PlanTier, Role


def _normalize_phone(value: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", value)
    digits = cleaned.lstrip("+")
    if cleaned.startswith("+91"):
        digits = digits[2:]
    elif len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if not re.fullmatch(r"\d{10}", digits):
        raise ValueError("Enter a valid 10-digit mobile number")
    return digits


class _PhoneMixin(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def _phone(cls, value: str) -> str:
        return _normalize_phone(value)


class RegisterOwnerRequest(_PhoneMixin):
    property_name: str = Field(min_length=2, max_length=160)
    business_category: BusinessCategory = BusinessCategory.HOMESTAY
    owner_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    email: str | None = Field(default=None, max_length=200)
    upi_vpa: str | None = Field(default=None, pattern=r"^[\w.\-]{2,64}@[A-Za-z]{2,32}$")
    city: str | None = Field(default=None, max_length=80)


class LoginRequest(_PhoneMixin):
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class CreateUserRequest(_PhoneMixin):
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: Literal[Role.MANAGER, Role.STAFF]


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: uuid.UUID
    property_id: uuid.UUID
    role: Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    name: str
    phone: str
    email: str | None
    role: Role
    is_active: bool


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    business_category: BusinessCategory
    business_config: dict
    upi_vpa: str | None
    is_booking_frozen: bool
    plan_tier: PlanTier
    trial_ends_at: datetime | None
    city: str | None
    updated_at: datetime
