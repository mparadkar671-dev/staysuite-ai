"""Pydantic schemas for POS billing, split checkout, and Khata ledger."""
import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.enums import AllocationStatus, FolioStatus


class PaymentEntry(BaseModel):
    mode: str = Field(default="UPI", description="Payment mode: UPI, CASH, CARD, etc.")
    amount: Decimal = Field(gt=0, description="Payment amount in INR")
    reference: str | None = Field(default=None, description="Txn reference or UTR")
    at: str | None = Field(default=None, description="ISO timestamp of payment")


class PartialCheckoutRequest(BaseModel):
    waive_extra_person_fee: bool = Field(default=False, description="1-click waiver of mattress and driver bed fees")
    ac_nights_override: int | None = Field(default=None, description="Explicit AC night count if manual adjustment needed")
    payments: list[PaymentEntry] = Field(default_factory=list, description="Payments collected at checkout")
    notes: str | None = Field(default=None, description="Checkout notes")


class LineItemOut(BaseModel):
    type: str  # ROOM | FOOD | EXTRA | DISCOUNT
    description: str
    qty: Decimal | int
    unit_price: Decimal
    amount: Decimal


class PartialCheckoutResponse(BaseModel):
    allocation_id: uuid.UUID
    booking_id: uuid.UUID
    room_number: str
    allocation_status: AllocationStatus
    folio_id: uuid.UUID
    folio_status: FolioStatus
    total_nights: int
    ac_nights: int
    non_ac_nights: int
    room_charges: Decimal
    food_charges: Decimal
    extra_charges: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    upi_qr_string: str | None
    sibling_rooms_active: int
    line_items: list[dict]
    payments: list[dict]
    message: str


class MoveToKhataRequest(BaseModel):
    customer_name: str
    customer_phone: str
    due_date: date | None = None
    notes: str | None = None


class MoveToKhataResponse(BaseModel):
    folio_id: uuid.UUID
    khata_id: uuid.UUID
    customer_name: str
    customer_phone: str
    amount_moved: Decimal
    new_khata_balance: Decimal
    folio_status: FolioStatus
    whatsapp_reminder_payload: dict
    message: str


class CustomerKhataOut(BaseModel):
    id: uuid.UUID
    customer_name: str
    customer_phone: str
    total_balance: Decimal
    credit_limit: Decimal
    notes: str | None
    updated_at: datetime


class FolioOut(BaseModel):
    id: uuid.UUID
    allocation_id: uuid.UUID
    booking_id: uuid.UUID
    status: FolioStatus
    room_charges: Decimal
    food_charges: Decimal
    extra_charges: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    line_items: list[dict]
    payments: list[dict]
    upi_qr_string: str | None
    closed_at: datetime | None
