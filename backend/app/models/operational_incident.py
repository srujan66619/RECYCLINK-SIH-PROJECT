import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database.base import Base

class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, enum.Enum):
    DETECTED = "DETECTED"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    MITIGATED = "MITIGATED"
    RESOLVED = "RESOLVED"
    REVIEWED = "REVIEWED"

class OperationalIncident(Base):
    __tablename__ = "operational_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    incident_type = Column(String(50), nullable=False)  # CAPACITY_CRISIS, PICKUP_BACKLOG, RECYCLER_OUTAGE, SYNC_FAILURE, INTEGRITY_ANOMALY
    severity = Column(String(20), default=IncidentSeverity.MEDIUM.value)
    status = Column(String(30), default=IncidentStatus.DETECTED.value, index=True)
    
    playbook_applied = Column(String(100), nullable=True)
    affected_entities = Column(Text, nullable=True)
    evidence_text = Column(Text, nullable=True)
    mitigation_steps = Column(Text, nullable=True)
    post_incident_learning = Column(Text, nullable=True)
    assigned_to = Column(String(100), default="Regional Operations Lead")
    
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
