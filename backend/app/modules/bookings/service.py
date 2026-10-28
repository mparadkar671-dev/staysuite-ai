"""Bookings business logic and OTA Booking.com webhook ingestion service."""
import urllib.parse
import uuid
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import next_server_ts
from app.core.enums import AllocationStatus, BookingSource, BookingStatus, FolioStatus
from app.modules.bookings.models import Booking, BookingRoomAllocation, Folio
from app.modules.bookings.schemas import OTAIngestRequest, OTAIngestResponse, WhatsAppAdvancePayload
from app.modules.properties.models import Property, Room

settings = get_settings()
_FIFTY_PERCENT = Decimal("0.50")


class BookingsService:
    @staticmethod
    async def ingest_ota_booking(
        session: AsyncSession,
        property_id: uuid.UUID,
        req: OTAIngestRequest,
    ) -> OTAIngestResponse:
        """Ingests unpaid OTA reservations (e.g. Booking.com), marks status as PENDING_ADVANCE,
        creates allocations and folios, calculates 50% UPI advance requirement, and triggers
        the WhatsApp Cloud API notification payload with 50% UPI link + food pre-order rule acknowledgment."""
        # Check property
        prop_stmt = select(Property).where(Property.id == property_id)
        prop = (await session.execute(prop_stmt)).scalar_one_or_none()
        if not prop:
            raise ValueError(f"Property {property_id} not found")
        if prop.status == "SUSPENDED":
            raise ValueError("This property is currently suspended by StaySuite Super Admin.")
        if prop.is_booking_frozen:
            raise ValueError("Bookings are currently paused for this property.")

        # 1. 50% UPI Advance calculation
        advance_required = (req.total_amount * _FIFTY_PERCENT).quantize(Decimal("0.01"))

        # 2. Create Booking in PENDING_ADVANCE state
        booking_id = uuid.uuid4()
        now = next_server_ts()
        booking = Booking(
            id=booking_id,
            property_id=property_id,
            source=req.source,
            status=BookingStatus.PENDING_ADVANCE,
            ota_reference=req.ota_reference,
            guest_name=req.guest_name,
            guest_phone=req.guest_phone,
            guest_email=req.guest_email,
            check_in_date=req.check_in_date,
            check_out_date=req.check_out_date,
            adults=req.adults,
            children=req.children,
            total_amount=req.total_amount,
            advance_required=advance_required,
            advance_paid=Decimal("0"),
            notes=req.notes or f"Imported from {req.source.value} - Ref: {req.ota_reference}",
        )

        advance_payment_url = f"{settings.guest_web_base_url}/pay/{booking.booking_token}"
        food_rules_ack_url = f"{settings.guest_web_base_url}/menu/{booking.booking_token}"
        booking.advance_payment_link = advance_payment_url
        session.add(booking)
        await session.flush()

        # 3. Create room allocations
        stay_nights = max(1, (req.check_out_date - req.check_in_date).days)
        if req.rooms:
            for r_in in req.rooms:
                room_id = r_in.room_id
                if not room_id and r_in.room_number:
                    room_stmt = select(Room).where(
                        Room.property_id == property_id,
                        Room.room_number == r_in.room_number,
                    )
                    room_res = await session.execute(room_stmt)
                    r_obj = room_res.scalar_one_or_none()
                    if r_obj:
                        room_id = r_obj.id

                if not room_id:
                    # Pick first active room in property
                    any_room = (
                        await session.execute(
                            select(Room).where(Room.property_id == property_id, Room.is_active.is_(True))
                        )
                    ).scalar_one_or_none()
                    if any_room:
                        room_id = any_room.id
                    else:
                        room_id = uuid.uuid4()

                alloc_id = uuid.uuid4()
                alloc = BookingRoomAllocation(
                    id=alloc_id,
                    property_id=property_id,
                    booking_id=booking_id,
                    room_id=room_id,
                    status=AllocationStatus.RESERVED,
                    stay_start=req.check_in_date,
                    stay_end=req.check_out_date,
                    adults=r_in.adults,
                    ac_required=r_in.ac_required,
                    rate_ac_snapshot=r_in.rate_per_night,
                    rate_non_ac_snapshot=r_in.rate_per_night,
                )
                session.add(alloc)

                # Create Folio
                folio = Folio(
                    id=uuid.uuid4(),
                    property_id=property_id,
                    allocation_id=alloc_id,
                    booking_id=booking_id,
                    status=FolioStatus.OPEN,
                    room_charges=r_in.rate_per_night * Decimal(stay_nights),
                    total_amount=r_in.rate_per_night * Decimal(stay_nights),
                    balance_due=r_in.rate_per_night * Decimal(stay_nights),
                )
                session.add(folio)
        else:
            # Fallback allocation if no explicit room passed
            room_obj = (
                await session.execute(
                    select(Room).where(Room.property_id == property_id, Room.is_active.is_(True))
                )
            ).scalar_one_or_none()
            if room_obj:
                alloc_id = uuid.uuid4()
                alloc = BookingRoomAllocation(
                    id=alloc_id,
                    property_id=property_id,
                    booking_id=booking_id,
                    room_id=room_obj.id,
                    status=AllocationStatus.RESERVED,
                    stay_start=req.check_in_date,
                    stay_end=req.check_out_date,
                    adults=req.adults,
                    ac_required=True,
                    rate_ac_snapshot=room_obj.base_tariff_ac,
                    rate_non_ac_snapshot=room_obj.base_tariff_non_ac,
                )
                session.add(alloc)

                folio = Folio(
                    id=uuid.uuid4(),
                    property_id=property_id,
                    allocation_id=alloc_id,
                    booking_id=booking_id,
                    status=FolioStatus.OPEN,
                    room_charges=req.total_amount,
                    total_amount=req.total_amount,
                    balance_due=req.total_amount,
                )
                session.add(folio)

        await session.commit()

        # 4. Generate Dynamic UPI Intent URL
        upi_intent: str | None = None
        if prop.upi_vpa:
            safe_name = urllib.parse.quote(prop.name)
            upi_intent = (
                f"upi://pay?pa={prop.upi_vpa}&pn={safe_name}&am={advance_required:.2f}&cu=INR"
                f"&tn={urllib.parse.quote(f'50% Advance {req.ota_reference}')}"
            )

        # 5. Formulate Meta WhatsApp Cloud API Payload
        message_text = (
            f"Namaskar {req.guest_name}! Thank you for reserving at {prop.name} (Ref: {req.ota_reference}).\n\n"
            f"1. To confirm your stay, please pay the 50% advance of Rs. {advance_required:.2f} within 2 hours:\n"
            f"Pay Link: {advance_payment_url}\n"
            + (f"Direct UPI: {upi_intent}\n" if upi_intent else "")
            + f"\n2. As a Konkan homestay, we cook only fresh catch to order. Please pre-order your meals here:\n"
            f"Food Menu: {food_rules_ack_url}"
        )

        whatsapp_payload = WhatsAppAdvancePayload(
            recipient_phone=req.guest_phone,
            guest_name=req.guest_name,
            property_name=prop.name,
            booking_token=booking.booking_token,
            ota_reference=req.ota_reference,
            advance_amount=advance_required,
            advance_payment_url=advance_payment_url,
            upi_intent_url=upi_intent,
            food_rules_ack_url=food_rules_ack_url,
            message_text=message_text,
        )

        # 6. Attempt background delivery to Meta Cloud API if token is provided
        if settings.whatsapp_cloud_api_token and settings.whatsapp_phone_number_id:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.post(
                        f"https://graph.facebook.com/{settings.whatsapp_api_version}/{settings.whatsapp_phone_number_id}/messages",
                        headers={"Authorization": f"Bearer {settings.whatsapp_cloud_api_token}"},
                        json={
                            "messaging_product": "whatsapp",
                            "to": req.guest_phone,
                            "type": "text",
                            "text": {"body": message_text},
                        },
                    )
            except Exception:
                pass  # Graceful fallback; payload is returned in response

        return OTAIngestResponse(
            booking_id=booking.id,
            booking_token=booking.booking_token,
            status=booking.status,
            guest_name=booking.guest_name,
            total_amount=booking.total_amount,
            advance_required=advance_required,
            advance_payment_link=advance_payment_url,
            whatsapp_dispatch=whatsapp_payload,
            message=f"OTA booking {req.ota_reference} ingested. Marked PENDING_ADVANCE. WhatsApp advance payload generated.",
        )
