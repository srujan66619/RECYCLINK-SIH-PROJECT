from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class HandoverCreateRequest(BaseModel):
    lot_id: Optional[Any] = None
    transaction_id: Optional[int] = None
    final_weight: float
    final_price: float
    condition: Optional[str] = "Standard Handover"
    notes: Optional[str] = None
    photo: Optional[str] = None

class HandoverResponseOut(BaseModel):
    handover_id: str
    trace_id: str
    lot_id: str
    status: str
    initial_weight: float
    final_weight: float
    variance_pct: float
    discrepancy_flagged: bool
    quoted_price: Optional[float] = None
    final_price: float
    receipt_url: str
    created_at: str

class DigitalReceiptOut(BaseModel):
    handover_id: str
    trace_id: str
    lot_id: str
    material: str
    initial_weight: float
    final_weight: float
    weight_variance_pct: float
    quoted_price: Optional[float] = None
    final_price: float
    recycler: Dict[str, Any]
    status: str
    handover_timestamp: Optional[str] = None
    notes: Optional[str] = None
    evidence_photo: Optional[str] = None
    qr_code_base64: Optional[str] = None
