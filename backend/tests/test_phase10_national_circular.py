import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.safety_guide import SafetyGuide

client = TestClient(app)

def test_ai_classification_with_phase10_explainability():
    """Verify Phase 10 AI returns explainability cues, alternatives, recyclability, and handling recommendations."""
    payload = {
        "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "device_info": "Test Mobile Client"
    }
    response = client.post("/api/ai/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "material" in data
    assert "confidence" in data
    assert "explainability_reasons" in data
    assert isinstance(data["explainability_reasons"], list)
    assert len(data["explainability_reasons"]) > 0
    assert "alternatives" in data
    assert "recyclability_category" in data
    assert "recommended_handling" in data
    assert "recommended_recycler_category" in data

def test_ai_human_in_the_loop_feedback():
    """Verify collector can submit AI correction feedback without retraining model."""
    feedback_payload = {
        "original_prediction": "CRT",
        "original_confidence": 0.68,
        "corrected_material": "PCB",
        "user_role": "COLLECTOR",
        "notes": "Board with green resin pattern, not CRT glass"
    }
    response = client.post("/api/ai/feedback", json=feedback_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["corrected_material"] == "PCB"
    assert "feedback_id" in data

def test_admin_circular_flow_and_capacity_pressure():
    """Verify circular economy flow endpoint returns stages, material flows, and capacity pressure signals."""
    response = client.get("/api/admin/circular-flow")
    assert response.status_code == 200
    data = response.json()
    assert data["demo_environment"] is True
    assert "stages" in data
    assert len(data["stages"]) >= 6
    assert "material_flows" in data
    assert "capacity_pressure_alerts" in data

    # Verify each material flow has utilization, demand, and deterministic recommendation
    for flow in data["material_flows"]:
        assert "material" in flow
        assert "supply_kg" in flow
        assert "demand_capacity_kg" in flow
        assert "status" in flow
        assert "recommendation" in flow

def test_admin_pickup_clusters():
    """Verify smart pickup batching groups compatible lots with vehicle and route suggestions."""
    response = client.get("/api/admin/pickup-clusters")
    assert response.status_code == 200
    clusters = response.json()
    assert isinstance(clusters, list)
    assert len(clusters) > 0
    first = clusters[0]
    assert "cluster_id" in first
    assert "hub_name" in first
    assert "suggested_vehicle" in first
    assert "total_weight_kg" in first

def test_admin_what_if_scenario_simulator():
    """Verify what-if simulator returns projected volume, payouts, and formula transparency."""
    response = client.get("/api/admin/scenario-simulation?participation_pct=25.0")
    assert response.status_code == 200
    sim = response.json()
    assert sim["simulation_mode"] is True
    assert sim["participation_increase_pct"] == 25.0
    assert "baseline" in sim
    assert "projected" in sim
    assert sim["projected"]["monthly_collection_kg"] > sim["baseline"]["monthly_collection_kg"]
    assert "impact_assumptions" in sim
    assert "formula" in sim["impact_assumptions"]

def test_community_collection_drives():
    """Verify listing and creating community collection drives."""
    # List
    response = client.get("/api/admin/collection-drives")
    assert response.status_code == 200
    drives = response.json()
    assert isinstance(drives, list)
    assert len(drives) >= 1

    # Create
    new_drive = {
        "title": "Phase 10 Grand Finale Drive",
        "location": "Banjara Hills Civic Grounds",
        "city": "Hyderabad",
        "target_weight_kg": 800.0,
        "target_collectors": 40,
        "accepted_materials": "PCB, Battery, Cable"
    }
    create_res = client.post("/api/admin/collection-drives", json=new_drive)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["success"] is True
    assert created["title"] == "Phase 10 Grand Finale Drive"

def test_demo_control_scenarios_and_reset():
    """Verify admin demo control endpoints for SIH judges."""
    # Trigger scenario 1
    s1_res = client.post("/api/admin/demo/scenario/scenario_1")
    assert s1_res.status_code == 200
    assert s1_res.json()["status"] == "READY"

    # Trigger scenario 6
    s6_res = client.post("/api/admin/demo/scenario/scenario_6")
    assert s6_res.status_code == 200
    assert s6_res.json()["demo_trace_id"] == "RC-2026-000241"

    # Demo reset
    reset_res = client.post("/api/admin/demo/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

def test_multilingual_safety_guides_seeded():
    """Verify all 8 national languages have active safety guidelines seeded in DB."""
    db = SessionLocal()
    for lang in ["en", "hi", "mr", "te", "ta", "kn", "ml", "bn"]:
        count = db.query(SafetyGuide).filter(SafetyGuide.language == lang).count()
        assert count > 0, f"Expected safety guides for language {lang}"
    db.close()
