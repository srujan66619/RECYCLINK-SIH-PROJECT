import sqlite3
import os
import json
from datetime import datetime, timedelta

def migrate_database_phase12(db_path: str = "recyclink.db"):
    if not os.path.exists(db_path):
        print(f"[Phase 12 Migration] Database {db_path} not found. Skipping.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print(f"[Phase 12 Migration] Checking Phase 12 schema for {db_path}...")

    # 1. Create disputes table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS disputes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dispute_code VARCHAR(50) UNIQUE NOT NULL,
            transaction_id INTEGER,
            lot_id INTEGER,
            trace_id VARCHAR(100),
            raised_by_user_id INTEGER NOT NULL,
            raised_by_role VARCHAR(50) DEFAULT 'COLLECTOR',
            dispute_type VARCHAR(50) DEFAULT 'WEIGHT_DISCREPANCY',
            status VARCHAR(50) DEFAULT 'DISPUTE_CREATED',
            title VARCHAR(255) NOT NULL,
            claim_description TEXT NOT NULL,
            claimed_value FLOAT,
            recorded_value FLOAT,
            evidence_package_json TEXT,
            ai_dispute_summary TEXT,
            resolution_notes TEXT,
            resolved_by_admin_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id),
            FOREIGN KEY (lot_id) REFERENCES e_waste_lots(id),
            FOREIGN KEY (raised_by_user_id) REFERENCES users(id),
            FOREIGN KEY (resolved_by_admin_id) REFERENCES users(id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_disputes_code ON disputes(dispute_code)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_disputes_status ON disputes(status)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_disputes_trace ON disputes(trace_id)")

    # 2. Create participant_trust_profiles table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS participant_trust_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            role VARCHAR(50) NOT NULL,
            trust_score FLOAT DEFAULT 85.0,
            trust_tier VARCHAR(30) DEFAULT 'ESTABLISHED',
            completed_transactions_count INTEGER DEFAULT 0,
            traceability_completeness_pct FLOAT DEFAULT 100.0,
            successful_handovers_count INTEGER DEFAULT 0,
            cancellation_rate_pct FLOAT DEFAULT 0.0,
            dispute_count INTEGER DEFAULT 0,
            verification_status VARCHAR(50) DEFAULT 'VERIFIED',
            safety_compliance_pct FLOAT DEFAULT 100.0,
            trust_breakdown_json TEXT,
            last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_trust_user_id ON participant_trust_profiles(user_id)")

    # 3. Create incentive_records table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS incentive_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incentive_code VARCHAR(50) UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            user_role VARCHAR(50) DEFAULT 'COLLECTOR',
            incentive_type VARCHAR(50) DEFAULT 'POINTS',
            title VARCHAR(200) NOT NULL,
            value FLOAT DEFAULT 0.0,
            badge_name VARCHAR(100),
            trigger_event VARCHAR(100) NOT NULL,
            why_earned TEXT NOT NULL,
            status VARCHAR(30) DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_incentives_code ON incentive_records(incentive_code)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_incentives_user_id ON incentive_records(user_id)")

    # 4. Create institutional_partners table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS institutional_partners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            partner_code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            partner_type VARCHAR(50) DEFAULT 'MUNICIPALITY',
            service_area VARCHAR(255) NOT NULL,
            city VARCHAR(100) DEFAULT 'Hyderabad',
            state VARCHAR(100) DEFAULT 'Telangana',
            contact_person VARCHAR(100),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(20),
            verification_status VARCHAR(50) DEFAULT 'ACTIVE',
            material_capabilities VARCHAR(255) DEFAULT 'PCB, Batteries, Cables, IT Hardware',
            total_formalized_kg FLOAT DEFAULT 0.0,
            active_campaigns_count INTEGER DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_partners_code ON institutional_partners(partner_code)")

    # 5. Create policy_rules table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS policy_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_key VARCHAR(100) UNIQUE NOT NULL,
            policy_category VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            value_type VARCHAR(20) DEFAULT 'FLOAT',
            current_value VARCHAR(255) NOT NULL,
            default_value VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            description TEXT,
            version INTEGER DEFAULT 1,
            updated_by_admin_id INTEGER,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_policy_key ON policy_rules(policy_key)")

    # 6. Create policy_versions table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS policy_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_key VARCHAR(100) NOT NULL,
            previous_value VARCHAR(255),
            new_value VARCHAR(255) NOT NULL,
            version INTEGER NOT NULL,
            reason TEXT,
            changed_by_admin_name VARCHAR(100) DEFAULT 'Admin Authority',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_policy_version_key ON policy_versions(policy_key)")

    # 7. Create operational_incidents table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS operational_incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_code VARCHAR(50) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            incident_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) DEFAULT 'MEDIUM',
            status VARCHAR(30) DEFAULT 'DETECTED',
            playbook_applied VARCHAR(100),
            affected_entities TEXT,
            evidence_text TEXT,
            mitigation_steps TEXT,
            post_incident_learning TEXT,
            assigned_to VARCHAR(100) DEFAULT 'Regional Operations Lead',
            detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_incidents_code ON operational_incidents(incident_code)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_incidents_status ON operational_incidents(status)")

    conn.commit()

    now = datetime.utcnow()

    # Find collector user and recycler user
    cur.execute("SELECT id FROM users WHERE role = 'COLLECTOR' LIMIT 1")
    coll_row = cur.fetchone()
    collector_user_id = coll_row[0] if coll_row else 1

    cur.execute("SELECT id FROM users WHERE role = 'RECYCLER' LIMIT 1")
    rec_row = cur.fetchone()
    recycler_user_id = rec_row[0] if rec_row else 2

    cur.execute("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
    adm_row = cur.fetchone()
    admin_user_id = adm_row[0] if adm_row else 1

    # Find sample lot and transaction
    cur.execute("SELECT id, trace_id FROM e_waste_lots LIMIT 1")
    lot_row = cur.fetchone()
    sample_lot_id, sample_trace_id = lot_row if lot_row else (1, "RC-2026-000241")

    cur.execute("SELECT id FROM transactions LIMIT 1")
    txn_row = cur.fetchone()
    sample_txn_id = txn_row[0] if txn_row else 1

    # Seed baseline Disputes if empty
    cur.execute("SELECT count(*) FROM disputes")
    if cur.fetchone()[0] == 0:
        print("  Seeding baseline disputes...")
        evidence_pkg_1 = {
            "trace_id": sample_trace_id,
            "lot_id": f"LOT-{sample_lot_id}",
            "material": "Printed Circuit Boards (PCB)",
            "collector_estimated_weight": 15.0,
            "recycler_scale_weight": 12.6,
            "variance_kg": -2.4,
            "variance_pct": -16.0,
            "scale_calibration_cert": "CERT-IND-WEIGH-2026-882 (Valid through Nov 2026)",
            "ai_vision_confidence": 0.94,
            "handover_timestamp": (now - timedelta(hours=22)).isoformat(),
            "scale_tare_photo": "evidence_scale_zeroed.jpg",
            "audit_trail_events": [
                "2026-10-02 09:30: Lot created with estimated weight 15.0 kg",
                "2026-10-02 14:15: Pickup completed by Van #2",
                "2026-10-02 16:40: Digital scale at EcoCycle recorded 12.6 kg",
                "2026-10-02 16:45: Discrepancy flagged: variance exceeds 10% threshold"
            ]
        }

        sample_disputes = [
            (
                "DISP-2026-001",
                sample_txn_id,
                sample_lot_id,
                sample_trace_id,
                collector_user_id,
                "COLLECTOR",
                "WEIGHT_DISCREPANCY",
                "UNDER_REVIEW",
                "Weight Discrepancy on Motherboard Lot",
                "Collector estimated 15.0 kg using manual spring scale; Recycler digital weighbridge recorded 12.6 kg (-2.4 kg difference).",
                15.0,
                12.6,
                json.dumps(evidence_pkg_1),
                "Discrepancy of 2.4 kg (-16.0%) between field estimate (15.0 kg) and calibrated facility weighbridge (12.6 kg). Recycler digital scale certification verified valid within 7 days. Possible tare deduction for wooden casing.",
                None,
                None,
                now - timedelta(hours=20),
                now - timedelta(hours=2),
                None
            ),
            (
                "DISP-2026-002",
                sample_txn_id,
                sample_lot_id,
                sample_trace_id,
                recycler_user_id,
                "RECYCLER",
                "MATERIAL_CLASSIFICATION",
                "DISPUTE_CREATED",
                "Cable Scrap Insulation Grade Disagreement",
                "Consignment marked as Pure Copper Wire Grade A contains ~25% aluminium core wiring.",
                510.0,
                380.0,
                json.dumps({
                    "material_declared": "Pure Copper Cable (Grade A)",
                    "material_received": "Mixed Copper/Aluminium Harness",
                    "spark_test_result": "Aluminium present in sub-bundle 3 of 4",
                    "price_impact": "₹130/kg differential"
                }),
                "Recycler intake inspection reports alloy mixture in cable lot. Spectrometric verification strip photo uploaded. Discrepancy in benchmark price of ₹130/kg.",
                None,
                None,
                now - timedelta(hours=6),
                now - timedelta(hours=1),
                None
            )
        ]
        cur.executemany("""
            INSERT INTO disputes (
                dispute_code, transaction_id, lot_id, trace_id,
                raised_by_user_id, raised_by_role, dispute_type, status,
                title, claim_description, claimed_value, recorded_value,
                evidence_package_json, ai_dispute_summary, resolution_notes,
                resolved_by_admin_id, created_at, updated_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_disputes)
        conn.commit()
        print(f"  Inserted {len(sample_disputes)} baseline disputes.")

    # Seed baseline Participant Trust Profiles if empty
    cur.execute("SELECT count(*) FROM participant_trust_profiles")
    if cur.fetchone()[0] == 0:
        print("  Seeding baseline trust profiles...")
        coll_breakdown = {
            "positive_factors": [
                {"factor": "Traceability Completeness", "score": "+40 pts", "detail": "98% of lots have complete 14-stage lifecycle"},
                {"factor": "Successful Handovers", "score": "+35 pts", "detail": "42 dual-OTP verified handovers without fraud"},
                {"factor": "Safety Compliance", "score": "+17.4 pts", "detail": "Zero acid-leaching or hazardous burning flags"}
            ],
            "negative_factors": [
                {"factor": "Active Disputes", "score": "-0 pts", "detail": "1 pending weight review (non-penalizing)"}
            ],
            "governance_note": "Score calculated purely from operational data. Zero demographic or personal scoring inputs."
        }

        rec_breakdown = {
            "positive_factors": [
                {"factor": "Intake Accuracy", "score": "+45 pts", "detail": "Calibrated digital scales with CPCB validation"},
                {"factor": "Fair-Price Adherence", "score": "+30 pts", "detail": "Offers align with CPCB benchmark matrix within 5%"},
                {"factor": "Prompt Payout", "score": "+13 pts", "detail": "Instant UPI reconciliation in < 15 minutes"}
            ],
            "negative_factors": [
                {"factor": "Capacity Pressure", "score": "-5 pts", "detail": "Intake saturation exceeding 85% ceiling"}
            ],
            "governance_note": "Score reflects logistics and processing reliability."
        }

        sample_trust = [
            (
                collector_user_id,
                "COLLECTOR",
                92.4,
                "EXEMPLARY",
                42,
                98.0,
                42,
                0.0,
                1,
                "VERIFIED",
                100.0,
                json.dumps(coll_breakdown),
                now,
                now - timedelta(days=60)
            ),
            (
                recycler_user_id,
                "RECYCLER",
                88.0,
                "ESTABLISHED",
                148,
                94.5,
                142,
                2.1,
                2,
                "VERIFIED",
                98.0,
                json.dumps(rec_breakdown),
                now,
                now - timedelta(days=90)
            )
        ]
        cur.executemany("""
            INSERT INTO participant_trust_profiles (
                user_id, role, trust_score, trust_tier,
                completed_transactions_count, traceability_completeness_pct,
                successful_handovers_count, cancellation_rate_pct, dispute_count,
                verification_status, safety_compliance_pct, trust_breakdown_json,
                last_calculated_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_trust)
        conn.commit()
        print(f"  Inserted {len(sample_trust)} trust profiles.")

    # Seed baseline Incentive Records if empty
    cur.execute("SELECT count(*) FROM incentive_records")
    if cur.fetchone()[0] == 0:
        print("  Seeding baseline incentives...")
        sample_incentives = [
            (
                "INC-2026-001",
                collector_user_id,
                "COLLECTOR",
                "POINTS",
                "High-Grade PCB Purity Milestone",
                250.0,
                "E-Waste Champion",
                "TRACEABILITY_COMPLIANCE",
                "Completed 10 consecutive PCB consignments with zero contamination and 100% digital trace compliance.",
                "ACTIVE",
                now - timedelta(days=5)
            ),
            (
                "INC-2026-002",
                collector_user_id,
                "COLLECTOR",
                "BADGE",
                "Safe Battery Handling Accreditation",
                0.0,
                "Hazard Safety Certified",
                "SAFE_HANDOVER",
                "Completed sand-drum lithium battery handling verification with no terminal short-circuit risks.",
                "ACTIVE",
                now - timedelta(days=12)
            ),
            (
                "INC-2026-003",
                collector_user_id,
                "COLLECTOR",
                "COMMUNITY_REWARD",
                "Tenali Corridor Collection Drive Reward",
                500.0,
                "Community Green Leader",
                "CAMPAIGN_PARTICIPATION",
                "Formalized 142 kg of informal e-waste during the Tenali Urban Formalization Campaign.",
                "ACTIVE",
                now - timedelta(days=1)
            )
        ]
        cur.executemany("""
            INSERT INTO incentive_records (
                incentive_code, user_id, user_role, incentive_type,
                title, value, badge_name, trigger_event, why_earned,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_incentives)
        conn.commit()
        print(f"  Inserted {len(sample_incentives)} incentive records.")

    # Seed baseline Institutional Partners if empty
    cur.execute("SELECT count(*) FROM institutional_partners")
    if cur.fetchone()[0] == 0:
        print("  Seeding baseline institutional partners...")
        sample_partners = [
            (
                "INST-2026-01",
                "Greater Hyderabad Municipal Corporation (GHMC) - Ward 12",
                "MUNICIPALITY",
                "Hyderabad Central Hub",
                "Hyderabad",
                "Telangana",
                "Shri K. Venkatesh (Superintending Engineer)",
                "ghmc.ward12.sanitation@telangana.gov.in",
                "+91-40-23456789",
                "ACTIVE",
                "PCB, Batteries, Mixed Small Appliances",
                4850.0,
                2,
                "Municipal ward partner with 14 designated e-waste drop-off kiosks.",
                now - timedelta(days=120),
                now
            ),
            (
                "INST-2026-02",
                "JNTU University E-Waste Circular Research Hub",
                "EDUCATIONAL",
                "Kukatpally Academic Zone",
                "Hyderabad",
                "Telangana",
                "Dr. P. Rajeshwar Rao",
                "ewaste.initiative@jntuh.ac.in",
                "+91-40-23158661",
                "ACTIVE",
                "Laptops, Server Blades, Telecom Scrap",
                1420.0,
                1,
                "Student collection drive host and material characterization partner.",
                now - timedelta(days=90),
                now
            ),
            (
                "INST-2026-03",
                "Wipro Hyderabad Green Campus Taskforce",
                "CORPORATE",
                "Gachibowli IT Corridor",
                "Hyderabad",
                "Telangana",
                "Ms. Shalini Murthy",
                "sustainability.hyd@wipro.com",
                "+91-40-39100000",
                "ACTIVE",
                "IT Assets, Monitors, Lithium UPS Packs",
                3180.0,
                1,
                "Corporate bulk asset formalization partner with zero-landfill mandate.",
                now - timedelta(days=60),
                now
            ),
            (
                "INST-2026-04",
                "Vriksha Environmental Action NGO",
                "NGO",
                "Guntur Urban & Tenali Belt",
                "Guntur",
                "Andhra Pradesh",
                "A. Srinivasa Rao",
                "contact@vriksha-ngo.org",
                "+91-863-2233445",
                "ACTIVE",
                "Informal Kabadiwala Onboarding & Safety Drums",
                950.0,
                1,
                "Grassroots informal collector welfare and digital literacy outreach.",
                now - timedelta(days=45),
                now
            )
        ]
        cur.executemany("""
            INSERT INTO institutional_partners (
                partner_code, name, partner_type, service_area, city, state,
                contact_person, contact_email, contact_phone, verification_status,
                material_capabilities, total_formalized_kg, active_campaigns_count,
                notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_partners)
        conn.commit()
        print(f"  Inserted {len(sample_partners)} institutional partners.")

    # Seed baseline Policy Rules if empty
    cur.execute("SELECT count(*) FROM policy_rules")
    if cur.fetchone()[0] == 0:
        print("  Seeding baseline policy rules...")
        sample_rules = [
            (
                "TRUST_HANDOVER_WEIGHT",
                "TRUST",
                "Handover Verification Trust Weight",
                "FLOAT",
                "0.35",
                "0.35",
                "weight (0-1)",
                "Weight of dual-OTP successful handovers in dynamic participant trust calculation.",
                1,
                admin_user_id,
                now
            ),
            (
                "TRUST_TRACEABILITY_WEIGHT",
                "TRUST",
                "Traceability Completeness Trust Weight",
                "FLOAT",
                "0.30",
                "0.30",
                "weight (0-1)",
                "Weight of 14-stage journey completeness in participant trust score.",
                1,
                admin_user_id,
                now
            ),
            (
                "CAPACITY_THRESHOLD_PCT",
                "CAPACITY",
                "Recycler Intake Saturation Threshold",
                "FLOAT",
                "85.0",
                "85.0",
                "%",
                "Intake capacity utilization percentage above which a recycler is flagged in CAPACITY_PRESSURE.",
                1,
                admin_user_id,
                now
            ),
            (
                "SLA_PICKUP_HOURS",
                "OPERATIONAL",
                "Maximum Pickup Dispatch SLA",
                "FLOAT",
                "24.0",
                "24.0",
                "hours",
                "Maximum permissible duration in PICKUP_SCHEDULED before triggering a trace delay alert.",
                1,
                admin_user_id,
                now
            ),
            (
                "INCENTIVE_POINTS_PER_KG",
                "INCENTIVE",
                "Base Formalization Points Multiplier",
                "FLOAT",
                "5.0",
                "5.0",
                "pts/kg",
                "Standard reward points awarded to verified collectors per kg of formalized e-waste.",
                1,
                admin_user_id,
                now
            ),
            (
                "ANOMALY_PRICE_DEVIATION_PCT",
                "OPERATIONAL",
                "Price Fairness Anomaly Ceiling",
                "FLOAT",
                "40.0",
                "40.0",
                "%",
                "Deviation percentage from CPCB fair price benchmark triggering predatory pricing flags.",
                1,
                admin_user_id,
                now
            )
        ]
        cur.executemany("""
            INSERT INTO policy_rules (
                policy_key, policy_category, name, value_type,
                current_value, default_value, unit, description,
                version, updated_by_admin_id, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_rules)
        conn.commit()

        # Seed initial Policy Versions
        policy_versions = [
            (r[0], None, r[4], 1, "Initial baseline policy established for Phase 12 deployment.", "Admin Authority", now)
            for r in sample_rules
        ]
        cur.executemany("""
            INSERT INTO policy_versions (
                policy_key, previous_value, new_value, version,
                reason, changed_by_admin_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, policy_versions)
        conn.commit()
        print(f"  Inserted {len(sample_rules)} policy rules and versions.")

    # Seed baseline Operational Incidents if empty
    cur.execute("SELECT count(*) FROM operational_incidents")
    if cur.fetchone()[0] == 0:
        print("  Seeding baseline operational incidents...")
        sample_incidents = [
            (
                "INC-OPS-2026-01",
                "PCB Inflow Saturation at EcoCycle Primary Facility",
                "CAPACITY_CRISIS",
                "HIGH",
                "MITIGATED",
                "Capacity Pressure Response Playbook",
                "18 collection lots (86.0 kg PCB scrap), EcoCycle Solutions",
                "EcoCycle monthly intake reached 94.4% saturation. Queue turnaround stretched to 38.5 hours.",
                "1. Activated Capacity Pressure Playbook\n2. Generated recommendation REC-2026-001\n3. Admin authorized rebalancing of 8 lots to GreenTech Hub\n4. Dispatch routes re-synchronized",
                "Secondary facility failover rules must trigger automatically at 85% capacity rather than waiting for 90% saturation.",
                "Regional Logistics Coordinator",
                now - timedelta(days=2),
                now - timedelta(hours=18)
            ),
            (
                "INC-OPS-2026-02",
                "Guntur Central Pickup Cluster Logistics Queue Backlog",
                "PICKUP_BACKLOG",
                "MEDIUM",
                "RESOLVED",
                "Logistics Batching Playbook",
                "6 cable lots (31.4 kg), 6 informal collectors",
                "Independent pickup requests caused vehicle dispatch bottleneck in central urban ward.",
                "Consolidated dispatches into Batch #014 multi-stop route, saving 24.5 km of transit and resolving queue in 3.5 hours.",
                "PWA client now clusters lots on map before allowing individual pickup requests.",
                "Guntur Fleet Supervisor",
                now - timedelta(days=1),
                now - timedelta(hours=8)
            )
        ]
        cur.executemany("""
            INSERT INTO operational_incidents (
                incident_code, title, incident_type, severity, status,
                playbook_applied, affected_entities, evidence_text,
                mitigation_steps, post_incident_learning, assigned_to,
                detected_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_incidents)
        conn.commit()
        print(f"  Inserted {len(sample_incidents)} operational incidents.")

    conn.close()
    print(f"[Phase 12 Migration] Finished migration for {db_path}.")

if __name__ == "__main__":
    migrate_database_phase12()
