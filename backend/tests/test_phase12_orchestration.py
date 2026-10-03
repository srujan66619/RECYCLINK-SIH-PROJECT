import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_circular_network_graph():
    """Verify circular network graph returns nodes and edges mapped to actual application entities."""
    response = client.get("/api/orchestration/network-graph")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert "summary" in data
    assert data["summary"]["total_nodes"] > 0
    assert data["summary"]["total_edges"] > 0
    
    node_types = {n["type"] for n in data["nodes"]}
    assert "COLLECTOR" in node_types or "RECYCLER" in node_types or "MATERIAL" in node_types

def test_network_health_score_and_explainability():
    """Verify transparent weighted network health score and factor explainability."""
    response = client.get("/api/orchestration/network-health")
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["overall_score"] <= 100
    assert data["health_tier"] in ["OPTIMAL", "STABLE", "RESILIENT", "DEGRADED", "PRESSURE", "CRITICAL"]
    assert "calculation_formula" in data
    assert "contributing_factors" in data
    assert len(data["contributing_factors"]) >= 5
    for factor in data["contributing_factors"]:
        assert "factor" in factor
        assert "weight" in factor
        assert "value" in factor
        assert "contribution" in factor
        assert factor["status"] in ["POSITIVE", "NEUTRAL", "NEGATIVE"]
        assert "interpretation" in factor

def test_participant_trust_profiles():
    """Verify non-discriminatory trust profiles and transparent trust breakdown."""
    response = client.get("/api/orchestration/trust-profiles")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    profile = data[0]
    assert "user_id" in profile
    assert "role" in profile
    assert "trust_score" in profile
    assert "trust_tier" in profile
    assert "breakdown" in profile
    # Verify strict non-discrimination: No demographic keys exist
    forbidden_keys = {"religion", "caste", "gender", "political", "race", "ethnicity"}
    assert not any(k in profile for k in forbidden_keys)

