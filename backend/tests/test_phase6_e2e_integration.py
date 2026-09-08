import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.entities import (
    User, CollectorProfile, RecyclerProfile, EWasteLot, Transaction,
    HandoverRecord, PickupRecord, TraceEvent, AuditLog, AnomalyAlert,
    UserRole, LotStatus, TransactionStatus
)
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_complete_phase6_e2e_lifecycle(db):
    """
    Section 46 & 49: Complete End-to-End Integration Test
    Collector creates PCB lot -> FairPrice -> Recycler receives lot in incoming queue
    -> Submits Offer -> Accepts -> Schedules Pickup -> Verifies Handover -> Settles Payment -> Trace events verified!
    """

    # 1. Authenticate Collector
    collector_user = db.query(User).filter(User.role == UserRole.COLLECTOR.value).first()
    assert collector_user is not None
    collector_token = create_access_token({"sub": str(collector_user.id), "user_id": collector_user.id, "role": collector_user.role})
    collector_headers = {"Authorization": f"Bearer {collector_token}"}

    # 2. Authenticate Recycler
    recycler_user = db.query(User).filter(User.role == UserRole.RECYCLER.value).first()
    assert recycler_user is not None
    recycler_token = create_access_token({"sub": str(recycler_user.id), "user_id": recycler_user.id, "role": recycler_user.role})
    recycler_headers = {"Authorization": f"Bearer {recycler_token}"}

    # 3. Collector creates lot
    lot_resp = client.post(
        "/api/lots",
        headers=collector_headers,
        json={
            "material_name": "Printed Circuit Board (PCB)",
            "subcategory": "Server Motherboard",
            "weight_kg": 2.4,
            "condition": "Standard Scrap",
            "location_address": "Kukatpally Industrial Area, Hyderabad"
        }
    )
    assert lot_resp.status_code == 200
    created_lot = lot_resp.json()
    lot_id = created_lot["lot_id"]
    trace_id = created_lot["trace_id"]
    assert lot_id.startswith("LOT-")
    assert trace_id.startswith("RC-")

    # 4. Recycler discovers lot in incoming lots queue
    incoming_resp = client.get("/api/recycler/lots/incoming?material=PCB", headers=recycler_headers)
    assert incoming_resp.status_code == 200
    incoming_lots = incoming_resp.json()
    matched_lot = next((l for l in incoming_lots if l["lot_id"] == lot_id), None)
    assert matched_lot is not None, f"Lot {lot_id} was not found in incoming queue."
    assert matched_lot["weight_kg"] == 2.4

    # 5. Recycler reviews lot specifications
    detail_resp = client.get(f"/api/recycler/lots/{lot_id}", headers=recycler_headers)
    assert detail_resp.status_code == 200
    lot_detail = detail_resp.json()
    assert "Prototype AI Prediction" in lot_detail["ai_confidence_label"]
    assert lot_detail["recommended_price"] > 0

    # 6. Recycler submits formal purchase offer of ₹480/kg
    offer_resp = client.post(
        "/api/recycler/offers",
        headers=recycler_headers,
        json={
            "lot_id": lot_id,
            "offer_price_per_kg": 480.0,
            "pickup_available": True,
            "pickup_time_window": "10:00 AM - 01:00 PM",
            "notes": "Hydrometallurgical refinery processing"
        }
    )
    assert offer_resp.status_code == 200
    offer_data = offer_resp.json()
    assert offer_data["fairness_status"] in ["GOOD OFFER", "FAIR"]
    txn_id = offer_data["transaction_id"]

    # 7. Collector synchronizes & checks status (should be OFFER_RECEIVED)
    collector_check_1 = client.get(f"/api/lots/{lot_id}", headers=collector_headers)
    assert collector_check_1.status_code == 200
    assert collector_check_1.json()["status"] == "OFFER_RECEIVED"

    # 8. Recycler accepts lot
    accept_resp = client.post(f"/api/recycler/lots/{lot_id}/accept", headers=recycler_headers)
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "ACCEPTED"

    # 9. Collector checks status (should be ACCEPTED)
    collector_check_2 = client.get(f"/api/lots/{lot_id}", headers=collector_headers)
    assert collector_check_2.status_code == 200
    assert collector_check_2.json()["status"] == "ACCEPTED"

    # 10. Recycler schedules pickup
    sched_date = datetime.utcnow() + timedelta(days=1)
    pickup_resp = client.post(
        "/api/recycler/pickups",
        headers=recycler_headers,
        json={
            "transaction_id": txn_id,
            "scheduled_date": sched_date.isoformat(),
            "time_window": "11:00 AM - 02:00 PM",
            "pickup_notes": "Logistics van assigned."
        }
    )
    assert pickup_resp.status_code == 200
    assert pickup_resp.json()["status"] == "SCHEDULED"

    # 11. Collector checks status (should be PICKUP_SCHEDULED)
    collector_check_3 = client.get(f"/api/lots/{lot_id}", headers=collector_headers)
    assert collector_check_3.status_code == 200
    assert collector_check_3.json()["status"] == "PICKUP_SCHEDULED"

    # 12. Recycler performs Handover Verification
    # Calibrated scale weight = 2.3 kg, rate = ₹475/kg -> Total = ₹1092.50
    handover_resp = client.post(
        f"/api/recycler/handover/{txn_id}",
        headers=recycler_headers,
        json={
            "final_verified_weight": 2.3,
            "final_agreed_rate_per_kg": 475.0,
            "remarks": "Calibrated electronic scale. Grade verified under CPCB standards."
        }
    )
    assert handover_resp.status_code == 200
    handover_data = handover_resp.json()
    assert handover_data["final_weight"] == 2.3
    assert handover_data["final_rate_per_kg"] == 475.0
    assert handover_data["final_price"] == 1092.5
    assert handover_data["status"] == "HANDED_OVER"

    # 13. Collector checks status (should be HANDOVER_VERIFIED)
    collector_check_4 = client.get(f"/api/lots/{lot_id}", headers=collector_headers)
    assert collector_check_4.status_code == 200
    assert collector_check_4.json()["status"] == "HANDOVER_VERIFIED"
    assert collector_check_4.json()["final_weight"] == 2.3
    assert collector_check_4.json()["final_price"] == 1092.5

    # 14. Recycler settles payout -> payment status = PAID
    pay_resp = client.patch(
        f"/api/recycler/transactions/{txn_id}/payment-status",
        headers=recycler_headers,
        json={
            "payment_status": "PAID",
            "payment_method": "UPI Instant Transfer"
        }
    )
    assert pay_resp.status_code == 200
    assert pay_resp.json()["payment_status"] == "PAID"
    assert pay_resp.json()["transaction_status"] == "COMPLETED"

    # 15. Collector checks status (should be COMPLETED)
    collector_check_5 = client.get(f"/api/lots/{lot_id}", headers=collector_headers)
    assert collector_check_5.status_code == 200
    assert collector_check_5.json()["status"] == "COMPLETED"

    # 16. Verify Complete Traceability Chain
    trace_resp = client.get(f"/api/trace/{trace_id}")
    assert trace_resp.status_code == 200
    trace_doc = trace_resp.json()
    stages = [e["stage"] for e in trace_doc["timeline"]]
    
    # Assert every major milestone was immutably recorded into trace ledger
    assert "COLLECTED" in stages
    assert "OFFER_RECEIVED" in stages
    assert "ACCEPTED" in stages
    assert "PICKUP_SCHEDULED" in stages
    assert "HANDOVER_VERIFIED" in stages
    assert "FORMAL_RECYCLING" in stages
    assert "PAYMENT_COMPLETED" in stages

    # 17. Verify Audit Logs
    audit_logs = db.query(AuditLog).filter(AuditLog.entity_id == str(txn_id)).all()
    actions = [l.action for l in audit_logs]
    assert "OFFER_SUBMITTED" in actions
    assert "PICKUP_SCHEDULED" in actions
    assert "HANDOVER_CONFIRMED" in actions
    assert "PAYMENT_STATUS_CHANGED" in actions
