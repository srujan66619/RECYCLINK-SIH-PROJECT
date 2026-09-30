from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class DecisionHistory(Base):
    __tablename__ = "decision_history"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("intelligence_recommendations.id"), nullable=True, index=True)
    recommendation_code = Column(String(50), nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_name = Column(String(100), nullable=False, default="Admin Authority")
    
    decision = Column(String(30), nullable=False)  # ACCEPTED, DISMISSED, MODIFIED
    action_taken = Column(String(255), nullable=False)
    evidence_reference = Column(Text, nullable=True)
    
    decision_time = Column(DateTime, default=datetime.utcnow)
    execution_result = Column(String(50), default="SUCCESS")  # SUCCESS, PENDING_SYNC, REASSIGNED, CANCELLED
    outcome_status = Column(String(50), default="VERIFIED")   # COMPLETED, IN_PROGRESS, MONITORING
    outcome_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    recommendation = relationship("IntelligenceRecommendation", back_populates="decision_records")
