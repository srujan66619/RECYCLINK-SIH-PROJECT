import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_intelligence_overview():
    """Verify operational command center scorecard and timeline."""
    response = client.get("/api/intelligence/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["demo_environment"] is True
    assert "e_waste_tracked_kg" in data
    assert "traceable_lots_count" in data
    assert "active_collectors_count" in data
    assert "active_recyclers_count" in data
    assert "pending_pickups_count" in data
    assert "capacity_pressure_count" in data
    assert "open_recommendations_count" in data
    assert "top_actions" in data
    assert len(data["top_actions"]) == 3
    assert "system_intelligence_timeline" in data
    assert len(data["system_intelligence_timeline"]) > 0

def test_collection_trends():
    """Verify collection volume, participation, and demand trend calculations with explainability."""
    response = client.get("/api/intelligence/trends")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    for item in data:
        assert "metric" in item
        assert "current_period_val" in item
        assert "prev_period_val" in item
        assert "change_pct" in item
        assert item["trend_direction"] in ["Increasing", "Stable", "Decreasing"]
        assert "unit" in item
        assert "explanation" in item

def test_material_demand_forecast():
    """Verify material forecast estimates with confidence and deterministic explainability."""
    response = client.get("/api/intelligence/forecast")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    for f in data:
        assert "material" in f
        assert "current_kg" in f
        assert "expected_next_period_kg" in f
        assert f["estimate_label"] == "ESTIMATE"
        assert f["confidence_label"] in ["HIGH", "MEDIUM", "LOW"]
        assert "why_this_forecast" in f
        assert len(f["why_this_forecast"]) > 0

def test_network_bottleneck_detection():
    """Verify bottleneck detection across capacity, pickup, handover, and regional coverage."""
    response = client.get("/api/intelligence/bottlenecks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    for b in data:
        assert "category" in b
        assert b["priority"] in ["HIGH", "MEDIUM", "LOW"]
        assert "what_happened" in b
        assert "why" in b
        assert "affected_entities" in b
        assert "what_can_be_done" in b

def test_recommendation_lifecycle_and_decision_history():
    """Verify recommendation lifecycle: GENERATED -> REVIEW -> ACCEPT (EXECUTED) and audit logging."""
    # 1. Fetch recommendations
    recs_res = client.get("/api/intelligence/recommendations")
    assert recs_res.status_code == 200
    recs = recs_res.json()
    assert len(recs) > 0
    rec_target = recs[0]
    rec_id = rec_target["id"]

    # Verify evidence and counterfactual exist
    assert "evidence" in rec_target
    assert "counterfactual" in rec_target

    # 2. Review recommendation
    rev_res = client.post(f"/api/intelligence/recommendations/{rec_id}/action", json={"action": "REVIEW"})
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "REVIEWED"

    # 3. Accept recommendation (human-in-the-loop approval)
    accept_res = client.post(
        f"/api/intelligence/recommendations/{rec_id}/action",
        json={"action": "ACCEPT", "admin_notes": "Approved by testing suite."}
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "EXECUTED"
    assert "decision_id" in accept_res.json()

    # 4. Verify decision history
    dec_res = client.get("/api/intelligence/decisions")
    assert dec_res.status_code == 200
    decisions = dec_res.json()
    assert len(decisions) > 0
    assert any(d["decision"] == "ACCEPTED" for d in decisions)

def test_circular_opportunities():
    """Verify Circular Economy Opportunity Engine returns high-yield formalization levers."""
    response = client.get("/api/intelligence/opportunities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    for opp in data:
        assert "title" in opp
        assert "opportunity_type" in opp
        assert "gap_status" in opp
        assert "recommended_investigation" in opp
        assert "estimated_impact" in opp

def test_recycler_network_capacity():
    """Verify recycler network capacity view shows pressure and workload status."""
    response = client.get("/api/intelligence/recycler-network")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for r in data:
        assert "facility_name" in r
        assert "configured_capacity_kg_month" in r
        assert "used_capacity_kg_month" in r
        assert "available_capacity_kg_month" in r
        assert "pressure_level" in r
        assert r["workload_status"] in ["CURRENT", "PROJECTED", "SIMULATION"]

def test_ai_performance_and_human_corrections():
    """Verify AI model monitoring tracks corrections, confused materials, and correction rate."""
    response = client.get("/api/intelligence/ai-performance")
    assert response.status_code == 200
    data = response.json()
    assert "total_ai_classifications" in data
    assert "human_corrections_count" in data
    assert "correction_rate_pct" in data
    assert "most_confused_materials" in data
    assert isinstance(data["most_confused_materials"], list)

def test_ai_decision_support_pcb_query():
    """Verify AI Decision Support uses grounded database evidence for operational questions."""
    query_payload = {"query": "Why are PCB handovers delayed?"}
    response = client.post("/api/intelligence/decision-support", json=query_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "INVESTIGATE_PCB_OPERATIONAL_DELAYS"
    assert data["relevant_records_count"] > 0
    assert len(data["records_used"]) > 0
    assert "evidence_text" in data
    assert "suggested_action" in data
    assert "REC-2026-001" in data["suggested_action"] or "GreenTech" in data["suggested_action"]

def test_trace_alerts_workflow():
    """Verify traceability alerts retrieval and resolution workflow."""
    alerts_res = client.get("/api/intelligence/trace-alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0
    alert_id = alerts[0]["id"]

    # Resolve alert
    res_alert = client.post(
        f"/api/intelligence/trace-alerts/{alert_id}/action",
        json={"action": "RESOLVE", "notes": "Handover OTP verified on-site."}
    )
    assert res_alert.status_code == 200
    assert res_alert.json()["status"] == "RESOLVED"

def test_scenario_simulator_counterfactual():
    """Verify Scenario Simulator 2.0 returns counterfactual baseline vs simulated outcome."""
    payload = {"scenario_type": "COLLECTOR_INCREASE", "parameter_change_pct": 30.0}
    response = client.post("/api/intelligence/simulations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "current_baseline" in data
    assert "simulated_result" in data
    assert "counterfactual_difference" in data
    assert "SIMULATION" in data["simulation_label"]

def test_collector_insights():
    """Verify non-sensitive collector opportunity insights."""
    response = client.get("/api/intelligence/collector-insights?collector_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "completed_collections_month" in data
    assert "most_frequent_material" in data
    assert "total_traceable_weight_kg" in data
    assert "recommendation_tip" in data

def test_intelligence_csv_export():
    """Verify CSV export of circular economy intelligence marked as DEMO DATA."""
    response = client.get("/api/intelligence/export")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    text = response.text
    assert "DEMO DATA" in text
    assert "OVERVIEW" in text
    assert "RECOMMENDATION_CODE" in text

