from typing import Optional, Dict, Any
from pydantic import BaseModel

class AnomalyCheckRequest(BaseModel):
    material_name: Optional[str] = "PCB"
    material_id: Optional[int] = None
    weight_kg: Optional[float] = 1.0
    expected_price: Optional[float] = None
    offered_price: float
    recycler_id: Optional[int] = None
    collector_id: Optional[int] = None
    transaction_id: Optional[int] = None
    lot_id: Optional[int] = None

class AnomalyCheckResult(BaseModel):
    is_anomaly: bool
    severity: str = "NONE"  # LOW, MEDIUM, HIGH, NONE
    alert_type: Optional[str] = None
    reason: str
    difference_percent: float = 0.0
    expected_value: float = 0.0
    actual_value: float = 0.0
    recommended_action: str = "Proceed"
    alert_id: Optional[int] = None
