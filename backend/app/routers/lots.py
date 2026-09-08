from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.lot import LotCreate, LotUpdate, LotOut
from app.services.lot_service import LotService
from app.core.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/lots", tags=["E-Waste Lots"])

@router.post("", response_model=LotOut)
def create_lot(
    req: LotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new e-waste lot with deterministic collision-safe lot_id and trace_id,
    and initialize immutable chain-of-custody trace event.
    """
    lot = LotService.create_lot(db=db, collector_user=current_user, data=req)
    return lot

@router.get("", response_model=List[LotOut])
def list_lots(
    status: Optional[str] = Query(None, description="Filter by lot status"),
    collector_id: Optional[int] = Query(None, description="Filter by collector ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    List e-waste lots. Enforces collector data isolation: logged-in collectors
    can only view their own lots.
    """
    return LotService.list_lots(
        db=db,
        current_user=current_user,
        status=status,
        collector_id=collector_id
    )

@router.get("/{id}", response_model=LotOut)
def get_lot(
    id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed lot record by database ID, lot_id, or trace_id.
    """
    return LotService.get_lot(db=db, lot_id_or_pk=id, current_user=current_user)

@router.patch("/{id}", response_model=LotOut)
def update_lot(
    id: str,
    req: LotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update lot attributes (e.g. weight, quoted price, condition, status).
    """
    return LotService.update_lot(db=db, lot_id_or_pk=id, data=req, current_user=current_user)
