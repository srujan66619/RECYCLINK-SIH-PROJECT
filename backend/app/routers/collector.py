from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.collector import CollectorDashboardStats
from app.schemas.lot import LotOut
from app.schemas.transaction import TransactionOut
from app.services.collector_service import CollectorService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/collector", tags=["Collector"])

@router.get("/dashboard", response_model=CollectorDashboardStats)
def get_collector_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated dashboard stats for the authenticated collector.
    """
    return CollectorService.get_dashboard_stats(db=db, current_user=current_user)

@router.get("/lots", response_model=List[LotOut])
def get_collector_lots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all e-waste lots belonging to the authenticated collector.
    """
    return CollectorService.get_lots(db=db, current_user=current_user)

@router.get("/transactions", response_model=List[TransactionOut])
def get_collector_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all transactions belonging to the authenticated collector.
    """
    return CollectorService.get_transactions(db=db, current_user=current_user)

@router.get("/earnings")
def get_collector_earnings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get total earnings breakdown and payment channel for the authenticated collector.
    """
    return CollectorService.get_earnings(db=db, current_user=current_user)
