from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

class AIPrerecognition(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("e_waste_lots.id"), nullable=True, index=True)
    model_name = Column(String(100), default="RecycLink-CV-v1")
    prediction_type = Column(String(50), default="MATERIAL_CLASSIFICATION")
    predicted_category = Column(String(100), nullable=True)
    detected_category = Column(String(100), nullable=False)
    detected_subcategory = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=False, default=0.90)
    confidence_score = Column(Float, nullable=False, default=0.90)
    estimated_weight = Column(Float, nullable=False, default=1.0)
    estimated_value_min = Column(Float, nullable=True)
    estimated_value_max = Column(Float, nullable=True)
    value_min = Column(Float, nullable=False, default=0.0)
    value_max = Column(Float, nullable=False, default=0.0)
    hazard_level = Column(String(20), default="MEDIUM")
    recoverable_metals = Column(JSON, default=list)
    raw_response = Column(JSON, default=dict)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    lot = relationship("EWasteLot", back_populates="ai_predictions")

# Model alias for AI Prediction
AIPrediction = AIPrerecognition

