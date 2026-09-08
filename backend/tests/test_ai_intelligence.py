import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.ai_prediction import AIPrediction
from app.models.anomaly_alert import AnomalyAlert
from app.models.trace_event import TraceEvent
from app.models.ewaste_lot import EWasteLot

client = TestClient(app)

def create_test_image_bytes(format="JPEG", size=(200, 200), color=(0, 128, 64)):
    """Generate in-memory valid image bytes for test uploads"""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()

def test_01_image_validation_valid_jpeg():
    """Verify classification succeeds with valid JPEG image via multipart form"""
    img_bytes = create_test_image_bytes("JPEG")
    files = {"image": ("test_pcb.jpg", img_bytes, "image/jpeg")}
    data = {"weight": "2.4", "sample_key": "pcb"}

    res = client.post("/api/ai/classify-material", files=files, data=data)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["detected_material"] == "PCB"
    assert body["confidence"] >= 0.90
    assert body["confidence_band"] == "HIGH CONFIDENCE"
    assert body["is_demo_prediction"] is True
    assert "prediction_id" in body
    assert body["prediction_id"] is not None
    assert body["hazard_level"] == "Medium"
    assert "Copper" in body["recoverable_materials"]
    assert "explanation" in body
    assert "circuit-board" in body["explanation"]

def test_02_image_validation_invalid_corrupted():
    """Verify rejection of corrupted / unreadable image bytes"""
    corrupt_bytes = b"NOT_A_VALID_IMAGE_FILE_HEADER_GARBAGE_BYTES_12345"
    files = {"image": ("corrupted.jpg", corrupt_bytes, "image/jpeg")}

    res = client.post("/api/ai/classify-material", files=files)
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_IMAGE"

def test_03_image_validation_unsupported_format():
    """Verify rejection of unsupported file extensions"""
    files = {"image": ("sample.txt", b"Hello world e-waste", "text/plain")}

    res = client.post("/api/ai/classify-material", files=files)
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "UNSUPPORTED_FORMAT"

def test_04_image_validation_file_too_large():
    """Verify rejection of file exceeding 10MB limit"""
    large_dummy_bytes = b"0" * (11 * 1024 * 1024)  # 11 MB
    files = {"image": ("huge_image.jpg", large_dummy_bytes, "image/jpeg")}

    res = client.post("/api/ai/classify-material", files=files)
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "FILE_TOO_LARGE"

def test_05_material_classes_coverage():
    """Verify deterministic predictions across all 10 material classes"""
    classes_to_test = [
        ("pcb", "PCB", "Medium"),
        ("cable", "Cable", "Low"),
        ("battery", "Battery", "High"),
        ("lcd", "LCD", "Medium"),
        ("crt", "CRT", "High"),
        ("motor", "Motor", "Low"),
        ("magnet", "Magnet Assembly", "Low"),
        ("plastic", "Mixed Plastic", "Low"),
        ("component", "Electronic Component", "Medium"),
        ("mixed", "Mixed E-Waste", "Medium"),
    ]

    for key, expected_cat, expected_haz in classes_to_test:
        res = client.post("/api/ai/classify-material", json={"sample_key": key})
        assert res.status_code == 200, f"Failed for {key}"
        data = res.json()
        assert data["material_category"] == expected_cat
        assert data["hazard_level"] == expected_haz
        assert len(data["recoverable_materials"]) > 0
        assert data["model_name"] == "recycLink-demo-classifier"
        assert data["is_demo_prediction"] is True

def test_06_weight_input_and_pricing_calculation():
    """Verify user-provided approximate weight modifies price calculation deterministically"""
    res = client.post("/api/ai/classify-material", json={
        "sample_key": "pcb",
        "weight": 5.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["estimated_weight"] == 5.0
    # PCB base price is 190, 5kg = 950 recommended
    assert data["recommended_fair_price"] == 950.0
    assert data["estimated_value_min"] == round(950 * 0.92, 2)
    assert data["estimated_value_max"] == round(950 * 1.14, 2)

def test_07_price_estimation_endpoint():
    """Verify POST /api/ai/estimate-value foundation"""
    res = client.post("/api/ai/estimate-value", json={
        "material_name": "PCB",
        "weight": 2.4,
        "condition": "GOOD"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["material"] == "PCB"
    assert data["weight"] == 2.4
    assert data["method"] == "DEMO_PRICE_MODEL"
    assert data["currency"] == "INR"
    assert data["is_demo_estimate"] is True
    assert 400.0 <= data["estimated_min"] <= 430.0
    assert 500.0 <= data["estimated_max"] <= 530.0

def test_08_transaction_anomaly_detection():
    """Verify POST /api/ai/detect-anomaly flags predatory underpricing"""
    # Expected: ₹450, Offer: ₹270 -> 40% underbidding
    res = client.post("/api/ai/detect-anomaly", json={
        "material_name": "PCB",
        "expected_price": 450.0,
        "offered_price": 270.0,
        "weight": 2.4
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_anomaly"] is True
    assert data["severity"] == "HIGH"
    assert data["difference_percent"] == 40.0
    assert "below the expected range" in data["reason"]

    # Normal price -> no anomaly
    res_normal = client.post("/api/ai/detect-anomaly", json={
        "material_name": "PCB",
        "expected_price": 450.0,
        "offered_price": 440.0,
        "weight": 2.4
    })
    assert res_normal.status_code == 200
    data_normal = res_normal.json()
    assert data_normal["is_anomaly"] is False
    assert data_normal["severity"] == "NONE"

def test_09_manual_fallback_material_selection():
    """Verify manual fallback when AI is bypassed or confidence is low"""
    res = client.post("/api/ai/manual-material", json={
        "material_category": "Battery",
        "weight": 3.0,
        "notes": "Collector selected Battery manually"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["material_category"] == "Battery"
    assert data["confidence"] == 1.0
    assert data["confidence_band"] == "MANUAL SELECTION"
    assert data["hazard_level"] == "High"
    assert data["is_demo_prediction"] is False

def test_10_prediction_persistence_and_trace_event():
    """Verify prediction record persistence and trace event generation when lot_id is provided"""
    db = SessionLocal()
    # Find an existing lot or create temporary reference
    lot = db.query(EWasteLot).first()
    db.close()

    if lot:
        res = client.post("/api/ai/classify-material", json={
            "sample_key": "cable",
            "weight": 4.5,
            "lot_id": lot.id
        })
        assert res.status_code == 200
        data = res.json()
        assert data["prediction_id"] is not None

        # Verify in DB
        db = SessionLocal()
        prediction = db.query(AIPrediction).filter(AIPrediction.id == data["prediction_id"]).first()
        assert prediction is not None
        assert prediction.detected_category == "Cable"
        assert prediction.lot_id == lot.id

        # Verify trace event
        trace = db.query(TraceEvent).filter(
            TraceEvent.lot_id == lot.id,
            TraceEvent.stage == "AI_IDENTIFIED"
        ).order_by(TraceEvent.created_at.desc()).first()
        assert trace is not None
        assert "Cable" in trace.description
        db.close()

def test_11_ai_analytics_endpoint():
    """Verify GET /api/admin/ai/analytics returns operational metrics"""
    res = client.get("/api/admin/ai/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "total_predictions" in data
    assert "high_confidence_predictions" in data
    assert "manual_classifications" in data
    assert "anomalies_detected" in data
    assert "top_materials" in data
    assert isinstance(data["top_materials"], list)
