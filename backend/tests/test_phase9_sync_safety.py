import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_sync_status():
    response = client.get("/api/sync/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["idempotency_enabled"] is True
    assert "synced_lots_count" in data
    assert "supported_actions" in data

def test_sync_batch_and_idempotency():
    # 1. First sync with unique client action ID
    test_action_id = f"test-act-{pytest.__name__}-998877"
    payload = {
        "device_id": "test-device-android-01",
        "actions": [
            {
                "client_action_id": test_action_id,
                "action_type": "CREATE_LOT",
                "payload": {
                    "material_name": "Battery",
                    "weight_kg": 4.5,
                    "hazard_level": "HIGH",
                    "recommended_price": 420.0
                }
            }
        ]
    }

    res1 = client.post("/api/sync/batch", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "SUCCESS"
    assert data1["synced_count"] == 1
    assert len(data1["results"]) == 1
    first_result = data1["results"][0]
    assert first_result["status"] == "SYNCED"
    assert first_result["client_action_id"] == test_action_id
    server_id_1 = first_result["server_id"]
    trace_id_1 = first_result["trace_id"]
    assert server_id_1 is not None
    assert trace_id_1.startswith("RC-2026-")

    # 2. Retry identical sync (simulating network dropped response): Must be idempotent!
    res2 = client.post("/api/sync/batch", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "SUCCESS"
    assert len(data2["results"]) == 1
    second_result = data2["results"][0]
    assert second_result["status"] == "SYNCED"
    assert second_result["idempotent"] is True
    assert second_result["server_id"] == server_id_1
    assert second_result["trace_id"] == trace_id_1

def test_safety_guides_multilingual():
    # English
    res_en = client.get("/api/safety-guides?lang=en")
    assert res_en.status_code == 200
    guides_en = res_en.json()
    assert len(guides_en) > 0
    assert any(g["material_category"] == "Battery" for g in guides_en)

    # Hindi
    res_hi = client.get("/api/safety-guides?lang=hi")
    assert res_hi.status_code == 200
    guides_hi = res_hi.json()
    assert len(guides_hi) > 0

    # Marathi
    res_mr = client.get("/api/safety-guides?lang=mr")
    assert res_mr.status_code == 200
    guides_mr = res_mr.json()
    assert len(guides_mr) > 0

def test_safety_guide_by_material():
    res = client.get("/api/safety-guides/material/Battery?lang=hi")
    assert res.status_code == 200
    guide = res.json()
    assert guide["material_category"] == "Battery"
    assert "बैटरी" in guide["title"] or "विस्फोट" in guide["danger_description"]
    assert "dos" in guide and isinstance(guide["dos"], list)

def test_safety_acknowledgement():
    res = client.post("/api/safety-guides/acknowledge", json={
        "material_name": "Battery",
        "hazard_level": "HIGH",
        "collector_id": 1
    })
    assert res.status_code == 200
    ack = res.json()
    assert ack["status"] == "ACKNOWLEDGED"
    assert ack["material"] == "Battery"

def test_admin_safety_analytics():
    res = client.get("/api/admin/analytics/safety")
    assert res.status_code == 200
    stats = res.json()
    assert "high_hazard_lots" in stats
    assert "medium_hazard_lots" in stats
    assert "low_hazard_lots" in stats
    assert "safety_guide_views" in stats
    assert "safety_alerts_count" in stats
