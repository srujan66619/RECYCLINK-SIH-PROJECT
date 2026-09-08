from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel

class RecyclerOut(BaseModel):
    id: int
    user_id: int
    facility_name: str
    authorization_status: str
    authorization_number: str
    contact_phone: str
    contact_email: Optional[str]
    city: str
    state: str
    latitude: float
    longitude: float
    accepted_materials: List[str]
    service_radius_km: float
    pickup_available: bool
    reliability_score: float
    rating: float
    is_active: bool
    created_at: datetime
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

class RecyclerRecommendedOut(BaseModel):
    id: int
    recycler_id: Optional[int] = None
    facility_name: str
    authorization_no: str
    authorization_status: str
    distance_km: float
    distance_label: Optional[str] = None
    accepted_materials: List[str] = []
    offer_price: Optional[float] = None
    offered_price_per_kg: float
    pickup_available: bool
    rating: float
    reliability_score: float
    overall_score: Optional[float] = None
    match_reasons: Optional[List[str]] = None
    component_scores: Optional[Dict[str, float]] = None
    city: str
    service_radius_km: float

class RecyclerOfferCreate(BaseModel):
    material_id: int
    offer_price_per_kg: float
    min_weight_kg: float = 1.0
    pickup_available: bool = True
