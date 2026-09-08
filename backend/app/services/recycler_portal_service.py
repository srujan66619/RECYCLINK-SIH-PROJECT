import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models.user import User, UserRole
from app.models.recycler import RecyclerProfile, AuthorizationStatus
from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.transaction import Transaction, TransactionStatus, PaymentStatus
from app.models.handover import HandoverRecord
from app.models.pickup_record import PickupRecord, PickupStatus
from app.models.trace_event import TraceEvent, TraceStage
from app.models.audit_log import AuditLog
from app.models.material import MaterialCategory
from app.schemas.recycler_portal import (
    RecyclerDashboardStats, RecyclerIncomingLotOut, RecyclerLotDetailOut,
    RecyclerOfferSubmit, RecyclerOfferUpdate, RecyclerOfferResponse,
    RecyclerPickupCreate, RecyclerPickupStatusUpdate, PickupRecordOut,
    HandoverVerifyDetail, HandoverVerifySubmit, HandoverVerifyResult,
    PaymentStatusUpdateReq, RecyclerProfileUpdateReq
)
from app.services.trace_service import TraceService
from app.anomaly.service import TransactionFairnessService
from app.ai.anomaly_detector import AnomalyDetector
from app.pricing.market_analyzer import MarketAnalyzer
from app.core.exceptions import NotFoundException, ForbiddenException, AppException

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class RecyclerPortalService:

    # State Machine Validation Table
    VALID_STATUS_TRANSITIONS = {
        TransactionStatus.INITIATED.value: [
            TransactionStatus.OFFER_RECEIVED.value,
            TransactionStatus.ACCEPTED.value,
            TransactionStatus.REJECTED.value,
            TransactionStatus.CANCELLED.value
        ],
        TransactionStatus.OFFER_RECEIVED.value: [
            TransactionStatus.ACCEPTED.value,
            TransactionStatus.REJECTED.value,
            TransactionStatus.OFFER_RECEIVED.value,
            TransactionStatus.CANCELLED.value
        ],
        TransactionStatus.ACCEPTED.value: [
            TransactionStatus.PICKUP_SCHEDULED.value,
            TransactionStatus.HANDOVER_VERIFICATION.value,
            TransactionStatus.HANDED_OVER.value,
            TransactionStatus.CANCELLED.value
        ],
        TransactionStatus.PICKUP_SCHEDULED.value: [
            TransactionStatus.PICKUP_IN_PROGRESS.value,
            TransactionStatus.HANDOVER_VERIFICATION.value,
            TransactionStatus.HANDED_OVER.value,
            TransactionStatus.PICKUP_SCHEDULED.value,
            TransactionStatus.CANCELLED.value
        ],
        TransactionStatus.PICKUP_IN_PROGRESS.value: [
            TransactionStatus.HANDOVER_VERIFICATION.value,
            TransactionStatus.HANDED_OVER.value,
            TransactionStatus.PICKUP_SCHEDULED.value,
            TransactionStatus.CANCELLED.value
        ],
        TransactionStatus.HANDOVER_VERIFICATION.value: [
            TransactionStatus.HANDED_OVER.value,
            TransactionStatus.COMPLETED.value
        ],
        TransactionStatus.HANDED_OVER.value: [
            TransactionStatus.PAYMENT_PENDING.value,
            TransactionStatus.COMPLETED.value
        ],
        TransactionStatus.PAYMENT_PENDING.value: [
            TransactionStatus.COMPLETED.value
        ],
        TransactionStatus.COMPLETED.value: [],
        TransactionStatus.REJECTED.value: [
            TransactionStatus.OFFER_RECEIVED.value
        ],
        TransactionStatus.CANCELLED.value: []
    }

    @staticmethod
    def _validate_transition(current_status: str, target_status: str):
        allowed = RecyclerPortalService.VALID_STATUS_TRANSITIONS.get(current_status, [])
        if target_status not in allowed and target_status != current_status:
            raise AppException(
                status_code=400,
                code="INVALID_STATE_TRANSITION",
                message=f"Invalid transaction transition from '{current_status}' to '{target_status}'. Allowed transitions: {allowed or 'None (terminal state)'}."
            )

    @staticmethod
    def _log_audit(
        db: Session,
        user_id: Optional[int],
        action: str,
        entity_type: str,
        entity_id: str,
        details: str,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None
    ):
        try:
            log = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id),
                old_value=old_value,
                new_value=new_value,
                details=details,
                timestamp=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            db.add(log)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[AUDIT_ERROR] Failed to record audit log: {e}")

    @staticmethod
    def _get_recycler_profile(db: Session, current_user: User) -> RecyclerProfile:
        if current_user.role != UserRole.RECYCLER.value:
            raise ForbiddenException("Access restricted strictly to registered authorized recyclers.")
        
        prof = current_user.recycler_profile
        if not prof:
            prof = db.query(RecyclerProfile).filter(RecyclerProfile.user_id == current_user.id).first()
        if not prof:
            # Fallback to first recycler if demo user missing profile link
            prof = db.query(RecyclerProfile).first()
        if not prof:
            raise NotFoundException("RECYCLER_PROFILE", f"User {current_user.id}")
        return prof

    @classmethod
    def get_dashboard(cls, db: Session, current_user: User) -> RecyclerDashboardStats:
        recycler = cls._get_recycler_profile(db, current_user)
        accepted_materials = recycler.accepted_materials or ["PCB", "Cable", "Battery", "LCD", "CRT", "Motor"]

        # 1. Incoming available lots matching materials
        # Eligible lot statuses for initial acquisition
        eligible_statuses = [
            LotStatus.DRAFT.value,
            LotStatus.IDENTIFIED.value,
            LotStatus.PRICE_ESTIMATED.value,
            LotStatus.PRICED.value,
            "NEW",
            "CREATED",
            LotStatus.RECYCLER_SELECTED.value,
            LotStatus.OFFER_RECEIVED.value
        ]
        incoming_lots_query = db.query(EWasteLot).filter(
            EWasteLot.status.in_(eligible_statuses)
        )
        all_incoming = incoming_lots_query.all()
        matching_incoming = [
            lot for lot in all_incoming
            if not lot.transaction or lot.transaction.recycler_id == recycler.id
        ]
        incoming_count = len(matching_incoming)

        # 2. Pending offers
        pending_offers_count = db.query(Transaction).filter(
            Transaction.recycler_id == recycler.id,
            Transaction.status.in_([TransactionStatus.OFFER_RECEIVED.value, TransactionStatus.INITIATED.value])
        ).count()

        # 3. Accepted lots
        accepted_count = db.query(Transaction).filter(
            Transaction.recycler_id == recycler.id,
            Transaction.status == TransactionStatus.ACCEPTED.value
        ).count()

        # 4. Scheduled pickups
        scheduled_pickups_count = db.query(PickupRecord).filter(
            PickupRecord.recycler_id == recycler.id,
            PickupRecord.status.in_([PickupStatus.SCHEDULED, PickupStatus.IN_PROGRESS])
        ).count()

        # 5. Completed transactions
        completed_txns = db.query(Transaction).filter(
            Transaction.recycler_id == recycler.id,
            Transaction.status == TransactionStatus.COMPLETED.value
        ).all()
        completed_count = len(completed_txns)

        # 6. Aggregate weights & purchase values
        total_weight = sum((t.final_weight or (t.lot.final_weight if t.lot else 0) or (t.lot.estimated_weight if t.lot else 0) or 0) for t in completed_txns)
        total_purchase_val = sum((t.total_amount or t.final_price or 0) for t in completed_txns)

        # Format recent incoming lots (top 5)
        recent_lots = []
        for lot in matching_incoming[:5]:
            dist = haversine_distance(recycler.latitude, recycler.longitude, lot.location_lat or 17.3850, lot.location_lng or 78.4867)
            recent_lots.append({
                "id": lot.id,
                "lot_id": lot.lot_id,
                "trace_id": lot.trace_id,
                "material": lot.material_name,
                "weight_kg": lot.estimated_weight,
                "distance_km": dist,
                "recommended_price": lot.recommended_price or 450.0,
                "status": lot.status,
                "created_at": lot.created_at.isoformat()
            })

        # Today's pickups
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        today_pickups_db = db.query(PickupRecord).filter(
            PickupRecord.recycler_id == recycler.id,
            PickupRecord.scheduled_date >= today_start,
            PickupRecord.scheduled_date < today_end
        ).all()
        
        today_pickups = []
        for p in today_pickups_db:
            today_pickups.append({
                "id": p.id,
                "transaction_id": p.transaction_id,
                "lot_id": p.lot.lot_id if p.lot else "LOT-2026",
                "material": p.lot.material_name if p.lot else "E-Waste",
                "weight_kg": p.lot.estimated_weight if p.lot else 0.0,
                "time_window": p.time_window,
                "status": p.status
            })

        # Recent transactions (top 5)
        recent_txns_db = db.query(Transaction).filter(
            Transaction.recycler_id == recycler.id
        ).order_by(Transaction.created_at.desc()).limit(5).all()

        recent_txns = []
        for t in recent_txns_db:
            recent_txns.append({
                "id": t.id,
                "lot_id": t.lot.lot_id if t.lot else f"LOT-{t.lot_id}",
                "trace_id": t.lot.trace_id if t.lot else f"RC-{t.lot_id}",
                "material": t.lot.material_name if t.lot else "PCB",
                "weight_kg": t.final_weight or (t.lot.estimated_weight if t.lot else 2.0),
                "total_amount": t.total_amount or t.final_price or 0.0,
                "status": t.status,
                "payment_status": t.payment_status,
                "date": t.created_at.strftime("%d %b %Y")
            })

        return RecyclerDashboardStats(
            facility_name=recycler.facility_name,
            authorization_status=recycler.authorization_status,
            authorization_number=recycler.authorization_number,
            reliability_score=recycler.reliability_score or 94.0,
            incoming_lots_count=incoming_count,
            pending_offers_count=pending_offers_count,
            accepted_lots_count=accepted_count,
            scheduled_pickups_count=scheduled_pickups_count,
            completed_transactions_count=completed_count,
            total_weight_kg=round(total_weight, 1),
            total_purchase_value=round(total_purchase_val, 2),
            recent_incoming_lots=recent_lots,
            today_pickups=today_pickups,
            recent_transactions=recent_txns
        )

    @classmethod
    def get_incoming_lots(
        cls,
        db: Session,
        current_user: User,
        material: Optional[str] = None,
        max_distance: Optional[float] = None,
        sort_by: Optional[str] = "distance"
    ) -> List[RecyclerIncomingLotOut]:
        recycler = cls._get_recycler_profile(db, current_user)
        accepted_materials = [m.lower() for m in (recycler.accepted_materials or [])]

        eligible_statuses = [
            LotStatus.DRAFT.value,
            LotStatus.IDENTIFIED.value,
            LotStatus.PRICE_ESTIMATED.value,
            LotStatus.PRICED.value,
            "NEW",
            "CREATED",
            LotStatus.RECYCLER_SELECTED.value,
            LotStatus.OFFER_RECEIVED.value
        ]

        query = db.query(EWasteLot).filter(EWasteLot.status.in_(eligible_statuses))
        if material:
            query = query.filter(EWasteLot.material_name.ilike(f"%{material}%"))

        lots = query.all()
        results: List[RecyclerIncomingLotOut] = []

        for lot in lots:
            # Check existing transaction constraint
            if lot.transaction and lot.transaction.recycler_id != recycler.id and lot.transaction.status not in [TransactionStatus.REJECTED.value, TransactionStatus.CANCELLED.value]:
                continue

            # Calculate distance
            lat = lot.location_lat if lot.location_lat is not None else 17.3850
            lon = lot.location_lng if lot.location_lng is not None else 78.4867
            dist = haversine_distance(recycler.latitude, recycler.longitude, lat, lon)

            if max_distance and dist > max_distance:
                continue

            # Material match check
            is_compat = any(m in (lot.material_name or "").lower() for m in accepted_materials) if accepted_materials else True

            # Recommendation reason
            reason_parts = []
            if is_compat:
                reason_parts.append("Compatible Material")
            if dist <= recycler.service_radius_km:
                reason_parts.append(f"Within Service Radius ({dist} km)")
            else:
                reason_parts.append(f"Regional Logistics ({dist} km)")

            # Resolve coarse location (area / city only — protects collector personal data)
            area = "Industrial Area"
            city = lot.collector.city if (lot.collector and lot.collector.city) else (lot.location.city if lot.location else "Hyderabad")
            if lot.location_address:
                parts = [p.strip() for p in lot.location_address.split(",")]
                if len(parts) >= 2:
                    area = parts[-2]
                elif len(parts) == 1:
                    area = parts[0]

            results.append(RecyclerIncomingLotOut(
                id=lot.id,
                lot_id=lot.lot_id,
                trace_id=lot.trace_id,
                material=lot.material_name,
                subcategory=lot.subcategory,
                weight_kg=lot.estimated_weight,
                collector_area=area,
                collector_city=city,
                ai_estimate_min=lot.estimated_price_min or round((lot.recommended_price or 450.0) * 0.9, 1),
                ai_estimate_max=lot.estimated_price_max or round((lot.recommended_price or 450.0) * 1.15, 1),
                recommended_price=lot.recommended_price or 450.0,
                distance_km=dist,
                status=lot.status,
                created_date=lot.created_at,
                is_recommended=is_compat and dist <= (recycler.service_radius_km * 1.5),
                recommendation_reason=" • ".join(reason_parts)
            ))

        if sort_by == "distance":
            results.sort(key=lambda x: x.distance_km)
        elif sort_by == "weight":
            results.sort(key=lambda x: x.weight_kg, reverse=True)
        elif sort_by == "price":
            results.sort(key=lambda x: x.recommended_price, reverse=True)
        else:
            results.sort(key=lambda x: x.created_date, reverse=True)

        return results

    @classmethod
    def get_lot_detail(cls, db: Session, lot_id_or_pk: str, current_user: User) -> RecyclerLotDetailOut:
        recycler = cls._get_recycler_profile(db, current_user)
        lot = db.query(EWasteLot).filter(
            or_(EWasteLot.id == int(lot_id_or_pk) if lot_id_or_pk.isdigit() else False,
                EWasteLot.lot_id == lot_id_or_pk,
                EWasteLot.trace_id == lot_id_or_pk)
        ).first()

        if not lot:
            raise NotFoundException("LOT", lot_id_or_pk)

        lat = lot.location_lat or 17.3850
        lon = lot.location_lng or 78.4867
        dist = haversine_distance(recycler.latitude, recycler.longitude, lat, lon)

        # Baseline metals & hazard
        recoverable = ["Copper", "Tin"]
        if "pcb" in (lot.material_name or "").lower():
            recoverable = ["Copper", "Gold", "Silver", "Palladium"]
        elif "cable" in (lot.material_name or "").lower():
            recoverable = ["High-purity Copper", "PVC Granules"]
        elif "battery" in (lot.material_name or "").lower():
            recoverable = ["Lithium", "Cobalt", "Nickel", "Copper Foil"]

        # Coarse location
        area = "Local Scrap Hub"
        city = lot.collector.city if lot.collector else "Hyderabad"
        if lot.location_address:
            parts = [p.strip() for p in lot.location_address.split(",")]
            area = parts[-2] if len(parts) >= 2 else parts[0]

        # Check existing transaction / offer
        existing_offer = None
        txn_dict = None
        if lot.transaction:
            txn = lot.transaction
            txn_dict = {
                "id": txn.id,
                "status": txn.status,
                "agreed_price_per_kg": txn.agreed_price_per_kg,
                "total_amount": txn.total_amount,
                "scheduled_pickup_time": txn.scheduled_pickup_time.isoformat() if txn.scheduled_pickup_time else None,
                "payment_status": txn.payment_status
            }
            if txn.recycler_id == recycler.id:
                existing_offer = {
                    "transaction_id": txn.id,
                    "offer_rate": txn.agreed_price_per_kg,
                    "total_val": txn.total_amount,
                    "status": txn.status
                }

        return RecyclerLotDetailOut(
            id=lot.id,
            lot_id=lot.lot_id,
            trace_id=lot.trace_id,
            material_name=lot.material_name,
            subcategory=lot.subcategory,
            photo_url=lot.photo_url,
            estimated_weight=lot.estimated_weight,
            condition=lot.condition or "Standard Scrap",
            ai_classification=lot.material_name,
            ai_confidence=lot.ai_confidence or 0.94,
            ai_confidence_label="Prototype AI Prediction",
            hazard_level=lot.hazard_level or "MEDIUM",
            recoverable_materials=recoverable,
            estimated_price_min=lot.estimated_price_min or round((lot.recommended_price or 450.0) * 0.9, 1),
            estimated_price_max=lot.estimated_price_max or round((lot.recommended_price or 450.0) * 1.15, 1),
            recommended_price=lot.recommended_price or 450.0,
            collector_area=area,
            collector_city=city,
            distance_km=dist,
            status=lot.status,
            created_at=lot.created_at,
            existing_offer=existing_offer,
            transaction=txn_dict
        )

    @classmethod
    def submit_offer(cls, db: Session, data: RecyclerOfferSubmit, current_user: User) -> RecyclerOfferResponse:
        recycler = cls._get_recycler_profile(db, current_user)
        lot = db.query(EWasteLot).filter(
            or_(EWasteLot.id == int(data.lot_id) if data.lot_id.isdigit() else False,
                EWasteLot.lot_id == data.lot_id,
                EWasteLot.trace_id == data.lot_id)
        ).first()

        if not lot:
            raise NotFoundException("LOT", data.lot_id)

        # Check material compatibility
        accepted = [m.lower() for m in (recycler.accepted_materials or [])]
        if accepted and not any(m in (lot.material_name or "").lower() for m in accepted):
            raise AppException(status_code=400, code="INCOMPATIBLE_MATERIAL", message=f"Recycler does not process material '{lot.material_name}'.")

        # 1. Evaluate Offer Fairness vs CPCB Benchmark
        expected_bench = (lot.recommended_price / lot.estimated_weight) if (lot.estimated_weight and lot.estimated_weight > 0 and lot.recommended_price) else 455.0
        fairness_result = TransactionFairnessService.evaluate_fairness(
            db=db,
            offered_price=data.offer_price_per_kg,
            expected_price=expected_bench,
            material_name=lot.material_name,
            weight_kg=lot.estimated_weight,
            collector_id=lot.collector_id,
            recycler_id=recycler.id,
            lot_id=lot.id,
            persist_alert=True
        )

        fairness_tag = "FAIR"
        fairness_warning = None
        if data.offer_price_per_kg >= expected_bench * 0.98:
            fairness_tag = "GOOD OFFER"
        elif data.offer_price_per_kg < expected_bench * 0.70:
            fairness_tag = "BELOW FAIR"
            fairness_warning = "⚠ PRICE CHECK: This offer is significantly below the estimated fair benchmark range."
        elif fairness_result.is_anomaly:
            fairness_tag = "UNUSUAL"
            fairness_warning = f"⚠ PRICE CHECK: {fairness_result.reason}"

        # 2. Update or create transaction record
        total_amount = round(data.offer_price_per_kg * lot.estimated_weight, 2)
        txn = db.query(Transaction).filter(Transaction.lot_id == lot.id).first()

        old_status = txn.status if txn else None
        if not txn:
            txn = Transaction(
                lot_id=lot.id,
                collector_id=lot.collector_id,
                recycler_id=recycler.id,
                agreed_price_per_kg=data.offer_price_per_kg,
                estimated_price=round(expected_bench * lot.estimated_weight, 2),
                quoted_price=total_amount,
                total_amount=total_amount,
                payment_status=PaymentStatus.PENDING.value,
                transaction_status=TransactionStatus.OFFER_RECEIVED.value,
                status=TransactionStatus.OFFER_RECEIVED.value,
                scheduled_pickup_time=data.scheduled_pickup_date
            )
            db.add(txn)
        else:
            if txn.recycler_id != recycler.id and txn.status not in [TransactionStatus.REJECTED.value, TransactionStatus.CANCELLED.value]:
                raise AppException(status_code=400, code="LOT_ENGAGED", message="This lot is currently reserved with another transaction.")
            
            cls._validate_transition(txn.status, TransactionStatus.OFFER_RECEIVED.value)
            txn.recycler_id = recycler.id
            txn.agreed_price_per_kg = data.offer_price_per_kg
            txn.quoted_price = total_amount
            txn.total_amount = total_amount
            txn.status = TransactionStatus.OFFER_RECEIVED.value
            txn.transaction_status = TransactionStatus.OFFER_RECEIVED.value
            if data.scheduled_pickup_date:
                txn.scheduled_pickup_time = data.scheduled_pickup_date

        lot.status = LotStatus.OFFER_RECEIVED.value
        lot.quoted_price = total_amount
        db.commit()
        db.refresh(txn)

        # 3. Record TraceEvent
        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="OFFER_RECEIVED",
            title=f"Formal Recycler Purchase Offer: ₹{data.offer_price_per_kg}/kg",
            description=f"{recycler.facility_name} submitted formal acquisition rate of ₹{data.offer_price_per_kg}/kg (Total: ₹{total_amount}). Tag: {fairness_tag}.",
            actor_role="RECYCLER",
            actor_name=recycler.facility_name,
            actor_id=current_user.id,
            location=f"{recycler.city}, {recycler.state}",
            metadata_json={
                "offer_price_per_kg": data.offer_price_per_kg,
                "fairness_tag": fairness_tag,
                "pickup_available": data.pickup_available
            }
        )

        # 4. Audit Log
        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="OFFER_SUBMITTED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            details=f"Submitted offer ₹{data.offer_price_per_kg}/kg for Lot {lot.lot_id} ({lot.material_name}).",
            old_value={"status": old_status},
            new_value={"status": txn.status, "rate": data.offer_price_per_kg}
        )

        return RecyclerOfferResponse(
            offer_id=txn.id,
            transaction_id=txn.id,
            lot_id=lot.lot_id,
            offer_price_per_kg=data.offer_price_per_kg,
            total_estimated_amount=total_amount,
            fairness_status=fairness_tag,
            fairness_warning=fairness_warning,
            status=txn.status,
            message="Offer successfully transmitted to collector and recorded on audit trail."
        )

    @classmethod
    def accept_lot(cls, db: Session, lot_id_or_pk: str, current_user: User) -> Dict[str, Any]:
        recycler = cls._get_recycler_profile(db, current_user)
        lot = db.query(EWasteLot).filter(
            or_(EWasteLot.id == int(lot_id_or_pk) if lot_id_or_pk.isdigit() else False,
                EWasteLot.lot_id == lot_id_or_pk,
                EWasteLot.trace_id == lot_id_or_pk)
        ).first()

        if not lot:
            raise NotFoundException("LOT", lot_id_or_pk)

        txn = lot.transaction
        if not txn:
            # Create transaction on immediate acceptance
            rate = (lot.recommended_price / lot.estimated_weight) if (lot.estimated_weight and lot.estimated_weight > 0) else 450.0
            tot = round(rate * lot.estimated_weight, 2)
            txn = Transaction(
                lot_id=lot.id,
                collector_id=lot.collector_id,
                recycler_id=recycler.id,
                agreed_price_per_kg=rate,
                estimated_price=tot,
                quoted_price=tot,
                total_amount=tot,
                payment_status=PaymentStatus.PENDING.value,
                transaction_status=TransactionStatus.ACCEPTED.value,
                status=TransactionStatus.ACCEPTED.value
            )
            db.add(txn)
        else:
            cls._validate_transition(txn.status, TransactionStatus.ACCEPTED.value)
            txn.status = TransactionStatus.ACCEPTED.value
            txn.transaction_status = TransactionStatus.ACCEPTED.value
            txn.recycler_id = recycler.id

        lot.status = LotStatus.ACCEPTED.value
        db.commit()
        db.refresh(txn)

        # Trace event
        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="ACCEPTED",
            title=f"Lot Accepted by {recycler.facility_name}",
            description=f"Authorized recycler {recycler.facility_name} accepted lot into formal custody pipeline.",
            actor_role="RECYCLER",
            actor_name=recycler.facility_name,
            actor_id=current_user.id,
            location=f"{recycler.city}, {recycler.state}"
        )

        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="LOT_ACCEPTED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            details=f"Recycler accepted lot {lot.lot_id}"
        )

        return {
            "success": True,
            "lot_id": lot.lot_id,
            "transaction_id": txn.id,
            "status": "ACCEPTED",
            "message": "Lot accepted. Proceed to schedule pickup logistics."
        }

    @classmethod
    def reject_lot(cls, db: Session, lot_id_or_pk: str, current_user: User) -> Dict[str, Any]:
        recycler = cls._get_recycler_profile(db, current_user)
        lot = db.query(EWasteLot).filter(
            or_(EWasteLot.id == int(lot_id_or_pk) if lot_id_or_pk.isdigit() else False,
                EWasteLot.lot_id == lot_id_or_pk,
                EWasteLot.trace_id == lot_id_or_pk)
        ).first()

        if not lot:
            raise NotFoundException("LOT", lot_id_or_pk)

        txn = lot.transaction
        if txn:
            cls._validate_transition(txn.status, TransactionStatus.REJECTED.value)
            txn.status = TransactionStatus.REJECTED.value
            txn.transaction_status = TransactionStatus.REJECTED.value

        lot.status = LotStatus.PRICED.value
        db.commit()

        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="REJECTED",
            title="Recycler Withdrew Offer / Rejected Lot",
            description=f"Recycler {recycler.facility_name} declined lot acquisition. Lot returned to active open marketplace.",
            actor_role="RECYCLER",
            actor_name=recycler.facility_name,
            actor_id=current_user.id,
            location=f"{recycler.city}, {recycler.state}"
        )

        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="LOT_REJECTED",
            entity_type="LOT",
            entity_id=str(lot.id),
            details=f"Recycler rejected lot {lot.lot_id}"
        )

        return {
            "success": True,
            "lot_id": lot.lot_id,
            "status": "REJECTED",
            "message": "Lot rejected and returned to open collector queue."
        }

    @classmethod
    def get_pickups(cls, db: Session, current_user: User) -> Dict[str, List[PickupRecordOut]]:
        recycler = cls._get_recycler_profile(db, current_user)
        records = db.query(PickupRecord).filter(
            PickupRecord.recycler_id == recycler.id
        ).order_by(PickupRecord.scheduled_date.asc()).all()

        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        today_list = []
        upcoming_list = []
        completed_list = []

        for p in records:
            out = PickupRecordOut(
                id=p.id,
                transaction_id=p.transaction_id,
                lot_id=p.lot_id,
                lot_code=p.lot.lot_id if p.lot else None,
                trace_id=p.lot.trace_id if p.lot else None,
                material_name=p.lot.material_name if p.lot else "E-Waste",
                weight_kg=p.lot.estimated_weight if p.lot else None,
                collector_area=p.lot.collector.area if (p.lot and p.lot.collector) else "Collector Hub",
                scheduled_date=p.scheduled_date,
                time_window=p.time_window,
                status=p.status,
                pickup_notes=p.pickup_notes,
                created_at=p.created_at
            )
            if p.status in [PickupStatus.COMPLETED, PickupStatus.CANCELLED]:
                completed_list.append(out)
            elif today_start <= p.scheduled_date < today_end:
                today_list.append(out)
            else:
                upcoming_list.append(out)

        return {
            "today": today_list,
            "upcoming": upcoming_list,
            "completed": completed_list
        }

    @classmethod
    def schedule_pickup(cls, db: Session, data: RecyclerPickupCreate, current_user: User) -> PickupRecordOut:
        recycler = cls._get_recycler_profile(db, current_user)
        txn = db.query(Transaction).filter(Transaction.id == data.transaction_id).first()
        if not txn:
            raise NotFoundException("TRANSACTION", str(data.transaction_id))

        if txn.recycler_id != recycler.id:
            raise ForbiddenException("Access denied to other recyclers' transactions.")

        cls._validate_transition(txn.status, TransactionStatus.PICKUP_SCHEDULED.value)

        # Create pickup record
        pickup = PickupRecord(
            transaction_id=txn.id,
            recycler_id=recycler.id,
            collector_id=txn.collector_id,
            lot_id=txn.lot_id,
            scheduled_date=data.scheduled_date,
            time_window=data.time_window,
            status=PickupStatus.SCHEDULED,
            pickup_notes=data.pickup_notes
        )
        db.add(pickup)

        txn.status = TransactionStatus.PICKUP_SCHEDULED.value
        txn.transaction_status = TransactionStatus.PICKUP_SCHEDULED.value
        txn.scheduled_pickup_time = data.scheduled_date
        if txn.lot:
            txn.lot.status = LotStatus.PICKUP_SCHEDULED.value

        db.commit()
        db.refresh(pickup)

        # Trace event
        date_str = data.scheduled_date.strftime("%d %b %Y")
        TraceService.record_event(
            db=db,
            lot_id=txn.lot_id,
            trace_id=txn.lot.trace_id if txn.lot else None,
            stage="PICKUP_SCHEDULED",
            title="Logistics Vehicle Dispatched for Secure Pickup",
            description=f"Authorized logistics scheduled for {date_str} ({data.time_window}). Transport provided by {recycler.facility_name}.",
            actor_role="RECYCLER",
            actor_name=recycler.facility_name,
            actor_id=current_user.id,
            location=txn.lot.location_address if txn.lot else recycler.city,
            metadata_json={"pickup_id": pickup.id, "time_window": data.time_window}
        )

        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="PICKUP_SCHEDULED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            details=f"Scheduled pickup #{pickup.id} for transaction {txn.id} on {date_str} {data.time_window}",
            new_value={"pickup_id": pickup.id, "scheduled_date": date_str, "time_window": data.time_window}
        )

        return PickupRecordOut(
            id=pickup.id,
            transaction_id=pickup.transaction_id,
            lot_id=pickup.lot_id,
            lot_code=txn.lot.lot_id if txn.lot else None,
            trace_id=txn.lot.trace_id if txn.lot else None,
            material_name=txn.lot.material_name if txn.lot else None,
            weight_kg=txn.lot.estimated_weight if txn.lot else None,
            collector_area=txn.lot.collector.area if (txn.lot and txn.lot.collector) else None,
            scheduled_date=pickup.scheduled_date,
            time_window=pickup.time_window,
            status=pickup.status,
            pickup_notes=pickup.pickup_notes,
            created_at=pickup.created_at
        )

    @classmethod
    def update_pickup_status(cls, db: Session, pickup_id: int, data: RecyclerPickupStatusUpdate, current_user: User) -> Dict[str, Any]:
        recycler = cls._get_recycler_profile(db, current_user)
        pickup = db.query(PickupRecord).filter(PickupRecord.id == pickup_id).first()
        if not pickup:
            raise NotFoundException("PICKUP", str(pickup_id))

        if pickup.recycler_id != recycler.id:
            raise ForbiddenException("Access denied.")

        old_status = pickup.status
        new_status = data.status.upper()
        pickup.status = new_status
        if data.notes:
            pickup.pickup_notes = f"{(pickup.pickup_notes or '')}\n[{datetime.utcnow().strftime('%H:%M')}] {data.notes}".strip()

        txn = pickup.transaction
        if new_status == PickupStatus.IN_PROGRESS:
            cls._validate_transition(txn.status, TransactionStatus.PICKUP_IN_PROGRESS.value)
            txn.status = TransactionStatus.PICKUP_IN_PROGRESS.value
            txn.transaction_status = TransactionStatus.PICKUP_IN_PROGRESS.value
            if txn.lot:
                txn.lot.status = LotStatus.PICKUP_IN_PROGRESS.value
            TraceService.record_event(
                db=db,
                lot_id=txn.lot_id,
                trace_id=txn.lot.trace_id if txn.lot else None,
                stage="PICKUP_STARTED",
                title="Logistics Vehicle En Route to Collection Point",
                description=f"Transport team dispatched by {recycler.facility_name}.",
                actor_role="RECYCLER",
                actor_name=recycler.facility_name,
                actor_id=current_user.id
            )
        elif new_status == PickupStatus.ARRIVED:
            cls._validate_transition(txn.status, TransactionStatus.HANDOVER_VERIFICATION.value)
            txn.status = TransactionStatus.HANDOVER_VERIFICATION.value
            txn.transaction_status = TransactionStatus.HANDOVER_VERIFICATION.value
            TraceService.record_event(
                db=db,
                lot_id=txn.lot_id,
                trace_id=txn.lot.trace_id if txn.lot else None,
                stage="PICKUP_ARRIVED",
                title="Transport Arrived at Collector Location",
                description="Driver onsite ready for scale weight calibration and physical handover.",
                actor_role="RECYCLER",
                actor_name=recycler.facility_name,
                actor_id=current_user.id
            )
        elif new_status == PickupStatus.COMPLETED:
            pass

        db.commit()

        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="PICKUP_STATUS_CHANGED",
            entity_type="PICKUP",
            entity_id=str(pickup.id),
            details=f"Pickup status changed from {old_status} to {new_status}"
        )

        return {
            "success": True,
            "pickup_id": pickup.id,
            "status": pickup.status,
            "transaction_status": txn.status,
            "message": f"Pickup status updated to {new_status}."
        }

    @classmethod
    def get_handover_details(cls, db: Session, txn_id: int, current_user: User) -> HandoverVerifyDetail:
        recycler = cls._get_recycler_profile(db, current_user)
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise NotFoundException("TRANSACTION", str(txn_id))

        if txn.recycler_id != recycler.id:
            raise ForbiddenException("Access denied.")

        lot = txn.lot
        init_wt = lot.estimated_weight if lot else 2.4
        bench = (lot.recommended_price / init_wt) if (lot and lot.recommended_price and init_wt > 0) else 450.0

        area = "Collector Area"
        if lot and lot.location_address:
            parts = [p.strip() for p in lot.location_address.split(",")]
            area = parts[-2] if len(parts) >= 2 else parts[0]

        return HandoverVerifyDetail(
            transaction_id=txn.id,
            lot_id=lot.lot_id if lot else f"LOT-{txn.lot_id}",
            trace_id=lot.trace_id if lot else f"RC-{txn.lot_id}",
            material=lot.material_name if lot else "PCB",
            initial_estimated_weight=init_wt,
            fair_price_min=lot.estimated_price_min if lot else (bench * 0.9),
            fair_price_max=lot.estimated_price_max if lot else (bench * 1.15),
            fair_recommended_rate=round(bench, 1),
            recycler_offer_rate=txn.agreed_price_per_kg,
            offered_total=txn.total_amount or (txn.agreed_price_per_kg * init_wt),
            collector_area=area,
            status=txn.status
        )

    @classmethod
    def confirm_handover(cls, db: Session, txn_id: int, data: HandoverVerifySubmit, current_user: User) -> HandoverVerifyResult:
        recycler = cls._get_recycler_profile(db, current_user)
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise NotFoundException("TRANSACTION", str(txn_id))

        if txn.recycler_id != recycler.id:
            raise ForbiddenException("Access denied.")

        cls._validate_transition(txn.status, TransactionStatus.HANDED_OVER.value)

        lot = txn.lot
        init_wt = lot.estimated_weight if (lot and lot.estimated_weight > 0) else 1.0
        final_wt = data.final_verified_weight
        diff = round(final_wt - init_wt, 2)
        variance_pct = round((abs(final_wt - init_wt) / init_wt) * 100, 1)

        rate = data.final_agreed_rate_per_kg or txn.agreed_price_per_kg
        final_total = round(final_wt * rate, 2) if data.final_price is None else data.final_price

        # 1. Weight Discrepancy & Anomaly Check (>25% variance triggers regulatory anomaly alert)
        is_variance_anomaly = False
        variance_warning = None
        if variance_pct >= 25.0:
            is_variance_anomaly = True
            variance_warning = f"⚠ WEIGHT VARIANCE: Final scale weight ({final_wt} kg) differs by {variance_pct}% from initial collector intake ({init_wt} kg)."
            AnomalyDetector.evaluate_weight_handover(
                db=db,
                transaction_id=txn.id,
                lot_id=lot.id if lot else txn.lot_id,
                initial_weight=init_wt,
                final_scale_weight=final_wt
            )

        # 2. Persist Handover Record
        handover = db.query(HandoverRecord).filter(HandoverRecord.transaction_id == txn.id).first()
        if not handover:
            handover = HandoverRecord(
                transaction_id=txn.id,
                verified_by=current_user.full_name,
                initial_weight=init_wt,
                final_weight=final_wt,
                verified_weight=final_wt,
                weight_discrepancy_pct=variance_pct,
                final_rate_per_kg=rate,
                final_price=final_total,
                final_amount_paid=final_total,
                handover_photo=data.photo_proof_url,
                photo_proof_url=data.photo_proof_url,
                handover_timestamp=datetime.utcnow(),
                recycler_digital_signature=data.recycler_signature or f"AUTH-REC-{recycler.id}",
                collector_confirmation=True,
                notes=data.notes or data.remarks,
                remarks=data.remarks or data.notes
            )
            db.add(handover)
        else:
            handover.final_weight = final_wt
            handover.verified_weight = final_wt
            handover.weight_discrepancy_pct = variance_pct
            handover.final_rate_per_kg = rate
            handover.final_price = final_total
            handover.final_amount_paid = final_total
            handover.handover_timestamp = datetime.utcnow()
            handover.remarks = data.remarks

        # 3. Advance transaction & lot state
        txn.final_weight = final_wt
        txn.final_price = final_total
        txn.total_amount = final_total
        txn.status = TransactionStatus.HANDED_OVER.value
        txn.transaction_status = TransactionStatus.HANDED_OVER.value
        txn.payment_status = PaymentStatus.PENDING.value

        if lot:
            lot.final_weight = final_wt
            lot.final_price = final_total
            lot.status = LotStatus.HANDOVER_VERIFIED.value
            if lot.collector:
                lot.collector.total_weight_collected = (lot.collector.total_weight_collected or 0.0) + final_wt

        # Complete associated pickups
        db.query(PickupRecord).filter(PickupRecord.transaction_id == txn.id).update({"status": PickupStatus.COMPLETED})

        db.commit()
        db.refresh(handover)

        # 4. Trace Events
        TraceService.record_event(
            db=db,
            lot_id=lot.id if lot else txn.lot_id,
            trace_id=lot.trace_id if lot else None,
            stage="HANDOVER_VERIFIED",
            title="Digital Handover & Calibrated Scale Verification Complete",
            description=f"Physical handover verified. Scale weight: {final_wt} kg (Diff: {diff:+} kg, {variance_pct}%). Agreed settlement: ₹{final_total} (₹{rate}/kg).",
            actor_role="RECYCLER",
            actor_name=recycler.facility_name,
            actor_id=current_user.id,
            location=lot.location_address if lot else recycler.city,
            metadata_json={"final_weight": final_wt, "final_price": final_total, "variance_pct": variance_pct}
        )

        TraceService.record_event(
            db=db,
            lot_id=lot.id if lot else txn.lot_id,
            trace_id=lot.trace_id if lot else None,
            stage="FORMAL_RECYCLING",
            title="Ingested into Formal CPCB Authorized Recycling Stream",
            description=f"Batched into closed-loop hydrometallurgical recovery process at {recycler.facility_name} (CPCB Auth: {recycler.authorization_number}).",
            actor_role="RECYCLER",
            actor_name=recycler.facility_name,
            location=f"{recycler.city}, {recycler.state}"
        )

        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="HANDOVER_CONFIRMED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            details=f"Handover verified: {final_wt} kg @ ₹{rate}/kg = ₹{final_total}"
        )

        return HandoverVerifyResult(
            handover_id=handover.id,
            transaction_id=txn.id,
            lot_id=lot.lot_id if lot else str(txn.lot_id),
            trace_id=lot.trace_id if lot else str(txn.lot_id),
            initial_weight=init_wt,
            final_weight=final_wt,
            weight_difference_kg=diff,
            variance_pct=variance_pct,
            is_variance_anomaly=is_variance_anomaly,
            variance_warning=variance_warning,
            final_rate_per_kg=rate,
            final_price=final_total,
            status=txn.status,
            message="Material handover formally confirmed and recorded into tamper-evident chain of custody."
        )

    @classmethod
    def get_transactions(
        cls,
        db: Session,
        current_user: User,
        status: Optional[str] = None,
        material: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        recycler = cls._get_recycler_profile(db, current_user)
        query = db.query(Transaction).filter(
            Transaction.recycler_id == recycler.id
        ).order_by(Transaction.created_at.desc())

        if status:
            query = query.filter(Transaction.status == status)

        txns = query.all()
        results = []
        for t in txns:
            lot = t.lot
            if material and lot and material.lower() not in (lot.material_name or "").lower():
                continue

            area = "Collector Area"
            if lot and lot.location_address:
                parts = [p.strip() for p in lot.location_address.split(",")]
                area = parts[-2] if len(parts) >= 2 else parts[0]

            results.append({
                "id": t.id,
                "lot_id": lot.lot_id if lot else f"LOT-{t.lot_id}",
                "trace_id": lot.trace_id if lot else f"RC-{t.lot_id}",
                "material": lot.material_name if lot else "E-Waste",
                "subcategory": lot.subcategory if lot else None,
                "weight_kg": t.final_weight or (lot.estimated_weight if lot else 2.0),
                "collector_area": area,
                "agreed_rate": t.agreed_price_per_kg,
                "final_price": t.final_price or t.total_amount or 0.0,
                "status": t.status,
                "payment_status": t.payment_status,
                "payment_method": t.payment_method or "UPI Instant Transfer",
                "payment_ref": t.payment_ref,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat() if t.updated_at else None
            })

        return results

    @classmethod
    def get_transaction_detail(cls, db: Session, txn_id: int, current_user: User) -> Dict[str, Any]:
        recycler = cls._get_recycler_profile(db, current_user)
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise NotFoundException("TRANSACTION", str(txn_id))

        if txn.recycler_id != recycler.id:
            raise ForbiddenException("Access denied.")

        lot = txn.lot
        handover = txn.handover
        pickups = txn.pickups

        # Complete Pricing Chain
        init_wt = lot.estimated_weight if lot else 2.0
        pricing_chain = {
            "ai_estimate_min": lot.estimated_price_min if lot else 400.0,
            "ai_estimate_max": lot.estimated_price_max if lot else 500.0,
            "fair_benchmark_rate": lot.recommended_price / init_wt if (lot and lot.recommended_price and init_wt > 0) else 450.0,
            "fair_recommended_total": lot.recommended_price if lot else 450.0,
            "recycler_offer_rate": txn.agreed_price_per_kg,
            "recycler_offer_total": txn.quoted_price or (txn.agreed_price_per_kg * init_wt),
            "final_weight": txn.final_weight,
            "final_price": txn.final_price or txn.total_amount
        }

        trace_events = db.query(TraceEvent).filter(TraceEvent.lot_id == txn.lot_id).order_by(TraceEvent.created_at.asc()).all()

        return {
            "id": txn.id,
            "status": txn.status,
            "payment_status": txn.payment_status,
            "payment_ref": txn.payment_ref,
            "payment_method": txn.payment_method,
            "lot": {
                "id": lot.id if lot else None,
                "lot_id": lot.lot_id if lot else None,
                "trace_id": lot.trace_id if lot else None,
                "material": lot.material_name if lot else None,
                "estimated_weight": lot.estimated_weight if lot else None,
                "hazard_level": lot.hazard_level if lot else None,
                "location_area": lot.collector.area if (lot and lot.collector) else "Hyderabad"
            },
            "pricing_chain": pricing_chain,
            "handover": {
                "verified_weight": handover.verified_weight if handover else None,
                "variance_pct": handover.weight_discrepancy_pct if handover else None,
                "verified_by": handover.verified_by if handover else None,
                "timestamp": handover.handover_timestamp.isoformat() if handover else None,
                "signature": handover.recycler_digital_signature if handover else None
            } if handover else None,
            "pickups": [
                {
                    "id": p.id,
                    "date": p.scheduled_date.isoformat(),
                    "window": p.time_window,
                    "status": p.status,
                    "notes": p.pickup_notes
                } for p in pickups
            ],
            "trace_events": [
                {
                    "stage": e.stage,
                    "title": e.title,
                    "description": e.description,
                    "actor_name": e.actor_name,
                    "timestamp": (e.event_timestamp or e.created_at).isoformat()
                } for e in trace_events
            ]
        }

    @classmethod
    def update_payment_status(cls, db: Session, txn_id: int, data: PaymentStatusUpdateReq, current_user: User) -> Dict[str, Any]:
        recycler = cls._get_recycler_profile(db, current_user)
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise NotFoundException("TRANSACTION", str(txn_id))

        if txn.recycler_id != recycler.id:
            raise ForbiddenException("Access denied.")

        new_pay_status = data.payment_status.upper()
        txn.payment_status = new_pay_status
        txn.payment_method = data.payment_method or "UPI Instant Transfer"

        old_status = txn.status
        if new_pay_status == PaymentStatus.PAID.value:
            cls._validate_transition(txn.status, TransactionStatus.COMPLETED.value)
            txn.status = TransactionStatus.COMPLETED.value
            txn.transaction_status = TransactionStatus.COMPLETED.value
            txn.payment_ref = f"UPI-DEMO-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{txn.id}"
            if txn.lot:
                txn.lot.status = LotStatus.COMPLETED.value
                if txn.lot.collector:
                    txn.lot.collector.total_earnings = (txn.lot.collector.total_earnings or 0.0) + (txn.final_price or txn.total_amount or 0.0)

            # Trace event
            TraceService.record_event(
                db=db,
                lot_id=txn.lot_id,
                trace_id=txn.lot.trace_id if txn.lot else None,
                stage="PAYMENT_COMPLETED",
                title="Direct Payout Settled to Collector (Demo Settlement)",
                description=f"Payment of ₹{txn.total_amount or txn.final_price} marked PAID via {txn.payment_method} ({txn.payment_ref}). Closed-loop transaction complete.",
                actor_role="RECYCLER",
                actor_name=recycler.facility_name,
                actor_id=current_user.id,
                metadata_json={"payment_status": "PAID", "ref": txn.payment_ref, "amount": txn.total_amount or txn.final_price}
            )

        db.commit()

        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="PAYMENT_STATUS_CHANGED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            details=f"Payment status updated to {new_pay_status}. Transaction advanced from {old_status} to {txn.status}."
        )

        return {
            "success": True,
            "transaction_id": txn.id,
            "payment_status": txn.payment_status,
            "payment_ref": txn.payment_ref,
            "transaction_status": txn.status,
            "is_demo_payment": True,
            "message": f"Demo payment status updated to {new_pay_status}."
        }

    @classmethod
    def get_profile(cls, db: Session, current_user: User) -> Dict[str, Any]:
        recycler = cls._get_recycler_profile(db, current_user)
        return {
            "id": recycler.id,
            "user_id": recycler.user_id,
            "facility_name": recycler.facility_name,
            "authorization_status": recycler.authorization_status,
            "authorization_number": recycler.authorization_number,
            "contact_phone": recycler.contact_phone,
            "contact_email": recycler.contact_email,
            "address": recycler.address,
            "city": recycler.city,
            "state": recycler.state,
            "pincode": recycler.pincode,
            "latitude": recycler.latitude,
            "longitude": recycler.longitude,
            "accepted_materials": recycler.accepted_materials or [],
            "service_radius_km": recycler.service_radius_km,
            "pickup_available": recycler.pickup_available,
            "pickup_min_weight_kg": recycler.pickup_min_weight_kg,
            "reliability_score": recycler.reliability_score,
            "rating": recycler.rating,
            "badge": "✓ VERIFIED DEMO RECYCLER" if "DEMO" in recycler.authorization_status else "✓ CPCB LICENSED RECYCLER"
        }

    @classmethod
    def update_profile(cls, db: Session, data: RecyclerProfileUpdateReq, current_user: User) -> Dict[str, Any]:
        recycler = cls._get_recycler_profile(db, current_user)
        if data.facility_name:
            recycler.facility_name = data.facility_name
        if data.contact_phone:
            recycler.contact_phone = data.contact_phone
        if data.contact_email:
            recycler.contact_email = data.contact_email
        if data.address:
            recycler.address = data.address
        if data.accepted_materials is not None:
            recycler.accepted_materials = data.accepted_materials
        if data.service_radius_km is not None:
            recycler.service_radius_km = data.service_radius_km
        if data.pickup_available is not None:
            recycler.pickup_available = data.pickup_available
        if data.pickup_min_weight_kg is not None:
            recycler.pickup_min_weight_kg = data.pickup_min_weight_kg

        db.commit()
        db.refresh(recycler)

        cls._log_audit(
            db=db,
            user_id=current_user.id,
            action="PROFILE_UPDATED",
            entity_type="RECYCLER",
            entity_id=str(recycler.id),
            details=f"Recycler updated profile configuration."
        )

        return cls.get_profile(db, current_user)
