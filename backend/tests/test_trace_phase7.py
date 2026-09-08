import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal, get_db
from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.collector import CollectorProfile
from app.models.recycler import RecyclerProfile
from app.models.material import MaterialCategory
from app.models.transaction import Transaction, TransactionStatus
from app.models.handover import HandoverRecord
from app.models.trace_event import TraceEvent, TraceStage
from app.services.trace_service import TraceService
from app.services.handover_service import HandoverService
from app.utils.ids import generate_trace_id, generate_handover_id

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_trace_and_handover_id_generation(db_session: Session):
    """
    Verify unique, collision-safe identifier generation for Trace IDs and Handover IDs.
    """
    tid1 = generate_trace_id(db_session)
    tid2 = generate_trace_id(db_session)
    assert tid1.startswith("RC-2026-")
    assert tid2.startswith("RC-2026-")
    assert tid1 != tid2

    hid1 = generate_handover_id(db_session)
    hid2 = generate_handover_id(db_session)
    assert hid1.startswith("HR-2026-")
    assert hid2.startswith("HR-2026-")
    assert hid1 != hid2

def test_tamper_evident_event_hash_chain(db_session: Session):
    """
    Verify sequential SHA-256 hash chaining on Trace Events:
    Event 1: previous_hash = None
    Event 2: previous_hash = Event1.event_hash
    Event 3: previous_hash = Event2.event_hash
    """
    lot = db_session.query(EWasteLot).first()
    assert lot is not None, "At least one lot should exist in database"

    test_trace_id = f"RC-TEST-{datetime.utcnow().strftime('%M%S%f')[:8]}"
    test_lot = EWasteLot(
        lot_id=f"LOT-TEST-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=test_trace_id,
        collector_id=lot.collector_id,
        material_id=lot.material_id,
        material_name="PCB Test Scrap",
        estimated_weight=3.5,
        status=LotStatus.IDENTIFIED.value
    )
    db_session.add(test_lot)
    db_session.commit()
    db_session.refresh(test_lot)

    # Record Event 1
    ev1 = TraceService.record_event(
        db=db_session,
        lot_id=test_lot.id,
        trace_id=test_trace_id,
        stage=TraceStage.COLLECTED.value,
        title="Collection Verified",
        description="Lot aggregated at test hub",
        validate_sequence=False
    )
    assert ev1.previous_event_hash is None
    assert ev1.event_hash is not None
    assert len(ev1.event_hash) == 64

    # Record Event 2
    ev2 = TraceService.record_event(
        db=db_session,
        lot_id=test_lot.id,
        trace_id=test_trace_id,
        stage=TraceStage.AI_IDENTIFIED.value,
        title="AI Vision Classification",
        description="Classified as PCB 98% confidence",
        validate_sequence=False
    )
    assert ev2.previous_event_hash == ev1.event_hash
    assert ev2.event_hash is not None
    assert ev2.event_hash != ev1.event_hash

    # Record Event 3
    ev3 = TraceService.record_event(
        db=db_session,
        lot_id=test_lot.id,
        trace_id=test_trace_id,
        stage=TraceStage.PRICE_ESTIMATED.value,
        title="FairPrice Generated",
        description="Estimated benchmark value",
        validate_sequence=False
    )
    assert ev3.previous_event_hash == ev2.event_hash

    # Verify integrity report
    integrity = TraceService.verify_event_integrity(test_trace_id, db_session)
    assert integrity["status"] == "VALID"
    assert integrity["integrity_status"] == "VALID"
    assert integrity["events_checked"] == 3

