import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database.base import Base

class TraceAlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TraceAlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class TraceAlert(Base):
    __tablename__ = "trace_alerts"

    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String(100), nullable=False, index=True)
    current_stage = Column(String(50), nullable=False)
    alert_type = Column(String(50), nullable=False)  # STALLED_PICKUP, HANDOVER_DELAY, INCOMPLETE_EVIDENCE, UNEXPECTED_TRANSITION
    severity = Column(String(20), default=TraceAlertSeverity.MEDIUM.value)
    pending_duration_hours = Column(Float, default=0.0)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(20), default=TraceAlertStatus.OPEN.value, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
