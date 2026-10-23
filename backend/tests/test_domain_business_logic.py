"""Integration tests for Prompt 2 domain business logic:
1. Split POS Billing & Partial Room Checkout (AC/Non-AC prorating, waive extra person, Dynamic UPI QR, sibling retention)
2. Customer Khata Credit Ledger transfer & WhatsApp reminder payload
3. Dining BOM Meal Cut-off Gatekeeper (24h/4h) & Manager Override
4. Deterministic Recipe BOM Market Procurement aggregation (Fish Market vs Veg Market)
5. OTA Booking.com webhook ingestion (50% UPI advance + food pre-order acknowledgment)
6. Multilingual AI Copilot Natural Language Command Bar (English, Hindi, Marathi)
"""
import random
import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.core.enums import AllocationStatus, BookingSource, BookingStatus, FolioStatus, HousekeepingStatus, MarketGroup, MealSlot, MenuCategory
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _phone() -> str:
    return "9" + "".join(random.choice("0123456789") for _ in range(9))


def _register(client: TestClient, **overrides) -> dict:
    body = {
        "property_name": "Konkan Kinara Beach Resort",
        "business_category": "RESORT",
        "owner_name": "Abhijeet Patil",
        "phone": _phone(),
        "password": "Password123!",
        **overrides,
    }
    r = client.post("/api/v1/auth/register-owner", json=body)
    assert r.status_code == 201, r.text
    return {**r.json(), "phone": body["phone"]}


