from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.recycler import RecyclerOut
from app.services.recycler_service import RecyclerService
from app.matching import RecyclerMatchingService, RecommendedRecycler, RecyclerOfferDetail

router = APIRouter(prefix="/api/recyclers", tags=["Recyclers & Smart Matching"])

@router.get("", response_model=List[RecyclerOut])
def list_recyclers(
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    """
    List all registered and authorized e-waste recyclers.
    """
    return RecyclerService.get_recyclers(db=db, city=city)

@router.get("/recommended", response_model=List[RecommendedRecycler])
def get_recommended_recyclers(
    material: str = Query("PCB", description="Material to recycle"),
    material_id: Optional[int] = Query(None, description="Material ID (optional)"),
    location_id: Optional[int] = Query(None, description="Location ID (optional)"),
    weight: float = Query(2.4, description="Weight in kg"),
    condition: str = Query("Standard Scrap", description="Material condition"),
    lat: float = Query(17.3850, description="Collector latitude"),
    lon: float = Query(78.4867, description="Collector longitude"),
    city: Optional[str] = Query(None, description="Collector city"),
    db: Session = Depends(get_db)
):
    """
    Intelligent recycler recommendation ranking based on authorization (30%), material compatibility (20%),
    offered rate (20%), proximity (10%), pickup feasibility (10%), and verified reliability (10%).
    """
    return RecyclerMatchingService.get_recommended_recyclers(
        db=db,
        material_name=material,
        material_id=material_id,
        weight_kg=weight,
        condition=condition,
        location_id=location_id,
        collector_lat=lat,
        collector_lon=lon,
        collector_city=city or "Hyderabad"
    )

@router.get("/{id}/offers", response_model=List[RecyclerOfferDetail])
def get_recycler_offers(id: int, db: Session = Depends(get_db)):
    """
    Retrieve active commodity purchase offers posted by this authorized recycler.
    """
    return RecyclerMatchingService.get_recycler_offers(db=db, recycler_id=id)

@router.get("/{id}", response_model=RecyclerOut)
def get_recycler(id: int, db: Session = Depends(get_db)):
    """
    Get detailed recycler profile by ID.
    """
    return RecyclerService.get_recycler_by_id(db=db, recycler_id=id)
