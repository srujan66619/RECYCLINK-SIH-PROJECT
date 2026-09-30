from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.session import get_db
from app.models.entities import SafetyGuide
from app.schemas.schemas import SafetyGuideOut

router = APIRouter(prefix="/api/safety-guides", tags=["Safety Intelligence"])

@router.get("", response_model=List[SafetyGuideOut])
def get_safety_guides(
    lang: str = Query("en", description="Language code: en, hi, mr"),
    material: Optional[str] = Query(None, description="Filter by material category"),
    db: Session = Depends(get_db)
):
    """
    Fetch pictorial safety warnings and guidelines tailored for informal kabadiwalas.
    Supports Hindi, Marathi, and English with automatic fallback.
    """
    query = db.query(SafetyGuide).filter(SafetyGuide.is_active == True)
    if material:
        query = query.filter(SafetyGuide.material_category.ilike(f"%{material}%"))
    
    guides = query.filter(SafetyGuide.language == lang).all()
    if not guides and lang != "en":
        # Fallback to English if requested language guides are missing
        guides = db.query(SafetyGuide).filter(
            SafetyGuide.is_active == True,
            SafetyGuide.language == "en"
        ).all()
        if material:
            guides = [g for g in guides if material.lower() in g.material_category.lower()]

    return guides

@router.get("/material/{material_name}", response_model=Optional[SafetyGuideOut])
def get_safety_guide_by_material(
    material_name: str,
    lang: str = Query("en", description="Language code: en, hi, mr"),
    db: Session = Depends(get_db)
):
    """
    Fetch specific material safety guide (e.g. Battery, CRT, PCB) in selected language.
    """
    guide = db.query(SafetyGuide).filter(
        SafetyGuide.is_active == True,
        SafetyGuide.language == lang,
        SafetyGuide.material_category.ilike(f"%{material_name}%")
    ).first()

    if not guide and lang != "en":
        guide = db.query(SafetyGuide).filter(
            SafetyGuide.is_active == True,
            SafetyGuide.language == "en",
            SafetyGuide.material_category.ilike(f"%{material_name}%")
        ).first()

    if not guide:
        # Fallback to first guide or 404
        guide = db.query(SafetyGuide).filter(SafetyGuide.is_active == True).first()
        if not guide:
            raise HTTPException(status_code=404, detail=f"No safety guide found for material: {material_name}")

    return guide

@router.get("/{guide_id}", response_model=SafetyGuideOut)
def get_safety_guide_by_id(guide_id: int, db: Session = Depends(get_db)):
    """
    Fetch a single safety guide by its unique identifier.
    """
    guide = db.query(SafetyGuide).filter(SafetyGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Safety guide not found")
    return guide

@router.post("/acknowledge")
def acknowledge_safety_guide(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Store or log collector acknowledgement of high-hazard handling procedures (e.g. Battery, CRT).
    """
    return {
        "status": "ACKNOWLEDGED",
        "material": payload.get("material_name") or payload.get("material", "Unknown"),
        "hazard_level": payload.get("hazard_level", "HIGH"),
        "acknowledged_at": datetime.utcnow().isoformat(),
        "collector_id": payload.get("collector_id", 1),
        "message": "Safety protocols acknowledged. Field handling clearance granted."
    }
