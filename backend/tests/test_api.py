import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.utils.ids import generate_lot_id, generate_trace_id
from app.models.ewaste_lot import EWasteLot

client = TestClient(app)

# 1. User registration (collector, recycler)
def test_01_user_registration():
    suffix = uuid.uuid4().hex[:6]
    # Register collector
    col_payload = {
        "email": f"kabadiwala_{suffix}@test.com",
        "phone": f"991{suffix[:7]}",
        "password": "Password@123",
        "full_name": f"Collector Test {suffix}",
        "role": "COLLECTOR",
        "area": "Banjara Hills",
        "city": "Hyderabad",
        "state": "Telangana"
    }
    col_res = client.post("/api/auth/register", json=col_payload)
    assert col_res.status_code == 200, col_res.text
    col_data = col_res.json()
    assert "access_token" in col_data
    assert col_data["role"] == "COLLECTOR"
    assert col_data["user_id"] is not None

    # Register recycler
    rec_payload = {
        "email": f"recycler_{suffix}@test.com",
        "phone": f"992{suffix[:7]}",
        "password": "Password@123",
        "full_name": f"Recycler Test {suffix}",
        "role": "RECYCLER",
        "facility_name": f"Eco Recycler {suffix}",
        "city": "Hyderabad",
        "state": "Telangana"
    }
    rec_res = client.post("/api/auth/register", json=rec_payload)
    assert rec_res.status_code == 200, rec_res.text
    rec_data = rec_res.json()
    assert "access_token" in rec_data
    assert rec_data["role"] == "RECYCLER"

# 2. Admin cannot be registered publicly
def test_02_admin_registration_blocked_publicly():
    suffix = uuid.uuid4().hex[:6]
    admin_payload = {
        "email": f"admin_{suffix}@test.com",
        "phone": f"993{suffix[:7]}",
        "password": "Password@123",
        "full_name": "Rogue Admin",
        "role": "ADMIN",
        "city": "Delhi"
    }
    res = client.post("/api/auth/register", json=admin_payload)
    assert res.status_code == 403
    assert "Admin" in res.text or "forbidden" in res.text.lower()

# 3. Login valid credentials
def test_03_login_valid_credentials():
    res = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "collector123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "COLLECTOR"

# 4. Login invalid credentials
def test_04_login_invalid_credentials():
    res = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401

# 5. Role-based route access
def test_05_role_based_route_access():
    # Login as collector
    col_login = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "collector123"
    })
    token = col_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Collector accessing collector dashboard -> 200 OK
    res = client.get("/api/collector/dashboard", headers=headers)
    assert res.status_code == 200
    assert "collector_id" in res.json()

    # Unauthenticated access -> 401 Unauthorized
    unauth_res = client.get("/api/collector/dashboard")
    assert unauth_res.status_code == 401

# 6. Lot creation generates lot_id and trace_id
def test_06_lot_creation_generates_lot_id_and_trace_id():
    col_login = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "collector123"
    })
    token = col_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "material_name": "Printed Circuit Board (PCB)",
        "subcategory": "Telecom Server Boards",
        "weight_kg": 4.5,
        "quoted_price": 2047.5,
        "location_address": "Banjara Hills, Hyderabad"
    }
    res = client.post("/api/lots", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "lot_id" in data
    assert data["lot_id"].startswith("LOT-2026-")
    assert "trace_id" in data
    assert data["trace_id"].startswith("RC-2026-")
    assert data["status"] in ["DRAFT", "IDENTIFIED"]

# 7. Collector isolation (collector cannot view other collector lots)
def test_07_collector_isolation():
    # Register Collector A
    s_a = uuid.uuid4().hex[:6]
    res_a = client.post("/api/auth/register", json={
        "email": f"isolated_a_{s_a}@test.com",
        "phone": f"994{s_a[:7]}",
        "password": "Password@123",
        "full_name": f"Collector A {s_a}",
        "role": "COLLECTOR"
    })
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register Collector B
    s_b = uuid.uuid4().hex[:6]
    res_b = client.post("/api/auth/register", json={
        "email": f"isolated_b_{s_b}@test.com",
        "phone": f"995{s_b[:7]}",
        "password": "Password@123",
        "full_name": f"Collector B {s_b}",
        "role": "COLLECTOR"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Collector A creates a lot
    create_res = client.post("/api/lots", json={
        "material_name": "Lithium-Ion Battery Packs",
        "weight_kg": 3.0,
        "location_address": "Kukatpally, Hyderabad"
    }, headers=headers_a)
    assert create_res.status_code == 200
    lot_id_a = create_res.json()["id"]

    # Collector B attempts to fetch Collector A's lot by ID -> 403 Forbidden
    probe_res = client.get(f"/api/lots/{lot_id_a}", headers=headers_b)
    assert probe_res.status_code == 403

# 8. Collision safety for generated IDs
def test_08_collision_safety_ids():
    db = SessionLocal()
    try:
        lot_ids = set()
        trace_ids = set()
        iterations = 25
        for _ in range(iterations):
            lid = generate_lot_id(db)
            tid = generate_trace_id(db)
            assert lid.startswith("LOT-2026-")
            assert tid.startswith("RC-2026-")
            lot_ids.add(lid)
            trace_ids.add(tid)
        # All IDs in the run must be distinct
        assert len(lot_ids) == iterations
        assert len(trace_ids) == iterations
    finally:
        db.close()

# 9. Trace event recording on lot creation
def test_09_trace_event_recording_on_lot_creation():
    col_login = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "collector123"
    })
    token = col_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/lots", json={
        "material_name": "Insulated Copper Telecom Cable",
        "weight_kg": 6.2,
        "location_address": "Secunderabad Depot"
    }, headers=headers)
    assert create_res.status_code == 200
    trace_id = create_res.json()["trace_id"]

    # Verify provenance endpoint returns timeline with initial COLLECTED event
    trace_res = client.get(f"/api/trace/{trace_id}")
    assert trace_res.status_code == 200
    trace_data = trace_res.json()
    assert trace_data["trace_id"] == trace_id
    timeline = trace_data["timeline"]
    assert len(timeline) >= 1
    assert any(e["stage"] == "COLLECTED" for e in timeline)

