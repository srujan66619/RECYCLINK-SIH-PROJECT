import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class IncentiveType(str, enum.Enum):
    POINTS = "POINTS"
    BADGE = "BADGE"
    PRIORITY_ACCESS = "PRIORITY_ACCESS"
    COMMUNITY_REWARD = "COMMUNITY_REWARD"
    BENEFIT = "BENEFIT"

class IncentiveStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    REDEEMED = "REDEEMED"
    REVOKED = "REVOKED"

class IncentiveRecord(Base):
    __tablename__ = "incentive_records"

    id = Column(Integer, primary_key=True, index=True)
    incentive_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user_role = Column(String(50), default="COLLECTOR")
    
    incentive_type = Column(String(50), default=IncentiveType.POINTS.value)
    title = Column(String(200), nullable=False)
    value = Column(Float, default=0.0)
    badge_name = Column(String(100), nullable=True)
    trigger_event = Column(String(100), nullable=False)  # TRACEABILITY_COMPLIANCE, SAFE_HANDOVER, COMMUNITY_DRIVE
    why_earned = Column(Text, nullable=False)
    status = Column(String(30), default=IncentiveStatus.ACTIVE.value, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="incentives")
