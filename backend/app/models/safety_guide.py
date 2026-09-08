from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from app.database.base import Base

class SafetyGuide(Base):
    __tablename__ = "safety_guides"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    danger_description = Column(Text, nullable=False)
    safe_practice_description = Column(Text, nullable=False)
    language = Column(String(10), default="en", index=True)
    category = Column(String(100), nullable=True)
    material_category = Column(String(100), nullable=False)
    hazard_type = Column(String(100), nullable=False)
    icon = Column(String(100), default="shield-alert")
    pictorial_icon = Column(String(100), default="shield-alert")
    dos = Column(JSON, default=list)
    donts = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
