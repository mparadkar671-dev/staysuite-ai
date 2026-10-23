from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field


class SuperAdminPropertyItem(BaseModel):
    id: str
    business_code: str
    name: str
    business_category: str
    owner_name: str
    owner_phone: str
    subscription_plan: str
    status: str
    is_booking_frozen: bool
    enabled_features: list[str]
    created_at: datetime


class PropertyStatusUpdate(BaseModel):
    status: str = Field(..., description="ACTIVE, SUSPENDED, or CLOSED")
    is_booking_frozen: bool | None = None
    feature_overrides: dict[str, bool] | None = None
    reason: str | None = None


class PlatformAnalyticsOut(BaseModel):
    total_properties: int
    active_properties: int
    suspended_properties: int
    category_breakdown: dict[str, int]
    total_mrr: Decimal
    total_setup_fees_collected: Decimal
    new_listings_last_30_days: int
