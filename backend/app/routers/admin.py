from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Response, status, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.collector import CollectorProfile
from app.models.recycler import RecyclerProfile
from app.models.transaction import Transaction
from app.models.anomaly_alert import AnomalyAlert
from app.models.material import MaterialCategory
from app.models.user import User
from app.core.dependencies import get_optional_current_user
from app.schemas.dashboard import (
    AdminDashboardStats, AdminAnalyticsTrends, GeoHotspot,
    FormalizationFunnelStage, CollectorImpactStats, PriceFairnessStats,
    RecyclerPerformanceItem, TransactionPipelineStats, TraceabilityAnalyticsStats,
    AIAnalyticsStats, SafetyAnalyticsStats, ImpactScorecardStats,
    AnomalyActionRequest, AdminSearchResponse
)
from app.schemas.schemas import AnomalyAlertOut
from app.schemas.recycler import RecyclerOut
from app.schemas.transaction import TransactionOut
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/admin", tags=["Admin & Government Intelligence"])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    period: Optional[str] = Query("All Time", description="Date period: Today, 7 Days, 30 Days, 90 Days, All Time"),
    date_from: Optional[str] = Query(None, description="ISO start date"),
    date_to: Optional[str] = Query(None, description="ISO end date"),
    city: Optional[str] = Query(None, description="Filter by city hub"),
    material_id: Optional[int] = Query(None, description="Filter by material ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Real-time high-level governance and environmental impact KPIs.
    """
    return AnalyticsService.get_dashboard_metrics(
        db=db,
        period_label=period,
        date_from=date_from,
        date_to=date_to,
        city=city,
        material_id=material_id
    )

@router.get("/analytics", response_model=AdminAnalyticsTrends)
@router.get("/analytics/overview", response_model=AdminAnalyticsTrends)
def get_admin_analytics(
    days: Optional[int] = Query(30, description="Trend window in days"),
    city: Optional[str] = Query(None, description="City filter"),
    db: Session = Depends(get_db)
):
    """
    Time-series trends, material breakdown, and price trends.
    """
    return AnalyticsService.get_analytics_trends(db=db, days=days, city=city)

@router.get("/analytics/collection")
def get_collection_analytics(
    days: Optional[int] = Query(30, description="Trend days"),
    db: Session = Depends(get_db)
):
    """
    Time-series collection volume, lot counts, and payout trends.
    """
    return AnalyticsService.get_analytics_trends(db=db, days=days).monthly_collection_trend

@router.get("/analytics/materials")
def get_material_distribution(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Material composition distribution across formal collections.
    """
    return AnalyticsService.get_material_distribution(db=db, city=city)

@router.get("/analytics/locations")
@router.get("/hotspots", response_model=List[GeoHotspot])
def get_geographic_hotspots(
    db: Session = Depends(get_db)
):
    """
    Aggregated geographic hotspots for GIS mapping and location leaderboard.
    """
    return AnalyticsService.get_location_distribution(db=db)

@router.get("/analytics/formalization", response_model=List[FormalizationFunnelStage])
def get_formalization_funnel(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    8-stage transition funnel from informal intake to formal recycling.
    """
    return AnalyticsService.get_formalization_funnel(db=db, city=city)

@router.get("/analytics/collectors", response_model=CollectorImpactStats)
def get_collector_impact_analytics(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Economic impact on informal collectors (earnings, transaction averages, ₹/kg).
    """
    return AnalyticsService.get_collector_impact(db=db, city=city)

@router.get("/analytics/pricing", response_model=PriceFairnessStats)
@router.get("/pricing-analytics", response_model=PriceFairnessStats)
def get_pricing_analytics(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Commercial fairness aggregates and CPCB benchmark conformance.
    """
    return AnalyticsService.get_price_fairness(db=db, city=city)

@router.get("/analytics/recyclers", response_model=List[RecyclerPerformanceItem])
def get_recycler_performance_analytics(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Recycler network performance, CPCB authorization, and reliability scores.
    """
    return AnalyticsService.get_recycler_performance(db=db, city=city)

@router.get("/analytics/transactions", response_model=TransactionPipelineStats)
def get_transaction_pipeline_analytics(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Status breakdown across transaction pipeline stages.
    """
    return AnalyticsService.get_transaction_pipeline(db=db, city=city)

@router.get("/analytics/traceability", response_model=TraceabilityAnalyticsStats)
def get_traceability_analytics(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Trace lifecycle, QR engagement, and cryptographic hash chain integrity status.
    """
    return AnalyticsService.get_traceability_metrics(db=db, city=city)

@router.get("/analytics/ai", response_model=AIAnalyticsStats)
def get_ai_operational_analytics(
    db: Session = Depends(get_db)
):
    """
    Prototype AI classification volume, confidence distribution, and low-confidence predictions.
    """
    return AnalyticsService.get_ai_metrics(db=db)

@router.get("/ai/analytics")
def get_ai_service_analytics(
    db: Session = Depends(get_db)
):
    """
    Operational analytics for AI classification engine.
    """
    from app.ai.service import ai_service_engine
    return ai_service_engine.get_analytics(db=db)

@router.get("/analytics/safety", response_model=SafetyAnalyticsStats)
def get_safety_analytics(
    db: Session = Depends(get_db)
):
    """
    Hazard distribution and safety guide engagement metrics.
    """
    return AnalyticsService.get_safety_metrics(db=db)

@router.get("/analytics/scorecard", response_model=ImpactScorecardStats)
def get_impact_scorecard(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Comprehensive ESG Impact Scorecard across Environmental, Economic, Governance, Social, and Circularity.
    """
    return AnalyticsService.get_impact_scorecard(db=db, city=city)

@router.get("/analytics/attention")
def get_what_needs_attention(
    db: Session = Depends(get_db)
):
    """
    Prioritized action queue for administrators.
    """
    return AnalyticsService.get_what_needs_attention(db=db)

@router.get("/analytics/insights")
def get_explainable_insights(
    db: Session = Depends(get_db)
):
    """
    Data-derived explainable insights.
    """
    return AnalyticsService.get_explainable_insights(db=db)

@router.get("/anomalies", response_model=List[AnomalyAlertOut])
def get_anomalies(
    status: Optional[str] = Query(None, description="Filter by status (OPEN, UNDER_REVIEW, RESOLVED, DISMISSED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (LOW, MEDIUM, HIGH)"),
    db: Session = Depends(get_db)
):
    """
    List anomaly alerts flagged by AI Transaction Guardian.
    """
    query = db.query(AnomalyAlert).order_by(AnomalyAlert.created_at.desc())
    if status and status.upper() != "ALL":
        query = query.filter(AnomalyAlert.status == status.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(AnomalyAlert.severity == severity.upper())
    return query.limit(100).all()

@router.patch("/anomalies/{alert_id}/status")
def update_anomaly_alert_status(
    alert_id: int,
    action: AnomalyActionRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin command action: Mark anomaly status (UNDER_REVIEW, RESOLVED, DISMISSED) with audit trail.
    """
    updated = AnalyticsService.update_anomaly_status(
        db=db,
        alert_id=alert_id,
        new_status=action.new_status,
        admin_user=current_user,
        notes=action.notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Anomaly alert not found")
    return {
        "success": True,
        "alert_id": updated.id,
        "status": updated.status,
        "resolved_at": updated.resolved_at
    }

@router.get("/transactions", response_model=List[TransactionOut])
def list_admin_transactions(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """
    Admin oversight: List all transactions across the platform.
    """
    query = db.query(Transaction).order_by(Transaction.created_at.desc())
    if status and status.upper() != "ALL":
        query = query.filter(Transaction.status == status.upper())
    return query.limit(100).all()

@router.get("/recyclers", response_model=List[RecyclerOut])
def list_admin_recyclers(
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    """
    Admin oversight: List all recyclers with verification and authorization details.
    """
    query = db.query(RecyclerProfile).order_by(RecyclerProfile.created_at.desc())
    if city and city.upper() != "ALL":
        query = query.filter(RecyclerProfile.city.ilike(f"%{city}%"))
    return query.all()

@router.get("/collectors")
def list_admin_collectors(
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    """
    Privacy-safe informal collector list for administrative oversight.
    Excludes private phone numbers and street addresses.
    """
    query = db.query(CollectorProfile).order_by(CollectorProfile.created_at.desc())
    if city and city.upper() != "ALL":
        query = query.filter(CollectorProfile.city.ilike(f"%{city}%"))
    collectors = query.all()

    # Privacy-conscious projection
    return [
        {
            "id": c.id,
            "collector_code": f"COL-HYD-{c.id:04d}",
            "full_name": (c.user.full_name if c.user else f"Collector #{c.id}"),
            "city": c.city or "Hyderabad",
            "is_verified": c.is_verified,
            "total_earnings": c.total_earnings or 0.0,
            "total_lots_collected": len(c.lots) if c.lots else 0,
            "total_weight_collected_kg": c.total_weight_collected or 0.0,
            "created_at": c.created_at
        }
        for c in collectors
    ]

@router.get("/materials")
def list_admin_materials(
    db: Session = Depends(get_db)
):
    """
    Catalog of supported e-waste materials, hazard levels, and benchmark prices.
    """
    return db.query(MaterialCategory).all()

@router.get("/reports/export-csv")
def export_csv_report(
    report_type: str = Query("collection", description="Report type: collection, transactions, anomalies, recyclers, materials"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Export verified data directly to CSV with audit logging.
    """
    csv_content = AnalyticsService.export_csv_report(
        db=db,
        report_type=report_type,
        filters={},
        admin_user=current_user
    )
    filename = f"recyclink_{report_type}_report.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/audit-logs")
def list_admin_audit_logs(
    limit: Optional[int] = Query(50, description="Number of logs to retrieve"),
    db: Session = Depends(get_db)
):
    """
    Chronological trail of administrative actions and compliance operations.
    """
    return AnalyticsService.get_audit_logs(db=db, limit=limit)

@router.get("/search", response_model=AdminSearchResponse)
def search_admin_registry(
    q: str = Query(..., description="Search term (Trace ID, Lot ID, Recycler, Material)"),
    db: Session = Depends(get_db)
):
    """
    Global command search across traces, lots, and recyclers.
    """
    return AnalyticsService.search_admin(db=db, query=q)

@router.get("/settings")
def get_system_settings(
    db: Session = Depends(get_db)
):
    """
    Retrieve current regulatory, surveillance, and operational parameters.
    """
    return AnalyticsService.get_admin_settings(db=db)

@router.post("/settings")
@router.patch("/settings")
def update_system_settings(
    payload: Dict[str, Any],
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Update surveillance thresholds, demonstration mode, and statutory reporting intervals.
    """
    return AnalyticsService.update_admin_settings(
        db=db,
        new_settings=payload,
        admin_user=current_user
    )

# ==========================================
# PHASE 10: CIRCULAR FLOW & DEMO CONTROL
# ==========================================

@router.get("/circular-flow")
def get_circular_economy_flow(
    material: Optional[str] = Query(None, description="Filter by material name"),
    city: Optional[str] = Query(None, description="Filter by city hub"),
    db: Session = Depends(get_db)
):
    """
    Phase 10: Circular Economy Digital Twin & Supply-Demand Capacity Map.
    Visualizes informal intake, formal processing, and alerts when material supply
    exceeds authorized recycler capacity.
    """
    return AnalyticsService.get_circular_flow(db=db, material=material, city=city)

@router.get("/pickup-clusters")
def get_smart_pickup_clusters(
    city: Optional[str] = Query(None, description="City filter"),
    db: Session = Depends(get_db)
):
    """
    Phase 10: Smart Pickup Batching and route aggregation.
    """
    return AnalyticsService.get_pickup_clusters(db=db, city=city)

@router.get("/scenario-simulation")
def get_what_if_scenario_simulation(
    participation_pct: float = Query(20.0, description="Projected informal collector growth percentage (e.g. 20.0, 50.0)"),
    db: Session = Depends(get_db)
):
    """
    Phase 10: What-If Scenario Simulator for government and municipal planners.
    """
    return AnalyticsService.get_scenario_simulation(db=db, participation_increase_pct=participation_pct)

@router.get("/collection-drives")
def list_community_collection_drives(
    db: Session = Depends(get_db)
):
    """
    Phase 10: List all community e-waste collection drives.
    """
    return AnalyticsService.get_community_drives(db=db)

@router.post("/collection-drives", status_code=status.HTTP_201_CREATED)
def create_community_collection_drive(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Phase 10: Create a new municipal/community collection drive.
    """
    return AnalyticsService.create_community_drive(db=db, drive_data=payload)

@router.post("/demo/reset")
def reset_demo_environment(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 10: SIH Grand Finale Demo Reset.
    Safely resets state to baseline demo dataset without deleting system accounts.
    """
    return AnalyticsService.reset_demo_data(db=db, admin_user=current_user)

@router.post("/demo/scenario/{scenario_id}")
def trigger_demo_scenario(
    scenario_id: str,
    db: Session = Depends(get_db)
):
    """
    Phase 10: Trigger 1 of 6 SIH Grand Finale demo scenarios (scenario_1 to scenario_6).
    """
    return AnalyticsService.trigger_demo_scenario(db=db, scenario_id=scenario_id)

