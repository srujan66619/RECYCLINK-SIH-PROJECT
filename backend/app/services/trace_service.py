import hashlib
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.trace_event import TraceEvent, TraceStage

class TraceService:
    @staticmethod
    def calculate_event_hash(payload: Dict[str, Any], previous_hash: Optional[str] = None) -> str:
        """
        Computes deterministic SHA-256 hash for a tamper-evident trace event chain.
        (previous_event_hash + canonical_event_payload -> SHA-256).
        """
        canonical_json = json.dumps(payload, sort_keys=True, default=str)
        content = (previous_hash or "") + canonical_json
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    @staticmethod
    def validate_event_sequence(db: Session, lot_id: int, next_stage: str) -> None:
        """
        Enforces chronological e-waste lifecycle rules preventing impossible transitions.
        Raises ValueError if prerequisites are violated.
        """
        stage_str = str(next_stage).upper()

        prereqs = {
            "PAYMENT_COMPLETED": [
                "HANDOVER_VERIFIED", "FINAL_PRICE_RECORDED", "FINAL_WEIGHT_RECORDED",
                "HANDED_OVER", "FORMAL_RECYCLING", "COMPLETED", "PAID"
            ],
            "TRANSACTION_COMPLETED": ["PAYMENT_COMPLETED", "PAID", "COMPLETED"],
            "HANDOVER_VERIFIED": [
                "PICKUP_ARRIVED", "PICKUP_STARTED", "PICKUP_SCHEDULED",
                "PICKUP_IN_PROGRESS", "ACCEPTED", "OFFER_ACCEPTED", "OFFER_RECEIVED",
                "RECYCLER_SELECTED", "HANDOVER_VERIFICATION", "HANDOVER_VERIFIED", "HANDED_OVER"
            ],
            "FINAL_WEIGHT_RECORDED": ["HANDOVER_VERIFIED", "HANDED_OVER"],
            "FINAL_PRICE_RECORDED": ["HANDOVER_VERIFIED", "FINAL_WEIGHT_RECORDED", "HANDED_OVER"],
        }

        if stage_str in prereqs:
            existing_events = db.query(TraceEvent).filter(TraceEvent.lot_id == lot_id).all()
            existing_stages = {e.stage.upper() for e in existing_events if e.stage}

            # Also inspect lot and transaction lifecycle status from DB
            from app.models.ewaste_lot import EWasteLot
            from app.models.transaction import Transaction
            lot = db.query(EWasteLot).filter(EWasteLot.id == lot_id).first()
            if lot:
                if lot.status:
                    existing_stages.add(str(lot.status).upper())
                txns = db.query(Transaction).filter(Transaction.lot_id == lot.id).all()
                for t in txns:
                    if t.status:
                        existing_stages.add(str(t.status).upper())
                    if t.transaction_status:
                        existing_stages.add(str(t.transaction_status).upper())
                    if t.payment_status:
                        existing_stages.add(str(t.payment_status).upper())

            required_any = prereqs[stage_str]
            if not any(req in existing_stages for req in required_any):
                raise ValueError(
                    f"Invalid trace sequence: '{stage_str}' cannot occur before one of {required_any}"
                )

    @staticmethod
    def record_event(
        db: Session,
        lot_id: int,
        stage: str,
        title: str,
        description: str,
        actor_role: str = "SYSTEM",
        actor_name: str = "RECYCLINK Intelligence",
        actor_id: Optional[int] = None,
        location: Optional[str] = None,
        trace_id: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        location_accuracy: Optional[float] = None,
        evidence_url: Optional[str] = None,
        event_status: str = "COMPLETED",
        validate_sequence: bool = True
    ) -> TraceEvent:
        """
        Records a trace event and cryptographically links it to the preceding event's SHA-256 hash.
        """
        if validate_sequence:
            TraceService.validate_event_sequence(db=db, lot_id=lot_id, next_stage=stage)

        # Resolve trace_id if missing
        if not trace_id:
            from app.models.ewaste_lot import EWasteLot
            lot = db.query(EWasteLot).filter(EWasteLot.id == lot_id).first()
            if lot and lot.trace_id:
                trace_id = lot.trace_id

        # Find previous event for this lot/trace to link the chain
        last_event = (
            db.query(TraceEvent)
            .filter((TraceEvent.lot_id == lot_id) | (TraceEvent.trace_id == trace_id))
            .order_by(TraceEvent.id.desc())
            .first()
        )
        previous_hash = last_event.event_hash if (last_event and last_event.event_hash) else None

        now = datetime.utcnow()
        timestamp_str = now.isoformat()

        payload = {
            "lot_id": lot_id,
            "trace_id": trace_id,
            "stage": stage,
            "event_type": stage,
            "actor_role": actor_role,
            "actor_id": actor_id,
            "title": title,
            "description": description,
            "timestamp": timestamp_str
        }
        event_hash = TraceService.calculate_event_hash(payload, previous_hash)

        event = TraceEvent(
            lot_id=lot_id,
            trace_id=trace_id,
            event_type=stage,
            stage=stage,
            event_status=event_status,
            title=title,
            description=description,
            actor_id=actor_id,
            actor_role=actor_role,
            actor_name=actor_name,
            location=location,
            latitude=latitude,
            longitude=longitude,
            location_accuracy=location_accuracy,
            evidence_url=evidence_url,
            event_timestamp=now,
            timestamp=now,
            metadata_json=metadata_json or {},
            previous_event_hash=previous_hash,
            event_hash=event_hash
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def get_events_for_lot(db: Session, lot_id: int) -> List[TraceEvent]:
        return db.query(TraceEvent).filter(TraceEvent.lot_id == lot_id).order_by(TraceEvent.created_at.asc(), TraceEvent.id.asc()).all()

    @staticmethod
    def get_events_for_trace_id(db: Session, trace_id: str) -> List[TraceEvent]:
        from app.models.ewaste_lot import EWasteLot
        lot = db.query(EWasteLot).filter((EWasteLot.trace_id == trace_id) | (EWasteLot.lot_id == trace_id)).first()
        if lot:
            return db.query(TraceEvent).filter(
                (TraceEvent.lot_id == lot.id) | (TraceEvent.trace_id == trace_id)
            ).order_by(TraceEvent.created_at.asc(), TraceEvent.id.asc()).all()
        return db.query(TraceEvent).filter(TraceEvent.trace_id == trace_id).order_by(TraceEvent.created_at.asc(), TraceEvent.id.asc()).all()

    @staticmethod
    def verify_event_integrity(trace_id: str, db: Session) -> Dict[str, Any]:
        """
        Verifies the tamper-evident cryptographic hash chain of all trace events for a given Trace ID.
        Returns 'VALID' if every event's hash matches SHA-256(payload + previous_hash).
        Returns 'TAMPER_DETECTED' if any link is broken or modified.
        """
        events = TraceService.get_events_for_trace_id(db, trace_id)
        if not events:
            return {
                "trace_id": trace_id,
                "integrity_status": "EMPTY",
                "status": "EMPTY",
                "events_checked": 0,
                "message": f"No trace events found for Trace ID {trace_id}."
            }

        prev_hash = None
        for idx, event in enumerate(events):
            # Check link to previous hash
            if event.previous_event_hash != prev_hash:
                return {
                    "trace_id": trace_id,
                    "integrity_status": "TAMPER_DETECTED",
                    "status": "TAMPER_DETECTED",
                    "events_checked": len(events),
                    "tampered_at_event_id": event.id,
                    "tampered_at_index": idx,
                    "reason": f"Event {event.id} previous_event_hash does not match preceding event hash."
                }

            ts_str = (
                event.event_timestamp.isoformat()
                if event.event_timestamp
                else (event.created_at.isoformat() if event.created_at else "")
            )

            payload = {
                "lot_id": event.lot_id,
                "trace_id": event.trace_id,
                "stage": event.stage,
                "event_type": event.event_type,
                "actor_role": event.actor_role,
                "actor_id": event.actor_id,
                "title": event.title,
                "description": event.description,
                "timestamp": ts_str
            }
            computed_hash = TraceService.calculate_event_hash(payload, prev_hash)

            if event.event_hash and event.event_hash != computed_hash:
                return {
                    "trace_id": trace_id,
                    "integrity_status": "TAMPER_DETECTED",
                    "status": "TAMPER_DETECTED",
                    "events_checked": len(events),
                    "tampered_at_event_id": event.id,
                    "tampered_at_index": idx,
                    "reason": f"Event {event.id} hash mismatch: computed {computed_hash} != stored {event.event_hash}."
                }

            prev_hash = event.event_hash or computed_hash

        return {
            "trace_id": trace_id,
            "integrity_status": "VALID",
            "status": "VALID",
            "events_checked": len(events),
            "verified_at": datetime.utcnow().isoformat(),
            "message": "Tamper-Evident Trace Chain verified successfully with SHA-256."
        }

    @staticmethod
    def backfill_trace_hashes(db: Session) -> int:
        """
        Backfills SHA-256 hashes for legacy trace events that do not yet have hash chains.
        """
        from app.models.ewaste_lot import EWasteLot
        lots = db.query(EWasteLot).all()
        updated_count = 0

        for lot in lots:
            events = (
                db.query(TraceEvent)
                .filter(TraceEvent.lot_id == lot.id)
                .order_by(TraceEvent.created_at.asc(), TraceEvent.id.asc())
                .all()
            )
            prev_hash = None
            for event in events:
                ts_str = (
                    event.event_timestamp.isoformat()
                    if event.event_timestamp
                    else (event.created_at.isoformat() if event.created_at else "")
                )
                payload = {
                    "lot_id": event.lot_id,
                    "trace_id": lot.trace_id,
                    "stage": event.stage,
                    "event_type": event.event_type or event.stage,
                    "actor_role": event.actor_role or "SYSTEM",
                    "actor_id": event.actor_id,
                    "title": event.title or event.stage,
                    "description": event.description or "",
                    "timestamp": ts_str
                }
                computed_hash = TraceService.calculate_event_hash(payload, prev_hash)
                if event.previous_event_hash != prev_hash or event.event_hash != computed_hash or not event.trace_id:
                    event.trace_id = lot.trace_id
                    event.previous_event_hash = prev_hash
                    event.event_hash = computed_hash
                    updated_count += 1
                prev_hash = computed_hash

        db.commit()
        return updated_count
