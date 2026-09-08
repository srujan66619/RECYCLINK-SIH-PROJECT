import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.handover import HandoverRecord
from app.models.anomaly_alert import AnomalyAlert
from app.models.audit_log import AuditLog
from app.models.trace_event import TraceStage
from app.services.trace_service import TraceService
from app.utils.ids import generate_handover_id
from app.traceability.qr_generator import generate_qr_data_url

logger = logging.getLogger(__name__)

class HandoverService:
    @staticmethod
    def create_or_verify_handover(
        db: Session,
        lot_id: Optional[Any] = None,
        transaction_id: Optional[int] = None,
        final_weight: float = 0.0,
        final_price: float = 0.0,
        condition: Optional[str] = None,
        notes: Optional[str] = None,
        photo: Optional[str] = None,
        current_user: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Executes formal digital handover verification:
        - Calibrated scale reconciliation
        - Weight variance detection (>25% triggers SCALE_WEIGHT_MISMATCH anomaly)
        - Digital Handover Record creation (HR-YYYY-XXXXXX)
        - Trace event chain emission (HANDOVER_VERIFIED -> FINAL_WEIGHT_RECORDED -> FINAL_PRICE_RECORDED)
        """
        lot: Optional[EWasteLot] = None
        txn: Optional[Transaction] = None

        if lot_id is not None:
            # Handle numeric ID or code string (LOT-..., RC-...)
            if isinstance(lot_id, int) or (isinstance(lot_id, str) and lot_id.isdigit()):
                lot = db.query(EWasteLot).filter(EWasteLot.id == int(lot_id)).first()
            if not lot and isinstance(lot_id, str):
                lot = db.query(EWasteLot).filter(
                    (EWasteLot.lot_id == lot_id) | (EWasteLot.trace_id == lot_id)
                ).first()

        if transaction_id is not None:
            txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
            if txn and not lot:
                lot = txn.lot

        if not lot and txn:
            lot = txn.lot

        if not lot and not txn:
            raise HTTPException(status_code=404, detail="E-Waste Lot or Transaction not found for handover verification.")

        # Ensure transaction exists
        if not txn and lot:
            txn = db.query(Transaction).filter(Transaction.lot_id == lot.id).first()
            if not txn:
                # Create transaction on the fly for accepted lot
                recycler_id = None
                if current_user and hasattr(current_user, "recycler_profile") and current_user.recycler_profile:
                    recycler_id = current_user.recycler_profile.id
                txn = Transaction(
                    lot_id=lot.id,
                    collector_id=lot.collector_id,
                    recycler_id=recycler_id or 1,
                    agreed_price_per_kg=round(final_price / max(final_weight, 0.1), 2),
                    total_amount=final_price,
                    final_weight=final_weight,
                    status=TransactionStatus.ACCEPTED.value
                )
                db.add(txn)
                db.commit()
                db.refresh(txn)

        initial_weight = lot.estimated_weight if lot else (txn.final_weight or 1.0)
        variance_pct = 0.0
        if initial_weight > 0:
            variance_pct = round(((final_weight - initial_weight) / initial_weight) * 100.0, 2)

        discrepancy_flagged = abs(variance_pct) > 25.0

        if discrepancy_flagged:
            alert = AnomalyAlert(
                transaction_id=txn.id if txn else None,
                lot_id=lot.id if lot else None,
                alert_type="SCALE_WEIGHT_MISMATCH",
                severity="WARNING" if abs(variance_pct) <= 40.0 else "CRITICAL",
                description=(
                    f"⚠ SCALE WEIGHT VARIANCE: Calibrated scale weight of {final_weight} kg diverges by "
                    f"{variance_pct}% from initial intake estimate of {initial_weight} kg."
                ),
                deviation_pct=abs(variance_pct),
                benchmark_value=initial_weight,
                actual_value=final_weight,
                status="OPEN"
            )
            db.add(alert)
            logger.warning(f"[HandoverService] Flagged weight mismatch anomaly for lot {lot.id if lot else txn.id}: {variance_pct}%")

        # Generate unique Handover ID (HR-YYYY-XXXXXX)
        handover_code = generate_handover_id(db)

        # Check if handover record already exists for transaction
        existing_hr = db.query(HandoverRecord).filter(HandoverRecord.transaction_id == txn.id).first()
        if existing_hr:
            existing_hr.handover_id = existing_hr.handover_id or handover_code
            existing_hr.lot_id = lot.id if lot else txn.lot_id
            existing_hr.recycler_id = txn.recycler_id
            existing_hr.collector_id = txn.collector_id
            existing_hr.initial_weight = initial_weight
            existing_hr.final_weight = final_weight
            existing_hr.verified_weight = final_weight
            existing_hr.weight_discrepancy_pct = variance_pct
            existing_hr.quoted_price = lot.quoted_price if lot else None
            existing_hr.final_price = final_price
            existing_hr.final_amount_paid = final_price
            existing_hr.final_rate_per_kg = round(final_price / max(final_weight, 0.1), 2)
            existing_hr.handover_photo = photo or existing_hr.handover_photo
            existing_hr.photo_proof_url = photo or existing_hr.photo_proof_url
            existing_hr.evidence_photo = photo or existing_hr.evidence_photo
            existing_hr.status = "DISCREPANCY_FLAGGED" if discrepancy_flagged else "VERIFIED"
            existing_hr.notes = notes or existing_hr.notes
            existing_hr.remarks = notes or existing_hr.remarks
            hr_record = existing_hr
        else:
            hr_record = HandoverRecord(
                handover_id=handover_code,
                transaction_id=txn.id,
                lot_id=lot.id if lot else txn.lot_id,
                recycler_id=txn.recycler_id,
                collector_id=txn.collector_id,
                material_name=lot.material_name if lot else "E-Waste",
                initial_weight=initial_weight,
                final_weight=final_weight,
                verified_weight=final_weight,
                weight_discrepancy_pct=variance_pct,
                quoted_price=lot.quoted_price if lot else None,
                final_price=final_price,
                final_amount_paid=final_price,
                final_rate_per_kg=round(final_price / max(final_weight, 0.1), 2),
                handover_photo=photo,
                photo_proof_url=photo,
                evidence_photo=photo,
                handover_location=lot.location_address if lot else "Authorized Recycler Facility",
                status="DISCREPANCY_FLAGGED" if discrepancy_flagged else "VERIFIED",
                notes=notes,
                remarks=notes,
                collector_confirmation=True,
                verified_by=current_user.full_name if current_user else "Authorized Recycler Agent"
            )
            db.add(hr_record)

        # Update lot & txn statuses
        if lot:
            lot.final_weight = final_weight
            lot.final_price = final_price
            lot.status = LotStatus.HANDOVER_VERIFIED.value
        
        txn.final_weight = final_weight
        txn.total_amount = final_price
        txn.status = TransactionStatus.HANDED_OVER.value

        db.commit()
        db.refresh(hr_record)

        # Emit Trace Events (with SHA-256 hash chaining)
        actor_name = current_user.full_name if (current_user and current_user.full_name) else "GreenLoop Recycling"
        actor_id = current_user.id if current_user else None

        # 1. HANDOVER_VERIFIED
        TraceService.record_event(
            db=db,
            lot_id=lot.id if lot else txn.lot_id,
            trace_id=lot.trace_id if lot else None,
            stage=TraceStage.HANDOVER_VERIFIED.value,
            title="Physical Handover & Scale Reconciled",
            description=(
                f"Digital handover confirmed. Verified weight: {final_weight} kg "
                f"(variance: {variance_pct:+.1f}%). Handover Record: {hr_record.handover_id}."
            ),
            actor_role="RECYCLER",
            actor_name=actor_name,
            actor_id=actor_id,
            location=hr_record.handover_location,
            evidence_url=photo,
            metadata_json={
                "handover_id": hr_record.handover_id,
                "initial_weight": initial_weight,
                "final_weight": final_weight,
                "variance_pct": variance_pct,
                "discrepancy_flagged": discrepancy_flagged
            },
            validate_sequence=False
        )

        # 2. FINAL_WEIGHT_RECORDED
        TraceService.record_event(
            db=db,
            lot_id=lot.id if lot else txn.lot_id,
            trace_id=lot.trace_id if lot else None,
            stage=TraceStage.FINAL_WEIGHT_RECORDED.value,
            title="Final Scale Weight Recorded",
            description=f"Calibrated scale weight locked at {final_weight} kg for payout settlement.",
            actor_role="RECYCLER",
            actor_name=actor_name,
            actor_id=actor_id,
            location=hr_record.handover_location,
            metadata_json={"final_weight_kg": final_weight},
            validate_sequence=False
        )

        # 3. FINAL_PRICE_RECORDED
        TraceService.record_event(
            db=db,
            lot_id=lot.id if lot else txn.lot_id,
            trace_id=lot.trace_id if lot else None,
            stage=TraceStage.FINAL_PRICE_RECORDED.value,
            title="Final Settlement Price Reconciled",
            description=f"Final transaction value calculated and locked at ₹{final_price:.2f}.",
            actor_role="RECYCLER",
            actor_name=actor_name,
            actor_id=actor_id,
            location=hr_record.handover_location,
            metadata_json={"final_price_inr": final_price},
            validate_sequence=False
        )

        # Audit Log
        audit = AuditLog(
            user_id=current_user.id if current_user else None,
            action="HANDOVER_VERIFIED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            old_value=str({"status": txn.status, "weight": initial_weight}),
            new_value=str({
                "handover_id": hr_record.handover_id,
                "status": "HANDED_OVER",
                "final_weight": final_weight,
                "final_price": final_price,
                "variance_pct": variance_pct
            })
        )
        db.add(audit)
        db.commit()

        trace_id = lot.trace_id if lot else f"RC-2026-{txn.id:06d}"
        lot_code = lot.lot_id if lot else f"LOT-2026-{txn.id:06d}"

        return {
            "handover_id": hr_record.handover_id,
            "trace_id": trace_id,
            "lot_id": lot_code,
            "status": hr_record.status,
            "initial_weight": initial_weight,
            "final_weight": final_weight,
            "variance_pct": variance_pct,
            "discrepancy_flagged": discrepancy_flagged,
            "quoted_price": lot.quoted_price if lot else None,
            "final_price": final_price,
            "receipt_url": f"/trace/{trace_id}",
            "created_at": hr_record.created_at.isoformat() if hr_record.created_at else datetime.utcnow().isoformat()
        }

    @staticmethod
    def get_handover_record(db: Session, handover_identifier: str) -> Dict[str, Any]:
        """
        Retrieves digital handover record by handover_id (HR-2026-XXXXXX) or transaction ID.
        """
        hr = None
        if handover_identifier.startswith("HR-"):
            hr = db.query(HandoverRecord).filter(HandoverRecord.handover_id == handover_identifier).first()
        elif handover_identifier.isdigit():
            hr = db.query(HandoverRecord).filter(
                (HandoverRecord.id == int(handover_identifier)) | 
                (HandoverRecord.transaction_id == int(handover_identifier))
            ).first()

        if not hr:
            raise HTTPException(status_code=404, detail=f"Digital Handover Record '{handover_identifier}' not found.")

        txn = hr.transaction
        lot = txn.lot if txn else None
        trace_id = lot.trace_id if lot else (f"RC-2026-{txn.id:06d}" if txn else "RC-UNKNOWN")
        lot_id = lot.lot_id if lot else (f"LOT-2026-{txn.id:06d}" if txn else "LOT-UNKNOWN")
        material = lot.material_name if lot else hr.material_name or "E-Waste"
        recycler_name = txn.recycler.facility_name if (txn and txn.recycler) else "Authorized Formal Recycler"

        return {
            "handover_id": hr.handover_id or f"HR-2026-{hr.id:06d}",
            "trace_id": trace_id,
            "lot_id": lot_id,
            "material": material,
            "initial_weight": hr.initial_weight,
            "final_weight": hr.final_weight or hr.verified_weight,
            "weight_variance_pct": hr.weight_discrepancy_pct,
            "quoted_price": hr.quoted_price or (lot.quoted_price if lot else None),
            "final_price": hr.final_price or hr.final_amount_paid,
            "recycler": {
                "name": recycler_name,
                "authorization_status": "VERIFIED_DEMO"
            },
            "status": hr.status or "VERIFIED",
            "handover_timestamp": hr.handover_timestamp.isoformat() if hr.handover_timestamp else None,
            "notes": hr.notes or hr.remarks,
            "evidence_photo": hr.evidence_photo or hr.handover_photo,
            "qr_code_base64": generate_qr_data_url(trace_id)
        }
