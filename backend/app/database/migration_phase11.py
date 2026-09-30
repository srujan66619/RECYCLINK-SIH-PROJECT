import sqlite3
import os
import json
from datetime import datetime, timedelta

def migrate_database_phase11(db_path: str = "recyclink.db"):
    if not os.path.exists(db_path):
        print(f"[Phase 11 Migration] Database {db_path} not found. Skipping.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print(f"[Phase 11 Migration] Checking Phase 11 schema for {db_path}...")

    # 1. Create intelligence_recommendations table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS intelligence_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recommendation_code VARCHAR(50) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL,
            priority VARCHAR(20) DEFAULT 'MEDIUM',
            status VARCHAR(30) DEFAULT 'GENERATED',
            material VARCHAR(50),
            affected_lots_count INTEGER DEFAULT 0,
            affected_weight_kg FLOAT DEFAULT 0.0,
            target_recycler_id INTEGER,
            target_recycler_name VARCHAR(100),
            reason TEXT NOT NULL,
            expected_effect TEXT NOT NULL,
            recommended_action TEXT NOT NULL,
            evidence_json TEXT,
            counterfactual_json TEXT,
            admin_id INTEGER,
            admin_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed_at DATETIME,
            resolved_at DATETIME,
            executed_at DATETIME,
            verified_at DATETIME,
            FOREIGN KEY (target_recycler_id) REFERENCES recyclers(id),
            FOREIGN KEY (admin_id) REFERENCES users(id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_intel_rec_code ON intelligence_recommendations(recommendation_code)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_intel_rec_status ON intelligence_recommendations(status)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_intel_rec_category ON intelligence_recommendations(category)")

    # 2. Create decision_history table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS decision_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recommendation_id INTEGER,
            recommendation_code VARCHAR(50),
            admin_id INTEGER NOT NULL,
            admin_name VARCHAR(100) DEFAULT 'Admin Authority',
            decision VARCHAR(30) NOT NULL,
            action_taken VARCHAR(255) NOT NULL,
            evidence_reference TEXT,
            decision_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            execution_result VARCHAR(50) DEFAULT 'SUCCESS',
            outcome_status VARCHAR(50) DEFAULT 'VERIFIED',
            outcome_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recommendation_id) REFERENCES intelligence_recommendations(id),
            FOREIGN KEY (admin_id) REFERENCES users(id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_decision_rec_id ON decision_history(recommendation_id)")

    # 3. Create trace_alerts table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS trace_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trace_id VARCHAR(100) NOT NULL,
            current_stage VARCHAR(50) NOT NULL,
            alert_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) DEFAULT 'MEDIUM',
            pending_duration_hours FLOAT DEFAULT 0.0,
            description TEXT NOT NULL,
            recommended_action TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'OPEN',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_trace_alerts_trace_id ON trace_alerts(trace_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_trace_alerts_status ON trace_alerts(status)")

    conn.commit()

    # 4. Seed initial recommendations if empty
    cur.execute("SELECT count(*) FROM intelligence_recommendations")
    rec_count = cur.fetchone()[0]

    # Find verified recyclers to link
    cur.execute("SELECT id, facility_name FROM recyclers LIMIT 2")
    recycler_rows = cur.fetchall()
    rec1_id, rec1_name = recycler_rows[0] if len(recycler_rows) > 0 else (None, "EcoCycle Solutions")
    rec2_id, rec2_name = recycler_rows[1] if len(recycler_rows) > 1 else (rec1_id, "GreenTech E-Waste Hub")

    # Find admin user
    cur.execute("SELECT id, full_name FROM users WHERE role = 'ADMIN' LIMIT 1")
    admin_row = cur.fetchone()
    admin_id, admin_name = admin_row if admin_row else (1, "Admin Authority")

    now = datetime.utcnow()

    if rec_count == 0:
        print("  Seeding baseline intelligence recommendations...")

        rec1_evidence = {
            "records_used": ["LOT-PCB-088", "LOT-PCB-091", "LOT-PCB-094", "TX-2026-041", "TX-2026-042"],
            "time_range": "Last 7 Days (Historical Window)",
            "material": "Printed Circuit Boards (PCB)",
            "location": "Guntur & Vijayawada Cluster",
            "relevant_quantities": {
                "inflow_rate_kg_day": 42.5,
                "current_recycler_capacity_kg_day": 30.0,
                "capacity_utilization_pct": 141.6,
                "pending_unprocessed_kg": 86.0
            },
            "calculation_rule": "Inflow (42.5 kg/day) > Configured Capacity (30.0 kg/day) for > 48 consecutive hours.",
            "why_this_action": [
                "GreenTech E-Waste Hub has 450 kg/month available CPCB authorized capacity for PCB waste",
                "Distance from collection consolidation point is 8.4 km (well within regional dispatch threshold)",
                "Splitting lots avoids recycler bottleneck without adding transit penalty"
            ],
            "alternatives_evaluated": [
                {"option": "Maintain current single recycler assignment", "risk": "Estimated 4-day processing backlog and demurrage", "score": "POOR"},
                {"option": "Reallocate 8 lots to GreenTech E-Waste Hub", "risk": "Zero penalty; balanced load", "score": "OPTIMAL"}
            ]
        }

        rec1_counterfactual = {
            "current_system": {
                "pending_lots": 18,
                "avg_processing_delay_hours": 52.0,
                "capacity_pressure_index": "HIGH (141%)"
            },
            "simulated_system": {
                "pending_lots": 6,
                "avg_processing_delay_hours": 14.5,
                "capacity_pressure_index": "NORMAL (68%)"
            },
            "potential_difference": {
                "backlog_reduction_lots": -12,
                "turnaround_improvement_hours": -37.5,
                "capacity_headroom_kg": "+360 kg"
            },
            "notes": "Calculated scenario based on currently active collector volume and configured recycler limits. Not a guaranteed forecast."
        }

        rec2_evidence = {
            "records_used": ["LOT-CBL-102", "LOT-CBL-105", "LOT-CPR-108", "LOT-CBL-110", "LOT-CPR-112", "LOT-CBL-115"],
            "time_range": "Today (Active Dispatch Queue)",
            "material": "Cable & Copper Wire",
            "location": "Guntur Central Urban Zone",
            "relevant_quantities": {
                "lot_count": 6,
                "total_weight_kg": 31.4,
                "cluster_radius_km": 3.2,
                "separate_dispatch_distance_km": 38.6,
                "batched_route_distance_km": 14.1
            },
            "calculation_rule": "Geographic proximity <= 4.0 km AND Hazard compatibility match AND Total batch weight <= 250 kg van limit.",
            "why_this_action": [
                "All 6 lots verified as non-hazardous copper cables and wire harness",
                "Consolidation into 1 trip saves an estimated 24.5 km of intra-city transport",
                "Recycler destination facility has intake window open today from 14:00 to 18:00"
            ],
            "alternatives_evaluated": [
                {"option": "6 independent collector handovers", "impact": "6 separate dispatches, high logistics overhead", "score": "SUBOPTIMAL"},
                {"option": "Consolidated Batch #014 route", "impact": "Single vehicle dispatch, synchronized intake", "score": "OPTIMAL"}
            ]
        }

        rec2_counterfactual = {
            "current_system": {
                "individual_trips_required": 6,
                "total_distance_km": 38.6,
                "completion_window_hours": 12.0
            },
            "simulated_system": {
                "individual_trips_required": 1,
                "total_distance_km": 14.1,
                "completion_window_hours": 3.5
            },
            "potential_difference": {
                "dispatches_saved": 5,
                "distance_reduction_km": -24.5,
                "completion_time_saved_hours": -8.5
            },
            "notes": "Calculated batch routing model. Not guaranteed traffic conditions."
        }

        rec3_evidence = {
            "records_used": ["REG-AP-ZONE-4", "COLL-104", "COLL-109", "LOT-IT-077", "LOT-IT-079"],
            "time_range": "Last 14 Days",
            "material": "IT Hardware & Mobile Devices",
            "location": "Tenali Industrial Corridor",
            "relevant_quantities": {
                "informal_scavenging_reports": 14,
                "registered_lots": 3,
                "formalization_ratio_pct": 21.4,
                "estimated_unformalized_tonnes": 1.2
            },
            "calculation_rule": "Collection density index >= 0.70 but Formal handover ratio < 0.30.",
            "why_this_action": [
                "Tenali corridor demonstrates high informal scrap activity with low authorized recycler linkages",
                "Aggregated mobile/IT batches fetch ~22% higher fair-price payout when formalized through RecycLink",
                "CPCB certified dismantler EcoCycle has expressed intake interest for bulk IT equipment"
            ],
            "alternatives_evaluated": [
                {"option": "Passive observation", "risk": "Continued informal acid leaching or unregulated dumping", "score": "UNSAFE"},
                {"option": "Deploy Community Collection Drive + on-site digital weighing", "risk": "Formalizes up to 1.2T e-waste safely", "score": "HIGH_IMPACT"}
            ]
        }

        rec3_counterfactual = {
            "current_system": {
                "formal_handover_rate_pct": 21.4,
                "unregulated_disposal_risk_kg": 950.0
            },
            "simulated_system": {
                "formal_handover_rate_pct": 74.0,
                "unregulated_disposal_risk_kg": 210.0
            },
            "potential_difference": {
                "formalization_lift_pct": "+52.6%",
                "toxic_leakage_prevented_kg": "-740 kg"
            },
            "notes": "Model projection based on historical collection drive conversion rates in Guntur hub."
        }

        sample_recs = [
            (
                "REC-2026-001",
                "PCB Recycler Capacity Allocation & Load Balancing",
                "CAPACITY_PRESSURE",
                "HIGH",
                "GENERATED",
                "PCB",
                18,
                86.0,
                rec2_id,
                rec2_name,
                "PCB supply inflow (42.5 kg/day) is outpacing configured single-recycler intake (30 kg/day). Available capacity at EcoCycle is at 94% ceiling.",
                "Prevents 48h processing backlog and distributes intake evenly between 2 certified recyclers.",
                "Authorize allocation of 8 pending PCB lots to GreenTech E-Waste Hub facility.",
                json.dumps(rec1_evidence),
                json.dumps(rec1_counterfactual),
                None,
                None,
                now - timedelta(hours=3),
                now - timedelta(hours=1),
                None, None, None
            ),
            (
                "REC-2026-002",
                "Consolidated Pickup Batch #014 (Cables & Wire Scrap)",
                "PICKUP_BATCH",
                "MEDIUM",
                "GENERATED",
                "Cables",
                6,
                31.4,
                rec1_id,
                rec1_name,
                "6 verified non-hazardous cable lots are co-located within 3.2 km radius in Guntur Central. Separate dispatches represent unnecessary logistics friction.",
                "Consolidates 6 individual collector pickups into 1 multi-stop dispatch route, reducing transit distance by 24.5 km.",
                "Accept and dispatch Consolidated Route #014 to EcoCycle Logistics Van #2.",
                json.dumps(rec2_evidence),
                json.dumps(rec2_counterfactual),
                None,
                None,
                now - timedelta(hours=5),
                now - timedelta(hours=2),
                None, None, None
            ),
            (
                "REC-2026-003",
                "Formalization Gap Intervention: Tenali Industrial Corridor",
                "FORMALIZATION_GAP",
                "HIGH",
                "GENERATED",
                "IT Devices",
                12,
                142.0,
                rec1_id,
                rec1_name,
                "High informal aggregation activity observed with low formal platform onboarding in Tenali Zone. Informal disposal risk high.",
                "Onboards an estimated 14 informal collectors and secures ~1.2 tonnes of IT e-waste into verifiable trace passports.",
                "Schedule a 1-day RecycLink Onboarding & Fair-Price Spot Collection Drive in Tenali.",
                json.dumps(rec3_evidence),
                json.dumps(rec3_counterfactual),
                None,
                None,
                now - timedelta(days=1),
                now - timedelta(hours=8),
                None, None, None
            )
        ]

        cur.executemany("""
            INSERT INTO intelligence_recommendations (
                recommendation_code, title, category, priority, status,
                material, affected_lots_count, affected_weight_kg,
                target_recycler_id, target_recycler_name, reason,
                expected_effect, recommended_action, evidence_json,
                counterfactual_json, admin_id, admin_notes,
                created_at, reviewed_at, resolved_at, executed_at, verified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_recs)
        conn.commit()
        print(f"  Inserted {len(sample_recs)} baseline recommendations.")

    # 5. Seed initial Decision History if empty
    cur.execute("SELECT count(*) FROM decision_history")
    dh_count = cur.fetchone()[0]
    if dh_count == 0:
        print("  Seeding initial decision history records...")
        past_decisions = [
            (
                None,
                "REC-2026-000",
                admin_id,
                admin_name,
                "ACCEPTED",
                "Approved Batch Pickup #012 for 8 mixed battery & cable lots",
                json.dumps({
                    "lots": ["LOT-BAT-009", "LOT-CBL-011"],
                    "reason": "Intra-zone logistics batching",
                    "timestamp": (now - timedelta(days=2)).isoformat()
                }),
                now - timedelta(days=2),
                "SUCCESS",
                "COMPLETED",
                "Pickup executed by EcoCycle Logistics. All 8 trace passports updated to IN_TRANSIT with verified chain-of-custody.",
                now - timedelta(days=2)
            ),
            (
                None,
                "REC-2026-000B",
                admin_id,
                admin_name,
                "ACCEPTED",
                "Reassigned 4 Lead-Acid battery lots from overloaded Hub #1 to GreenTech Authorized Dismantler",
                json.dumps({
                    "hazardous_flag": True,
                    "target_capacity_headroom": "120 kg",
                    "timestamp": (now - timedelta(days=1)).isoformat()
                }),
                now - timedelta(days=1),
                "SUCCESS",
                "VERIFIED",
                "Material received safely at CPCB registered processing facility. Form 6 manifest auto-generated.",
                now - timedelta(days=1)
            )
        ]
        cur.executemany("""
            INSERT INTO decision_history (
                recommendation_id, recommendation_code, admin_id, admin_name,
                decision, action_taken, evidence_reference, decision_time,
                execution_result, outcome_status, outcome_notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, past_decisions)
        conn.commit()
        print(f"  Inserted {len(past_decisions)} decision history audit logs.")

    # 6. Seed initial Trace Alerts if empty
    cur.execute("SELECT count(*) FROM trace_alerts")
    alert_count = cur.fetchone()[0]
    if alert_count == 0:
        print("  Seeding baseline traceability alerts...")
        # Check an existing trace_id from trace_events if possible
        cur.execute("SELECT trace_id FROM trace_events LIMIT 1")
        existing_trace = cur.fetchone()
        sample_trace_id = existing_trace[0] if existing_trace else "RC-2026-000241"

        sample_trace_alerts = [
            (
                sample_trace_id,
                "PICKUP_SCHEDULED",
                "STALLED_PICKUP",
                "HIGH",
                38.5,
                f"Lot associated with trace {sample_trace_id} has been in PICKUP_SCHEDULED for 38.5 hours (configured SLA limit: 24h).",
                "Review driver route status or reassign to backup logistics partner.",
                "OPEN",
                now - timedelta(hours=38),
                None
            ),
            (
                "RC-2026-000189",
                "MATCHED",
                "HANDOVER_DELAY",
                "MEDIUM",
                29.0,
                "Offer accepted by recycler 29 hours ago, but digital handover OTP verification remains pending.",
                "Send proactive SMS & in-app reminder to recycler intake supervisor.",
                "OPEN",
                now - timedelta(hours=29),
                None
            ),
            (
                "RC-2026-000142",
                "IN_TRANSIT",
                "INCOMPLETE_EVIDENCE",
                "LOW",
                16.0,
                "Consignment marked in transit without GPS waypoint checkpoint ping in the last 4 hours.",
                "Request driver telemetry refresh via PWA sync client.",
                "RESOLVED",
                now - timedelta(hours=20),
                now - timedelta(hours=2)
            )
        ]
        cur.executemany("""
            INSERT INTO trace_alerts (
                trace_id, current_stage, alert_type, severity,
                pending_duration_hours, description, recommended_action,
                status, created_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_trace_alerts)
        conn.commit()
        print(f"  Inserted {len(sample_trace_alerts)} trace alerts.")

    conn.close()
    print(f"[Phase 11 Migration] Finished migration for {db_path}.")

if __name__ == "__main__":
    migrate_database_phase11()