def _auth(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_partial_room_checkout_and_sibling_retention(client: TestClient):
    """Verifies that checking out 1 room of a multi-room booking closes only that allocation,
    prorates AC vs Non-AC nights, waives extra mattress fee when toggled, formats Dynamic UPI QR,
    and keeps sibling rooms active."""
    owner = _register(client)
    headers = _auth(owner)

    # 1. Update property UPI VPA
    prop_id = uuid.UUID(owner["property_id"])
    now_iso = datetime.now(UTC).isoformat()
    client.post(
        "/api/v1/sync/push",
        headers=headers,
        json={
            "device_id": "test-pos",
            "mutations": [
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "properties",
                    "op": "UPSERT",
                    "record_id": str(prop_id),
                    "payload": {"upi_vpa": "resort@okhdfcbank"},
                    "client_updated_at": now_iso,
                }
            ],
        },
    )

    # 2. Create 2 rooms
    room1_id = uuid.uuid4()
    room2_id = uuid.uuid4()
    client.post(
        "/api/v1/sync/push",
        headers=headers,
        json={
            "device_id": "test-pos",
            "mutations": [
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "rooms",
                    "op": "UPSERT",
                    "record_id": str(room1_id),
                    "payload": {
                        "room_number": "101",
                        "name": "Sea Breeze 101",
                        "base_tariff_ac": "3000.00",
                        "base_tariff_non_ac": "2000.00",
                        "extra_mattress_charge": "500.00",
                        "driver_bed_charge": "300.00",
                        "has_ac": True,
                        "housekeeping_status": "CLEAN",
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "rooms",
                    "op": "UPSERT",
                    "record_id": str(room2_id),
                    "payload": {
                        "room_number": "102",
                        "name": "Sea Breeze 102",
                        "base_tariff_ac": "3000.00",
                        "base_tariff_non_ac": "2000.00",
                        "has_ac": True,
                        "housekeeping_status": "CLEAN",
                    },
                    "client_updated_at": now_iso,
                },
            ],
        },
    )

    # 3. Create Group Booking with 2 room allocations
    booking_id = uuid.uuid4()
    alloc1_id = uuid.uuid4()
    alloc2_id = uuid.uuid4()
    start_date = (date.today() - timedelta(days=2)).isoformat()
    end_date = (date.today() + timedelta(days=1)).isoformat()

    client.post(
        "/api/v1/sync/push",
        headers=headers,
        json={
            "device_id": "test-pos",
            "mutations": [
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "bookings",
                    "op": "UPSERT",
                    "record_id": str(booking_id),
                    "payload": {
                        "guest_name": "Sharma Family",
                        "guest_phone": "9820011223",
                        "check_in_date": start_date,
                        "check_out_date": end_date,
                        "adults": 4,
                        "status": "CHECKED_IN",
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "booking_room_allocations",
                    "op": "UPSERT",
                    "record_id": str(alloc1_id),
                    "payload": {
                        "booking_id": str(booking_id),
                        "room_id": str(room1_id),
                        "status": "CHECKED_IN",
                        "stay_start": start_date,
                        "stay_end": end_date,
                        "ac_required": True,
                        "rate_ac_snapshot": "3000.00",
                        "rate_non_ac_snapshot": "2000.00",
                        "extra_mattress_count": 1,
                        "extra_mattress_charge_snapshot": "500.00",
                        "waive_extra_person_fee": False,
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "booking_room_allocations",
                    "op": "UPSERT",
                    "record_id": str(alloc2_id),
                    "payload": {
                        "booking_id": str(booking_id),
                        "room_id": str(room2_id),
                        "status": "CHECKED_IN",
                        "stay_start": start_date,
                        "stay_end": end_date,
                        "ac_required": True,
                        "rate_ac_snapshot": "3000.00",
                        "rate_non_ac_snapshot": "2000.00",
                    },
                    "client_updated_at": now_iso,
                },
            ],
        },
    )

    # 4. Partial Checkout Room 101 with 1 AC night override + waiver of extra mattress
    r = client.post(
        f"/api/v1/folios/{alloc1_id}/partial-checkout",
        headers=headers,
        json={
            "waive_extra_person_fee": True,
            "ac_nights_override": 1,
            "payments": [{"mode": "UPI", "amount": 1000.00, "reference": "UPI123456"}],
            "notes": "Early partial checkout for Room 101",
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()

    assert data["allocation_status"] == "CHECKED_OUT"
    assert data["room_number"] == "101"
    assert data["sibling_rooms_active"] == 1
    assert Decimal(str(data["discount_amount"])) > 0  # Mattress fee waived
    assert data["upi_qr_string"] is not None
    assert "upi://pay?pa=resort@okhdfcbank" in data["upi_qr_string"]
    assert Decimal(str(data["balance_due"])) > 0


def test_customer_khata_transfer(client: TestClient):
    """Verifies that an unpaid folio balance can be transferred to a Customer Khata credit ledger,
    updating the ledger balance and generating a WhatsApp UPI reminder payload."""
    owner = _register(client)
    headers = _auth(owner)

    # Create room & booking with open folio
    now_iso = datetime.now(UTC).isoformat()
    room_id = uuid.uuid4()
    booking_id = uuid.uuid4()
    alloc_id = uuid.uuid4()
    folio_id = uuid.uuid4()

    client.post(
        "/api/v1/sync/push",
        headers=headers,
        json={
            "device_id": "test-pos",
            "mutations": [
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "rooms",
                    "op": "UPSERT",
                    "record_id": str(room_id),
                    "payload": {
                        "room_number": "201",
                        "name": "Deluxe 201",
                        "base_tariff_ac": "4000.00",
                        "base_tariff_non_ac": "3000.00",
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "bookings",
                    "op": "UPSERT",
                    "record_id": str(booking_id),
                    "payload": {
                        "guest_name": "Rajesh Merchant",
                        "guest_phone": "9820554433",
                        "check_in_date": date.today().isoformat(),
                        "check_out_date": (date.today() + timedelta(days=1)).isoformat(),
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "booking_room_allocations",
                    "op": "UPSERT",
                    "record_id": str(alloc_id),
                    "payload": {
                        "booking_id": str(booking_id),
                        "room_id": str(room_id),
                        "stay_start": date.today().isoformat(),
                        "stay_end": (date.today() + timedelta(days=1)).isoformat(),
                        "rate_ac_snapshot": "4000.00",
                        "rate_non_ac_snapshot": "3000.00",
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "folios",
                    "op": "UPSERT",
                    "record_id": str(folio_id),
                    "payload": {
                        "allocation_id": str(alloc_id),
                        "booking_id": str(booking_id),
                        "total_amount": "4000.00",
                        "amount_paid": "1000.00",
                        "balance_due": "3000.00",
                        "status": "OPEN",
                    },
                    "client_updated_at": now_iso,
                },
            ],
        },
    )

    # Move balance to Khata
    r = client.post(
        f"/api/v1/folios/{folio_id}/move-to-khata",
        headers=headers,
        json={
            "customer_name": "Rajesh Merchant",
            "customer_phone": "9820554433",
            "notes": "Regular corporate guest",
        },
    )
    assert r.status_code == 200, r.text
    res = r.json()
    assert res["folio_status"] == "MOVED_TO_KHATA"
    assert Decimal(str(res["amount_moved"])) == Decimal("3000.00")
    assert Decimal(str(res["new_khata_balance"])) == Decimal("3000.00")
    assert "whatsapp_reminder_payload" in res
    assert res["whatsapp_reminder_payload"]["recipient_phone"] == "9820554433"

    # List Khatas
    khatas_res = client.get("/api/v1/khatas?phone=9820554433", headers=headers)
    assert khatas_res.status_code == 200
    k_list = khatas_res.json()
    assert len(k_list) == 1
    assert k_list[0]["customer_name"] == "Rajesh Merchant"


def test_dining_meal_cutoff_and_manager_override(client: TestClient):
    """Tests the 24-hr pre-arrival / 4-hr in-stay meal cut-off gatekeeper and manager override."""
    owner = _register(client)
    headers = _auth(owner)

    # Create fresh fish dish and instant snack
    fish_dish_id = uuid.uuid4()
    snack_dish_id = uuid.uuid4()
    now_iso = datetime.now(UTC).isoformat()

    client.post(
        "/api/v1/sync/push",
        headers=headers,
        json={
            "device_id": "test-pos",
            "mutations": [
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "menu_items",
                    "op": "UPSERT",
                    "record_id": str(fish_dish_id),
                    "payload": {
                        "name": "Surmai Fish Thali",
                        "name_local": "सुरमई थाळी",
                        "category": "SEAFOOD",
                        "price": "450.00",
                        "is_fresh_prep": True,
                        "is_instant_snack": False,
                        "is_available": True,
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "menu_items",
                    "op": "UPSERT",
                    "record_id": str(snack_dish_id),
                    "payload": {
                        "name": "Kanda Bhaji",
                        "name_local": "कांदा भजी",
                        "category": "SNACK",
                        "price": "120.00",
                        "is_fresh_prep": False,
                        "is_instant_snack": True,
                        "is_available": True,
                    },
                    "client_updated_at": now_iso,
                },
            ],
        },
    )

    # 1. Pre-order fresh fish for TODAY LUNCH (violates 24-hr cut-off) without override -> 422
    r_late = client.post(
        "/api/v1/dining/orders?is_pre_arrival=true",
        headers=headers,
        json={
            "guest_name": "Pooja Verma",
            "order_date": date.today().isoformat(),
            "meal_slot": "LUNCH",
            "items": [{"menu_item_id": str(fish_dish_id), "qty": 2}],
            "is_manager_override": False,
        },
    )
    assert r_late.status_code == 422
    assert "Fresh kitchen prep is closed for this slot" in r_late.text

    # 2. Same order WITH Manager Override -> 201 Created
    r_override = client.post(
        "/api/v1/dining/orders?is_pre_arrival=true",
        headers=headers,
        json={
            "guest_name": "Pooja Verma",
            "order_date": date.today().isoformat(),
            "meal_slot": "LUNCH",
            "items": [{"menu_item_id": str(fish_dish_id), "qty": 2}],
            "is_manager_override": True,
        },
    )
    assert r_override.status_code == 201
    assert r_override.json()["is_manager_override"] is True

    # 3. Order Instant Snack -> 201 Created even without override
    r_snack = client.post(
        "/api/v1/dining/orders?is_pre_arrival=true",
        headers=headers,
        json={
            "guest_name": "Pooja Verma",
            "order_date": date.today().isoformat(),
            "meal_slot": "LUNCH",
            "items": [{"menu_item_id": str(snack_dish_id), "qty": 1}],
            "is_manager_override": False,
        },
    )
    assert r_snack.status_code == 201


def test_deterministic_recipe_bom_market_procurement(client: TestClient):
    """Verifies that the market procurement list correctly calculates:
    (Confirmed Orders * Recipe BOM Weight - Current Kitchen Stock)
    and groups ingredients into FISH_MEAT and VEG_MARKET."""
    owner = _register(client)
    headers = _auth(owner)

    # Create Inventory items: Surmai Fish (stock = 1.0 kg), Onions (stock = 0.5 kg)
    surmai_inv_id = uuid.uuid4()
    onion_inv_id = uuid.uuid4()
    thali_dish_id = uuid.uuid4()
    now_iso = datetime.now(UTC).isoformat()

    client.post(
        "/api/v1/sync/push",
        headers=headers,
        json={
            "device_id": "test-pos",
            "mutations": [
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "inventory_items",
                    "op": "UPSERT",
                    "record_id": str(surmai_inv_id),
                    "payload": {
                        "name": "Surmai Fish",
                        "category": "FISH_MEAT",
                        "market_group": "FISH_MEAT",
                        "unit": "kg",
                        "current_stock_qty": "1.000",
                        "last_purchase_price": "600.00",
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "inventory_items",
                    "op": "UPSERT",
                    "record_id": str(onion_inv_id),
                    "payload": {
                        "name": "Onions",
                        "category": "VEGETABLES",
                        "market_group": "VEG_MARKET",
                        "unit": "kg",
                        "current_stock_qty": "0.500",
                        "last_purchase_price": "40.00",
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "menu_items",
                    "op": "UPSERT",
                    "record_id": str(thali_dish_id),
                    "payload": {
                        "name": "Surmai Special Thali",
                        "category": "SEAFOOD",
                        "price": "500.00",
                        "is_fresh_prep": True,
                        "is_available": True,
                    },
                    "client_updated_at": now_iso,
                },
                # Recipe BOM: 1 Thali requires 0.30 kg Surmai and 0.20 kg Onions
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "recipe_bom",
                    "op": "UPSERT",
                    "record_id": str(uuid.uuid4()),
                    "payload": {
                        "menu_item_id": str(thali_dish_id),
                        "inventory_item_id": str(surmai_inv_id),
                        "qty_per_serving": "0.3000",
                    },
                    "client_updated_at": now_iso,
                },
                {
                    "mutation_id": str(uuid.uuid4()),
                    "table": "recipe_bom",
                    "op": "UPSERT",
                    "record_id": str(uuid.uuid4()),
                    "payload": {
                        "menu_item_id": str(thali_dish_id),
                        "inventory_item_id": str(onion_inv_id),
                        "qty_per_serving": "0.2000",
                    },
                    "client_updated_at": now_iso,
                },
            ],
        },
    )

    # Place an order for 10 Thalis on tomorrow's lunch
    tomorrow = (date.today() + timedelta(days=2)).isoformat()
    client.post(
        "/api/v1/dining/orders?is_pre_arrival=true",
        headers=headers,
        json={
            "guest_name": "Group Booking Lunch",
            "order_date": tomorrow,
            "meal_slot": "LUNCH",
            "items": [{"menu_item_id": str(thali_dish_id), "qty": 10}],
            "is_manager_override": False,
        },
    )

    # Fetch Market Procurement
    r_proc = client.get(
        f"/api/v1/dining/market-procurement?date={tomorrow}&slot=LUNCH",
        headers=headers,
    )
    assert r_proc.status_code == 200, r_proc.text
    pdata = r_proc.json()

    # Math:
    # Surmai: 10 * 0.3 = 3.0 kg required. Stock = 1.0 kg -> Net Procure = 2.0 kg.
    # Onions: 10 * 0.2 = 2.0 kg required. Stock = 0.5 kg -> Net Procure = 1.5 kg.
    assert len(pdata["fish_meat_market"]) == 1
    assert pdata["fish_meat_market"][0]["name"] == "Surmai Fish"
    assert Decimal(str(pdata["fish_meat_market"][0]["gross_required_qty"])) == Decimal("3.000")
    assert Decimal(str(pdata["fish_meat_market"][0]["net_procure_qty"])) == Decimal("2.000")

    assert len(pdata["veg_market"]) == 1
    assert pdata["veg_market"][0]["name"] == "Onions"
    assert Decimal(str(pdata["veg_market"][0]["gross_required_qty"])) == Decimal("2.000")
    assert Decimal(str(pdata["veg_market"][0]["net_procure_qty"])) == Decimal("1.500")


def test_ota_unpaid_booking_ingest_and_whatsapp_payload(client: TestClient):
    """Tests the OTA webhook endpoint for Booking.com unpaid reservations."""
    owner = _register(client)
    prop_id = owner["property_id"]

    r = client.post(
        "/api/v1/webhooks/ota-ingest",
        headers={"X-Property-Id": prop_id},
        json={
            "ota_reference": "BCOM-554433221",
            "source": "BOOKING_COM",
            "guest_name": "Amitabh Deshmukh",
            "guest_phone": "9819988776",
            "guest_email": "amitabh@example.com",
            "check_in_date": (date.today() + timedelta(days=5)).isoformat(),
            "check_out_date": (date.today() + timedelta(days=7)).isoformat(),
            "adults": 2,
            "total_amount": 10000.00,
        },
    )
    assert r.status_code == 201, r.text
    data = r.json()

    assert data["status"] == "PENDING_ADVANCE"
    assert Decimal(str(data["advance_required"])) == Decimal("5000.00")
    assert "pay" in data["advance_payment_link"]
    assert data["whatsapp_dispatch"]["recipient_phone"] == "9819988776"
    assert "50%" in data["whatsapp_dispatch"]["message_text"]
    assert "BCOM-554433221" in data["whatsapp_dispatch"]["message_text"]


def test_ai_copilot_multilingual_command_parser(client: TestClient):
    """Tests the Natural Language Command Bar across English, Marathi, and Hindi."""
    owner = _register(client)
    headers = _auth(owner)

    # 1. English Freeze Command
    r1 = client.post(
        "/api/v1/copilot/parse-command",
        headers=headers,
        json={"query": "Freeze all rooms for Dec 24"},
    )
    assert r1.status_code == 200
    res1 = r1.json()
    assert res1["action_type"] == "FREEZE_ROOMS"
    assert "2026-12-24" in res1["payload"]["frozen_date"]
    assert res1["confirmation_required"] is True

    # 2. Marathi Freeze Command ("24 डिसेंबर रूम ब्लॉक करा")
    r2 = client.post(
        "/api/v1/copilot/parse-command",
        headers=headers,
        json={"query": "24 डिसेंबर रूम ब्लॉक करा"},
    )
    assert r2.status_code == 200
    res2 = r2.json()
    assert res2["action_type"] == "FREEZE_ROOMS"
    assert "2026-12-24" in res2["payload"]["frozen_date"]

    # 3. Tariff Change Command ("Change Deluxe AC tariff to 4000")
    r3 = client.post(
        "/api/v1/copilot/parse-command",
        headers=headers,
        json={"query": "Change Deluxe AC tariff to 4000"},
    )
    assert r3.status_code == 200
    res3 = r3.json()
    assert res3["action_type"] == "UPDATE_TARIFF"
    assert res3["payload"]["new_tariff"] == 4000.0
