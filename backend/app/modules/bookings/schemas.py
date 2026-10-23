"""Pydantic schemas for bookings, OTA ingestion webhook, and WhatsApp notifications."""
import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.enums import BookingSource, BookingStatus


class OTAIngestRoomItem(BaseModel):
    room_id: uuid.UUID | None = None
    room_number: str | None = None
    rate_per_night: Decimal
    ac_required: bool = True
    adults: int = 2
    children: int = 0


class OTAIngestRequest(BaseModel):
    property_id: uuid.UUID | None = Field(None, description="Property ID if known; otherwise property slug/header")
    ota_reference: str = Field(..., description="OTA Reservation Number e.g. BCOM-987654321")
    source: BookingSource = Field(default=BookingSource.BOOKING_COM)
    guest_name: str
    guest_phone: str
    guest_email: str | None = None
    check_in_date: date
    check_out_date: date
    adults: int = 1
    children: int = 0
    total_amount: Decimal = Field(gt=0)
    rooms: list[OTAIngestRoomItem] = Field(default_factory=list)
    notes: str | None = None


class WhatsAppAdvancePayload(BaseModel):
    recipient_phone: str
    guest_name: str
    property_name: str
    booking_token: str
    ota_reference: str
    advance_amount: Decimal
    advance_payment_url: str
    upi_intent_url: str | None
    food_rules_ack_url: str
    message_text: str


class OTAIngestResponse(BaseModel):
    booking_id: uuid.UUID
    booking_token: str
    status: BookingStatus
    guest_name: str
    total_amount: Decimal
    advance_required: Decimal
    advance_payment_link: str
    whatsapp_dispatch: WhatsAppAdvancePayload
    message: str


class BookingOut(BaseModel):
    id: uuid.UUID
    booking_token: str
    source: BookingSource
    status: BookingStatus
    ota_reference: str | None
    guest_name: str
    guest_phone: str | None
    guest_email: str | None
    check_in_date: date
    check_out_date: date
    adults: int
    children: int
    total_amount: Decimal
    advance_required: Decimal
    advance_paid: Decimal
    advance_payment_link: str | None
    food_rules_acknowledged_at: datetime | None
    notes: str | None
    created_at: datetime
