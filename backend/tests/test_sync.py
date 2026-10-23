"""Integration tests for auth + the offline sync protocol.

Requires a migrated PostgreSQL reachable through DATABASE_URL (see docker-compose.yml).
Every test registers its own tenant with a random phone number, so no DB reset is needed.
"""
import random
import uuid
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _phone() -> str:
    return "9" + "".join(random.choice("0123456789") for _ in range(9))


def _register(client: TestClient, **overrides) -> dict:
    body = {
        "property_name": "Sea Breeze Homestay",
        "business_category": "HOMESTAY",
        "owner_name": "Owner One",
        "phone": _phone(),
        "password": "Sup3rSecret!",
        **overrides,
    }
    r = client.post("/api/v1/auth/register-owner", json=body)
    assert r.status_code == 201, r.text
    return {**r.json(), "phone": body["phone"]}


def _auth(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _mut(table: str, record_id: uuid.UUID, payload: dict, op: str = "UPSERT", ts: str | None = None) -> dict:
    return {
        "mutation_id": str(uuid.uuid4()),
        "table": table,
        "op": op,
        "record_id": str(record_id),
        "payload": payload,
        "client_updated_at": ts or datetime.now(UTC).isoformat(),
    }


def _push(client, tokens, mutations, device="dev-1"):
    return client.post(
        "/api/v1/sync/push", headers=_auth(tokens), json={"device_id": device, "mutations": mutations}
    )


ROOM = {
    "room_number": "101",
    "name": "Sea Facing Deluxe",
    "base_tariff_ac": "4000.00",
    "base_tariff_non_ac": "3000.00",
}


def test_onboarding_applies_homestay_plugin(client):
    tokens = _register(client)
    prop = client.get("/api/v1/properties/me", headers=_auth(tokens)).json()
    assert prop["business_config"]["rules"]["pre_arrival_food_cutoff_hours"] == 24
    assert prop["business_config"]["rules"]["in_stay_food_cutoff_hours"] == 4
    assert "bar_inventory" in prop["business_config"]["hidden_modules"]
    assert prop["plan_tier"] == "TRIAL"


def test_login_and_bad_password(client):
    tokens = _register(client)
    ok = client.post("/api/v1/auth/login", json={"phone": tokens["phone"], "password": "Sup3rSecret!"})
    assert ok.status_code == 200
    bad = client.post("/api/v1/auth/login", json={"phone": tokens["phone"], "password": "nope-nope"})
    assert bad.status_code == 401


def test_push_pull_roundtrip_and_idempotency(client):
    tokens = _register(client)
    room_id = uuid.uuid4()
    m = _mut("rooms", room_id, ROOM)
    first = _push(client, tokens, [m]).json()
    assert first["results"][0]["status"] == "APPLIED"

    again = _push(client, tokens, [m]).json()  # same mutation_id replayed
    assert again["results"][0]["duplicate"] is True

    pulled = client.get("/api/v1/sync/pull", headers=_auth(tokens)).json()
    rooms = pulled["changes"]["rooms"]
    assert len(rooms) == 1 and rooms[0]["id"] == str(room_id)
    assert rooms[0]["base_tariff_ac"] == "4000.00"
    assert rooms[0]["door_qr_token"]
    assert pulled["has_more"] is False

    # Cursor semantics: nothing newer than the newest row we saw.
    newest = rooms[0]["updated_at"]
    empty = client.get("/api/v1/sync/pull", headers=_auth(tokens), params={"since": newest}).json()
    assert "rooms" not in empty["changes"]


def test_delete_is_a_tombstone_visible_on_pull(client):
    tokens = _register(client)
    room_id = uuid.uuid4()
    _push(client, tokens, [_mut("rooms", room_id, ROOM)])
    res = _push(client, tokens, [_mut("rooms", room_id, {}, op="DELETE")]).json()
    assert res["results"][0]["status"] == "APPLIED"
    row = client.get("/api/v1/sync/pull", headers=_auth(tokens)).json()["changes"]["rooms"][0]
    assert row["is_deleted"] is True


def test_stale_mutation_loses_last_write_wins(client):
    tokens = _register(client)
    room_id = uuid.uuid4()
    _push(client, tokens, [_mut("rooms", room_id, ROOM, ts="2026-01-02T10:00:00+00:00")])
    stale = _push(
        client, tokens, [_mut("rooms", room_id, {"name": "Old Name"}, ts="2026-01-01T10:00:00+00:00")]
    ).json()
    assert stale["results"][0]["status"] == "STALE"
    row = client.get("/api/v1/sync/pull", headers=_auth(tokens)).json()["changes"]["rooms"][0]
    assert row["name"] == "Sea Facing Deluxe"


def test_bad_mutation_does_not_block_the_batch(client):
    tokens = _register(client)
    good = _mut("rooms", uuid.uuid4(), ROOM)
    bad_table = _mut("nope", uuid.uuid4(), {})
    bad_value = _mut("rooms", uuid.uuid4(), {**ROOM, "room_number": "102", "base_tariff_ac": "abc"})
    missing = _mut("rooms", uuid.uuid4(), {"room_number": "103"})
    out = _push(client, tokens, [bad_table, good, bad_value, missing]).json()["results"]
    assert [r["status"] for r in out] == ["REJECTED", "APPLIED", "REJECTED", "REJECTED"]
    assert out[0]["error"] == "UNKNOWN_TABLE"
    assert out[2]["error"] == "INVALID_VALUE:base_tariff_ac"
    assert out[3]["error"].startswith("MISSING_FIELDS")


def test_tenant_isolation(client):
    a, b = _register(client), _register(client)
    room_id = uuid.uuid4()
    _push(client, a, [_mut("rooms", room_id, ROOM)])
    # Tenant B cannot see it...
    assert "rooms" not in client.get("/api/v1/sync/pull", headers=_auth(b)).json()["changes"]
    # ...nor overwrite it.
    hijack = _push(client, b, [_mut("rooms", room_id, {"name": "Hijacked"})]).json()
    assert hijack["results"][0]["error"] == "FORBIDDEN_TENANT"
    row = client.get("/api/v1/sync/pull", headers=_auth(a)).json()["changes"]["rooms"][0]
    assert row["name"] == "Sea Facing Deluxe"


def test_kyc_never_stores_raw_id_digits(client):
    tokens = _register(client)
    kyc_id = uuid.uuid4()
    payload = {
        "guest_name": "Ramesh",
        "id_type": "AADHAAR",
        "masked_id_display": "1234 5678 9012",  # attempt to smuggle digits in
        "address": "Flat 4, Aadhaar 1234 5678 9012, Pune",
        "id_document_key": "kyc/redacted/abc.webp",
    }
    assert _push(client, tokens, [_mut("guest_kyc_records", kyc_id, payload)]).json()["results"][0]["status"] == "APPLIED"
    row = client.get("/api/v1/sync/pull", headers=_auth(tokens)).json()["changes"]["guest_kyc_records"][0]
    assert row["masked_id_display"] == "[Aadhaar Redacted]"
    assert "1234" not in (row["address"] or "")
    assert row["id_document_key"] == "kyc/redacted/abc.webp"  # owner sees the redacted-image key

    # Manager login: ID image reference hidden, redaction label + status visible.
    manager_phone = _phone()
    r = client.post(
        "/api/v1/auth/users",
        headers=_auth(tokens),
        json={"name": "Mgr", "phone": manager_phone, "password": "Mgr-Passw0rd", "role": "MANAGER"},
    )
    assert r.status_code == 201, r.text
    mgr = client.post("/api/v1/auth/login", json={"phone": manager_phone, "password": "Mgr-Passw0rd"}).json()
    mrow = client.get("/api/v1/sync/pull", headers=_auth(mgr)).json()["changes"]["guest_kyc_records"][0]
    assert "id_document_key" not in mrow
    assert mrow["masked_id_display"] == "[Aadhaar Redacted]"
    assert mrow["verification_status"] == "PENDING"


def test_staff_can_only_update_housekeeping(client):
    owner = _register(client)
    room_id = uuid.uuid4()
    _push(client, owner, [_mut("rooms", room_id, {**ROOM, "housekeeping_status": "DIRTY"})])
    phone = _phone()
    client.post(
        "/api/v1/auth/users",
        headers=_auth(owner),
        json={"name": "Maid", "phone": phone, "password": "Maid-Passw0rd", "role": "STAFF"},
    )
    staff = client.post("/api/v1/auth/login", json={"phone": phone, "password": "Maid-Passw0rd"}).json()

    ok = _push(client, staff, [_mut("rooms", room_id, {"housekeeping_status": "CLEAN"})]).json()
    assert ok["results"][0]["status"] == "APPLIED"
    price = _push(client, staff, [_mut("rooms", room_id, {"base_tariff_ac": "1.00"})]).json()
    assert price["results"][0]["error"].startswith("FORBIDDEN_COLUMNS")
    delete = _push(client, staff, [_mut("rooms", room_id, {}, op="DELETE")]).json()
    assert delete["results"][0]["error"] == "DELETE_NOT_ALLOWED"
    booking = _push(
        client,
        staff,
        [_mut("bookings", uuid.uuid4(), {"guest_name": "x", "check_in_date": "2026-12-24", "check_out_date": "2026-12-25"})],
    ).json()
    assert booking["results"][0]["error"] == "FORBIDDEN_ROLE"

    row = client.get("/api/v1/sync/pull", headers=_auth(owner)).json()["changes"]["rooms"][0]
    assert row["housekeeping_status"] == "CLEAN" and row["housekeeping_updated_at"]


def test_pull_pagination_covers_every_row_once(client):
    tokens = _register(client)
    ids = {str(uuid.uuid4()) for _ in range(7)}
    muts = [_mut("rooms", uuid.UUID(i), {**ROOM, "room_number": f"R{n}"}) for n, i in enumerate(ids)]
    assert all(r["status"] == "APPLIED" for r in _push(client, tokens, muts).json()["results"])

    seen: list[str] = []
    since = None
    for _ in range(10):
        params = {"limit": 3, **({"since": since} if since else {})}
        page = client.get("/api/v1/sync/pull", headers=_auth(tokens), params=params).json()
        seen += [r["id"] for r in page["changes"].get("rooms", [])]
        since = page["next_since"]
        if not page["has_more"]:
            break
    assert set(seen) == ids and len(seen) == len(ids)


def test_websocket_notifies_on_push(client):
    tokens = _register(client)
    with client.websocket_connect(f"/api/v1/ws/{tokens['property_id']}") as ws:
        ws.send_json({"type": "auth", "token": tokens["access_token"]})
        assert ws.receive_json()["type"] == "ready"
        _push(client, tokens, [_mut("rooms", uuid.uuid4(), ROOM)], device="tablet-7")
        event = ws.receive_json()
        assert event["type"] == "sync.changed"
        assert event["tables"] == ["rooms"] and event["origin_device_id"] == "tablet-7"


def test_websocket_rejects_other_tenant(client):
    a, b = _register(client), _register(client)
    with client.websocket_connect(f"/api/v1/ws/{a['property_id']}") as ws:
        ws.send_json({"type": "auth", "token": b["access_token"]})
        with pytest.raises(Exception):
            ws.receive_json()
