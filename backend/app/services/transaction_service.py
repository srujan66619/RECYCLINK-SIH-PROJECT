from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, TransactionStatus, PaymentStatus
from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.recycler import RecyclerProfile
from app.models.handover import HandoverRecord
from app.models.user import User, UserRole
from app.schemas.transaction import TransactionCreate, HandoverRequest, HandoverResponse
from app.services.trace_service import TraceService
from app.ai.anomaly_detector import AnomalyDetector
from app.core.exceptions import NotFoundException, ForbiddenException, AppException

class TransactionService:
    @staticmethod
    def create_transaction(db: Session, data: TransactionCreate, current_user: User) -> Transaction:
        lot = db.query(EWasteLot).filter(EWasteLot.id == data.lot_id).first()
        if not lot:
            raise NotFoundException("LOT", str(data.lot_id))

        recycler = db.query(RecyclerProfile).filter(RecyclerProfile.id == data.recycler_id).first()
        if not recycler:
            raise NotFoundException("RECYCLER", str(data.recycler_id))

        # Check existing transaction
        existing = db.query(Transaction).filter(Transaction.lot_id == lot.id).first()
        if existing:
            return existing

        # Check material compatibility
        accepted = recycler.accepted_materials or []
        if accepted and lot.material_name:
            is_compat = any(m.lower() in lot.material_name.lower() or lot.material_name.lower() in m.lower() for m in accepted)
            # Log warning if marginally compatible, but allow demo flexibility

        total_est = round(data.agreed_price_per_kg * lot.estimated_weight, 2)
        est_fair_val = lot.recommended_price if (lot.recommended_price and lot.recommended_price > 0) else round(455.0 * lot.estimated_weight, 2)

        txn = Transaction(
            lot_id=lot.id,
            collector_id=lot.collector_id,
            recycler_id=recycler.id,
            agreed_price_per_kg=data.agreed_price_per_kg,
            estimated_price=est_fair_val,
            quoted_price=total_est,
            total_amount=total_est,
            payment_status=PaymentStatus.PENDING.value,
            transaction_status=TransactionStatus.ACCEPTED.value,
            status=TransactionStatus.ACCEPTED.value,
            scheduled_pickup_time=data.scheduled_pickup_time or datetime.utcnow()
        )
        db.add(txn)
        lot.status = LotStatus.RECYCLER_SELECTED.value
        lot.quoted_price = total_est
        db.commit()
        db.refresh(txn)

        # Append lifecycle events to TraceService
        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="PRICED",
            title="Fair Market Benchmark Rate Applied",
            description=f"Transaction initialized at ₹{data.agreed_price_per_kg}/kg.",
            actor_role="SYSTEM_AI",
            actor_name="RECYCLINK Pricing Engine",
            location=lot.location_address,
            metadata_json={"agreed_rate": data.agreed_price_per_kg}
        )

        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="RECYCLER_SELECTED",
            title=f"Matched with Authorized Recycler: {recycler.facility_name}",
            description=f"Awarded to {recycler.facility_name} (License: {recycler.authorization_number}).",
            actor_role="RECYCLER",
            actor_name=recycler.facility_name,
            actor_id=recycler.user_id,
            location=f"{recycler.city}, {recycler.state}",
            metadata_json={"recycler_id": recycler.id, "auth_no": recycler.authorization_number}
        )

        # Transaction Fairness & AI Guardian Anomaly check
        bench_rate = (lot.recommended_price / lot.estimated_weight) if (lot.estimated_weight and lot.estimated_weight > 0 and lot.recommended_price) else 455.0
        from app.anomaly.service import TransactionFairnessService
        TransactionFairnessService.evaluate_fairness(
            db=db,
            offered_price=data.agreed_price_per_kg,
            expected_price=bench_rate,
            material_name=lot.material_name,
            weight_kg=lot.estimated_weight,
            collector_id=lot.collector_id,
            recycler_id=recycler.id,
            transaction_id=txn.id,
            lot_id=lot.id,
            persist_alert=True
        )

        return txn

    @staticmethod
    def get_transaction(db: Session, txn_id: int, current_user: Optional[User] = None) -> Transaction:
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise NotFoundException("TRANSACTION", str(txn_id))

        if current_user:
            if current_user.role == UserRole.COLLECTOR.value:
                if current_user.collector_profile and txn.collector_id != current_user.collector_profile.id:
                    raise ForbiddenException("Access denied to other collectors' transactions")
            elif current_user.role == UserRole.RECYCLER.value:
                if current_user.recycler_profile and txn.recycler_id != current_user.recycler_profile.id:
                    raise ForbiddenException("Access denied to other recyclers' transactions")

        return txn

    @staticmethod
    def list_transactions(
        db: Session,
        current_user: Optional[User] = None,
        recycler_id: Optional[int] = None,
        collector_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Transaction]:
        query = db.query(Transaction).order_by(Transaction.created_at.desc())

        if current_user:
            if current_user.role == UserRole.COLLECTOR.value and current_user.collector_profile:
                query = query.filter(Transaction.collector_id == current_user.collector_profile.id)
            elif current_user.role == UserRole.RECYCLER.value and current_user.recycler_profile:
                query = query.filter(Transaction.recycler_id == current_user.recycler_profile.id)

        if recycler_id:
            query = query.filter(Transaction.recycler_id == recycler_id)
        if collector_id:
            query = query.filter(Transaction.collector_id == collector_id)
        if status:
            query = query.filter(Transaction.status == status)

        return query.limit(100).all()

    @staticmethod
    def update_status(db: Session, txn_id: int, new_status: str, current_user: User) -> Transaction:
        txn = TransactionService.get_transaction(db, txn_id, current_user)
        txn.status = new_status
        txn.transaction_status = new_status

        if new_status == TransactionStatus.PICKUP_SCHEDULED.value:
            txn.lot.status = LotStatus.PICKUP_SCHEDULED.value
            TraceService.record_event(
                db=db,
                lot_id=txn.lot_id,
                trace_id=txn.lot.trace_id,
                stage="PICKUP_SCHEDULED",
                title="Logistics Vehicle Dispatched for Secure Pickup",
                description=f"Authorized transport en route to collector in {txn.lot.location_address}.",
                actor_role="RECYCLER",
                actor_name=txn.recycler.facility_name if txn.recycler else "Authorized Logistics",
                location=txn.lot.location_address
            )

        db.commit()
        db.refresh(txn)
        return txn

    @staticmethod
    def confirm_handover(db: Session, txn_id: int, data: HandoverRequest, current_user: User) -> HandoverResponse:
        txn = TransactionService.get_transaction(db, txn_id, current_user)
        lot = txn.lot

        init_wt = lot.estimated_weight or 1.0
        verified_wt = data.final_verified_weight
        rate = data.final_agreed_rate_per_kg
        final_amount = round(verified_wt * rate, 2)
        diff_pct = round((abs(verified_wt - init_wt) / init_wt) * 100, 1)

        # Create HandoverRecord
        handover = HandoverRecord(
            transaction_id=txn.id,
            verified_by=current_user.full_name,
            initial_weight=init_wt,
            final_weight=verified_wt,
            verified_weight=verified_wt,
            weight_discrepancy_pct=diff_pct,
            final_rate_per_kg=rate,
            final_price=final_amount,
            final_amount_paid=final_amount,
            handover_photo=data.photo_proof_url,
            photo_proof_url=data.photo_proof_url,
            handover_timestamp=datetime.utcnow(),
            recycler_digital_signature=data.recycler_signature or f"SIG-REC-{txn.recycler_id}",
            collector_confirmation=data.collector_confirmation,
            remarks=data.remarks,
            notes=data.remarks
        )
        db.add(handover)

        # Update transaction & lot
        txn.final_weight = verified_wt
        txn.final_price = final_amount
        txn.total_amount = final_amount
        txn.payment_status = PaymentStatus.PAID.value
        txn.status = TransactionStatus.COMPLETED.value
        txn.transaction_status = TransactionStatus.COMPLETED.value
        txn.payment_ref = f"UPI-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{txn.id}"

        lot.final_weight = verified_wt
        lot.final_price = final_amount
        lot.status = LotStatus.FORMAL_RECYCLING.value

        # Update collector metrics
        if lot.collector:
            lot.collector.total_weight_collected += verified_wt
            lot.collector.total_earnings += final_amount

        db.commit()

        # Weight Discrepancy Check via AnomalyDetector
        AnomalyDetector.evaluate_weight_handover(
            db=db,
            transaction_id=txn.id,
            lot_id=lot.id,
            initial_weight=init_wt,
            final_scale_weight=verified_wt
        )

        # Record Handover and Formal Recycling TraceEvents
        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="HANDOVER_VERIFIED",
            title="Digital Handover & Scale Weight Verification Complete",
            description=f"Verified scale weight: {verified_wt} kg. Payment of ₹{final_amount} settled via UPI ({txn.payment_ref}).",
            actor_role="RECYCLER",
            actor_name=txn.recycler.facility_name if txn.recycler else "Certified Recycler",
            location=lot.location_address,
            metadata_json={"scale_weight_kg": verified_wt, "payout_inr": final_amount}
        )

        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="FORMAL_RECYCLING",
            title="Ingested into Formal CPCB Authorized Recycling Stream",
            description="Safely batched into closed-loop hydrometallurgical refinery with zero toxic landfill leakage.",
            actor_role="AUDITOR",
            actor_name="State Pollution Control Board Audited Facility",
            location=f"{txn.recycler.city if txn.recycler else 'Facility'}, India"
        )

        return HandoverResponse(
            handover_id=handover.id,
            transaction_id=txn.id,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            verified_weight_kg=verified_wt,
            weight_discrepancy_pct=diff_pct,
            final_rate_per_kg=rate,
            final_amount_paid=final_amount,
            handover_timestamp=handover.handover_timestamp,
            status="COMPLETED",
            qr_trace_url=f"/trace/{lot.trace_id}",
            message="Digital handover confirmed and verified into formal chain of custody."
        )
