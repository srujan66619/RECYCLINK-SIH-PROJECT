from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class NetworkGraphNode(BaseModel):
    id: str
    label: str
    type: str  # COLLECTOR, LOT, MATERIAL, PICKUP, RECYCLER, INSTITUTION, PROCESSING_STAGE
    status: Optional[str] = None
    weight_kg: Optional[float] = None
    details: Optional[str] = None

class NetworkGraphEdge(BaseModel):
    source: str
    target: str
    relationship: str
    status: Optional[str] = "VERIFIED"
    verified: bool = True

class NetworkGraphResponse(BaseModel):
    nodes: List[NetworkGraphNode]
    edges: List[NetworkGraphEdge]
    summary: Dict[str, Any]

class HealthScoreFactor(BaseModel):
    factor: str
    value: str
    weight: float
    contribution: str
    status: str  # POSITIVE, NEGATIVE, NEUTRAL
    interpretation: str

class NetworkHealthResponse(BaseModel):
    overall_score: float
    health_tier: str
    contributing_factors: List[HealthScoreFactor]
    positive_factors: List[str]
    negative_factors: List[str]
    calculation_formula: str

class ParticipantTrustOut(BaseModel):
    id: int
    user_id: int
    role: str
    user_name: str
    trust_score: float
    trust_tier: str
    completed_transactions_count: int
    traceability_completeness_pct: float
    successful_handovers_count: int
    cancellation_rate_pct: float
    dispute_count: int
    verification_status: str
    safety_compliance_pct: float
    breakdown: Optional[Dict[str, Any]] = None
    last_calculated_at: datetime

class DisputeCreateRequest(BaseModel):
    lot_id: Optional[int] = None
    transaction_id: Optional[int] = None
    trace_id: Optional[str] = None
    dispute_type: str = "WEIGHT_DISCREPANCY"
    title: str
    claim_description: str
    claimed_value: Optional[float] = None
    recorded_value: Optional[float] = None

class DisputeResolveRequest(BaseModel):
    action: str  # RESOLVE, DISMISS
    resolution_notes: str

class DisputeOut(BaseModel):
    id: int
    dispute_code: str
    lot_id: Optional[int] = None
    transaction_id: Optional[int] = None
    trace_id: Optional[str] = None
    raised_by_user_id: int
    raised_by_name: str
    raised_by_role: str
    dispute_type: str
    status: str
    title: str
    claim_description: str
    claimed_value: Optional[float] = None
    recorded_value: Optional[float] = None
    evidence_package: Optional[Dict[str, Any]] = None
    ai_dispute_summary: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_by_admin_name: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class IncentiveOut(BaseModel):
    id: int
    incentive_code: str
    user_id: int
    user_name: str
    user_role: str
    incentive_type: str
    title: str
    value: float
    badge_name: Optional[str] = None
    trigger_event: str
    why_earned: str
    status: str
    created_at: datetime

class InstitutionalPartnerCreateRequest(BaseModel):
    name: str
    partner_type: str = "MUNICIPALITY"
    service_area: str
    city: str = "Hyderabad"
    state: Optional[str] = "Telangana"
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    material_capabilities: Optional[str] = "PCB, Batteries, Cables, IT Hardware"

class InstitutionalPartnerVerifyRequest(BaseModel):
    status: str  # ACTIVE, VERIFIED, REJECTED
    notes: Optional[str] = None

class InstitutionalPartnerOut(BaseModel):
    id: int
    partner_code: str
    name: str
    partner_type: str
    service_area: str
    city: str
    state: str
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    verification_status: str
    material_capabilities: str
    total_formalized_kg: float
    active_campaigns_count: int
    notes: Optional[str] = None
    created_at: datetime

class PolicyRuleOut(BaseModel):
    id: int
    policy_key: str
    policy_category: str
    name: str
    value_type: str
    current_value: str
    default_value: str
    unit: Optional[str] = None
    description: Optional[str] = None
    version: int
    updated_at: Optional[datetime] = None

class PolicyRuleUpdateRequest(BaseModel):
    new_value: str
    reason: str

class PolicyVersionOut(BaseModel):
    id: int
    policy_key: str
    previous_value: Optional[str] = None
    new_value: str
    version: int
    reason: Optional[str] = None
    changed_by_admin_name: str
    created_at: datetime

class PolicyRollbackRequest(BaseModel):
    policy_key: Optional[str] = None
    rule_id: Optional[int] = None
    target_version: int
    reason: str

class PolicySimulationMultiRequest(BaseModel):
    collector_surge_pct: float = 20.0
    recycler_capacity_delta_pct: float = 0.0
    pickup_fleet_delta_pct: float = 15.0
    campaign_intensity_pct: float = 25.0
    incentive_multiplier: float = 1.25

class PolicySimulationMultiResponse(BaseModel):
    baseline: Dict[str, Any]
    scenario_a: Dict[str, Any]
    scenario_b: Dict[str, Any]
    assumptions: List[str]
    limitations: str
    actionable_guidance: str

class MaterialFlowStage(BaseModel):
    stage_name: str
    inflow_kg: float
    outflow_kg: float
    drop_off_kg: float
    drop_off_pct: float
    status: str

class MaterialFlowResponse(BaseModel):
    material: str
    total_collected_kg: float
    total_recovered_kg: float
    stages: List[MaterialFlowStage]
    traceability_gaps: List[Dict[str, Any]]
    circularity_index_pct: float
    formula_used: str

class DataQualityIssue(BaseModel):
    category: str
    severity: str
    problem: str
    affected_records_count: int
    recommended_fix: str
    owner: str

class DataQualityResponse(BaseModel):
    overall_score: float
    score_breakdown: Dict[str, float]
    issues: List[DataQualityIssue]
    score_explanation: str

class SystemHealthResponse(BaseModel):
    status: str
    api_health: str
    database_status: str
    ai_provider_status: str
    ai_fallback_active: bool
    sync_status: str
    ai_usage_stats: Dict[str, Any]
    background_jobs: List[Dict[str, Any]]

class OperationalIncidentOut(BaseModel):
    id: int
    incident_code: str
    title: str
    incident_type: str
    severity: str
    status: str
    playbook_applied: Optional[str] = None
    affected_entities: Optional[str] = None
    evidence_text: Optional[str] = None
    mitigation_steps: Optional[str] = None
    post_incident_learning: Optional[str] = None
    assigned_to: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None

class OperationalIncidentActionRequest(BaseModel):
    status: str  # TRIAGED, ASSIGNED, MITIGATED, RESOLVED, REVIEWED
    mitigation_steps: Optional[str] = None
    post_incident_learning: Optional[str] = None

class InstitutionalReportResponse(BaseModel):
    report_title: str
    generated_at: str
    environment_classification: str
    sections: Dict[str, Any]
