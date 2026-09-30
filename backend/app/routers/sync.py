from fastapi import APIRouter, Depends, Body, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Union, Optional
from app.database.session import get_db
from app.models.entities import EWasteLot, TraceEvent, TraceStage, LotStatus, CollectorProfile
from app.traceability.qr_generator import generate_qr_data_url
import random
from datetime import datetime

router = APIRouter(prefix="/api/sync", tags=["Offline Sync Manager"])

@router.get("/status")
def get_sync_service_status(db: Session = Depends(get_db)):
    """
    Check sync bridge health, server time, and offline idempotency configuration.
    """
    total_synced_lots = db.query(EWasteLot).filter(EWasteLot.client_action_id.isnot(None)).count()
    return {
        "status": "ONLINE",
        "timestamp": datetime.utcnow().isoformat(),
        "synced_lots_count": total_synced_lots,
        "supported_actions": ["CREATE_LOT", "UPDATE_WEIGHT", "SAFETY_ACKNOWLEDGE"],
        "idempotency_enabled": True,
        "version": "Phase9-Offline-v1.0"
    }

@router.post("/batch")
async def sync_offline_drafts(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Synchronize offline queued actions (lots, drafts, acknowledgements) with idempotency protection.
    Prevents duplicate lots if the network drops before response delivery.
    """
    body_data = await request.json()
    actions = []
    device_id = None

    if isinstance(body_data, list):
        actions = body_data
    elif isinstance(body_data, dict):
        device_id = body_data.get("device_id")
        actions = body_data.get("actions", [])
    
    synced_items = []
    default_profile = db.query(CollectorProfile).first()
    collector_id = default_profile.id if default_profile else 1

    for action in actions:
        # Determine client_action_id
        client_action_id = (
            action.get("client_action_id") or 
            action.get("client_id") or 
            action.get("local_id") or 
            action.get("id")
        )
        
        # Action payload could be nested in 'payload' or flattened
        payload = action.get("payload") if isinstance(action.get("payload"), dict) else action
        action_type = action.get("action_type", "CREATE_LOT")

        # 1. Idempotency verification: Check if lot with this client_action_id already exists
        if client_action_id:
            existing_lot = db.query(EWasteLot).filter(EWasteLot.client_action_id == str(client_action_id)).first()
            if existing_lot:
                synced_items.append({
                    "client_action_id": client_action_id,
                    "client_id": client_action_id,
                    "trace_id": existing_lot.trace_id,
                    "lot_id": existing_lot.lot_id,
                    "server_lot_id": existing_lot.lot_id,
                    "status": "SYNCED",
                    "server_id": existing_lot.id,
                    "idempotent": True,
                    "message": "Already synchronized"
                })
                continue

        # 2. Process CREATE_LOT or general intake
        from app.utils.ids import generate_lot_id, generate_trace_id
        lot_id = generate_lot_id(db)
        trace_id = generate_trace_id(db)
        qr_url = generate_qr_data_url(trace_id)

        weight = float(payload.get("weight_kg") or payload.get("estimated_weight") or 2.0)
        material = payload.get("material_name") or payload.get("material") or "PCB"
        rec_price = float(payload.get("recommended_price") or 455.0) * weight
        hazard = payload.get("hazard_level") or ("HIGH" if material in ["Battery", "CRT"] else "MEDIUM")

        lot = EWasteLot(
            lot_id=lot_id,
            trace_id=trace_id,
            collector_id=collector_id,
            material_name=material,
            subcategory=payload.get("subcategory", "Offline Field Intake"),
            estimated_weight=weight,
            photo_url=payload.get("photo_url", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"),
            ai_confidence=float(payload.get("ai_confidence", 0.92)),
            hazard_level=hazard,
            estimated_price_min=rec_price * 0.85,
            estimated_price_max=rec_price * 1.15,
            recommended_price=rec_price,
            quoted_price=rec_price,
            status=LotStatus.IDENTIFIED.value,
            location_address=payload.get("location_address", "Field Offline Sync"),
            qr_code_url=qr_url,
            client_action_id=str(client_action_id) if client_action_id else None
        )
        db.add(lot)
        db.commit()
        db.refresh(lot)

        event = TraceEvent(
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage=TraceStage.COLLECTED.value,
            title="Offline Lot Synchronized to Formal Cloud Registry",
            description=f"Field intake of {weight} kg {material} synchronized with idempotency.",
            actor_role="COLLECTOR",
            actor_name="Offline Sync Manager",
            location=lot.location_address,
            event_timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()

        synced_items.append({
            "client_action_id": client_action_id,
            "client_id": client_action_id,
            "trace_id": lot.trace_id,
            "lot_id": lot.lot_id,
            "server_lot_id": lot.lot_id,
            "status": "SYNCED",
            "server_id": lot.id,
            "idempotent": False
        })

    return {
        "status": "SUCCESS",
        "device_id": device_id,
        "synced_count": len(synced_items),
        "results": synced_items
    }
