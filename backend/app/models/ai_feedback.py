from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database.base import Base

class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, nullable=True, index=True)
    lot_id = Column(Integer, ForeignKey("e_waste_lots.id"), nullable=True)
    original_prediction = Column(String(100), nullable=False)
    original_confidence = Column(Float, nullable=True)
    corrected_material = Column(String(100), nullable=False)
    user_role = Column(String(50), default="COLLECTOR")
    user_id = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
