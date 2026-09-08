from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate, TransactionOut, HandoverRequest, HandoverResponse
)
from app.services.transaction_service import TransactionService
from app.core.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/transactions", tags=["Transactions & Handover"])

@router.post("", response_model=TransactionOut)
def create_transaction(
    req: TransactionCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate a formal transaction between a collector's e-waste lot and an authorized recycler.
    """
    user = current_user or db.query(User).first()
    return TransactionService.create_transaction(db=db, data=req, current_user=user)

@router.get("", response_model=List[TransactionOut])
def list_transactions(
    recycler_id: Optional[int] = Query(None, description="Filter by recycler ID"),
    collector_id: Optional[int] = Query(None, description="Filter by collector ID"),
    status: Optional[str] = Query(None, description="Filter by transaction status"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    List transactions with role-based filtering and status query parameters.
    """
    return TransactionService.list_transactions(
        db=db,
        current_user=current_user,
        recycler_id=recycler_id,
        collector_id=collector_id,
        status=status
    )

@router.get("/{id}", response_model=TransactionOut)
def get_transaction(
    id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single transaction by ID with authorization verification.
    """
    return TransactionService.get_transaction(db=db, txn_id=id, current_user=current_user)

@router.patch("/{id}/status")
def update_transaction_status(
    id: int,
    new_status: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Update transaction lifecycle status (e.g., PICKUP_SCHEDULED, IN_TRANSIT, CANCELLED).
    """
    user = current_user or db.query(User).first()
    txn = TransactionService.update_status(db=db, txn_id=id, new_status=new_status, current_user=user)
    return {"message": f"Transaction status updated to {new_status}", "transaction_id": txn.id}

@router.post("/{id}/handover", response_model=HandoverResponse)
def confirm_handover(
    id: int,
    req: HandoverRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Digital Handover Confirmation:
    - Verifies scale weight against initial AI intake
    - Reconciles final payment amount
    - Triggers weight anomaly guardian check
    - Locks transaction and advances lot to HANDOVER_VERIFIED & FORMAL_RECYCLING
    """
    user = current_user or db.query(User).first()
    return TransactionService.confirm_handover(db=db, txn_id=id, data=req, current_user=user)
