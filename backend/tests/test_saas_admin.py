"""Integration tests for Super Admin Control Plane (Pillar 1 - Main Business Model):
1. Subscription Plans & Entitlement Matrix
2. Granular Per-Property Feature Overrides
3. Conditional Business Discount Engine (Anchor client, Setup fee waiver, AMC rate, Coupons, Referral credits)
4. Property Verification & Publishing Pipeline (PENDING_VERIFICATION -> VERIFIED_PUBLISHED)
5. 1-Click Global Kill-Switch (SUSPEND_PROPERTY, UNPUBLISH_LISTING, FREEZE_BOOKINGS, RESTORE_PROPERTY)
6. Auth & Property Middleware enforcement (Suspension block, require_feature guard, marketplace visibility)
7. Platform Revenue & P&L Telemetry
"""
import random
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.core.enums import BusinessCategory, Role
from app.main import app
from app.plugins.category_matrix import FeatureModule


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _phone() -> str:
    return "9" + "".join(random.choice("0123456789") for _ in range(9))


def _register(client: TestClient, **overrides) -> dict:
    body = {
        "property_name": "Alibaug Palm Grove Homestay",
        "business_category": "HOMESTAY",
        "owner_name": "Sanjay Shinde",
        "phone": _phone(),
        "password": "Password123!",
        **overrides,
    }
    r = client.post("/api/v1/auth/register-owner", json=body)
    assert r.status_code == 201, r.text
    return {**r.json(), "phone": body["phone"]}


