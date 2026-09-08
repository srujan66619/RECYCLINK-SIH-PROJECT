from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class LotCreate(BaseModel):
    material_id: Optional[int] = None
    material_name: str
    subcategory: Optional[str] = "Standard Grade"
    weight_kg: float
    quoted_price: Optional[float] = None
    location_address: Optional[str] = "Hyderabad, India"
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    photo_url: Optional[str] = None
    ai_confidence: Optional[float] = 0.94
    hazard_level: Optional[str] = "MEDIUM"
    condition: Optional[str] = "Standard Scrap"

class LotUpdate(BaseModel):
    weight_kg: Optional[float] = None
    quoted_price: Optional[float] = None
    condition: Optional[str] = None
    status: Optional[str] = None

class LotCreationResponse(BaseModel):
    lot_id: str
    trace_id: str
    status: str
    created_at: datetime

class LotOut(BaseModel):
    id: int
    lot_id: str
    trace_id: str
    collector_id: int
    material_id: Optional[int]
    material_name: str
    subcategory: Optional[str]
    estimated_weight: float
    final_weight: Optional[float]
    ai_confidence: float
    hazard_level: str
    estimated_price_min: float
    estimated_price_max: float
    recommended_price: float
    quoted_price: Optional[float]
    final_price: Optional[float]
    condition: Optional[str]
    status: str
    location_address: Optional[str]
    qr_code_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
