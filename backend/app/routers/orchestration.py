from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user, get_optional_current_user
from app.services.orchestration_service import OrchestrationService
from app.schemas.orchestration import (
    NetworkGraphResponse, NetworkHealthResponse, ParticipantTrustOut,
    DisputeOut, DisputeCreateRequest, DisputeResolveRequest,
    IncentiveOut, InstitutionalPartnerOut, InstitutionalPartnerCreateRequest,
    InstitutionalPartnerVerifyRequest, PolicyRuleOut, PolicyRuleUpdateRequest,
    PolicyVersionOut, PolicyRollbackRequest,
    PolicySimulationMultiRequest, PolicySimulationMultiResponse,
    MaterialFlowResponse, DataQualityResponse, SystemHealthResponse,
    OperationalIncidentOut, OperationalIncidentActionRequest, InstitutionalReportResponse
)

router = APIRouter(prefix="/api/orchestration", tags=["Phase 12 Circular Economy Network Orchestration"])

@router.get("/network-graph", response_model=NetworkGraphResponse)
def get_circular_network_graph(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Circular Economy Network Graph: Real relationship map between collectors, lots,
    materials, pickups, recyclers, and downstream certified processing stages.
    """
    return OrchestrationService.get_circular_network_graph(db)

@router.get("/network-health", response_model=NetworkHealthResponse)
def get_network_health(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Network Health Score (0-100) calculated from transparent weighted platform indicators
    with positive/negative factor explainability.
    """
    return OrchestrationService.get_network_health(db)

@router.get("/trust-profiles", response_model=List[ParticipantTrustOut])
def get_trust_profiles(
    role: Optional[str] = Query(None, description="Filter by COLLECTOR, RECYCLER, INSTITUTION"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Participant Trust Profiles: Non-discriminatory, dynamic trust score governance
    derived purely from verified transactions, handovers, and compliance history.
    """
    return OrchestrationService.get_participant_trust_profiles(db, role=role)

@router.get("/disputes", response_model=List[DisputeOut])
def get_disputes(
    status: Optional[str] = Query(None, description="Filter by DISPUTE_CREATED, UNDER_REVIEW, RESOLVED, DISMISSED"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Dispute Center: Lists evidence-grounded disputes with AI objective summaries.
    """
    return OrchestrationService.get_disputes(db, status=status)

@router.post("/disputes", response_model=DisputeOut, status_code=status.HTTP_201_CREATED)
def create_dispute(
    payload: DisputeCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Files an evidence-based dispute with objective AI discrepancy assistance.
    """
    user = current_user
    if not user:
        user = db.query(User).filter(User.role == UserRole.COLLECTOR.value).first()
        if not user:
            user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=403, detail="Authenticated user required to file dispute.")

    return OrchestrationService.create_dispute(db, user, payload)

@router.get("/disputes/{dispute_id}", response_model=DisputeOut)
def get_dispute(
    dispute_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Retrieves full evidence package and AI summary for a single dispute.
    """
    try:
        return OrchestrationService.get_dispute_by_id(db, dispute_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.post("/disputes/{dispute_id}/resolve", response_model=DisputeOut)
def resolve_dispute(
    dispute_id: int,
    payload: DisputeResolveRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Human-in-the-loop dispute resolution. AI provides evidence summary, authorized admin decides.
    """
    admin = current_user
    if not admin:
        admin = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if not admin:
            admin = db.query(User).first()

    if not admin:
        raise HTTPException(status_code=403, detail="Authorized administrator required to resolve dispute.")

    try:
        return OrchestrationService.resolve_dispute(db, dispute_id, payload, admin)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/incentives", response_model=List[IncentiveOut])
def get_incentives(
    user_id: Optional[int] = Query(None, description="Optional filter by user ID"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Incentive Intelligence: Points, badges, and recognition earned through verified behavior.
    """
    uid = user_id
    if not uid and current_user and current_user.role == UserRole.COLLECTOR.value:
        uid = current_user.id
    return OrchestrationService.get_incentives(db, user_id=uid)

@router.get("/anti-gaming")
def get_anti_gaming_status(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Anti-Gaming Protection: Audits against artificial lot splitting and duplicate rewards.
    """
    return OrchestrationService.verify_anti_gaming(db)

@router.get("/partners", response_model=List[InstitutionalPartnerOut])
def get_institutional_partners(
    status: Optional[str] = Query(None, description="Filter by APPLICATION, VERIFIED, ACTIVE"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Institutional Onboarding: Lists municipalities, universities, corporates, and NGOs.
    """
    return OrchestrationService.get_institutional_partners(db, status=status)

@router.post("/partners", response_model=InstitutionalPartnerOut, status_code=status.HTTP_201_CREATED)
def create_institutional_partner(
    payload: InstitutionalPartnerCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Registers a new institutional partner application.
    """
    return OrchestrationService.create_institutional_partner(db, payload)

@router.post("/partners/{partner_id}/verify", response_model=InstitutionalPartnerOut)
def verify_institutional_partner(
    partner_id: int,
    payload: InstitutionalPartnerVerifyRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Updates partner onboarding verification state (APPLICATION -> ACTIVE).
    """
    try:
        return OrchestrationService.verify_institutional_partner(db, partner_id, payload.status, payload.notes)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.post("/policy-simulation", response_model=PolicySimulationMultiResponse)
def run_multi_policy_simulation(
    payload: PolicySimulationMultiRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Policy Simulation Engine: What-if comparison of Baseline vs Policy A vs Policy B.
    """
    return OrchestrationService.run_multi_policy_simulation(db, payload)

@router.get("/material-flow", response_model=MaterialFlowResponse)
def get_material_flow(
    material: Optional[str] = Query(None, description="Material category name"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Material Flow Analytics & Drop-Off Detection: Tracks end-to-end journey stages
    and flags downstream unaccounted records as Traceability Gaps.
    """
    return OrchestrationService.get_material_flow_analytics(db, material=material)

@router.get("/data-quality", response_model=DataQualityResponse)
def get_data_quality(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Data Quality Center: Completeness, consistency, validity scores, and actionable remediation.
    """
    return OrchestrationService.get_data_quality_report(db)

@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    System Health Center: API, DB, AI provider status, fallback activations, and usage stats.
    """
    return OrchestrationService.get_system_health(db)

@router.get("/policies", response_model=List[PolicyRuleOut])
def get_policy_rules(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Policy Center: Lists configurable governance rules.
    """
    return OrchestrationService.get_policy_rules(db)

@router.post("/policies/rollback", response_model=PolicyRuleOut)
def rollback_policy_rule_direct(
    payload: PolicyRollbackRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Safely rolls back a policy rule to a previous version using payload key/id.
    """
    admin = current_user
    if not admin:
        admin = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if not admin:
            admin = db.query(User).first()
    if not admin:
        raise HTTPException(status_code=403, detail="Authorized administrator required.")

    target_key = payload.policy_key or (str(payload.rule_id) if payload.rule_id else None)
    if not target_key:
        raise HTTPException(status_code=400, detail="Missing policy key or rule ID for rollback.")

    try:
        return OrchestrationService.rollback_policy_rule(db, target_key, payload.target_version, payload.reason, admin)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.put("/policies/{key}", response_model=PolicyRuleOut)
@router.post("/policies/{key}", response_model=PolicyRuleOut)
def update_policy_rule(
    key: str,
    payload: PolicyRuleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Updates policy rule with versioning and audit trail.
    """
    admin = current_user
    if not admin:
        admin = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if not admin:
            admin = db.query(User).first()
    if not admin:
        raise HTTPException(status_code=403, detail="Authorized administrator required.")

    try:
        return OrchestrationService.update_policy_rule(db, key, payload, admin)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/policies/{key}/versions", response_model=List[PolicyVersionOut])
def get_policy_versions(
    key: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Policy Version History for a specific rule.
    """
    return OrchestrationService.get_policy_versions(db, key)

@router.post("/policies/{key}/rollback", response_model=PolicyRuleOut)
def rollback_policy_rule_keyed(
    key: str,
    payload: PolicyRollbackRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Safely rolls back a policy rule to a previous version using path key.
    """
    admin = current_user
    if not admin:
        admin = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if not admin:
            admin = db.query(User).first()
    if not admin:
        raise HTTPException(status_code=403, detail="Authorized administrator required.")

    try:
        return OrchestrationService.rollback_policy_rule(db, key, payload.target_version, payload.reason, admin)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/incidents", response_model=List[OperationalIncidentOut])
def get_operational_incidents(
    status: Optional[str] = Query(None, description="Filter by DETECTED, TRIAGED, MITIGATED, RESOLVED"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Operational Incidents & Response Playbooks: Capacity crises, logistics backlogs, and post-incident learning.
    """
    return OrchestrationService.get_operational_incidents(db, status=status)

@router.get("/reports/institutional", response_model=InstitutionalReportResponse)
def get_institutional_report(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Formal circular economy report distinguishing ACTUAL, ESTIMATE, SIMULATION, and DEMO.
    """
    return OrchestrationService.generate_institutional_report(db)