# 10. Price estimate calculation
def test_10_price_estimate_calculation():
    res = client.post("/api/pricing/estimate", json={
        "material": "PCB",
        "weight_kg": 2.4,
        "location_city": "Hyderabad"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["material"] == "PCB"
    assert data["market_range_min_per_kg"] > 0
    assert data["market_range_max_per_kg"] >= data["market_range_min_per_kg"]
    assert data["recommended_fair_price_per_kg"] > 0
    assert data["total_estimated_value"] == round(data["recommended_fair_price_per_kg"] * 2.4, 2)
    assert len(data["nearby_recycler_offers"]) > 0

# 11. Recycler recommendation ranking
def test_11_recycler_recommendation_ranking():
    res = client.get("/api/recyclers/recommended?material=PCB&weight=2.4&lat=17.385&lon=78.486")
    assert res.status_code == 200
    recyclers = res.json()
    assert len(recyclers) > 0
    top = recyclers[0]
    assert "facility_name" in top
    assert top["authorization_status"] in ["VERIFIED", "VERIFIED_DEMO"]
    assert "reliability_score" in top
    assert "distance_km" in top

# 12. Transaction creation
def test_12_transaction_creation():
    col_login = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "collector123"
    })
    token = col_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create lot
    lot_res = client.post("/api/lots", json={
        "material_name": "Fractional Electric Motor",
        "weight_kg": 8.0,
        "location_address": "Peenya, Bengaluru"
    }, headers=headers)
    lot_id = lot_res.json()["id"]

    # Get a recycler
    recs = client.get("/api/recyclers").json()
    recycler_id = recs[0]["id"]

    # Create transaction
    txn_res = client.post("/api/transactions", json={
        "lot_id": lot_id,
        "recycler_id": recycler_id,
        "agreed_price_per_kg": 155.0
    }, headers=headers)
    assert txn_res.status_code == 200
    txn_data = txn_res.json()
    assert txn_data["lot_id"] == lot_id
    assert txn_data["recycler_id"] == recycler_id
    assert txn_data["status"] == "ACCEPTED"
    assert txn_data["total_amount"] == round(155.0 * 8.0, 2)

# 13. Handover verification with scale weight mismatch
def test_13_handover_verification_scale_mismatch():
    col_login = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "collector123"
    })
    token = col_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create lot with estimated weight 10.0 kg
    lot_res = client.post("/api/lots", json={
        "material_name": "Printed Circuit Board (PCB)",
        "weight_kg": 10.0,
        "location_address": "AutoNagar, Vijayawada"
    }, headers=headers)
    lot_id = lot_res.json()["id"]

    recs = client.get("/api/recyclers").json()
    recycler_id = recs[0]["id"]

    txn_res = client.post("/api/transactions", json={
        "lot_id": lot_id,
        "recycler_id": recycler_id,
        "agreed_price_per_kg": 450.0
    }, headers=headers)
    txn_id = txn_res.json()["id"]

    # Digital Handover with scale weight 7.2 kg (28% mismatch)
    handover_payload = {
        "final_verified_weight": 7.2,
        "final_agreed_rate_per_kg": 450.0,
        "recycler_signature": "SIG-AUTH-CPCB-001",
        "collector_confirmation": True,
        "remarks": "Scale calibration verified; moisture evaporated during transit"
    }
    handover_res = client.post(f"/api/transactions/{txn_id}/handover", json=handover_payload, headers=headers)
    assert handover_res.status_code == 200
    h_data = handover_res.json()
    assert h_data["status"] == "COMPLETED"
    assert h_data["verified_weight_kg"] == 7.2
    assert h_data["final_amount_paid"] == round(7.2 * 450.0, 2)
    assert h_data["weight_discrepancy_pct"] > 20.0

    # Verify transaction is completed
    check_txn = client.get(f"/api/transactions/{txn_id}", headers=headers)
    assert check_txn.status_code == 200
    assert check_txn.json()["status"] == "COMPLETED"

    # Verify lot is advanced to FORMAL_RECYCLING
    check_lot = client.get(f"/api/lots/{lot_id}", headers=headers)
    assert check_lot.status_code == 200
    assert check_lot.json()["status"] == "FORMAL_RECYCLING"

# 14. Admin dashboard metrics
def test_14_admin_dashboard_metrics():
    res = client.get("/api/admin/dashboard")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_collectors"] >= 20
    assert stats["verified_recyclers"] >= 10
    assert stats["total_e_waste_collected_kg"] > 0
    assert "precious_metals_recovered_est_g" in stats
    assert "unsafe_disposal_risk_prevented_kg" in stats

# 15. Health check endpoints
def test_15_health_check_endpoints():
    res_root = client.get("/health")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["status"] == "healthy"
    assert data_root["database"] == "connected"
    assert data_root["service"] == "recycLink-backend"

    res_api = client.get("/api/health")
    assert res_api.status_code == 200
    data_api = res_api.json()
    assert data_api["status"] == "healthy"
    assert data_api["database"] == "connected"
