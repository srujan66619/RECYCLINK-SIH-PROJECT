from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class RecommendationActionRequest(BaseModel):
    action: str  # ACCEPT, DISMISS, REVIEW
    admin_notes: Optional[str] = None

class RecommendationOut(BaseModel):
    id: int
    recommendation_code: str
    title: str
    category: str
    priority: str
    status: str
    material: Optional[str] = None
    affected_lots_count: int = 0
    affected_weight_kg: float = 0.0
    target_recycler_id: Optional[int] = None
    target_recycler_name: Optional[str] = None
    reason: str
    expected_effect: str
    recommended_action: str
    evidence: Optional[Dict[str, Any]] = None
    counterfactual: Optional[Dict[str, Any]] = None
    admin_id: Optional[int] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

class DecisionHistoryOut(BaseModel):
    id: int
    recommendation_id: Optional[int] = None
    recommendation_code: Optional[str] = None
    admin_id: int
    admin_name: str
    decision: str
    action_taken: str
    evidence_reference: Optional[str] = None
    decision_time: datetime
    execution_result: Optional[str] = "SUCCESS"
    outcome_status: str = "VERIFIED"
    outcome_notes: Optional[str] = None
    created_at: datetime

class TraceAlertOut(BaseModel):
    id: int
    trace_id: str
    current_stage: str
    alert_type: str
    severity: str
    pending_duration_hours: float
    description: str
    recommended_action: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

class TraceAlertActionRequest(BaseModel):
    action: str  # RESOLVE, DISMISS
    notes: Optional[str] = None

class BottleneckItem(BaseModel):
    category: str  # CAPACITY_PRESSURE, PICKUP_PRESSURE, HANDOVER_DELAY, RECYCLER_SHORTAGE, MATERIAL_MISMATCH, REGIONAL_GAP
    priority: str  # HIGH, MEDIUM, LOW
    material: Optional[str] = None
    affected_lots: int = 0
    pending_weight_kg: float = 0.0
    available_capacity_status: str
    what_happened: str
    why: str
    affected_entities: str
    what_can_be_done: str

class TrendItem(BaseModel):
    metric: str
    current_period_val: float
    prev_period_val: float
    change_pct: float
    trend_direction: str  # Increasing, Stable, Decreasing
    unit: str
    explanation: str

class MaterialForecastItem(BaseModel):
    material: str
    current_kg: float
    expected_next_period_kg: float
    confidence_score: float
    confidence_label: str  # HIGH, MEDIUM, LOW
    estimate_label: str = "ESTIMATE"
    why_this_forecast: List[str]
    is_sufficient_data: bool

class CircularOpportunityItem(BaseModel):
    id: str
    title: str
    opportunity_type: str
    region_or_material: str
    collection_activity: str
    formal_handover_activity: str
    gap_status: str
    recommended_investigation: str
    estimated_impact: str

class CollectorInsightsOut(BaseModel):
    collector_id: int
    collector_name: str
    completed_collections_month: int
    most_frequent_material: str
    total_traceable_weight_kg: float
    pending_pickups_count: int
    formalization_status: str
    recommendation_tip: str

class RecyclerNetworkCapacityItem(BaseModel):
    id: int
    facility_name: str
    authorization_status: str
    city: str
    configured_capacity_kg_month: float
    used_capacity_kg_month: float
    available_capacity_kg_month: float
    utilization_pct: float
    workload_status: str  # CURRENT, PROJECTED, SIMULATION
    pressure_level: str   # LOW, NORMAL, PRESSURE, CEILING
    pending_lots_assigned: int
    material_specialties: List[str]
    pickup_capable: bool

class AIPerformanceAnalytics(BaseModel):
    total_ai_classifications: int
    human_corrections_count: int
    correction_rate_pct: float
    low_confidence_count: int
    most_confused_materials: List[Dict[str, Any]]
    recent_feedbacks: List[Dict[str, Any]]

class DecisionSupportQueryRequest(BaseModel):
    query: str

class DecisionSupportQueryResponse(BaseModel):
    query: str
    intent: str
    relevant_records_count: int
    records_used: List[str]
    calculated_indicators: Dict[str, Any]
    evidence_text: str
    explanation: str
    suggested_action: str

class ScenarioSimulationRequest(BaseModel):
    scenario_type: str  # COLLECTOR_INCREASE, RECYCLER_CAPACITY_DROP, SUPPLY_SURGE, PICKUP_UNAVAILABLE
    parameter_change_pct: float = 25.0

class ScenarioSimulationResponse(BaseModel):
    scenario_name: str
    simulation_label: str = "SIMULATION - NOT ACTUAL DATA"
    current_baseline: Dict[str, Any]
    simulated_result: Dict[str, Any]
    counterfactual_difference: Dict[str, Any]
    actionable_takeaway: str

class IntelligenceOverview(BaseModel):
    demo_environment: bool = True
    e_waste_tracked_kg: float
    traceable_lots_count: int
    active_collectors_count: int
    active_recyclers_count: int
    pending_pickups_count: int
    capacity_pressure_count: int
    active_anomalies_count: int
    open_recommendations_count: int
    formal_handovers_count: int
    trace_alerts_count: int
    top_actions: List[str]
    system_intelligence_timeline: List[Dict[str, Any]]
