import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class TrustTier(str, enum.Enum):
    EXEMPLARY = "EXEMPLARY"       # 90 - 100
    ESTABLISHED = "ESTABLISHED"   # 75 - 89
    PROBATIONARY = "PROBATIONARY" # 50 - 74
    UNDER_REVIEW = "UNDER_REVIEW" # < 50

class ParticipantTrust(Base):
    __tablename__ = "participant_trust_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False)  # COLLECTOR, RECYCLER, INSTITUTION
    
    trust_score = Column(Float, default=85.0)  # 0.0 to 100.0
    trust_tier = Column(String(30), default=TrustTier.ESTABLISHED.value)
    
    completed_transactions_count = Column(Integer, default=0)
    traceability_completeness_pct = Column(Float, default=100.0)
    successful_handovers_count = Column(Integer, default=0)
    cancellation_rate_pct = Column(Float, default=0.0)
    dispute_count = Column(Integer, default=0)
    verification_status = Column(String(50), default="VERIFIED")
    safety_compliance_pct = Column(Float, default=100.0)
    
    # Explainable positive and negative contributors (JSON string)
    trust_breakdown_json = Column(Text, nullable=True)
    last_calculated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="trust_profile")
