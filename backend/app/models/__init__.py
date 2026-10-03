from app.database.base import Base
from app.models.location import Location
from app.models.user import User, UserRole
from app.models.collector import CollectorProfile
from app.models.recycler import RecyclerProfile, AuthorizationStatus
from app.models.material import MaterialCategory, HazardLevel
from app.models.price_history import PriceHistory
from app.models.recycler_offer import RecyclerOffer
from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.transaction import Transaction, TransactionStatus, PaymentStatus
from app.models.handover import HandoverRecord
from app.models.trace_event import TraceEvent, TraceStage
from app.models.ai_prediction import AIPrerecognition, AIPrediction
from app.models.anomaly_alert import AnomalyAlert, AnomalySeverity, AnomalyStatus
from app.models.safety_guide import SafetyGuide
from app.models.audit_log import AuditLog
from app.models.pickup_record import PickupRecord, PickupStatus
from app.models.ai_feedback import AIFeedback
from app.models.collection_drive import CollectionDrive
from app.models.intelligence_recommendation import (
    IntelligenceRecommendation, RecommendationStatus, RecommendationPriority
)
from app.models.decision_history import DecisionHistory
from app.models.trace_alert import TraceAlert, TraceAlertSeverity, TraceAlertStatus
from app.models.dispute import DisputeRecord, DisputeStatus, DisputeType
from app.models.participant_trust import ParticipantTrust, TrustTier
from app.models.incentive import IncentiveRecord, IncentiveType, IncentiveStatus
from app.models.institutional_partner import InstitutionalPartner, PartnerType, PartnerVerificationStatus
from app.models.policy_rule import PolicyRule, PolicyVersion
from app.models.operational_incident import OperationalIncident, IncidentStatus, IncidentSeverity

__all__ = [
    "Base",
    "Location",
    "User",
    "UserRole",
    "CollectorProfile",
    "RecyclerProfile",
    "AuthorizationStatus",

    "MaterialCategory",
    "HazardLevel",
    "PriceHistory",
    "RecyclerOffer",
    "EWasteLot",
    "LotStatus",
    "Transaction",
    "TransactionStatus",
    "PaymentStatus",
    "HandoverRecord",
    "PickupRecord",
    "PickupStatus",
    "TraceEvent",
    "TraceStage",
    "AIPrerecognition",
    "AIPrediction",
    "AIFeedback",
    "AnomalyAlert",
    "AnomalySeverity",
    "AnomalyStatus",
    "SafetyGuide",
    "AuditLog",
    "CollectionDrive",
    "IntelligenceRecommendation",
    "RecommendationStatus",
    "RecommendationPriority",
    "DecisionHistory",
    "TraceAlert",
    "TraceAlertSeverity",
    "TraceAlertStatus",

    # Phase 12
    "DisputeRecord",
    "DisputeStatus",
    "DisputeType",
    "ParticipantTrust",
    "TrustTier",
    "IncentiveRecord",
    "IncentiveType",
    "IncentiveStatus",
    "InstitutionalPartner",
    "PartnerType",
    "PartnerVerificationStatus",
    "PolicyRule",
    "PolicyVersion",
    "OperationalIncident",
    "IncidentStatus",
    "IncidentSeverity"
]