def test_tamper_evident_integrity_detects_modification(db_session: Session):
    """
    Verify verify_event_integrity accurately detects if any event payload in the chain is tampered.
    """
    test_trace_id = f"RC-TMP-{datetime.utcnow().strftime('%M%S%f')[:8]}"
    lot = db_session.query(EWasteLot).first()

    test_lot = EWasteLot(
        lot_id=f"LOT-TMP-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=test_trace_id,
        collector_id=lot.collector_id,
        material_id=lot.material_id,
        material_name="Test Cable Scrap",
        estimated_weight=5.0,
        status=LotStatus.IDENTIFIED.value
    )
    db_session.add(test_lot)
    db_session.commit()
    db_session.refresh(test_lot)

    ev1 = TraceService.record_event(
        db=db_session,
        lot_id=test_lot.id,
        trace_id=test_trace_id,
        stage=TraceStage.COLLECTED.value,
        title="Valid Event 1",
        description="Unmodified description",
        validate_sequence=False
    )
    ev2 = TraceService.record_event(
        db=db_session,
        lot_id=test_lot.id,
        trace_id=test_trace_id,
        stage=TraceStage.AI_IDENTIFIED.value,
        title="Valid Event 2",
        description="Unmodified description 2",
        validate_sequence=False
    )

    # Initial check must be valid
    check_before = TraceService.verify_event_integrity(test_trace_id, db_session)
    assert check_before["status"] == "VALID"

    # Maliciously modify ev1 description directly in DB without recalculating event_hash
    ev1.description = "MALICIOUSLY TAMPERED CONTENT"
    db_session.commit()

    check_after = TraceService.verify_event_integrity(test_trace_id, db_session)
    assert check_after["status"] == "TAMPER_DETECTED"
    assert check_after["integrity_status"] == "TAMPER_DETECTED"
    assert check_after["tampered_at_event_id"] == ev1.id

def test_event_sequence_validation_rejects_impossible_order(db_session: Session):
    """
    Verify event sequence validation rejects invalid lifecycle jumps:
    e.g. PAYMENT_COMPLETED before HANDOVER_VERIFIED.
    """
    lot = db_session.query(EWasteLot).first()
    test_trace_id = f"RC-SEQ-{datetime.utcnow().strftime('%M%S%f')[:8]}"
    test_lot = EWasteLot(
        lot_id=f"LOT-SEQ-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=test_trace_id,
        collector_id=lot.collector_id,
        material_name="Testing Sequence",
        estimated_weight=2.0,
        status=LotStatus.IDENTIFIED.value
    )
    db_session.add(test_lot)
    db_session.commit()
    db_session.refresh(test_lot)

    # Attempt to record PAYMENT_COMPLETED without HANDOVER_VERIFIED
    with pytest.raises(ValueError) as excinfo:
        TraceService.record_event(
            db=db_session,
            lot_id=test_lot.id,
            trace_id=test_trace_id,
            stage=TraceStage.PAYMENT_COMPLETED.value,
            title="Illegal Payment Event",
            description="Attempting payment without handover",
            validate_sequence=True
        )
    assert "cannot occur before" in str(excinfo.value)

def test_public_trace_endpoint_protects_collector_privacy():
    """
    Verify GET /api/trace/{trace_id} returns public trace information while strictly
    suppressing sensitive collector data (no phone, private address, or private documents).
    """
    res = client.get("/api/trace/RC-2026-000241")
    assert res.status_code == 200
    data = res.json()

    assert data["trace_id"] == "RC-2026-000241"
    assert data["lot_id"] == "LOT-2026-000241"
    assert data["material"] == "Printed Circuit Board (PCB)"
    assert data["status"] == "COMPLETED"
    assert "integrity" in data
    assert data["integrity"]["status"] == "VALID"

    # Privacy Protection checks
    assert "phone" not in data
    assert "collector_phone" not in data
    assert "collector_address" not in data
    assert data["collector_type"] == "Verified Informal Collector"
    assert "collector_city" in data

