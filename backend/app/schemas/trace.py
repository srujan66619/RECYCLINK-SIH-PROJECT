from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TraceEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lot_id: int
    trace_id: Optional[str] = None
    event_type: str
    stage: str
    event_status: Optional[str] = "COMPLETED"
    title: Optional[str] = None
    description: str
    actor_id: Optional[int] = None
    actor_role: str = "SYSTEM"
    actor_name: str = "RECYCLINK Intelligence"
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_url: Optional[str] = None
    previous_event_hash: Optional[str] = None
    event_hash: Optional[str] = None
    event_timestamp: datetime
    timestamp: datetime
    metadata_json: Optional[Dict[str, Any]] = None

class TraceIntegrityOut(BaseModel):
    trace_id: str
    status: str
    integrity_status: str
    events_checked: int
    verified_at: Optional[str] = None
    message: Optional[str] = None

class TraceHandoverSummary(BaseModel):
    handover_id: Optional[str] = None
    initial_weight: float
    final_weight: float
    weight_variance_pct: float
    quoted_price: Optional[float] = None
    final_price: float
    status: str = "VERIFIED"
    handover_timestamp: Optional[str] = None

class TraceRecyclerSummary(BaseModel):
    name: str
    authorization_status: str = "VERIFIED_DEMO"
    authorization_no: Optional[str] = None
    city: Optional[str] = None

class TraceProvenanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    trace_id: str
    lot_id: str
    material: str
    subcategory: Optional[str] = None
    status: str
    current_status: str
    initial_weight: float
    estimated_weight: float
    final_weight: Optional[float] = None
    quoted_price: Optional[float] = None
    final_price: Optional[float] = None
    final_amount_paid: Optional[float] = None
    
    # Safe Privacy-Compliant Collector Attributes
    collector_type: str = "Verified Informal Collector"
    collector_city: str = "Hyderabad, TS"
    location_label: str = "Location Verified (CPCB Hub)"
    
    # Recycler Attributes
    recycler: Optional[TraceRecyclerSummary] = None
    recycler_name: Optional[str] = None
    recycler_auth_no: Optional[str] = None
    
    # Handover & Receipt
    handover: Optional[TraceHandoverSummary] = None
    
    # Dates
    collection_date: Optional[str] = None
    handover_date: Optional[str] = None
    created_at: datetime
    
    # Integrity & QR
    integrity: TraceIntegrityOut
    qr_code_base64: Optional[str] = None
    hazard_level: Optional[str] = "MEDIUM"
    
    # Event Streams
    events: List[TraceEventOut] = []
    timeline: List[TraceEventOut] = []

class TraceAnalyticsOut(BaseModel):
    total_traceable_lots: int
    completed_transactions: int
    active_lots: int
    pending_handover: int
    verified_handovers: int
    total_weight_tracked_kg: float
    total_collector_value: float
    trace_integrity_valid_pct: float
    anomalies_detected: int
    is_demo_data: bool = True

class TraceListItemOut(BaseModel):
    trace_id: str
    lot_id: str
    material: str
    initial_weight: float
    final_weight: Optional[float] = None
    recycler_name: Optional[str] = None
    status: str
    created_at: str
    completed_at: Optional[str] = None
    integrity_status: str
    discrepancy_flagged: bool = False