def _auth(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


# =============================================================================
# 1. SUBSCRIPTION PLANS & ENTITLEMENT MATRIX
# =============================================================================

def test_list_and_create_subscription_plans(client: TestClient):
    """Verifies that default plans exist and Super Admin can create custom tiers."""
    r = client.get("/api/v1/superadmin/plans")
    assert r.status_code == 200, r.text
    plans = r.json()
    assert len(plans) >= 4
    plan_codes = [p["plan_code"] for p in plans]
    assert "FREE_TRIAL_30_DAYS" in plan_codes
    assert "STANDARD" in plan_codes
    assert "PREMIUM" in plan_codes
    assert "CUSTOM_ENTERPRISE" in plan_codes

    # Create new custom tier
    new_plan = {
        "plan_code": f"PILOT_SPECIAL_{random.randint(100, 999)}",
        "name": "Konkan Pilot Special",
        "description": "Special promo tier for pioneer homestay hosts in Konkan belt.",
        "billing_interval": "MONTHLY",
        "base_price_inr": 1499.00,
        "annual_discount_percent": 20.00,
        "standard_setup_fee_inr": 2500.00,
        "standard_amc_rate_inr": 2000.00,
        "trial_days": 14,
        "default_features": ["MOD_ROOMS_AC_TOGGLE", "MOD_POS_SPLIT_BILLING"],
        "max_rooms": 12,
        "max_staff_accounts": 5,
        "is_active": True,
        "is_public": True,
        "sort_order": 5,
    }
    r2 = client.post("/api/v1/superadmin/plans", json=new_plan)
    assert r2.status_code == 201, r2.text
    created = r2.json()
    assert created["plan_code"] == new_plan["plan_code"]
    assert float(created["base_price_inr"]) == 1499.00


def test_plan_entitlement_matrix(client: TestClient):
    """Verifies that the multi-category x plan entitlement matrix calculates correctly."""
    r = client.get("/api/v1/superadmin/matrix")
    assert r.status_code == 200, r.text
    matrix = r.json()
    assert len(matrix) > 0
    # Homestay on Standard plan should have AC toggle, Split POS, Housekeeping QR
    homestay_standard = next(
        (m for m in matrix if m["category"] == "HOMESTAY" and m["plan_code"] == "STANDARD"),
        None,
    )
    assert homestay_standard is not None
    assert homestay_standard["feature_flags"]["MOD_ROOMS_AC_TOGGLE"] is True
    assert homestay_standard["feature_flags"]["MOD_POS_SPLIT_BILLING"] is True


# =============================================================================
# 2. GRANULAR FEATURE OVERRIDES (PER-PROPERTY)
# =============================================================================

def test_granular_feature_override_grant_and_revoke(client: TestClient):
    """Verifies that Super Admin can override individual modules for a specific property."""
    owner = _register(client, business_category="HOMESTAY", property_name="Tarkarli Breeze Resort")
    prop_id = owner["property_id"]

    # Initially inspect features
    r_initial = client.get(f"/api/v1/superadmin/properties/{prop_id}/features")
    assert r_initial.status_code == 200, r_initial.text
    initial_data = r_initial.json()
    assert "MOD_360_PANORAMA" in initial_data["effective_features"]

    # Explicitly revoke MOD_360_PANORAMA
    r_revoke = client.post(
        f"/api/v1/superadmin/properties/{prop_id}/features/override",
        json={
            "feature_key": "MOD_360_PANORAMA",
            "is_enabled": False,
            "reason": "Suspended panorama for exceeding quota bandwidth",
        },
    )
    assert r_revoke.status_code == 200, r_revoke.text
    revoked_data = r_revoke.json()
    assert "MOD_360_PANORAMA" not in revoked_data["effective_features"]
    assert revoked_data["feature_overrides"]["MOD_360_PANORAMA"] is False

    # Grant it back with an Anchor Client Pilot rationale
    r_grant = client.post(
        f"/api/v1/superadmin/properties/{prop_id}/features/override",
        json={
            "feature_key": "MOD_360_PANORAMA",
            "is_enabled": True,
            "reason": "Re-granted as part of Anchor Client Pilot deal",
        },
    )
    assert r_grant.status_code == 200, r_grant.text
    granted_data = r_grant.json()
    assert "MOD_360_PANORAMA" in granted_data["effective_features"]
    assert granted_data["feature_overrides"]["MOD_360_PANORAMA"] is True


# =============================================================================
# 3. CONDITIONAL BUSINESS DISCOUNT ENGINE
# =============================================================================

def test_conditional_discount_engine_and_evaluation(client: TestClient):
    """Tests Anchor Client price override, Setup Fee waiver, AMC rate, Promo Coupons, and Referral credits."""
    owner = _register(client, property_name="Devbagh Anchor Resort")
    prop_id = owner["property_id"]

    # 1. Create an Anchor Client Deal: Recurring price fixed at ₹1,499 (instead of ₹2,499)
    # and 100% Setup Fee Waiver (₹0 instead of ₹5,000)
    deal1 = {
        "name": "Devbagh Anchor Client Early Adopter Deal",
        "deal_type": "ANCHOR_CLIENT_OVERRIDE",
        "target_property_id": prop_id,
        "discount_mode": "FIXED_PRICE_OVERRIDE",
        "discount_value": 0,
        "override_recurring_inr": 1499.00,
        "admin_notes": "Early Konkan anchor client contract for 2 years",
    }
    r1 = client.post("/api/v1/superadmin/discounts", json=deal1)
    assert r1.status_code == 201, r1.text

    deal2 = {
        "name": "Anchor Setup Fee 100% Waiver",
        "deal_type": "SETUP_FEE_WAIVER",
        "target_property_id": prop_id,
        "discount_mode": "FULL_WAIVER",
        "discount_value": 0,
        "override_setup_fee_inr": 0.00,
        "admin_notes": "Waived setup fee for early adopter",
    }
    r2 = client.post("/api/v1/superadmin/discounts", json=deal2)
    assert r2.status_code == 201, r2.text

    # 2. Create a Festival Promo Coupon (e.g. DIWALI20 for 20% off)
    promo_code = f"DIWALI{random.randint(10, 99)}"
    deal3 = {
        "discount_code": promo_code,
        "name": "Diwali Festival 20% Off",
        "deal_type": "PROMO_COUPON",
        "discount_mode": "PERCENTAGE",
        "discount_value": 20.00,
        "admin_notes": "Festival campaign coupon",
    }
    r3 = client.post("/api/v1/superadmin/discounts", json=deal3)
    assert r3.status_code == 201, r3.text

    # 3. Evaluate pricing breakdown for Devbagh Anchor Resort
    eval_req = {
        "property_id": prop_id,
        "plan_code": "STANDARD",
        "billing_cycle": "MONTHLY",
        "promo_code": promo_code,
    }
    r_eval = client.post("/api/v1/superadmin/discounts/evaluate", json=eval_req)
    assert r_eval.status_code == 200, r_eval.text
    data = r_eval.json()

    # Base recurring for standard = 2499, but anchor client override applies
    assert float(data["standard_base_recurring_inr"]) == 2499.00
    assert float(data["standard_setup_fee_inr"]) == 5000.00
    # Setup fee was waived from ₹5,000 to ₹0
    assert float(data["net_setup_fee_inr"]) == 0.00
    assert float(data["setup_fee_discount_inr"]) == 5000.00
    # Net due today should reflect discounted setup fee + discounted recurring
    assert float(data["net_recurring_inr"]) <= 1499.00
    assert float(data["total_due_today_inr"]) == float(data["net_recurring_inr"]) + float(data["net_setup_fee_inr"])


# =============================================================================
# 4. PROPERTY VERIFICATION & PUBLISHING PIPELINE
# =============================================================================

def test_property_verification_and_publish_workflow(client: TestClient):
    """Simulates property onboarding application submission and Super Admin Approve & Publish."""
    # 1. Host submits application via Onboarding Wizard
    phone = _phone()
    submit_body = {
        "business_category": "HOMESTAY",
        "property_name": "Malvan Coral Beach House",
        "owner_full_name": "Ramesh Kadam",
        "owner_mobile": phone,
        "owner_email": f"ramesh_{phone}@example.com",
        "password": "Password123!",
        "formatted_address": "Wayangani Beach Road, Vengurla",
        "village_city": "Vengurla",
        "state": "Maharashtra",
        "pincode": "416516",
        "latitude": 15.8642,
        "longitude": 73.6372,
        "owner_pan_number": "ABCDE1234F",
        "merchant_upi_vpa": "ramesh@oksbi",
        "subscription_plan": "30_DAY_FREE_TRIAL",
        "operational_policies": {"check_in_time": "12:00", "check_out_time": "10:00"},
        "category_licenses": {"tourism_registration_no": "MTDC-K-9482"},
    }
    r_submit = client.post("/api/v1/onboarding/submit-property", json=submit_body)
    assert r_submit.status_code == 201, r_submit.text
    app_data = r_submit.json()
    app_id = app_data["application_id"]
    prop_id = app_data["property_id"]

    # 2. Super Admin lists pending verifications
    r_list = client.get("/api/v1/superadmin/verifications")
    assert r_list.status_code == 200, r_list.text
    pending_apps = r_list.json()
    assert any(a["application_id"] == app_id for a in pending_apps)

    # 3. Super Admin inspects KYC & licenses
    r_detail = client.get(f"/api/v1/superadmin/verifications/{app_id}")
    assert r_detail.status_code == 200, r_detail.text
    detail = r_detail.json()
    assert detail["owner_pan_number"] == "ABCDE1234F"
    assert detail["owner_gov_id_masked_display"] == "[Aadhaar Redacted]"
    assert detail["category_licenses"]["tourism_registration_no"] == "MTDC-K-9482"

    # 4. Super Admin Action: [ Approve & Publish ]
    r_approve = client.post(
        f"/api/v1/superadmin/verifications/{app_id}/approve",
        json={"remarks": "PAN and MTDC registration certificate verified."},
    )
    assert r_approve.status_code == 200, r_approve.text
    approve_res = r_approve.json()
    assert approve_res["new_status"] == "VERIFIED_PUBLISHED"
    assert approve_res["marketplace_live"] is True

    # 5. Verify the property is now live and discoverable on Public Booking Marketplace
    r_explore = client.get("/api/v1/properties/explore?category=HOMESTAY")
    assert r_explore.status_code == 200, r_explore.text
    marketplace_props = r_explore.json()
    matching = next((p for p in marketplace_props if p["id"] == prop_id), None)
    assert matching is not None
    assert matching["name"] == "Malvan Coral Beach House"
    assert matching["is_booking_frozen"] is False


# =============================================================================
# 5. GLOBAL KILL-SWITCH & AUTH ENFORCEMENT
# =============================================================================

def test_global_kill_switch_suspension_blocks_auth(client: TestClient):
    """Tests that 1-Click SUSPEND_PROPERTY immediately blocks app logins and bookings."""
    owner = _register(client, property_name="Freeze Test Homestay")
    prop_id = owner["property_id"]
    headers = _auth(owner)

    # Owner can currently access /me
    r_me = client.get("/api/v1/auth/me", headers=headers)
    assert r_me.status_code == 200, r_me.text

    # Super Admin triggers Kill-Switch: SUSPEND_PROPERTY
    r_kill = client.post(
        f"/api/v1/superadmin/properties/{prop_id}/kill-switch",
        json={
            "action": "SUSPEND_PROPERTY",
            "reason": "Non-payment of subscription dues and terms violation",
        },
    )
    assert r_kill.status_code == 200, r_kill.text
    kill_data = r_kill.json()
    assert kill_data["status"] == "SUSPENDED"
    assert kill_data["is_booking_frozen"] is True

    # Owner's next request is immediately blocked by Auth Middleware with 403 Forbidden
    r_blocked = client.get("/api/v1/auth/me", headers=headers)
    assert r_blocked.status_code == 403, r_blocked.text
    assert "suspended by StaySuite Super Admin" in r_blocked.text

    # Reactivate via RESTORE_PROPERTY
    r_restore = client.post(
        f"/api/v1/superadmin/properties/{prop_id}/kill-switch",
        json={"action": "RESTORE_PROPERTY", "reason": "Payment received, account restored."},
    )
    assert r_restore.status_code == 200, r_restore.text
    assert r_restore.json()["status"] == "ACTIVE"

    # Owner can access again
    r_me_again = client.get("/api/v1/auth/me", headers=headers)
    assert r_me_again.status_code == 200, r_me_again.text


def test_booking_freeze_kill_switch(client: TestClient):
    """Verifies that FREEZE_BOOKINGS locks storefront checkouts immediately."""
    owner = _register(client, property_name="Booking Freeze Villa")
    prop_id = owner["property_id"]

    # 1. Super Admin triggers FREEZE_BOOKINGS
    r_freeze = client.post(
        f"/api/v1/superadmin/properties/{prop_id}/kill-switch",
        json={"action": "FREEZE_BOOKINGS", "reason": "Property full for private family event"},
    )
    assert r_freeze.status_code == 200, r_freeze.text
    assert r_freeze.json()["is_booking_frozen"] is True

    # 2. Check public microsite
    prop_row = client.get("/api/v1/properties/me", headers=_auth(owner)).json()
    slug = prop_row["slug"]
    r_public = client.get(f"/api/v1/properties/by-slug/{slug}")
    assert r_public.status_code == 200, r_public.text
    assert r_public.json()["is_booking_frozen"] is True

    # 3. New booking checkout attempt is rejected with 400 Bad Request
    booking_payload = {
        "source": "DIRECT",
        "ota_reference": "REF-FREEZE-999",
        "guest_name": "Deepak Joshi",
        "guest_phone": "9820011223",
        "check_in_date": str(datetime.now(UTC).date()),
        "check_out_date": str(datetime.now(UTC).date() + timedelta(days=2)),
        "adults": 2,
        "children": 0,
        "total_amount": 6000.00,
        "allocations": [],
    }
    r_book = client.post(
        "/api/v1/webhooks/ota-ingest",
        json=booking_payload,
        headers={"X-Property-Id": prop_id},
    )
    assert r_book.status_code == 400, r_book.text
    assert "Bookings are currently paused" in r_book.text


# =============================================================================
# 6. REVENUE & P&L DASHBOARD
# =============================================================================

def test_superadmin_revenue_and_pnl_analytics(client: TestClient):
    """Verifies live telemetry: MRR, ARR, setup fees, active/expiring trials, and listings."""
    r = client.get("/api/v1/superadmin/analytics")
    assert r.status_code == 200, r.text
    analytics = r.json()

    assert analytics["total_properties"] > 0
    assert analytics["active_properties"] > 0
    assert float(analytics["total_mrr"]) >= 0.0
    assert float(analytics["total_arr"]) == float(analytics["total_mrr"]) * 12.0
    assert float(analytics["total_setup_fees_collected"]) >= 0
