"""Business logic service for POS split billing, partial room checkout, and Khata ledger."""
import urllib.parse
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import next_server_ts
from app.core.enums import AllocationStatus, BookingStatus, FolioStatus, HousekeepingStatus
from app.modules.billing_pos.models import CustomerKhata, KhataEntry
from app.modules.billing_pos.schemas import (
    CustomerKhataOut,
    MoveToKhataRequest,
    MoveToKhataResponse,
    PartialCheckoutRequest,
    PartialCheckoutResponse,
)
from app.modules.bookings.models import Booking, BookingRoomAllocation, Folio
from app.modules.dining_bom.models import FoodOrder
from app.modules.properties.models import Property, Room

_ZERO = Decimal("0")


class BillingPOSService:
    @staticmethod
    async def partial_checkout(
        session: AsyncSession,
        property_id: uuid.UUID,
        user_id: uuid.UUID,
        allocation_id: uuid.UUID,
        req: PartialCheckoutRequest,
    ) -> PartialCheckoutResponse:
        """Calculates room nights (prorating AC vs Non-AC toggles), adds assigned KOT food items,
        applies waive_extra_person_fee if toggled, generates Dynamic UPI QR, closes only that room
        allocation and updates housekeeping to DIRTY, while keeping sibling rooms active."""
        # 1. Fetch Allocation
        stmt = select(BookingRoomAllocation).where(
            BookingRoomAllocation.id == allocation_id,
            BookingRoomAllocation.property_id == property_id,
            BookingRoomAllocation.is_deleted.is_(False),
        )
        res = await session.execute(stmt)
        allocation = res.scalar_one_or_none()
        if not allocation:
            raise ValueError(f"Allocation {allocation_id} not found")

        # 2. Fetch Room & Property
        room_stmt = select(Room).where(Room.id == allocation.room_id, Room.property_id == property_id)
        room_res = await session.execute(room_stmt)
        room = room_res.scalar_one_or_none()
        room_number = room.room_number if room else "Unknown"

        prop_stmt = select(Property).where(Property.id == property_id)
        prop_res = await session.execute(prop_stmt)
        prop = prop_res.scalar_one()

        # 3. Fetch Folio
        folio_stmt = select(Folio).where(
            Folio.allocation_id == allocation_id,
            Folio.property_id == property_id,
            Folio.is_deleted.is_(False),
        )
        folio_res = await session.execute(folio_stmt)
        folio = folio_res.scalar_one_or_none()
        if not folio:
            folio = Folio(
                id=uuid.uuid4(),
                property_id=property_id,
                allocation_id=allocation_id,
                booking_id=allocation.booking_id,
                status=FolioStatus.OPEN,
            )
            session.add(folio)
            await session.flush()

        # 4. Calculate Nights & AC/Non-AC split
        today = date.today()
        actual_end = today if today >= allocation.stay_start else allocation.stay_end
        stay_nights = max(1, (actual_end - allocation.stay_start).days)

        if req.ac_nights_override is not None:
            ac_nights = max(0, min(stay_nights, req.ac_nights_override))
            non_ac_nights = max(0, stay_nights - ac_nights)
        elif allocation.ac_history:
            # Prorate from history log if available
            ac_count = sum(1 for h in allocation.ac_history if h.get("ac_required", True))
            ac_nights = min(stay_nights, ac_count)
            non_ac_nights = max(0, stay_nights - ac_nights)
        else:
            ac_nights = stay_nights if allocation.ac_required else 0
            non_ac_nights = 0 if allocation.ac_required else stay_nights

        ac_room_charges = Decimal(ac_nights) * allocation.rate_ac_snapshot
        non_ac_room_charges = Decimal(non_ac_nights) * allocation.rate_non_ac_snapshot
        total_room_charges = ac_room_charges + non_ac_room_charges

        # 5. Extra Bed & Mattress
        mattress_charges = (
            Decimal(allocation.extra_mattress_count)
            * allocation.extra_mattress_charge_snapshot
            * Decimal(stay_nights)
        )
        driver_bed_charges = (
            Decimal(allocation.driver_bed_count)
            * allocation.driver_bed_charge_snapshot
            * Decimal(stay_nights)
        )
        extra_charges = mattress_charges + driver_bed_charges

        # 6. Waive extra person fee discount
        waive = req.waive_extra_person_fee or allocation.waive_extra_person_fee
        discount_amount = extra_charges if waive else _ZERO

        # 7. Assigned KOT / Food orders
        food_orders_stmt = select(FoodOrder).where(
            FoodOrder.allocation_id == allocation_id,
            FoodOrder.property_id == property_id,
            FoodOrder.is_deleted.is_(False),
        )
        food_res = await session.execute(food_orders_stmt)
        food_orders = food_res.scalars().all()
        food_charges = sum((fo.total_amount for fo in food_orders), _ZERO)

        # 8. Build Line Items
        line_items: list[dict] = []
        if ac_nights > 0:
            line_items.append({
                "type": "ROOM",
                "description": f"Room {room_number} (AC) - {ac_nights} night(s)",
                "qty": ac_nights,
                "unit_price": str(allocation.rate_ac_snapshot),
                "amount": str(ac_room_charges),
            })
        if non_ac_nights > 0:
            line_items.append({
                "type": "ROOM",
                "description": f"Room {room_number} (Non-AC) - {non_ac_nights} night(s)",
                "qty": non_ac_nights,
                "unit_price": str(allocation.rate_non_ac_snapshot),
                "amount": str(non_ac_room_charges),
            })
        if mattress_charges > 0:
            line_items.append({
                "type": "EXTRA",
                "description": f"Extra Mattress ({allocation.extra_mattress_count}) - {stay_nights} night(s)",
                "qty": allocation.extra_mattress_count * stay_nights,
                "unit_price": str(allocation.extra_mattress_charge_snapshot),
                "amount": str(mattress_charges),
            })
        if driver_bed_charges > 0:
            line_items.append({
                "type": "EXTRA",
                "description": f"Driver Bed ({allocation.driver_bed_count}) - {stay_nights} night(s)",
                "qty": allocation.driver_bed_count * stay_nights,
                "unit_price": str(allocation.driver_bed_charge_snapshot),
                "amount": str(driver_bed_charges),
            })
        if waive and discount_amount > 0:
            line_items.append({
                "type": "DISCOUNT",
                "description": "Extra Person & Driver Bed Fee Waiver",
                "qty": 1,
                "unit_price": str(-discount_amount),
                "amount": str(-discount_amount),
            })
        for fo in food_orders:
            for item in getattr(fo, "items", []):
                line_items.append({
                    "type": "FOOD",
                    "description": f"KOT: {item.item_name}",
                    "qty": item.qty,
                    "unit_price": str(item.unit_price),
                    "amount": str(item.total_price),
                })

        total_amount = total_room_charges + extra_charges + food_charges - discount_amount

        # 9. Existing payments + new checkout payments
        payments_list = list(folio.payments or [])
        now_iso = datetime.now(UTC).isoformat()
        for p in req.payments:
            payments_list.append({
                "mode": p.mode.upper(),
                "amount": str(p.amount),
                "reference": p.reference,
                "at": p.at or now_iso,
            })

        amount_paid = sum((Decimal(p["amount"]) for p in payments_list), _ZERO)
        balance_due = max(_ZERO, total_amount - amount_paid)

        # 10. Generate Dynamic UPI QR String
        upi_qr: str | None = None
        if balance_due > 0 and prop.upi_vpa:
            safe_name = urllib.parse.quote(prop.name)
            upi_qr = f"upi://pay?pa={prop.upi_vpa}&pn={safe_name}&am={balance_due:.2f}&cu=INR"

        # 11. Update Folio
        folio.room_charges = total_room_charges
        folio.food_charges = food_charges
        folio.extra_charges = extra_charges
        folio.discount_amount = discount_amount
        folio.total_amount = total_amount
        folio.amount_paid = amount_paid
        folio.balance_due = balance_due
        folio.line_items = line_items
        folio.payments = payments_list
        folio.upi_qr_string = upi_qr
        now = next_server_ts()
        if balance_due == 0:
            folio.status = FolioStatus.SETTLED
            folio.closed_at = now
        else:
            folio.status = FolioStatus.OPEN
        folio.updated_at = now

        # 12. Update Allocation & Housekeeping
        allocation.status = AllocationStatus.CHECKED_OUT
        allocation.checked_out_at = now
        allocation.waive_extra_person_fee = waive
        if waive:
            allocation.waived_by_user_id = user_id
        allocation.updated_at = now

        if room:
            room.housekeeping_status = HousekeepingStatus.DIRTY
            room.housekeeping_updated_at = now
            room.updated_at = now

        # 13. Count Sibling Rooms still active
        siblings_stmt = select(func.count(BookingRoomAllocation.id)).where(
            BookingRoomAllocation.booking_id == allocation.booking_id,
            BookingRoomAllocation.id != allocation_id,
            BookingRoomAllocation.status != AllocationStatus.CHECKED_OUT,
            BookingRoomAllocation.is_deleted.is_(False),
        )
        sibling_count = (await session.execute(siblings_stmt)).scalar() or 0

        # Update booking status
        booking_stmt = select(Booking).where(Booking.id == allocation.booking_id)
        booking_res = await session.execute(booking_stmt)
        booking = booking_res.scalar_one_or_none()
        if booking:
            if sibling_count == 0:
                booking.status = BookingStatus.CHECKED_OUT
            else:
                booking.status = BookingStatus.PARTIALLY_CHECKED_OUT
            booking.updated_at = now

        await session.commit()

        return PartialCheckoutResponse(
            allocation_id=allocation_id,
            booking_id=allocation.booking_id,
            room_number=room_number,
            allocation_status=allocation.status,
            folio_id=folio.id,
            folio_status=folio.status,
            total_nights=stay_nights,
            ac_nights=ac_nights,
            non_ac_nights=non_ac_nights,
            room_charges=total_room_charges,
            food_charges=food_charges,
            extra_charges=extra_charges,
            discount_amount=discount_amount,
            total_amount=total_amount,
            amount_paid=amount_paid,
            balance_due=balance_due,
            upi_qr_string=upi_qr,
            sibling_rooms_active=sibling_count,
            line_items=line_items,
            payments=payments_list,
            message=f"Room {room_number} checked out successfully. Sibling rooms active: {sibling_count}.",
        )

    @staticmethod
    async def move_to_khata(
        session: AsyncSession,
        property_id: uuid.UUID,
        user_id: uuid.UUID,
        folio_id: uuid.UUID,
        req: MoveToKhataRequest,
    ) -> MoveToKhataResponse:
        """Transfers outstanding folio balance to a trusted Customer Khata ledger account."""
        folio_stmt = select(Folio).where(
            Folio.id == folio_id,
            Folio.property_id == property_id,
            Folio.is_deleted.is_(False),
        )
        folio_res = await session.execute(folio_stmt)
        folio = folio_res.scalar_one_or_none()
        if not folio:
            raise ValueError(f"Folio {folio_id} not found")

        if folio.balance_due <= 0:
            raise ValueError("Folio has no outstanding balance to move to Khata")

        # Find or create customer khata
        khata_stmt = select(CustomerKhata).where(
            CustomerKhata.property_id == property_id,
            CustomerKhata.customer_phone == req.customer_phone,
            CustomerKhata.is_deleted.is_(False),
        )
        khata_res = await session.execute(khata_stmt)
        khata = khata_res.scalar_one_or_none()
        now = next_server_ts()

        if not khata:
            khata = CustomerKhata(
                id=uuid.uuid4(),
                property_id=property_id,
                customer_name=req.customer_name,
                customer_phone=req.customer_phone,
                total_balance=folio.balance_due,
                credit_limit=_ZERO,
                notes=req.notes,
            )
            session.add(khata)
            await session.flush()
        else:
            khata.total_balance += folio.balance_due
            khata.updated_at = now

        # Record entry
        entry = KhataEntry(
            id=uuid.uuid4(),
            property_id=property_id,
            khata_id=khata.id,
            folio_id=folio_id,
            amount=folio.balance_due,
            entry_type="CREDIT",
            recorded_by_user_id=user_id,
            notes=req.notes or f"Transferred from Folio {folio_id}",
        )
        session.add(entry)

        # Update folio
        amount_moved = folio.balance_due
        folio.status = FolioStatus.MOVED_TO_KHATA
        folio.closed_at = now
        folio.updated_at = now

        # Fetch property for UPI link in WhatsApp reminder
        prop_stmt = select(Property).where(Property.id == property_id)
        prop = (await session.execute(prop_stmt)).scalar_one()

        upi_link = None
        if prop.upi_vpa:
            safe_name = urllib.parse.quote(prop.name)
            upi_link = f"upi://pay?pa={prop.upi_vpa}&pn={safe_name}&am={khata.total_balance:.2f}&cu=INR"

        whatsapp_payload = {
            "recipient_phone": req.customer_phone,
            "customer_name": req.customer_name,
            "amount_due": str(khata.total_balance),
            "property_name": prop.name,
            "upi_link": upi_link,
            "reminder_text": (
                f"Namaskar {req.customer_name}, your balance of Rs. {amount_moved:.2f} at "
                f"{prop.name} has been added to your Khata ledger. Total balance due: Rs. {khata.total_balance:.2f}."
                + (f" Pay via UPI: {upi_link}" if upi_link else "")
            ),
        }

        await session.commit()

        return MoveToKhataResponse(
            folio_id=folio_id,
            khata_id=khata.id,
            customer_name=khata.customer_name,
            customer_phone=khata.customer_phone,
            amount_moved=amount_moved,
            new_khata_balance=khata.total_balance,
            folio_status=folio.status,
            whatsapp_reminder_payload=whatsapp_payload,
            message=f"Outstanding balance of Rs. {amount_moved} moved to Khata for {khata.customer_name}.",
        )
