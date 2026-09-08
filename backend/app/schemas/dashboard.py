from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class DateRangePeriod(BaseModel):
    label: str = "All Time"
    date_from: Optional[str] = None
    date_to: Optional[str] = None

class KPICardItem(BaseModel):
    label: str
    value: Any
    unit: Optional[str] = None
    trend_pct: Optional[float] = None
    trend_label: Optional[str] = "vs previous period"
    description: Optional[str] = None

class AdminDashboardStats(BaseModel):
    demo_data: bool = True
    system_status: str = "OPERATIONAL"
    period: DateRangePeriod
    total_collectors: int
    active_collectors: int
    verified_recyclers: int
    total_weight: float
    total_e_waste_collected_kg: float
    total_e_waste_tonnes: float
    total_transactions: int
    completed_transactions: int
    formalized_transactions_count: int
    total_transaction_value: float
    total_transaction_value_inr: float
    traceable_lots: int
    verified_handovers: int
    anomaly_count: int
    anomalies_flagged_count: int
    formalization_rate_pct: float
    average_collector_earnings_inr: float
    unsafe_disposal_risk_prevented_kg: float
    precious_metals_recovered_est_g: Dict[str, float]
    kpis: Dict[str, KPICardItem]

class AdminAnalyticsTrends(BaseModel):
    demo_data: bool = True
    monthly_collection_trend: List[Dict[str, Any]]
    material_distribution: List[Dict[str, Any]]
    price_trends: List[Dict[str, Any]]
    collector_earnings_trend: List[Dict[str, Any]]

class GeoHotspot(BaseModel):
    id: Optional[str] = None
    rank: Optional[int] = None
    name: Optional[str] = None
    type: Optional[str] = "COLLECTION_HUB"
    latitude: float
    longitude: float
    volume_kg: Optional[float] = 0.0
    weight_kg: Optional[float] = 0.0
    city: str
    location: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    lots: Optional[int] = 0
    lots_count: Optional[int] = 0
    lot_count: Optional[int] = 0
    value_inr: Optional[float] = 0.0
    transaction_value_inr: Optional[float] = 0.0

class FormalizationFunnelStage(BaseModel):
    stage_id: str
    stage_name: str
    count: int
    retained_pct: float
    drop_off_pct: float
    notes: str

class CollectorImpactStats(BaseModel):
    demo_data: bool = True
    total_collector_value_inr: float
    average_transaction_value_inr: float
    average_value_per_kg_inr: float
    completed_transactions: int
    active_collectors: int
    top_material_by_earnings: str
    earnings_over_time: List[Dict[str, Any]]
    baseline_note: str = "Baseline comparison requires field-study data."

class PriceFairnessStats(BaseModel):
    demo_data: bool = True
    average_offered_price: float
    average_final_price: float
    average_fair_price: float
    average_variance_pct: float
    offers_below_fair_range: int
    offers_within_fair_range: int
    offers_above_fair_range: int
    below_fair_pct: float
    within_fair_pct: float
    above_fair_pct: float
    anomalies_detected: int
    top_materials: List[Dict[str, Any]]
    top_recyclers: List[Dict[str, Any]]

class RecyclerPerformanceItem(BaseModel):
    id: int
    facility_name: str
    city: str
    authorization_status: str
    lots_received: int
    offers_made: int
    accepted_lots: int
    completed_pickups: int
    verified_handovers: int
    average_offer_rate: float
    reliability_score: float
    status: str

class TransactionPipelineStats(BaseModel):
    demo_data: bool = True
    stages: Dict[str, int]
    total_in_pipeline: int
    completed_count: int
    total_volume_kg: float
    total_payout_inr: float

class TraceabilityAnalyticsStats(BaseModel):
    demo_data: bool = True
    traceable_lots: int
    qr_generated: int
    qr_scanned: int
    unique_trace_views: int
    recycler_scans: int
    public_trace_views: int
    verified_handovers: int
    completed_traces: int
    valid_traces: int
    invalid_traces: int
    integrity_status: str = "✓ NO TRACE INTEGRITY ISSUES DETECTED"
    lifecycle_completion_rate: float

class AIAnalyticsStats(BaseModel):
    demo_data: bool = True
    model_type: str = "PROTOTYPE AI"
    ai_identifications_count: int
    average_confidence: float
    confidence_distribution: Dict[str, int]
    low_confidence_count: int
    supported_categories_count: int
    ai_anomalies_count: int

class SafetyAnalyticsStats(BaseModel):
    demo_data: bool = True
    safety_guide_views: int
    high_hazard_lots: int
    medium_hazard_lots: int
    low_hazard_lots: int
    high_hazard_pct: float
    safety_alerts_count: int

class ImpactScorecardStats(BaseModel):
    demo_data: bool = True
    environmental: Dict[str, Any]
    economic: Dict[str, Any]
    governance: Dict[str, Any]
    social: Dict[str, Any]
    circularity: Dict[str, Any]

class AnomalyActionRequest(BaseModel):
    new_status: str
    notes: Optional[str] = None

class AdminSearchResponse(BaseModel):
    query: str
    traces: List[Dict[str, Any]]
    lots: List[Dict[str, Any]]
    transactions: List[Dict[str, Any]]
    recyclers: List[Dict[str, Any]]
    materials: List[Dict[str, Any]]