def test_handover_creation_and_receipt(db_session: Session):
    """
    Verify POST /api/handover reconciles scale weight, generates HR-2026-XXXXXX,
    and returns digital receipt details.
    """
    collector = db_session.query(CollectorProfile).first()
    lot = EWasteLot(
        lot_id=f"LOT-HND-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-HND-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Battery Pack Test",
        estimated_weight=2.4,
        quoted_price=480.0,
        status=LotStatus.ACCEPTED.value
    )
    db_session.add(lot)
    db_session.commit()
    db_session.refresh(lot)

    payload = {
        "lot_id": lot.id,
        "final_weight": 2.3,
        "final_price": 475.0,
        "condition": "Good certified scrap",
        "notes": "Calibrated scale check"
    }
    res = client.post("/api/handover", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["handover_id"].startswith("HR-2026-")
    assert data["final_weight"] == 2.3
    assert data["variance_pct"] == -4.17
    assert data["discrepancy_flagged"] is False

    # Verify GET /api/handover/{handover_id}
    receipt_res = client.get(f"/api/handover/{data['handover_id']}")
    assert receipt_res.status_code == 200
    receipt = receipt_res.json()
    assert receipt["handover_id"] == data["handover_id"]
    assert receipt["final_price"] == 475.0
    assert "qr_code_base64" in receipt

def test_handover_scale_weight_anomaly_flagged(db_session: Session):
    """
    Verify scale weight difference > 25% flags discrepancy_flagged = True
    and creates a SCALE_WEIGHT_MISMATCH anomaly alert.
    """
    collector = db_session.query(CollectorProfile).first()
    lot = EWasteLot(
        lot_id=f"LOT-VAR-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        trace_id=f"RC-VAR-{datetime.utcnow().strftime('%M%S%f')[:8]}",
        collector_id=collector.id,
        material_name="Cable Heavy Scrap",
        estimated_weight=10.0,
        quoted_price=2000.0,
        status=LotStatus.ACCEPTED.value
    )
    db_session.add(lot)
    db_session.commit()
    db_session.refresh(lot)

    # 10.0 kg initial vs 5.0 kg final (-50% variance)
    payload = {
        "lot_id": lot.id,
        "final_weight": 5.0,
        "final_price": 1000.0,
        "condition": "Moisture loss",
        "notes": "Significant variance"
    }
    res = client.post("/api/handover", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["variance_pct"] == -50.0
    assert data["discrepancy_flagged"] is True

def test_admin_trace_analytics_and_listing():
    """
    Verify CPCB admin analytics endpoint and traceable ledger listing.
    """
    res = client.get("/api/trace/admin/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "total_traceable_lots" in data
    assert "total_weight_tracked_kg" in data
    assert data["is_demo_data"] is True

    list_res = client.get("/api/trace/admin/list")
    assert list_res.status_code == 200
    lots = list_res.json()
    assert isinstance(lots, list)
    assert len(lots) > 0
    assert "trace_id" in lots[0]

def test_canonical_hackathon_demo_lot_rc_2026_000241():
    """
    Verify canonical hackathon demo lot RC-2026-000241 has complete 14-stage journey,
    valid SHA-256 hash chain, and valid handover receipt.
    """
    res = client.get("/api/trace/RC-2026-000241")
    assert res.status_code == 200
    data = res.json()

    assert data["trace_id"] == "RC-2026-000241"
    assert data["lot_id"] == "LOT-2026-000241"
    assert data["material"] == "Printed Circuit Board (PCB)"
    assert data["status"] == "COMPLETED"
    assert data["initial_weight"] == 2.4
    assert data["final_weight"] == 2.3
    assert data["final_price"] == 475.0
    assert data["integrity"]["status"] == "VALID"
    assert len(data["timeline"]) == 14

    # Verify Handover Record
    assert data["handover"] is not None
    assert data["handover"]["handover_id"] == "HR-2026-000241"
    assert data["handover"]["weight_variance_pct"] == -4.17

    # Test integrity endpoint specifically
    int_res = client.get("/api/trace/RC-2026-000241/integrity")
    assert int_res.status_code == 200
    int_data = int_res.json()
    assert int_data["status"] == "VALID"
    assert int_data["events_checked"] == 14
