from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class MaterialCategoryOut(BaseModel):
    id: int
    code: str
    name: str
    category: str
    subcategory: Optional[str]
    description: Optional[str]
    hazard_level: str
    unit: str
    base_market_price_min: float
    base_market_price_max: float
    current_benchmark_price: float
    recoverable_materials: List[str]
    icon_name: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialCreate(BaseModel):
    code: str
    name: str
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    hazard_level: str = "MEDIUM"
    base_market_price_min: float
    base_market_price_max: float
    current_benchmark_price: float
    recoverable_materials: List[str] = []
