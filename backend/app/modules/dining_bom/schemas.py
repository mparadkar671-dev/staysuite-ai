"""Pydantic v2 schemas for Dining, Recipe BOM, Cut-Off Validation & Market Procurement."""
import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.enums import FoodOrderStatus, MarketGroup, MealSlot, MenuCategory


class MenuItemOut(BaseModel):
    id: uuid.UUID
    name: str
    name_local: str | None
    description: str | None
    category: MenuCategory
    price: Decimal
    tax_percent: Decimal
    is_veg: bool
    is_fresh_prep: bool
    is_instant_snack: bool
    is_available: bool
    image_url: str | None
    prep_minutes: int | None
    sort_order: int


class FoodOrderItemIn(BaseModel):
    menu_item_id: uuid.UUID
    qty: int = Field(gt=0, description="Quantity of servings")
    notes: str | None = None


class FoodOrderItemOut(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    name: str
    qty: int
    unit_price: Decimal
    total_price: Decimal
    notes: str | None


class CreateFoodOrderRequest(BaseModel):
    booking_id: uuid.UUID | None = None
    allocation_id: uuid.UUID | None = None
    room_number: str | None = None
    guest_name: str
    order_date: date
    meal_slot: MealSlot = MealSlot.LUNCH
    items: list[FoodOrderItemIn] = Field(min_length=1)
    is_manager_override: bool = False
    notes: str | None = None


class FoodOrderOut(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID | None
    allocation_id: uuid.UUID | None
    room_number: str | None
    guest_name: str
    order_date: date
    meal_slot: MealSlot
    status: FoodOrderStatus
    is_manager_override: bool
    total_amount: Decimal
    notes: str | None
    items: list[FoodOrderItemOut]
    created_at: datetime


class CutoffValidationResult(BaseModel):
    is_allowed: bool
    is_cutoff_passed: bool
    cutoff_deadline: datetime
    message: str


class MarketProcurementItem(BaseModel):
    inventory_item_id: uuid.UUID
    name: str
    market_group: MarketGroup
    unit: str
    gross_required_qty: Decimal
    current_stock_qty: Decimal
    net_procure_qty: Decimal
    unit_price_estimate: Decimal | None = None
    estimated_cost: Decimal | None = None


class MarketProcurementResponse(BaseModel):
    date: date
    slot: MealSlot | None
    fish_meat_market: list[MarketProcurementItem]
    veg_market: list[MarketProcurementItem]
    kirana_and_other: list[MarketProcurementItem]
    total_estimated_cost: Decimal
    total_orders_counted: int
