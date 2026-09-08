from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class MatchComponentScores(BaseModel):
    authorization_score: float = 100.0
    material_score: float = 100.0
    price_score: float = 80.0
    distance_score: float = 80.0
    pickup_score: float = 100.0
    reliability_score: float = 90.0

class RecommendedRecycler(BaseModel):
    recycler_id: int
    id: int  # For compatibility with legacy frontend
    facility_name: str
    authorization_no: str
    authorization_status: str
    distance_km: float
    distance_label: str = "Regional"
    offer_price: float
    offered_price_per_kg: float  # For compatibility
    pickup_available: bool
    rating: float
    reliability_score: float
    overall_score: float
    component_scores: MatchComponentScores
    match_reasons: List[str]
    accepted_materials: List[str] = []
    city: str
    state: str
    service_radius_km: float = 40.0
    is_compatible: bool = True

class RecyclerOfferDetail(BaseModel):
    id: int
    recycler_id: int
    material_id: int
    material_name: Optional[str] = None
    offer_price_per_kg: float
    min_weight_kg: float = 1.0
    pickup_available: bool = True
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True
