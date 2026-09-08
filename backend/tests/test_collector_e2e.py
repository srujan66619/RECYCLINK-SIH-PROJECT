import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def collector_auth_headers():
    login_res = client.post("/api/auth/login", json={
        "username_or_phone": "collector@recyclink.in",
        "password": "collector123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_01_collector_auth_flow(collector_auth_headers):
    """Verify login and /api/auth/me profile retrieval"""
    me_res = client.get("/api/auth/me", headers=collector_auth_headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "collector@recyclink.in"
    assert me_data["role"] == "COLLECTOR"

def test_02_collector_dashboard(collector_auth_headers):
    """Verify collector live dashboard metrics endpoint"""
    dash_res = client.get("/api/collector/dashboard", headers=collector_auth_headers)
    assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
    dash_data = dash_res.json()
    assert "collector_id" in dash_data
    assert "total_earnings" in dash_data
    assert "total_kg_collected" in dash_data
    assert "active_lots_count" in dash_data
    assert "completed_tx_count" in dash_data

def test_03_ai_classify_material():
    """Verify AI computer vision classification endpoint"""
    classify_res = client.post("/api/ai/classify-material", json={
        "sample_key": "pcb",
        "location": "Hyderabad"
    })
    assert classify_res.status_code == 200, f"AI classification failed: {classify_res.text}"
    ai_data = classify_res.json()
    assert ai_data["detected_material"] == "PCB"
    assert ai_data["confidence"] >= 0.70
    assert "hazard_level" in ai_data
    assert len(ai_data["recoverable_materials"]) > 0
    assert ai_data["estimated_weight_kg"] > 0
    assert ai_data["recommended_fair_price"] > 0

def test_04_pricing_estimate():
    """Verify regional benchmark pricing estimation"""
    price_res = client.post("/api/pricing/estimate", json={
        "material": "Printed Circuit Board (PCB)",
        "weight_kg": 5.0,
        "location_city": "Hyderabad"
    })
    assert price_res.status_code == 200, f"Price estimate failed: {price_res.text}"
    price_data = price_res.json()
    assert price_data["recommended_fair_price_per_kg"] > 0
    assert price_data["market_range_min_per_kg"] <= price_data["market_range_max_per_kg"]
    assert price_data["total_estimated_value"] == round(price_data["recommended_fair_price_per_kg"] * 5.0, 2)
    assert len(price_data["nearby_recycler_offers"]) > 0

def test_05_recommended_recyclers():
    """Verify recycler recommendation ranking engine"""
    rec_res = client.get("/api/recyclers/recommended?material=PCB&weight=5.0&lat=17.385&lon=78.486")
    assert rec_res.status_code == 200, f"Recyclers fetch failed: {rec_res.text}"
    recyclers = rec_res.json()
    assert len(recyclers) > 0
    top = recyclers[0]
    assert "facility_name" in top
    assert top["authorization_status"] in ["VERIFIED", "VERIFIED_DEMO"]
    assert top["reliability_score"] >= 0.0

def test_06_create_and_retrieve_lot(collector_auth_headers):
    """Verify lot creation, ID generation, and detail lookup"""
    create_payload = {
        "material_name": "Printed Circuit Board (PCB)",
        "subcategory": "High-Grade Server PCBs",
        "weight_kg": 5.0,
        "quoted_price": 2250.0,
        "location_address": "Koti Kabadi Market, Hyderabad"
    }
    res = client.post("/api/lots", json=create_payload, headers=collector_auth_headers)
    assert res.status_code == 200, f"Lot creation failed: {res.text}"
    lot_data = res.json()
    assert "id" in lot_data
    assert lot_data["lot_id"].startswith("LOT-2026-")
    assert lot_data["trace_id"].startswith("RC-2026-")
    assert lot_data["estimated_weight"] == 5.0

    lot_pk = lot_data["id"]
    trace_id = lot_data["trace_id"]

    # Verify GET /api/lots/{id}
    detail_res = client.get(f"/api/lots/{lot_pk}", headers=collector_auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["lot_id"] == lot_data["lot_id"]

    # Verify GET /api/trace/{trace_id} immutable event ledger
    trace_res = client.get(f"/api/trace/{trace_id}")
    assert trace_res.status_code == 200, f"Trace failed: {trace_res.text}"
    trace_data = trace_res.json()
    assert trace_data["trace_id"] == trace_id
    assert len(trace_data["timeline"]) >= 1
    assert trace_data["timeline"][0]["stage"] == "COLLECTED"

def test_07_collector_earnings_and_transactions(collector_auth_headers):
    """Verify collector earnings aggregates and transaction history"""
    earn_res = client.get("/api/collector/earnings", headers=collector_auth_headers)
    assert earn_res.status_code == 200
    earn_data = earn_res.json()
    assert "total_earnings" in earn_data
    assert "payout_channel" in earn_data

    txns_res = client.get("/api/collector/transactions", headers=collector_auth_headers)
    assert txns_res.status_code == 200
    assert isinstance(txns_res.json(), list)

def test_08_multilingual_safety_guides():
    """Verify multilingual vernacular safety guidelines for informal collectors"""
    safety_en = client.get("/api/safety-guides?lang=en")
    assert safety_en.status_code == 200
    en_guides = safety_en.json()
    assert len(en_guides) > 0

    safety_hi = client.get("/api/safety-guides?lang=hi")
    assert safety_hi.status_code == 200
    hi_guides = safety_hi.json()
    assert len(hi_guides) > 0
