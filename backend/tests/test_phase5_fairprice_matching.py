import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.entities import (
    User, CollectorProfile, RecyclerProfile, MaterialCategory,
    PriceHistory, RecyclerOffer, EWasteLot, Transaction, TraceEvent,
    AnomalyAlert
)
from app.pricing import FairPriceService
from app.pricing.market_analyzer import MarketAnalyzer
from app.pricing.confidence import PriceConfidenceCalculator
from app.pricing.offer_analyzer import OfferAnalyzer
from app.matching import RecyclerMatchingService, DistanceCalculator, RecyclerScorer
from app.anomaly import TransactionFairnessService, AnomalyPriceRules

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()


# ============================================================
# 1. FAIRPRICE INTELLIGENCE TESTS
# ============================================================

def test_fairprice_calculation_standard(db):
    res = FairPriceService.estimate_price(
        db=db,
        material_name="Printed Circuit Board (PCB)",
        weight_kg=2.4,
        condition="Standard Scrap",
        location_city="Hyderabad"
    )
    assert res.market_min > 0
    assert res.market_max > res.market_min
    assert res.market_min <= res.recommended_price <= res.market_max
    assert res.total_estimated_value == round(res.recommended_price * 2.4, 2)
    assert res.confidence in ["HIGH", "MEDIUM", "LOW"]
    assert len(res.explanation) > 10
    assert len(res.nearby_recycler_offers) > 0

def test_fairprice_condition_adjustment(db):
    res_std = FairPriceService.estimate_price(db=db, material_name="PCB", weight_kg=1.0, condition="Standard Scrap")
    res_prem = FairPriceService.estimate_price(db=db, material_name="PCB", weight_kg=1.0, condition="Grade A Premium")
    res_dmg = FairPriceService.estimate_price(db=db, material_name="PCB", weight_kg=1.0, condition="Damaged Grade C")

    assert res_prem.recommended_price >= res_std.recommended_price
    assert res_dmg.recommended_price <= res_std.recommended_price

def test_price_confidence_grading():
    level_h, score_h, reason_h = PriceConfidenceCalculator.calculate_confidence(observation_count=20, offer_count=5)
    assert level_h == "HIGH"
    assert "Strong price evidence" in reason_h

    level_l, score_l, reason_l = PriceConfidenceCalculator.calculate_confidence(observation_count=0, offer_count=0)
    assert level_l == "LOW"
    assert "Limited price data" in reason_l

def test_price_trend_insufficient_data(db):
    trend_res = MarketAnalyzer.analyze_historical_trend(db=db, material_name="NonExistentMaterialX99", days=90)
    assert trend_res["trend"] == "INSUFFICIENT DATA"
    assert trend_res["percentage_change"] == 0.0


# ============================================================
# 2. RECYCLER MATCHING & EXPLAINABILITY TESTS
# ============================================================

def test_recycler_matching_scoring(db):
    recs = RecyclerMatchingService.get_recommended_recyclers(
        db=db,
        material_name="PCB",
        weight_kg=2.4,
        collector_lat=17.3850,
        collector_lon=78.4867
    )
    assert len(recs) > 0
    top = recs[0]
    assert top.overall_score > 0
    assert top.component_scores.authorization_score > 0
    assert top.component_scores.material_score > 0
    assert len(top.match_reasons) >= 2

def test_distance_haversine_and_city_fallback():
    km, label = DistanceCalculator.calculate_distance(
        collector_lat=17.3850, collector_lon=78.4867,
        recycler_lat=17.4400, recycler_lon=78.4980
    )
    assert km > 0
    assert "GPS" in label

    km_city, label_city = DistanceCalculator.calculate_distance(
        collector_lat=None, collector_lon=None,
        recycler_lat=None, recycler_lon=None,
        collector_city="Hyderabad", recycler_city="Hyderabad"
    )
    assert km_city > 0
    assert "Local" in label_city or "Hyderabad" in label_city


# ============================================================
# 3. TRANSACTION FAIRNESS & ANOMALY DETECTION TESTS
# ============================================================

def test_predatory_pricing_detection(db):
    # Benchmark 455, offer 270 (40% below) -> HIGH severity
    result = TransactionFairnessService.evaluate_fairness(
        db=db,
        offered_price=270.0,
        expected_price=455.0,
        material_name="PCB",
        weight_kg=2.4,
        persist_alert=True
    )
    assert result.is_anomaly is True
    assert result.severity in ["HIGH", "CRITICAL"]
    assert result.alert_type == "PREDATORY_PRICING"
    assert result.difference_percent >= 35.0
    assert "Review other offers" in result.recommended_action
    assert result.alert_id is not None

def test_weight_price_inconsistency_detection(db):
    # 2 kg at expected 455 = 910 total, but offer total is 5000 (rate 2500/kg)
    result = TransactionFairnessService.evaluate_fairness(
        db=db,
        offered_price=2500.0,
        expected_price=455.0,
        weight_kg=2.0,
        persist_alert=False
    )
    assert result.is_anomaly is True
    assert result.severity in ["MEDIUM", "HIGH"]
    assert result.alert_type in ["INFLATED_PRICE", "UNUSUAL_VALUE"]


# ============================================================
# 4. API ENDPOINTS INTEGRATION TESTS
# ============================================================

def test_api_pricing_estimate():
    payload = {
        "material": "Printed Circuit Board (PCB)",
        "weight_kg": 2.4,
        "location_city": "Hyderabad",
        "condition": "Standard Scrap"
    }
    res = client.post("/api/pricing/estimate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["material"] == "Printed Circuit Board (PCB)"
    assert data["recommended_price"] > 0
    assert data["confidence"] in ["HIGH", "MEDIUM", "LOW"]
    assert len(data["nearby_recycler_offers"]) > 0

def test_api_pricing_history():
    res = client.get("/api/pricing/history?material=PCB")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_api_pricing_trend(db):
    mat = db.query(MaterialCategory).first()
    mat_id = mat.id if mat else 1
    res = client.get(f"/api/pricing/trend/{mat_id}")
    assert res.status_code == 200
    data = res.json()
    assert "trend" in data
    assert "average" in data

def test_api_recyclers_recommended():
    res = client.get("/api/recyclers/recommended?material=PCB&weight=2.4")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "overall_score" in data[0]
    assert "match_reasons" in data[0]

def test_api_admin_pricing_analytics():
    res = client.get("/api/admin/pricing-analytics")
    assert res.status_code == 200
    data = res.json()
    assert "average_offered_price" in data
    assert "offers_within_fair_range" in data
    assert "anomalies_detected" in data
