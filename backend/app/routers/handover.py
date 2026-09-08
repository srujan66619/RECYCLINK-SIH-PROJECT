from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.core.dependencies import get_optional_current_user
from app.schemas.handover import HandoverCreateRequest, HandoverResponseOut, DigitalReceiptOut
from app.services.handover_service import HandoverService

router = APIRouter(prefix="/api/handover", tags=["Digital Handover & Scale Reconciliation"])

@router.post("", response_model=HandoverResponseOut)
def record_digital_handover(
    req: HandoverCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Formal Digital Handover Record Creation & Verification:
    - Calibrated digital scale weight capture
    - Automatic variance calculation vs initial AI intake
    - Discrepancy warning if variance > 25%
    - Generates unique Handover ID (HR-YYYY-XXXXXX)
    - Emits HANDOVER_VERIFIED, FINAL_WEIGHT_RECORDED, and FINAL_PRICE_RECORDED trace events
    """
    user = current_user or db.query(User).filter(User.role == "RECYCLER").first()
    return HandoverService.create_or_verify_handover(
        db=db,
        lot_id=req.lot_id,
        transaction_id=req.transaction_id,
        final_weight=req.final_weight,
        final_price=req.final_price,
        condition=req.condition,
        notes=req.notes,
        photo=req.photo,
        current_user=user
    )

@router.get("/{handover_id}", response_model=DigitalReceiptOut)
def get_digital_handover_receipt(handover_id: str, db: Session = Depends(get_db)):
    """
    Retrieve formal Digital E-Waste Handover Receipt by Handover ID (HR-2026-XXXXXX).
    """
    return HandoverService.get_handover_record(db=db, handover_identifier=handover_id)
