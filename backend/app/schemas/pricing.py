from typing import List, Optional, Dict
from pydantic import BaseModel

class PriceEstimateRequest(BaseModel):
    material_id: Optional[int] = None
    material: Optional[str] = "PCB"
    weight_kg: Optional[float] = None
    weight: Optional[float] = None
    location_id: Optional[int] = None
    location_city: Optional[str] = "Hyderabad"
    condition: Optional[str] = "Standard Scrap"

class RecyclerOfferComparison(BaseModel):
    recycler_id: int
    recycler_name: str
    distance_km: float
    offer_rate_per_kg: float
    total_offer_amount: float
    status_label: str
    pickup_available: bool

class PriceEstimateResponse(BaseModel):
    material: str
    weight_kg: float
    market_min: float
    market_max: float
    recommended_price: float
    market_range_min_per_kg: float
    market_range_max_per_kg: float
    recommended_fair_price_per_kg: float
    total_estimated_value: float
    price_status: str # "BELOW_FAIR", "FAIR", "GOOD_OFFER"
    assessment_tier: str
    total_value_range: Dict[str, float]
    nearby_recycler_offers: List[RecyclerOfferComparison]
