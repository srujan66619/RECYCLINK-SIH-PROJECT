from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.core.dependencies import require_recycler, get_current_user
from app.schemas.recycler_portal import (
    RecyclerDashboardStats, RecyclerIncomingLotOut, RecyclerLotDetailOut,
    RecyclerOfferSubmit, RecyclerOfferUpdate, RecyclerOfferResponse,
    RecyclerPickupCreate, RecyclerPickupStatusUpdate, PickupRecordOut,
    HandoverVerifyDetail, HandoverVerifySubmit, HandoverVerifyResult,
    PaymentStatusUpdateReq, RecyclerProfileUpdateReq
)
from app.services.recycler_portal_service import RecyclerPortalService

router = APIRouter(prefix="/api/recycler", tags=["Recycler Operations Portal"])

# ============================================================
# 1. RECYCLER DASHBOARD
# ============================================================

@router.get("/dashboard", response_model=RecyclerDashboardStats)
def get_recycler_dashboard(
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Recycler operations control tower dashboard.
    Returns real-time KPIs: Incoming lots, pending offers, pickups, completed transactions, total weight and purchase value.
    """
    return RecyclerPortalService.get_dashboard(db=db, current_user=current_user)

# ============================================================
# 2. INCOMING LOTS & DETAILS
# ============================================================

@router.get("/lots/incoming", response_model=List[RecyclerIncomingLotOut])
def get_incoming_lots(
    material: Optional[str] = Query(None, description="Filter by material name (e.g. PCB, Cable)"),
    max_distance: Optional[float] = Query(None, description="Filter by maximum distance in km"),
    sort_by: Optional[str] = Query("distance", description="Sort by distance, weight, price, or date"),
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Retrieve incoming e-waste lot queue matching recycler's material capabilities and service radius.
    """
    return RecyclerPortalService.get_incoming_lots(
        db=db,
        current_user=current_user,
        material=material,
        max_distance=max_distance,
        sort_by=sort_by
    )

@router.get("/lots/{id}", response_model=RecyclerLotDetailOut)
def get_lot_detail(
    id: str,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Inspect detailed e-waste lot specification:
    - Prototype AI classification & confidence
    - Potentially recoverable metals (Gold, Silver, Copper)
    - CPCB Fair Market benchmark rate & recommended price
    - Coarse collector geographic region
    """
    return RecyclerPortalService.get_lot_detail(db=db, lot_id_or_pk=id, current_user=current_user)

# ============================================================
# 3. OFFERS & ACCEPTANCE
# ============================================================

@router.get("/offers")
def list_recycler_offers(
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    List all active and past acquisition bids/offers submitted by this recycler.
    """
    return RecyclerPortalService.get_transactions(db=db, current_user=current_user, status=None)

@router.post("/offers", response_model=RecyclerOfferResponse)
def submit_recycler_offer(
    req: RecyclerOfferSubmit,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Submit formal purchase offer for an e-waste lot.
    - Validates offer rate against CPCB benchmark
    - Flags predatory undervaluation (>30% below fair market)
    - Records immutable OFFER_RECEIVED trace event
    """
    return RecyclerPortalService.submit_offer(db=db, data=req, current_user=current_user)

@router.patch("/offers/{id}", response_model=RecyclerOfferResponse)
def update_recycler_offer(
    id: str,
    req: RecyclerOfferUpdate,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Revise offer price or logistics availability on an open offer.
    """
    submit_data = RecyclerOfferSubmit(
        lot_id=id,
        offer_price_per_kg=req.offer_price_per_kg or 450.0,
        pickup_available=req.pickup_available if req.pickup_available is not None else True,
        notes=req.notes
    )
    return RecyclerPortalService.submit_offer(db=db, data=submit_data, current_user=current_user)

@router.post("/lots/{id}/accept")
def accept_lot(
    id: str,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Accept an e-waste lot into the formal processing pipeline.
    Advances status to ACCEPTED and triggers collector notification state.
    """
    return RecyclerPortalService.accept_lot(db=db, lot_id_or_pk=id, current_user=current_user)

@router.post("/lots/{id}/reject")
def reject_lot(
    id: str,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Reject an e-waste lot, returning it to the open collector marketplace.
    """
    return RecyclerPortalService.reject_lot(db=db, lot_id_or_pk=id, current_user=current_user)

# ============================================================
# 4. PICKUP LOGISTICS
# ============================================================

@router.get("/pickups", response_model=Dict[str, List[PickupRecordOut]])
def list_pickups(
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    List pickups categorized by Today's Pickups, Upcoming Pickups, and Completed.
    """
    return RecyclerPortalService.get_pickups(db=db, current_user=current_user)

@router.post("/pickups", response_model=PickupRecordOut)
def schedule_pickup(
    req: RecyclerPickupCreate,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Schedule authorized logistics transport to collector location.
    Records PICKUP_SCHEDULED trace event.
    """
    return RecyclerPortalService.schedule_pickup(db=db, data=req, current_user=current_user)

@router.patch("/pickups/{id}/status")
def update_pickup_status(
    id: int,
    req: RecyclerPickupStatusUpdate,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Update pickup status: SCHEDULED -> IN_PROGRESS -> ARRIVED -> COMPLETED.
    """
    return RecyclerPortalService.update_pickup_status(db=db, pickup_id=id, data=req, current_user=current_user)

# ============================================================
# 5. HANDOVER VERIFICATION & SCALE RECONCILIATION
# ============================================================

@router.get("/handover/{transaction_id}", response_model=HandoverVerifyDetail)
def get_handover_details(
    transaction_id: int,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Retrieve initial weight, fair price benchmark, and recycler offer for scale reconciliation.
    """
    return RecyclerPortalService.get_handover_details(db=db, txn_id=transaction_id, current_user=current_user)

@router.post("/handover/{transaction_id}", response_model=HandoverVerifyResult)
def confirm_handover(
    transaction_id: int,
    req: HandoverVerifySubmit,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Confirm physical material handover:
    - Verifies calibrated scale weight against initial AI intake
    - Automatically checks for scale variance > 25%
    - Locks final transaction value and generates immutable HANDOVER_VERIFIED trace event
    """
    return RecyclerPortalService.confirm_handover(db=db, txn_id=transaction_id, data=req, current_user=current_user)

# ============================================================
# 6. TRANSACTIONS & PAYMENT
# ============================================================

@router.get("/transactions")
def list_recycler_transactions(
    status: Optional[str] = Query(None, description="Filter by status"),
    material: Optional[str] = Query(None, description="Filter by material name"),
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Retrieve transaction ledger for this recycler with filtering options.
    """
    return RecyclerPortalService.get_transactions(db=db, current_user=current_user, status=status, material=material)

@router.get("/transactions/{id}")
def get_transaction_detail(
    id: int,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Full transaction audit dossier including complete pricing chain (AI -> Benchmark -> Offer -> Final Price)
    and chronological chain-of-custody trace events.
    """
    return RecyclerPortalService.get_transaction_detail(db=db, txn_id=id, current_user=current_user)

@router.patch("/transactions/{id}/payment-status")
def update_payment_status(
    id: int,
    req: PaymentStatusUpdateReq,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Update demo payment settlement status (PENDING -> PROCESSING -> PAID).
    When PAID, completes transaction and records PAYMENT_COMPLETED trace event.
    """
    return RecyclerPortalService.update_payment_status(db=db, txn_id=id, data=req, current_user=current_user)

# ============================================================
# 7. RECYCLER PROFILE
# ============================================================

@router.get("/profile")
def get_recycler_profile(
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Retrieve current recycler facility details, CPCB certification badge, and material handling capabilities.
    """
    return RecyclerPortalService.get_profile(db=db, current_user=current_user)

@router.patch("/profile")
def update_recycler_profile(
    req: RecyclerProfileUpdateReq,
    current_user: User = Depends(require_recycler),
    db: Session = Depends(get_db)
):
    """
    Update recycler operational settings (pickup radius, accepted materials, contact details).
    """
    return RecyclerPortalService.update_profile(db=db, data=req, current_user=current_user)
