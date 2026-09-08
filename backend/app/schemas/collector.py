from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CollectorProfileOut(BaseModel):
    id: int
    user_id: int
    preferred_language: str
    city: str
    state: str
    area: Optional[str]
    pincode: str
    upi_id: Optional[str]
    total_earnings: float
    total_weight_collected: float
    rating: float
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CollectorDashboardStats(BaseModel):
    collector_id: int
    collector_name: str
    city: str
    today_earnings: float
    total_earnings: float
    active_lots_count: int
    pending_pickups_count: int
    completed_tx_count: int
    total_kg_collected: float
    rating: float
