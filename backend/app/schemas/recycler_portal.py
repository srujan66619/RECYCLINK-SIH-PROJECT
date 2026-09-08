from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class RecyclerDashboardStats(BaseModel):
    facility_name: str
    authorization_status: str
    authorization_number: str
    reliability_score: float
    incoming_lots_count: int
    pending_offers_count: int
    accepted_lots_count: int
    scheduled_pickups_count: int
    completed_transactions_count: int
    total_weight_kg: float
    total_purchase_value: float
    recent_incoming_lots: List[Dict[str, Any]] = []
    today_pickups: List[Dict[str, Any]] = []
    recent_transactions: List[Dict[str, Any]] = []

class RecyclerIncomingLotOut(BaseModel):
    id: int
    lot_id: str
    trace_id: str
    material: str
    subcategory: Optional[str] = None
    weight_kg: float
    collector_area: str
    collector_city: str
    ai_estimate_min: float
    ai_estimate_max: float
    recommended_price: float
    distance_km: float
    status: str
    created_date: datetime
    is_recommended: bool = True
    recommendation_reason: Optional[str] = None

class RecyclerLotDetailOut(BaseModel):
    id: int
    lot_id: str
    trace_id: str
    material_name: str
    subcategory: Optional[str] = None
    photo_url: Optional[str] = None
    estimated_weight: float
    condition: Optional[str] = "Standard Scrap"
    ai_classification: str
    ai_confidence: float
    ai_confidence_label: str = "Prototype AI Prediction"
    hazard_level: str
    recoverable_materials: List[str] = []
    estimated_price_min: float
    estimated_price_max: float
    recommended_price: float
    collector_area: str
    collector_city: str
    distance_km: float
    status: str
    created_at: datetime
    existing_offer: Optional[Dict[str, Any]] = None
    transaction: Optional[Dict[str, Any]] = None

class RecyclerOfferSubmit(BaseModel):
    lot_id: str
    offer_price_per_kg: float = Field(..., gt=0, description="Rate per kg in INR")
    pickup_available: bool = True
    scheduled_pickup_date: Optional[datetime] = None
    pickup_time_window: Optional[str] = "10:00 AM - 01:00 PM"
    notes: Optional[str] = None

class RecyclerOfferUpdate(BaseModel):
    offer_price_per_kg: Optional[float] = Field(None, gt=0)
    pickup_available: Optional[bool] = None
    notes: Optional[str] = None

class RecyclerOfferResponse(BaseModel):
    offer_id: Optional[int] = None
    transaction_id: Optional[int] = None
    lot_id: str
    offer_price_per_kg: float
    total_estimated_amount: float
    fairness_status: str # GOOD OFFER, FAIR, BELOW FAIR, UNUSUAL
    fairness_warning: Optional[str] = None
    status: str
    message: str

class RecyclerPickupCreate(BaseModel):
    transaction_id: int
    scheduled_date: datetime
    time_window: str = "10:00 AM - 01:00 PM"
    pickup_notes: Optional[str] = None

class RecyclerPickupStatusUpdate(BaseModel):
    status: str # SCHEDULED, IN_PROGRESS, ARRIVED, COMPLETED, CANCELLED
    notes: Optional[str] = None

class PickupRecordOut(BaseModel):
    id: int
    transaction_id: int
    lot_id: Optional[int] = None
    lot_code: Optional[str] = None
    trace_id: Optional[str] = None
    material_name: Optional[str] = None
    weight_kg: Optional[float] = None
    collector_area: Optional[str] = None
    scheduled_date: datetime
    time_window: str
    status: str
    pickup_notes: Optional[str] = None
    created_at: datetime

class HandoverVerifyDetail(BaseModel):
    transaction_id: int
    lot_id: str
    trace_id: str
    material: str
    initial_estimated_weight: float
    fair_price_min: float
    fair_price_max: float
    fair_recommended_rate: float
    recycler_offer_rate: float
    offered_total: float
    collector_area: str
    status: str

class HandoverVerifySubmit(BaseModel):
    final_verified_weight: float = Field(..., gt=0, description="Calibrated scale weight in kg")
    final_agreed_rate_per_kg: Optional[float] = None
    final_price: Optional[float] = None
    condition: Optional[str] = "Standard Scrap"
    remarks: Optional[str] = "Verified on digital scale"
    notes: Optional[str] = None
    photo_proof_url: Optional[str] = None
    recycler_signature: Optional[str] = None

class HandoverVerifyResult(BaseModel):
    handover_id: int
    transaction_id: int
    lot_id: str
    trace_id: str
    initial_weight: float
    final_weight: float
    weight_difference_kg: float
    variance_pct: float
    is_variance_anomaly: bool
    variance_warning: Optional[str] = None
    final_rate_per_kg: float
    final_price: float
    status: str
    message: str

class PaymentStatusUpdateReq(BaseModel):
    payment_status: str # PENDING, PROCESSING, PAID, FAILED
    payment_method: Optional[str] = "UPI Instant Transfer"
    payment_notes: Optional[str] = None

class RecyclerProfileUpdateReq(BaseModel):
    facility_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    accepted_materials: Optional[List[str]] = None
    service_radius_km: Optional[float] = None
    pickup_available: Optional[bool] = None
    pickup_min_weight_kg: Optional[float] = None
