from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.lot import LotOut

class TransactionCreate(BaseModel):
    lot_id: int
    recycler_id: int
    agreed_price_per_kg: float
    scheduled_pickup_time: Optional[datetime] = None

class TransactionStatusUpdate(BaseModel):
    status: str

class HandoverRequest(BaseModel):
    final_verified_weight: float
    final_agreed_rate_per_kg: float
    remarks: Optional[str] = "Verified on calibrated digital scale"
    recycler_signature: Optional[str] = "SIGN-VERIFIED"
    collector_confirmation: bool = True
    photo_proof_url: Optional[str] = None

class HandoverResponse(BaseModel):
    handover_id: int
    transaction_id: int
    lot_id: int
    trace_id: str
    verified_weight_kg: float
    weight_discrepancy_pct: float
    final_rate_per_kg: float
    final_amount_paid: float
    handover_timestamp: datetime
    status: str
    qr_trace_url: str
    message: str

class TransactionOut(BaseModel):
    id: int
    lot_id: int
    collector_id: int
    recycler_id: int
    quoted_price: Optional[float]
    agreed_price_per_kg: float
    final_weight: Optional[float]
    final_price: Optional[float]
    total_amount: Optional[float]
    payment_status: str
    payment_method: str
    payment_ref: Optional[str]
    status: str
    scheduled_pickup_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    lot: Optional[LotOut] = None

    class Config:
        from_attributes = True
