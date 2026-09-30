from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Response, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user, get_optional_current_user
from app.services.intelligence_service import IntelligenceService
from app.schemas.intelligence import (
    IntelligenceOverview, TrendItem, MaterialForecastItem, BottleneckItem,
    RecommendationOut, RecommendationActionRequest, DecisionHistoryOut,
    CircularOpportunityItem, RecyclerNetworkCapacityItem, AIPerformanceAnalytics,
    DecisionSupportQueryRequest, DecisionSupportQueryResponse,
    TraceAlertOut, TraceAlertActionRequest,
    ScenarioSimulationRequest, ScenarioSimulationResponse, CollectorInsightsOut
)

router = APIRouter(prefix="/api/intelligence", tags=["Phase 11 Autonomous Circular Economy Intelligence"])

@router.get("/overview", response_model=IntelligenceOverview)
def get_intelligence_overview(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Returns real-time command center scorecard: tracked waste, active participants,
    capacity pressure, open recommendations, and today's intelligence timeline.
    """
    return IntelligenceService.get_intelligence_overview(db)

@router.get("/trends", response_model=List[TrendItem])
def get_collection_trends(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Returns collection volume, participation, recycler demand, and formal handover trends
    with configured calculations and explainability.
    """
    return IntelligenceService.get_collection_trends(db)

@router.get("/forecast", response_model=List[MaterialForecastItem])
def get_material_forecast(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Returns material demand estimates for PCB, Copper, Batteries, etc.
    Prominently tagged as ESTIMATE with grounded explainability.
    """
    return IntelligenceService.get_material_forecast(db)

@router.get("/bottlenecks", response_model=List[BottleneckItem])
def get_network_bottlenecks(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Detects network bottlenecks: capacity pressure, pickup pressure, handover delays,
    and regional coverage gaps with transparent rule explanations.
    """
    return IntelligenceService.detect_network_bottlenecks(db)

@router.get("/recommendations", response_model=List[RecommendationOut])
def get_recommendations(
    status: Optional[str] = Query(None, description="Filter by GENERATED, REVIEWED, ACCEPTED, DISMISSED, EXECUTED"),
    category: Optional[str] = Query(None, description="Filter by CAPACITY_PRESSURE, PICKUP_BATCH, FORMALIZATION_GAP"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Lists intelligence recommendations with evidence and counterfactual comparisons.
    """
    return IntelligenceService.get_recommendations(db, status=status, category=category)

@router.post("/recommendations/{rec_id}/action")
def act_on_recommendation(
    rec_id: int,
    payload: RecommendationActionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Human-in-the-loop action endpoint.
    Accepts, dismisses, or reviews a recommendation. Consequential actions require approval
    and log an entry in DecisionHistory.
    """
    # Fallback to system admin if anonymous demo session
    admin = current_user
    if not admin:
        admin = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if not admin:
            admin = db.query(User).first()

    if not admin:
        raise HTTPException(status_code=403, detail="Authorized administrator required to approve recommendation.")

    try:
        res = IntelligenceService.act_on_recommendation(
            db=db,
            rec_id=rec_id,
            action=payload.action,
            admin_user=admin,
            admin_notes=payload.admin_notes
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/decisions", response_model=List[DecisionHistoryOut])
def get_decision_history(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Returns audit trail of past intelligence decisions and their outcome feedback loops.
    """
    return IntelligenceService.get_decision_history(db)

@router.get("/opportunities", response_model=List[CircularOpportunityItem])
def get_circular_opportunities(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Circular Economy Opportunity Engine: Highlights high-yield formalization levers and asset utilization gaps.
    """
    return IntelligenceService.get_circular_opportunities(db)

@router.get("/recycler-network", response_model=List[RecyclerNetworkCapacityItem])
def get_recycler_network(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Recycler Network View: Configured vs used capacity, pressure levels, and workload status.
    """
    return IntelligenceService.get_recycler_network_capacity(db)

@router.get("/ai-performance", response_model=AIPerformanceAnalytics)
def get_ai_performance(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    AI model monitoring and human-in-the-loop correction analytics derived from ai_feedback.
    """
    return IntelligenceService.get_ai_performance_analytics(db)

@router.post("/decision-support", response_model=DecisionSupportQueryResponse)
def query_ai_decision_support(
    payload: DecisionSupportQueryRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    AI Decision Support: Answers operational questions using deterministic database evidence and explainability.
    """
    return IntelligenceService.query_ai_decision_support(db, payload.query)

@router.get("/trace-alerts", response_model=List[TraceAlertOut])
def get_trace_alerts(
    status: Optional[str] = Query(None, description="Filter by OPEN, RESOLVED, DISMISSED"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Traceability Alerts: Detects stalled stages, delayed pickups, and verification anomalies.
    """
    return IntelligenceService.get_trace_alerts(db, status=status)

@router.post("/trace-alerts/{alert_id}/action")
def resolve_trace_alert(
    alert_id: int,
    payload: TraceAlertActionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Resolves or dismisses a traceability alert.
    """
    try:
        return IntelligenceService.resolve_trace_alert(
            db=db,
            alert_id=alert_id,
            action=payload.action,
            notes=payload.notes
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.post("/simulations", response_model=ScenarioSimulationResponse)
def run_scenario_simulation(
    payload: ScenarioSimulationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Scenario Simulator 2.0: Counterfactual comparison between CURRENT SYSTEM vs SIMULATED SYSTEM.
    """
    return IntelligenceService.run_scenario_simulation(
        db=db,
        scenario_type=payload.scenario_type,
        parameter_change_pct=payload.parameter_change_pct
    )

@router.get("/collector-insights", response_model=CollectorInsightsOut)
def get_collector_insights(
    collector_id: Optional[int] = Query(None, description="Optional collector ID"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Non-sensitive operational insights for collectors (traceable volume, frequent material, pending pickups).
    """
    cid = collector_id
    if not cid and current_user and getattr(current_user, "collector_profile", None):
        cid = current_user.collector_profile.id
    if not cid:
        cid = 1
    return IntelligenceService.get_collector_insights(db, cid)

@router.get("/export")
def export_intelligence_csv(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Exports selected intelligence audit summary as CSV marked DEMO ENVIRONMENT.
    """
    csv_content = IntelligenceService.export_intelligence_csv(db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=recyclink_intelligence_audit.csv"}
    )
