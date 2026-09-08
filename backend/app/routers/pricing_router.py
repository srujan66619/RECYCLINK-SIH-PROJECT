from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.pricing import (
    FairPriceService, PriceEstimateRequest,
    FairPriceEstimateResponse, PriceHistoryRecord, PriceTrendResponse
)

router = APIRouter(prefix="/api/pricing", tags=["Pricing Engine & Commercial Intelligence"])

@router.post("/estimate", response_model=FairPriceEstimateResponse)
def estimate_fair_price(req: PriceEstimateRequest, db: Session = Depends(get_db)):
    """
    Compute transparent fair market price range, benchmark rates, confidence,
    trend, and ranked recycler offer classifications for an e-waste lot.
    """
    weight = req.weight_kg if req.weight_kg is not None else (req.weight if req.weight is not None else 1.0)
    material_name = req.material or "PCB"
    location_city = req.location_city or "Hyderabad"
    condition = req.condition or "Standard Scrap"

    return FairPriceService.estimate_price(
        db=db,
        material_name=material_name,
        material_id=req.material_id,
        weight_kg=weight,
        condition=condition,
        location_id=req.location_id,
        location_city=location_city
    )

@router.get("/history", response_model=List[PriceHistoryRecord])
def get_pricing_history(
    material: Optional[str] = Query("PCB", description="Material name to filter history"),
    material_id: Optional[int] = Query(None, description="Material ID"),
    location_id: Optional[int] = Query(None, description="Location ID"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Fetch historical benchmark rates for material price trend charts and auditability.
    """
    return FairPriceService.get_price_history(
        db=db,
        material_id=material_id,
        location_id=location_id,
        material_name=material
    )

@router.get("/trend/{material_id}", response_model=PriceTrendResponse)
def get_pricing_trend(material_id: int, db: Session = Depends(get_db)):
    """
    Analyze rolling commodity price trends, percentage change, and volatility for a material.
    """
    return FairPriceService.get_price_trend(db=db, material_id=material_id)
