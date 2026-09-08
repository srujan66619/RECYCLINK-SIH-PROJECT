import enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class PriceConfidenceLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class PriceTrendDirection(str, enum.Enum):
    RISING = "RISING"
    STABLE = "STABLE"
    FALLING = "FALLING"
    INSUFFICIENT_DATA = "INSUFFICIENT DATA"

class OfferTier(str, enum.Enum):
    BELOW_FAIR = "BELOW FAIR"
    FAIR = "FAIR"
    GOOD_OFFER = "GOOD OFFER"

class PriceEstimateRequest(BaseModel):
    material_id: Optional[int] = None
    material: Optional[str] = "PCB"
    weight_kg: Optional[float] = None
    weight: Optional[float] = None
    condition: Optional[str] = "Standard Scrap"
    location_id: Optional[int] = None
    location_city: Optional[str] = "Hyderabad"

class OfferComparisonItem(BaseModel):
    recycler_id: int
    facility_name: str
    recycler_name: Optional[str] = None
    authorization_status: str = "VERIFIED_DEMO"
    distance_km: float
    offer_rate_per_kg: float
    total_offer_amount: float
    status_label: str  # "GOOD OFFER", "FAIR", "BELOW FAIR"
    status_tier: str = "FAIR"
    pickup_available: bool = True
    difference_percent: float = 0.0

class PriceHistoryRecord(BaseModel):
    id: Optional[int] = None
    date: str
    price: float
    benchmark_price: float
    market_min: float
    market_max: float
    material: str
    location: str

class PriceTrendResponse(BaseModel):
    material_id: Optional[int] = None
    material_name: str
    average: float
    minimum: float
    maximum: float
    trend: str
    percentage_change: float
    observation_count: int
    period_days: int = 90
    recent_average: Optional[float] = None
    older_average: Optional[float] = None

class FairPriceEstimateResponse(BaseModel):
    material: str
    material_id: Optional[int] = None
    weight: float
    weight_kg: float
    market_min: float
    market_max: float
    recommended_price: float
    price_per_unit: float
    market_range_min_per_kg: float
    market_range_max_per_kg: float
    recommended_fair_price_per_kg: float
    total_estimated_value: float
    total_value_range: Dict[str, float]
    confidence: str  # HIGH, MEDIUM, LOW
    confidence_score: float
    confidence_reason: str
    trend: str  # RISING, STABLE, FALLING, INSUFFICIENT DATA
    percentage_change: float
    explanation: str
    condition_adjustment: float = 1.0
    location_factor: float = 1.0
    price_status: str = "FAIR"
    assessment_tier: str = "FAIR"
    nearby_recycler_offers: List[OfferComparisonItem] = []
