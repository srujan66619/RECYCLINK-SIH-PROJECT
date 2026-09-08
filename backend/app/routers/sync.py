from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.session import get_db
from app.models.entities import EWasteLot, TraceEvent, TraceStage, LotStatus, CollectorProfile
from app.traceability.qr_generator import generate_qr_data_url
import random
from datetime import datetime

router = APIRouter(prefix="/api/sync", tags=["Offline Sync Manager"])

@router.post("/batch")
def sync_offline_drafts(payloads: List[Dict[str, Any]], db: Session = Depends(get_db)):
    """
    Synchronize offline queued lots created by collectors when offline.
    Assigns Trace IDs and formalizes them into the active database.
    """
    synced_items = []
    default_profile = db.query(CollectorProfile).first()
    collector_id = default_profile.id if default_profile else 1

    for item in payloads:
        count = db.query(EWasteLot).count() + random.randint(100, 999)
        trace_id = f"RC-2026-{count:06d}"
        qr_url = generate_qr_data_url(trace_id)

        weight = float(item.get("weight_kg", 2.0))
        material = item.get("material_name", "PCB")
        rec_price = float(item.get("recommended_price", 455.0)) * weight

        lot = EWasteLot(
            trace_id=trace_id,
            collector_id=collector_id,
            material_name=material,
            subcategory=item.get("subcategory", "Offline Intake"),
            estimated_weight=weight,
            photo_url=item.get("photo_url", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"),
            ai_confidence=0.92,
            hazard_level=item.get("hazard_level", "MEDIUM"),
            estimated_price_min=rec_price * 0.85,
            estimated_price_max=rec_price * 1.15,
            recommended_price=rec_price,
            quoted_price=rec_price,
            status=LotStatus.IDENTIFIED.value,
            location_address=item.get("location_address", "Offline Sync Location"),
            qr_code_url=qr_url
        )
        db.add(lot)
        db.commit()
        db.refresh(lot)

        event = TraceEvent(
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage=TraceStage.COLLECTED.value,
            title="Offline Lot Synchronized to Formal Cloud Registry",
            description=f"Draft intake of {weight} kg {material} synced when connectivity restored.",
            actor_role="COLLECTOR",
            actor_name="Offline Sync Manager",
            location=lot.location_address,
            event_timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()

        synced_items.append({
            "client_id": item.get("client_id"),
            "trace_id": lot.trace_id,
            "status": "SYNCED",
            "server_id": lot.id
        })

    return {
        "status": "SUCCESS",
        "synced_count": len(synced_items),
        "results": synced_items
    }
