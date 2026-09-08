import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.entities import (
    User, CollectorProfile, RecyclerProfile, MaterialCategory,
    EWasteLot, Transaction, HandoverRecord, PickupRecord,
    TraceEvent, AnomalyAlert, UserRole, LotStatus, TransactionStatus
)
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module")
def recycler_auth_headers(db):
    recycler_user = db.query(User).filter(User.role == UserRole.RECYCLER.value).first()
    assert recycler_user is not None, "No recycler user found in database."
    token = create_access_token({"sub": str(recycler_user.id), "user_id": recycler_user.id, "role": recycler_user.role})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def collector_auth_headers(db):
    collector_user = db.query(User).filter(User.role == UserRole.COLLECTOR.value).first()
    assert collector_user is not None, "No collector user found in database."
    token = create_access_token({"sub": str(collector_user.id), "user_id": collector_user.id, "role": collector_user.role})
    return {"Authorization": f"Bearer {token}"}


# ============================================================
# 1. AUTHENTICATION & RBAC TESTS
# ============================================================

def test_recycler_login():
    resp = client.post("/api/auth/login", json={"email": "recycler@recyclink.in", "password": "recycler123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "RECYCLER"

def test_collector_forbidden_from_recycler_portal(collector_auth_headers):
    resp = client.get("/api/recycler/dashboard", headers=collector_auth_headers)
    assert resp.status_code == 403
    data = resp.json()
    assert data["success"] is False
    assert "FORBIDDEN" in data["error"]["code"] or "forbidden" in data["error"]["message"].lower()


# ============================================================
# 2. RECYCLER DASHBOARD TESTS
# ============================================================

def test_recycler_dashboard_live_kpis(recycler_auth_headers):
    resp = client.get("/api/recycler/dashboard", headers=recycler_auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "facility_name" in data
    assert "authorization_number" in data
    assert "incoming_lots_count" in data
    assert "scheduled_pickups_count" in data
    assert "total_weight_kg" in data
    assert "total_purchase_value" in data
    assert isinstance(data["recent_incoming_lots"], list)


# ============================================================
# 3. INCOMING LOTS & DETAILS TESTS
# ============================================================

def test_get_incoming_lots(recycler_auth_headers):
    resp = client.get("/api/recycler/lots/incoming", headers=recycler_auth_headers)
    assert resp.status_code == 200
    lots = resp.json()
    assert isinstance(lots, list)
    if len(lots) > 0:
        lot = lots[0]
        assert "lot_id" in lot
        assert "trace_id" in lot
        assert "material" in lot
        assert "weight_kg" in lot
        assert "distance_km" in lot
        assert "collector_area" in lot

def test_get_incoming_lots_filter_material(recycler_auth_headers):
    resp = client.get("/api/recycler/lots/incoming?material=PCB", headers=recycler_auth_headers)
    assert resp.status_code == 200
    lots = resp.json()
    for l in lots:
        assert "PCB" in l["material"] or "Circuit" in l["material"]

def test_get_lot_detail_with_ai_and_fairprice(recycler_auth_headers, db):
    lot = db.query(EWasteLot).first()
    assert lot is not None
    resp = client.get(f"/api/recycler/lots/{lot.lot_id}", headers=recycler_auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["lot_id"] == lot.lot_id
    assert "Prototype AI Prediction" in data["ai_confidence_label"]
    assert "recoverable_materials" in data
    assert data["recommended_price"] > 0
    assert "collector_area" in data


# ============================================================
# 4. OFFERS & FAIRNESS ANOMALY TESTS
# ============================================================

def test_submit_fair_offer(recycler_auth_headers, db):
    # Find or create a test lot
    collector = db.query(CollectorProfile).first()
    test_lot = EWasteLot(
        lot_id=f"LOT-TEST-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-TEST-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Printed Circuit Board (PCB)",
        estimated_weight=3.0,
        recommended_price=1350.0,
        status="PRICED"
    )
    db.add(test_lot)
    db.commit()
    db.refresh(test_lot)

    resp = client.post(
        "/api/recycler/offers",
        headers=recycler_auth_headers,
        json={
            "lot_id": test_lot.lot_id,
            "offer_price_per_kg": 460.0,
            "pickup_available": True,
            "pickup_time_window": "10:00 AM - 01:00 PM",
            "notes": "Premium hydrometallurgical recovery bid"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["lot_id"] == test_lot.lot_id
    assert data["offer_price_per_kg"] == 460.0
    assert data["fairness_status"] in ["GOOD OFFER", "FAIR"]
    assert data["total_estimated_amount"] == 1380.0

def test_submit_predatory_offer_triggers_warning_and_anomaly(recycler_auth_headers, db):
    collector = db.query(CollectorProfile).first()
    test_lot = EWasteLot(
        lot_id=f"LOT-LOW-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-LOW-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Printed Circuit Board (PCB)",
        estimated_weight=2.0,
        recommended_price=900.0, # 450/kg benchmark
        status="PRICED"
    )
    db.add(test_lot)
    db.commit()
    db.refresh(test_lot)

    # 150/kg is 66% below benchmark (predatory underbidding)
    resp = client.post(
        "/api/recycler/offers",
        headers=recycler_auth_headers,
        json={
            "lot_id": test_lot.lot_id,
            "offer_price_per_kg": 150.0,
            "pickup_available": True
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["fairness_status"] in ["BELOW FAIR", "UNUSUAL"]
    assert data["fairness_warning"] is not None
    assert "PRICE CHECK" in data["fairness_warning"]

    # Verify AnomalyAlert recorded in DB
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.lot_id == test_lot.id).first()
    assert alert is not None
    assert alert.alert_type == "PREDATORY_PRICING"


# ============================================================
# 5. ACCEPTANCE & STATE MACHINE TRANSITIONS
# ============================================================

def test_accept_lot_lifecycle(recycler_auth_headers, db):
    collector = db.query(CollectorProfile).first()
    lot = EWasteLot(
        lot_id=f"LOT-ACC-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-ACC-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Insulated Copper Telecom Cable",
        estimated_weight=5.0,
        recommended_price=1150.0,
        status="OFFER_RECEIVED"
    )
    db.add(lot)
    db.commit()

    resp = client.post(f"/api/recycler/lots/{lot.lot_id}/accept", headers=recycler_auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ACCEPTED"

    # Verify trace event
    events = db.query(TraceEvent).filter(TraceEvent.lot_id == lot.id, TraceEvent.stage == "ACCEPTED").all()
    assert len(events) >= 1

def test_invalid_state_transition_rejected(recycler_auth_headers, db):
    from app.services.recycler_portal_service import RecyclerPortalService
    with pytest.raises(Exception) as exc_info:
        # Cannot transition directly from COMPLETED to INITIATED
        RecyclerPortalService._validate_transition("COMPLETED", "INITIATED")
    assert "Invalid transaction transition" in str(exc_info.value)


# ============================================================
# 6. PICKUP LOGISTICS MANAGEMENT
# ============================================================

def test_schedule_pickup_and_update_status(recycler_auth_headers, db):
    recycler = db.query(RecyclerProfile).first()
    collector = db.query(CollectorProfile).first()

    lot = EWasteLot(
        lot_id=f"LOT-PKU-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-PKU-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Lithium-Ion Battery Packs",
        estimated_weight=4.0,
        recommended_price=840.0,
        status="ACCEPTED"
    )
    db.add(lot)
    db.commit()

    txn = Transaction(
        lot_id=lot.id,
        collector_id=collector.id,
        recycler_id=recycler.id,
        agreed_price_per_kg=210.0,
        quoted_price=840.0,
        total_amount=840.0,
        status="ACCEPTED"
    )
    db.add(txn)
    db.commit()

    # Schedule pickup
    sched_date = datetime.utcnow() + timedelta(days=1)
    resp = client.post(
        "/api/recycler/pickups",
        headers=recycler_auth_headers,
        json={
            "transaction_id": txn.id,
            "scheduled_date": sched_date.isoformat(),
            "time_window": "11:00 AM - 02:00 PM",
            "pickup_notes": "Handle hazardous battery cells with dielectric insulation tape."
        }
    )
    assert resp.status_code == 200
    pickup_data = resp.json()
    assert pickup_data["status"] == "SCHEDULED"
    pickup_id = pickup_data["id"]

    # Update status to IN_PROGRESS
    resp_prog = client.patch(
        f"/api/recycler/pickups/{pickup_id}/status",
        headers=recycler_auth_headers,
        json={"status": "IN_PROGRESS", "notes": "Logistics van en route."}
    )
    assert resp_prog.status_code == 200
    assert resp_prog.json()["status"] == "IN_PROGRESS"

    # Update status to ARRIVED
    resp_arr = client.patch(
        f"/api/recycler/pickups/{pickup_id}/status",
        headers=recycler_auth_headers,
        json={"status": "ARRIVED", "notes": "Driver onsite."}
    )
    assert resp_arr.status_code == 200
    assert resp_arr.json()["transaction_status"] == "HANDOVER_VERIFICATION"


# ============================================================
# 7. HANDOVER VERIFICATION & WEIGHT VARIANCE
# ============================================================

def test_handover_verification_normal(recycler_auth_headers, db):
    recycler = db.query(RecyclerProfile).first()
    collector = db.query(CollectorProfile).first()

    lot = EWasteLot(
        lot_id=f"LOT-HND-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-HND-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Printed Circuit Board (PCB)",
        estimated_weight=2.4,
        recommended_price=1092.0,
        status="PICKUP_IN_PROGRESS"
    )
    db.add(lot)
    db.commit()

    txn = Transaction(
        lot_id=lot.id,
        collector_id=collector.id,
        recycler_id=recycler.id,
        agreed_price_per_kg=465.0,
        quoted_price=1116.0,
        total_amount=1116.0,
        status="HANDOVER_VERIFICATION"
    )
    db.add(txn)
    db.commit()

    # Handover verification details
    resp_detail = client.get(f"/api/recycler/handover/{txn.id}", headers=recycler_auth_headers)
    assert resp_detail.status_code == 200
    assert resp_detail.json()["initial_estimated_weight"] == 2.4

    # Confirm handover with scale weight 2.3 kg (small -4% variance)
    resp_confirm = client.post(
        f"/api/recycler/handover/{txn.id}",
        headers=recycler_auth_headers,
        json={
            "final_verified_weight": 2.3,
            "final_agreed_rate_per_kg": 465.0,
            "remarks": "Calibrated CPCB scale weight."
        }
    )
    assert resp_confirm.status_code == 200
    res = resp_confirm.json()
    assert res["final_weight"] == 2.3
    assert res["final_price"] == round(2.3 * 465.0, 2)
    assert res["is_variance_anomaly"] is False
    assert res["status"] == "HANDED_OVER"

def test_handover_verification_weight_discrepancy_alert(recycler_auth_headers, db):
    recycler = db.query(RecyclerProfile).first()
    collector = db.query(CollectorProfile).first()

    lot = EWasteLot(
        lot_id=f"LOT-VAR-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-VAR-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Printed Circuit Board (PCB)",
        estimated_weight=10.0, # Initial estimated weight 10 kg
        recommended_price=4500.0,
        status="PICKUP_IN_PROGRESS"
    )
    db.add(lot)
    db.commit()

    txn = Transaction(
        lot_id=lot.id,
        collector_id=collector.id,
        recycler_id=recycler.id,
        agreed_price_per_kg=450.0,
        quoted_price=4500.0,
        total_amount=4500.0,
        status="HANDOVER_VERIFICATION"
    )
    db.add(txn)
    db.commit()

    # Scale weight is 6.5 kg (35% discrepancy > 25% threshold)
    resp = client.post(
        f"/api/recycler/handover/{txn.id}",
        headers=recycler_auth_headers,
        json={
            "final_verified_weight": 6.5,
            "remarks": "Observed significant missing components from chassis."
        }
    )
    assert resp.status_code == 200
    res = resp.json()
    assert res["is_variance_anomaly"] is True
    assert "WEIGHT VARIANCE" in res["variance_warning"]
    assert res["variance_pct"] == 35.0

    # Verify AnomalyAlert recorded in DB
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.transaction_id == txn.id).first()
    assert alert is not None
    assert alert.alert_type == "WEIGHT_MISMATCH"


# ============================================================
# 8. PAYMENT & TRANSACTION COMPLETION
# ============================================================

def test_payment_status_update_completes_lifecycle(recycler_auth_headers, db):
    recycler = db.query(RecyclerProfile).first()
    collector = db.query(CollectorProfile).first()

    lot = EWasteLot(
        lot_id=f"LOT-PAY-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-PAY-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Fractional Electric Motor",
        estimated_weight=15.0,
        final_weight=15.0,
        recommended_price=1200.0,
        status="HANDOVER_VERIFIED"
    )
    db.add(lot)
    db.commit()

    txn = Transaction(
        lot_id=lot.id,
        collector_id=collector.id,
        recycler_id=recycler.id,
        agreed_price_per_kg=80.0,
        final_weight=15.0,
        final_price=1200.0,
        total_amount=1200.0,
        payment_status="PENDING",
        status="HANDED_OVER"
    )
    db.add(txn)
    db.commit()

    resp = client.patch(
        f"/api/recycler/transactions/{txn.id}/payment-status",
        headers=recycler_auth_headers,
        json={
            "payment_status": "PAID",
            "payment_method": "UPI Instant Transfer"
        }
    )
    assert resp.status_code == 200
    res = resp.json()
    assert res["payment_status"] == "PAID"
    assert res["transaction_status"] == "COMPLETED"
    assert res["payment_ref"].startswith("UPI-DEMO")

    # Verify lot is also completed
    db.refresh(lot)
    assert lot.status == "COMPLETED"

    # Verify trace event recorded
    pay_events = db.query(TraceEvent).filter(TraceEvent.lot_id == lot.id, TraceEvent.stage == "PAYMENT_COMPLETED").all()
    assert len(pay_events) >= 1


# ============================================================
# 9. RECYCLER PROFILE MANAGEMENT
# ============================================================

def test_get_and_update_recycler_profile(recycler_auth_headers):
    resp_get = client.get("/api/recycler/profile", headers=recycler_auth_headers)
    assert resp_get.status_code == 200
    prof = resp_get.json()
    assert "facility_name" in prof
    assert "service_radius_km" in prof

    # Update profile radius
    resp_update = client.patch(
        "/api/recycler/profile",
        headers=recycler_auth_headers,
        json={"service_radius_km": 45.0, "pickup_available": True}
    )
    assert resp_update.status_code == 200
    assert resp_update.json()["service_radius_km"] == 45.0
