from app.schemas.auth import *
from app.schemas.collector import *
from app.schemas.recycler import *
from app.schemas.material import *
from app.schemas.lot import *
from app.schemas.transaction import *
from app.schemas.pricing import *
from app.schemas.trace import *
from app.schemas.dashboard import *

# Bridge for legacy schemas.py imports
from app.models.safety_guide import SafetyGuide
from app.models.anomaly_alert import AnomalyAlert

class SafetyGuideOut(BaseModel):
    id: int
    title: str
    material_category: str
    hazard_type: str
    danger_description: str
    safe_practice_description: str
    pictorial_icon: str
    dos: List[str]
    donts: List[str]
    language: str

    class Config:
        from_attributes = True

class AnomalyAlertOut(BaseModel):
    id: int
    transaction_id: Optional[int]
    lot_id: Optional[int]
    alert_type: str
    severity: str
    description: str
    deviation_pct: float
    benchmark_value: float
    actual_value: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialClassifyRequest(BaseModel):
    image_base64: Optional[str] = None
    sample_key: Optional[str] = None
    location: Optional[str] = "Hyderabad"

class MaterialClassifyResponse(BaseModel):
    detected_material: str
    material_category: str
    material_subcategory: str
    confidence: float
    estimated_weight_kg: float
    estimated_value_range: Dict[str, float]
    recommended_fair_price: float
    hazard_level: str
    recoverable_materials: List[str]
    safety_summary: str
    sample_image_url: Optional[str] = None
