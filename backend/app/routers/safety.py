from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.entities import SafetyGuide
from app.schemas.schemas import SafetyGuideOut

router = APIRouter(prefix="/api/safety-guides", tags=["Safety Intelligence"])

@router.get("", response_model=List[SafetyGuideOut])
def get_safety_guides(lang: str = "en", db: Session = Depends(get_db)):
    """
    Fetch pictorial safety warnings and guidelines tailored for informal kabadiwalas.
    """
    guides = db.query(SafetyGuide).filter(SafetyGuide.language == lang).all()
    if not guides:
        # Fallback to English if specified language is missing records
        guides = db.query(SafetyGuide).filter(SafetyGuide.language == "en").all()
    return guides
