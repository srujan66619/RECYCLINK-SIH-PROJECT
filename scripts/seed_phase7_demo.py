import sys
import os
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database.session import SessionLocal
from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.collector import CollectorProfile
from app.models.recycler import RecyclerProfile
from app.models.material import MaterialCategory
from app.models.transaction import Transaction, TransactionStatus
from app.models.handover import HandoverRecord
from app.models.trace_event import TraceEvent, TraceStage
from app.services.trace_service import TraceService
from app.traceability.qr_generator import generate_qr_data_url

def seed_canonical_demo_lot():
    db = SessionLocal()
    try:
        print("[Phase 7 Seeder] Seeding canonical Hackathon Demo Lot RC-2026-000241...")

        # Find or create collector
        collector = db.query(CollectorProfile).first()
        if not collector:
            print("  No collector found! Please run main seeder first.")
            return

        # Find or create recycler
        recycler = db.query(RecyclerProfile).filter(RecyclerProfile.facility_name.ilike("%Green%")).first()
        if not recycler:
            recycler = db.query(RecyclerProfile).first()

        # Find PCB material
        material = db.query(MaterialCategory).filter(MaterialCategory.code.ilike("%PCB%")).first()

        trace_id = "RC-2026-000241"
        lot_id = "LOT-2026-000241"
        handover_id = "HR-2026-000241"

        # Check if already exists
        existing_lot = db.query(EWasteLot).filter(EWasteLot.trace_id == trace_id).first()
        if existing_lot:
            print(f"  Lot {trace_id} already exists (ID: {existing_lot.id}). Re-creating cleanly for exact demo.")
            # Delete old trace events, handovers, transactions for this lot
            db.query(TraceEvent).filter(TraceEvent.lot_id == existing_lot.id).delete()
            if existing_lot.transaction:
                db.query(HandoverRecord).filter(HandoverRecord.transaction_id == existing_lot.transaction.id).delete()
                db.delete(existing_lot.transaction)
            db.delete(existing_lot)
            db.commit()

        base_time = datetime.utcnow() - timedelta(hours=8)

        # 1. Create canonical EWasteLot
        lot = EWasteLot(
            lot_id=lot_id,
            trace_id=trace_id,
            collector_id=collector.id,
            material_id=material.id if material else None,
            material_name="Printed Circuit Board (PCB)",
            subcategory="Server Grade Motherboard",
            estimated_weight=2.4,
            final_weight=2.3,
            estimated_price_min=420.0,
            estimated_price_max=510.0,
            recommended_price=480.0,
            quoted_price=480.0,
            final_price=475.0,
            condition="Standard Scrap - Grade A",
            location_address=f"{collector.area or 'Begumpet'}, {collector.city or 'Hyderabad'}",
            location_lat=17.4442,
            location_lng=78.4682,
            ai_confidence=0.965,
            hazard_level="MEDIUM",
            status=LotStatus.COMPLETED.value,
            qr_code_url=generate_qr_data_url(trace_id),
            created_at=base_time
        )
        db.add(lot)
        db.commit()
        db.refresh(lot)

        # 2. Create Transaction
        txn = Transaction(
            lot_id=lot.id,
            collector_id=collector.id,
            recycler_id=recycler.id if recycler else 1,
            agreed_price_per_kg=200.0,
            final_weight=2.3,
            total_amount=475.0,
            payment_status="PAID",
            payment_method="UPI Instant Transfer (Demo)",
            payment_ref="UPI-20260907-000241",
            scheduled_pickup_time=base_time + timedelta(hours=3),
            status=TransactionStatus.COMPLETED.value,
            created_at=base_time + timedelta(hours=2)
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        # 3. Create HandoverRecord
        handover = HandoverRecord(
            handover_id=handover_id,
            transaction_id=txn.id,
            lot_id=lot.id,
            recycler_id=txn.recycler_id,
            collector_id=collector.id,
            material_name="Printed Circuit Board (PCB)",
            initial_weight=2.4,
            final_weight=2.3,
            verified_weight=2.3,
            weight_discrepancy_pct=-4.17,
            quoted_price=480.0,
            final_price=475.0,
            final_amount_paid=475.0,
            final_rate_per_kg=206.52,
            handover_location="Industrial Area Yard #4, Hyderabad",
            status="VERIFIED",
            handover_timestamp=base_time + timedelta(hours=5),
            recycler_digital_signature=f"SIG-CPCB-AUTH2026-{recycler.id if recycler else 1}",
            collector_confirmation=True,
            notes="Physical calibrated dual-scale reconciliation complete. Variance: -4.17% (within normal limits). Paid via instant UPI.",
            remarks="Verified by authorized recycler logistics team.",
            created_at=base_time + timedelta(hours=5)
        )
        db.add(handover)
        db.commit()

        # 4. Generate 13 Canonical Chronological Trace Events with SHA-256 Hash Chaining
        events_spec = [
            (
                TraceStage.LOT_CREATED.value,
                "E-Waste Intake & Lot Created",
                "Informal collection intake registered by verified collector in Begumpet, Hyderabad.",
                "COLLECTOR",
                collector.user.full_name if (collector.user and collector.user.full_name) else "Ramesh Kumar",
                base_time
            ),
            (
                TraceStage.COLLECTED.value,
                "Material Aggregated at Local Hub",
                "Door-to-door e-waste intake verified and packaged for inspection.",
                "COLLECTOR",
                collector.user.full_name if (collector.user and collector.user.full_name) else "Ramesh Kumar",
                base_time + timedelta(minutes=15)
            ),
            (
                TraceStage.AI_IDENTIFIED.value,
                "AI Vision Prototype Classification",
                "Prototype AI classified material as High-Grade Server PCB (96.5% confidence). Recoverable: Au, Ag, Cu.",
                "SYSTEM_AI",
                "RECYCLINK AI Prototype Vision Engine",
                base_time + timedelta(minutes=30)
            ),
            (
                TraceStage.PRICE_ESTIMATED.value,
                "CPCB FairPrice Index Baseline",
                "Open pricing engine matched CPCB benchmark rate of ₹200.0/kg. Recommended fair value: ₹480.00.",
                "SYSTEM",
                "CPCB FairPrice Valuation Guardian",
                base_time + timedelta(minutes=45)
            ),
            (
                TraceStage.OFFER_RECEIVED.value,
                "Authorized Recycler Offer Submitted",
                f"{recycler.facility_name if recycler else 'GreenLoop Recycling'} submitted acquisition bid of ₹480.00 (100% of benchmark).",
                "RECYCLER",
                recycler.facility_name if recycler else "GreenLoop Recycling",
                base_time + timedelta(hours=1, minutes=30)
            ),
            (
                TraceStage.ACCEPTED.value,
                "Collector Accepted Recycler Bid",
                "Collector accepted formal recycling offer. Custody transfer initiated.",
                "COLLECTOR",
                collector.user.full_name if (collector.user and collector.user.full_name) else "Ramesh Kumar",
                base_time + timedelta(hours=2)
            ),
            (
                TraceStage.PICKUP_SCHEDULED.value,
                "Logistics Pickup Scheduled",
                "GPS-monitored zero-emission logistics carrier scheduled for physical pickup window (09:00 - 12:00).",
                "RECYCLER",
                recycler.facility_name if recycler else "GreenLoop Logistics",
                base_time + timedelta(hours=3)
            ),
            (
                TraceStage.PICKUP_STARTED.value,
                "Logistics Carrier Dispatched",
                "Electric collection vehicle dispatched to informal collection point.",
                "RECYCLER",
                "GreenLoop Logistics Fleet",
                base_time + timedelta(hours=3, minutes=45)
            ),
            (
                TraceStage.PICKUP_ARRIVED.value,
                "Carrier Arrived at Intake Point",
                "Logistics carrier arrived at collection consolidation point in Hyderabad.",
                "RECYCLER",
                "GreenLoop Field Agent",
                base_time + timedelta(hours=4, minutes=30)
            ),
            (
                TraceStage.HANDOVER_VERIFIED.value,
                "Physical Handover & Calibrated Scale Reconciliation",
                "Physical custody transferred. Certified scale verified: 2.3 kg vs 2.4 kg estimate (variance: -4.17%). Handover Record: HR-2026-000241.",
                "RECYCLER",
                recycler.facility_name if recycler else "GreenLoop Recycling",
                base_time + timedelta(hours=5)
            ),
            (
                TraceStage.FINAL_WEIGHT_RECORDED.value,
                "Calibrated Scale Weight Finalized",
                "Final settlement weight registered and sealed at 2.3 kg.",
                "RECYCLER",
                recycler.facility_name if recycler else "GreenLoop Recycling",
                base_time + timedelta(hours=5, minutes=5)
            ),
            (
                TraceStage.FINAL_PRICE_RECORDED.value,
                "Final Settlement Price Reconciled",
                "Final transaction value calculated and locked at ₹475.00.",
                "RECYCLER",
                recycler.facility_name if recycler else "GreenLoop Recycling",
                base_time + timedelta(hours=5, minutes=10)
            ),
            (
                TraceStage.PAYMENT_COMPLETED.value,
                "Instant Digital Payment Disbursed",
                "Full settlement ₹475.00 disbursed via instant UPI (Ref: UPI-20260907-000241). Payment Status: PAID.",
                "SYSTEM",
                "RECYCLINK Payout Gateway (Demo)",
                base_time + timedelta(hours=5, minutes=15)
            ),
            (
                TraceStage.TRANSACTION_COMPLETED.value,
                "Formal Recycling Chain Ingestion Complete",
                "E-waste lot sealed into authorized zero-landfill hydrometallurgical recycling stream. Circular chain complete.",
                "RECYCLER",
                recycler.facility_name if recycler else "GreenLoop Recycling",
                base_time + timedelta(hours=6)
            )
        ]

        prev_hash = None
        for stage, title, desc, role, actor_name, ts in events_spec:
            payload = {
                "lot_id": lot.id,
                "trace_id": trace_id,
                "stage": stage,
                "event_type": stage,
                "actor_role": role,
                "actor_id": None,
                "title": title,
                "description": desc,
                "timestamp": ts.isoformat()
            }
            curr_hash = TraceService.calculate_event_hash(payload, prev_hash)
            event = TraceEvent(
                lot_id=lot.id,
                trace_id=trace_id,
                event_type=stage,
                stage=stage,
                event_status="COMPLETED",
                title=title,
                description=desc,
                actor_role=role,
                actor_name=actor_name,
                location=lot.location_address,
                event_timestamp=ts,
                timestamp=ts,
                previous_event_hash=prev_hash,
                event_hash=curr_hash,
                created_at=ts
            )
            db.add(event)
            db.commit()
            prev_hash = curr_hash

        # Verify integrity
        integrity = TraceService.verify_event_integrity(trace_id, db)
        print(f"[Phase 7 Seeder] Canonical lot {trace_id} seeded! Integrity Status: {integrity['status']} ({integrity['events_checked']} events checked).")

        # Also backfill any remaining unhashed lots
        backfilled = TraceService.backfill_trace_hashes(db)
        print(f"[Phase 7 Seeder] Backfilled {backfilled} trace events across database.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_canonical_demo_lot()
