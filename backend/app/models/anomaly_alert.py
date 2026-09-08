import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class AnomalySeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class AnomalyStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True, index=True)
    lot_id = Column(Integer, ForeignKey("e_waste_lots.id"), nullable=True, index=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default=AnomalySeverity.WARNING.value)
    expected_value = Column(Float, nullable=True)
    benchmark_value = Column(Float, nullable=False, default=0.0)
    actual_value = Column(Float, nullable=False, default=0.0)
    deviation_pct = Column(Float, nullable=False, default=0.0)
    reason = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String(20), default=AnomalyStatus.OPEN.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    transaction = relationship("Transaction", back_populates="anomaly_alerts")
