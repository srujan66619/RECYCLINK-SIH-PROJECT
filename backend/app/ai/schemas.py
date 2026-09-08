from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ImageValidationErrorDetail(BaseModel):
    code: str
    message: str

class ImageValidationResponse(BaseModel):
    success: bool
    error: Optional[ImageValidationErrorDetail] = None

class MaterialClassifyResponse(BaseModel):
    prediction_id: Optional[int] = None
    detected_material: str
    material_category: str
    material_subcategory: str
    confidence: float
    confidence_score: float
    confidence_band: str = "HIGH CONFIDENCE"
    hazard_level: str
    estimated_weight: Optional[float] = None
    estimated_weight_kg: Optional[float] = None
    estimated_value_min: float
    estimated_value_max: float
    estimated_value_range: Dict[str, float]
    recommended_fair_price: float
    recoverable_materials: List[str]
    model_name: str = "recycLink-demo-classifier"
    model_version: str = "1.0-demo"
    is_demo_prediction: bool = True
    explanation: str
    safety_summary: str
    sample_image_url: Optional[str] = None

class ValueEstimateRequest(BaseModel):
    material_id: Optional[int] = None
    material_name: Optional[str] = "PCB"
    weight: float = Field(..., gt=0, description="Weight in kilograms")
    location_id: Optional[int] = None
    condition: Optional[str] = "GOOD"

class ValueEstimateResponse(BaseModel):
    material: str
    weight: float
    estimated_min: float
    estimated_max: float
    recommended_value: float
    confidence: float
    method: str = "DEMO_PRICE_MODEL"
    currency: str = "INR"
    is_demo_estimate: bool = True

class AnomalyDetectionRequest(BaseModel):
    material_id: Optional[int] = None
    material_name: Optional[str] = "PCB"
    expected_price: float = Field(..., gt=0)
    offered_price: float = Field(..., gt=0)
    weight: Optional[float] = None
    transaction_id: Optional[int] = None
    lot_id: Optional[int] = None

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    severity: str
    reason: str
    difference_percent: float
    alert_type: Optional[str] = None
    alert_id: Optional[int] = None

class ManualClassificationRequest(BaseModel):
    material_category: str
    weight: Optional[float] = None
    lot_id: Optional[int] = None
    notes: Optional[str] = None

class TopMaterialItem(BaseModel):
    material: str
    count: int

class AIAnalyticsResponse(BaseModel):
    total_predictions: int
    high_confidence_predictions: int
    medium_confidence_predictions: int
    low_confidence_predictions: int
    manual_classifications: int
    anomalies_detected: int
    top_materials: List[TopMaterialItem]
