import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.anomaly_alert import AnomalyAlert, AnomalyStatus
from app.models.audit_log import AuditLog

client = TestClient(app)

def test_admin_dashboard_kpis():
    response = client.get("/api/admin/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["demo_data"] is True
    assert data["system_status"] == "OPERATIONAL"
    assert "total_weight" in data
    assert "completed_transactions" in data
    assert "traceable_lots" in data
    assert "kpis" in data
    assert len(data["kpis"]) >= 8
    assert "total_weight" in data["kpis"]
    assert "traceable_lots" in data["kpis"]
    assert "completed_transactions" in data["kpis"]
    assert "collector_value" in data["kpis"]

def test_admin_analytics_trends():
    response = client.get("/api/admin/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "monthly_collection_trend" in data
    assert "material_distribution" in data
    assert "price_trends" in data
    assert "collector_earnings_trend" in data

def test_formalization_funnel():
    response = client.get("/api/admin/analytics/formalization")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8
    assert data[0]["stage_id"] == "COLLECTED"
    assert data[-1]["stage_id"] == "COMPLETED"
    for stage in data:
        assert 0.0 <= stage["retained_pct"] <= 100.0

def test_collector_impact():
    response = client.get("/api/admin/analytics/collectors")
    assert response.status_code == 200
    data = response.json()
    assert "total_collector_value_inr" in data
    assert "average_transaction_value_inr" in data
    assert "earnings_over_time" in data
    assert data["baseline_note"] == "Baseline comparison requires field-study data."

def test_price_fairness():
    response = client.get("/api/admin/analytics/pricing")
    assert response.status_code == 200
    data = response.json()
    assert "average_offered_price" in data
    assert "offers_below_fair_range" in data
    assert "offers_within_fair_range" in data
    assert "offers_above_fair_range" in data

def test_recycler_performance():
    response = client.get("/api/admin/analytics/recyclers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "facility_name" in data[0]
        assert "authorization_status" in data[0]
        assert "reliability_score" in data[0]

def test_traceability_metrics():
    response = client.get("/api/admin/analytics/traceability")
    assert response.status_code == 200
    data = response.json()
    assert "traceable_lots" in data
    assert "qr_generated" in data
    assert "verified_handovers" in data
    assert "integrity_status" in data
    assert "✓ NO TRACE INTEGRITY ISSUES DETECTED" in data["integrity_status"]

def test_ai_operational_analytics():
    response = client.get("/api/admin/analytics/ai")
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "PROTOTYPE AI"
    assert "average_confidence" in data
    assert "confidence_distribution" in data

def test_safety_analytics():
    response = client.get("/api/admin/analytics/safety")
    assert response.status_code == 200
    data = response.json()
    assert "high_hazard_lots" in data
    assert "medium_hazard_lots" in data
    assert "low_hazard_lots" in data

def test_impact_scorecard():
    response = client.get("/api/admin/analytics/scorecard")
    assert response.status_code == 200
    data = response.json()
    assert "environmental" in data
    assert "economic" in data
    assert "governance" in data
    assert "social" in data
    assert "circularity" in data

def test_anomaly_status_update_and_audit():
    db = SessionLocal()
    try:
        alert = db.query(AnomalyAlert).first()
        if not alert:
            alert = AnomalyAlert(
                alert_type="TEST_ANOMALY",
                severity="HIGH",
                description="Test alert for audit verification",
                actual_value=100.0,
                status=AnomalyStatus.OPEN.value
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)

        alert_id = alert.id
        resp = client.patch(
            f"/api/admin/anomalies/{alert_id}/status",
            json={"new_status": "RESOLVED", "notes": "Audited by CPCB admin"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "RESOLVED"

        # Verify audit log was created
        audit = db.query(AuditLog).filter(
            AuditLog.entity_id == str(alert_id),
            AuditLog.action == "ADMIN_ANOMALY_RESOLVED"
        ).first()
        assert audit is not None
        assert "Audited by CPCB admin" in audit.details
    finally:
        db.close()

def test_export_csv_report():
    response = client.get("/api/admin/reports/export-csv?report_type=collection")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    content = response.text
    assert "Lot ID" in content
    assert "Trace ID" in content

def test_privacy_protection_collectors():
    response = client.get("/api/admin/collectors")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        # Ensure no private phone or street address
        assert "phone" not in first
        assert "address" not in first
        assert "collector_code" in first
        assert "city" in first

def test_search_admin():
    response = client.get("/api/admin/search?q=RC-2026")
    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert "traces" in data

def test_system_settings():
    # Test GET settings
    res = client.get("/api/admin/settings")
    assert res.status_code == 200
    cfg = res.json()
    assert "demo_mode" in cfg
    assert "system_status" in cfg
    assert cfg["system_status"] == "OPERATIONAL"

    # Test update settings
    update_res = client.post("/api/admin/settings", json={"price_anomaly_threshold_pct": 35.0})
    assert update_res.status_code == 200
    updated_cfg = update_res.json()
    assert updated_cfg["price_anomaly_threshold_pct"] == 35.0

def test_all_9_statutory_csv_reports():
    reports = ["collection", "transactions", "materials", "recyclers", "traceability", "pricing", "anomalies", "collectors", "monthly_impact"]
    for r in reports:
        res = client.get(f"/api/admin/reports/export-csv?report_type={r}")
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/csv")
        assert len(res.text) > 0