def test_disputes_lifecycle_and_ai_evidence():
    """Verify evidence-grounded dispute creation, AI summary (non-judgmental), and resolution."""
    # 1. List existing disputes
    response = client.get("/api/orchestration/disputes")
    assert response.status_code == 200
    disputes = response.json()
    assert isinstance(disputes, list)
    
    # 2. Create new dispute
    create_payload = {
        "dispute_type": "WEIGHT_DISCREPANCY",
        "title": "Gross weight mismatch at dock gate",
        "claim_description": "Collection weight logged was 48 kg, dock gross scale registered 44.5 kg.",
        "trace_id": "TRC-2026-EW-0089",
        "claimed_value": 44.5,
        "recorded_value": 48.0
    }
    create_resp = client.post("/api/orchestration/disputes", json=create_payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    dispute_id = created["id"]
    assert created["dispute_code"].startswith("DISP-")
    assert created["status"] == "DISPUTE_CREATED"
    assert created["ai_dispute_summary"] is not None
    assert "discrepancy" in created["ai_dispute_summary"].lower() or "audit" in created["ai_dispute_summary"].lower()

    # 3. Retrieve specific dispute evidence package
    get_resp = client.get(f"/api/orchestration/disputes/{dispute_id}")
    assert get_resp.status_code == 200
    evidence_pkg = get_resp.json()["evidence_package"]
    assert evidence_pkg["trace_id"] == "TRC-2026-EW-0089"
    assert "collection_record" in evidence_pkg
    assert "tare_weighbridge_log" in evidence_pkg

    # 4. Resolve dispute with authorized human decision
    resolve_payload = {
        "action": "RESOLVE",
        "resolution_notes": "Dock scale recalibrated. Accepted tare-adjusted weight of 46.2 kg with mutual signoff."
    }
    resolve_resp = client.post(f"/api/orchestration/disputes/{dispute_id}/resolve", json=resolve_payload)
    assert resolve_resp.status_code == 200
    resolved = resolve_resp.json()
    assert resolved["status"] == "RESOLVED"
    assert resolved["resolution_notes"] == resolve_payload["resolution_notes"]

def test_incentive_engine_and_anti_gaming():
    """Verify incentive transparency and anti-gaming protection audit."""
    resp = client.get("/api/orchestration/incentives")
    assert resp.status_code == 200
    incentives = resp.json()
    assert isinstance(incentives, list)
    if len(incentives) > 0:
        inc = incentives[0]
        assert "incentive_type" in inc
        assert "trigger_event" in inc
        assert "why_earned" in inc

    # Anti-gaming audit
    anti_resp = client.get("/api/orchestration/anti-gaming")
    assert anti_resp.status_code == 200
    audit = anti_resp.json()
    assert "anti_gaming_status" in audit
    assert "safeguards_active" in audit
    assert "artificial_splitting_flags" in audit
    assert isinstance(audit["safeguards_active"], list)

def test_institutional_partner_onboarding_and_verification():
    """Verify institutional partner registration and verification workflow."""
    apply_payload = {
        "name": "Indian Institute of Science Circular Hub",
        "partner_type": "UNIVERSITY",
        "service_area": "Bengaluru North",
        "city": "Bengaluru",
        "state": "Karnataka",
        "contact_person": "Dr. Ramesh Sharma",
        "contact_email": "rsharma@iisc.ac.in",
        "contact_phone": "+91 98450 11223",
        "material_capabilities": "LITHIUM_ION_BATTERIES, PCB_CIRCUITS"
    }
    create_resp = client.post("/api/orchestration/partners", json=apply_payload)
    assert create_resp.status_code == 201
    partner = create_resp.json()
    partner_id = partner["id"]
    assert partner["verification_status"] == "APPLICATION"
    
    # Verify partner
    verify_resp = client.post(f"/api/orchestration/partners/{partner_id}/verify", json={
        "status": "ACTIVE",
        "notes": "Official institutional MOU and facility validation approved."
    })
    assert verify_resp.status_code == 200
    verified = verify_resp.json()
    assert verified["verification_status"] == "ACTIVE"

def test_policy_simulation_multi_scenario():
    """Verify what-if policy simulator comparing Baseline vs Scenario A vs Scenario B."""
    sim_payload = {
        "collector_surge_pct": 25.0,
        "recycler_capacity_delta_pct": 10.0,
        "pickup_fleet_delta_pct": 20.0,
        "campaign_intensity_pct": 30.0,
        "incentive_multiplier": 1.25
    }
    resp = client.post("/api/orchestration/policy-simulation", json=sim_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "baseline" in data
    assert "scenario_a" in data
    assert "scenario_b" in data
    assert "limitations" in data
    assert "assumptions" in data
    assert len(data["assumptions"]) > 0

def test_material_flow_and_traceability_gaps():
    """Verify circular material flow stages and drop-off / traceability gap detection."""
    resp = client.get("/api/orchestration/material-flow")
    assert resp.status_code == 200
    data = resp.json()
    assert "material" in data
    assert "stages" in data
    assert "traceability_gaps" in data
    assert "circularity_index_pct" in data
    assert "formula_used" in data
    assert len(data["stages"]) >= 4

def test_data_quality_center():
    """Verify data quality scorecard, metrics, and actionable remediation tasks."""
    resp = client.get("/api/orchestration/data-quality")
    assert resp.status_code == 200
    data = resp.json()
    assert 0 <= data["overall_score"] <= 100
    assert "score_breakdown" in data
    assert "issues" in data
    assert "score_explanation" in data
    assert len(data["issues"]) > 0

def test_system_health_and_ai_fallback():
    """Verify system operational health, AI fallback readiness, and usage telemetry."""
    resp = client.get("/api/orchestration/system-health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["HEALTHY", "DEGRADED", "WARNING", "OPERATIONAL"]
    assert "api_health" in data
    assert "database_status" in data
    assert "ai_provider_status" in data
    assert data["ai_fallback_active"] is False or data["ai_fallback_active"] is True
    assert "ai_usage_stats" in data
    assert "background_jobs" in data

def test_policy_governance_versioning_and_rollback():
    """Verify configurable policy management, immutable version increments, and safe rollback."""
    # 1. Fetch current policy rules
    resp = client.get("/api/orchestration/policies")
    assert resp.status_code == 200
    policies = resp.json()
    assert len(policies) >= 1
    policy = policies[0]
    policy_id = policy["id"]
    original_val = policy["current_value"]
    original_ver = policy["version"]

    # 2. Update policy rule
    update_resp = client.put(f"/api/orchestration/policies/{policy_id}", json={
        "new_value": str(float(original_val) + 5.0) if original_val.replace('.', '', 1).isdigit() else "95",
        "reason": "Automated integration test adjustment for threshold policy."
    })
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["version"] == original_ver + 1

    # 3. View versions
    ver_resp = client.get(f"/api/orchestration/policies/{policy_id}/versions")
    assert ver_resp.status_code == 200
    versions = ver_resp.json()
    assert len(versions) >= 2

    # 4. Rollback to original version
    rollback_resp = client.post("/api/orchestration/policies/rollback", json={
        "policy_key": policy["policy_key"],
        "target_version": original_ver,
        "reason": "Test rollback to verified baseline value."
    })
    assert rollback_resp.status_code == 200
    rolled_back = rollback_resp.json()
    assert rolled_back["current_value"] == original_val

def test_operational_incidents_and_playbooks():
    """Verify operational incidents lifecycle and standard circular response playbooks."""
    resp = client.get("/api/orchestration/incidents")
    assert resp.status_code == 200
    incidents = resp.json()
    assert isinstance(incidents, list)
    if len(incidents) > 0:
        inc = incidents[0]
        assert "incident_code" in inc
        assert "playbook_applied" in inc
        assert "severity" in inc
        assert "status" in inc

def test_institutional_report_generator():
    """Verify institutional report distinguishing ACTUAL, ESTIMATE, SIMULATION, DEMO."""
    resp = client.get("/api/orchestration/reports/institutional")
    assert resp.status_code == 200
    report = resp.json()
    assert "report_title" in report
    assert "generated_at" in report
    assert "environment_classification" in report
    assert "sections" in report
    sections = report["sections"]
    assert "executive_summary" in sections
    assert "predictive_forecast" in sections
    assert "policy_simulation" in sections
    assert "compliance_and_governance" in sections
