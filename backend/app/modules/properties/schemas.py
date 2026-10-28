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


class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    category_id: uuid.UUID | None = None
    room_number: str
    name: str
    floor_label: str | None = None
    housekeeping_status: str
    door_qr_token: str
    is_active: bool


class SeasonalOfferCreate(BaseModel):
    category_id: uuid.UUID | None = None
    offer_title: str = Field(min_length=2, max_length=160)
    badge_tag: str = Field(default="MONSOON 20% OFF", max_length=64)
    discount_type: Literal["PERCENTAGE", "FLAT_INR"] = "PERCENTAGE"
    discount_value: float = Field(default=20.0, ge=0)
    valid_from: str = Field(..., description="YYYY-MM-DD")
    valid_to: str = Field(..., description="YYYY-MM-DD")
    min_nights: int = Field(default=1, ge=1)
    weekdays_only: bool = False


class SeasonalOfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    category_id: uuid.UUID | None = None
    offer_title: str
    badge_tag: str
    discount_type: str
    discount_value: float
    valid_from: str
    valid_to: str
    min_nights: int
    weekdays_only: bool
    is_active: bool


class RoomCategoryBulkCreate(BaseModel):
    category_name: str = Field(..., min_length=2, max_length=120)
    stay_template_type: str = "STANDARD_ROOM"
    has_ac: bool = True
    base_tariff_ac: float = 3000.0
    allow_guest_non_ac_toggle: bool = True
    base_tariff_non_ac: float = 2200.0
    weekend_surge_percent: float = 0.0
    base_occupancy_adults: int = 2
    max_occupancy: int = 4
    extra_mattress_charge: float = 500.0
    driver_stay_free: bool = True
    amenities_config: dict = Field(default_factory=dict)
    media_config: dict = Field(default_factory=dict)
    room_numbers: list[str] = Field(default_factory=list, description="List of room numbers e.g. ['101', '102']")
    floor_label: str | None = "Ground Floor"


class CloneRoomRequest(BaseModel):
    new_room_number: str = Field(..., min_length=1, max_length=16)
    floor_label: str | None = None


class QuickTariffUpdateRequest(BaseModel):
    base_tariff_ac: float | None = None
    base_tariff_non_ac: float | None = None
    allow_guest_non_ac_toggle: bool | None = None
    weekend_surge_percent: float | None = None
    is_active: bool | None = None


class RoomCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    category_name: str
    stay_template_type: str
    has_ac: bool
    base_tariff_ac: float
    allow_guest_non_ac_toggle: bool
    base_tariff_non_ac: float
    weekend_surge_percent: float
    base_occupancy_adults: int
    max_occupancy: int
    extra_mattress_charge: float
    driver_stay_free: bool
    amenities_config: dict
    media_config: dict
    is_active: bool
    rooms: list[RoomOut] = Field(default_factory=list)
    seasonal_offers: list[SeasonalOfferOut] = Field(default_factory=list)
