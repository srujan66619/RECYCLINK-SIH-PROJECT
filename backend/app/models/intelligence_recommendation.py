import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class RecommendationStatus(str, enum.Enum):
    GENERATED = "GENERATED"
    REVIEWED = "REVIEWED"
    ACCEPTED = "ACCEPTED"
    DISMISSED = "DISMISSED"
    EXECUTED = "EXECUTED"
    VERIFIED = "VERIFIED"

class RecommendationPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class IntelligenceRecommendation(Base):
    __tablename__ = "intelligence_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # CAPACITY_PRESSURE, PICKUP_BATCH, RESOURCE_ALLOCATION, FORMALIZATION_GAP, RECYCLER_SHORTAGE
    priority = Column(String(20), default=RecommendationPriority.MEDIUM.value)
    status = Column(String(30), default=RecommendationStatus.GENERATED.value, index=True)
    
    material = Column(String(50), nullable=True)
    affected_lots_count = Column(Integer, default=0)
    affected_weight_kg = Column(Float, default=0.0)
    
    target_recycler_id = Column(Integer, ForeignKey("recyclers.id"), nullable=True)
    target_recycler_name = Column(String(100), nullable=True)
    
    reason = Column(Text, nullable=False)
    expected_effect = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    evidence_json = Column(Text, nullable=True)
    counterfactual_json = Column(Text, nullable=True)
    
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    # Relationships
    decision_records = relationship("DecisionHistory", back_populates="recommendation", cascade="all, delete-orphan")
