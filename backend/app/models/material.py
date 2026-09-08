import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class HazardLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class MaterialCategory(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    hazard_level = Column(String(20), default=HazardLevel.MEDIUM.value)
    unit = Column(String(20), default="kg")
    default_unit = Column(String(20), default="kg")
    base_market_price_min = Column(Float, nullable=False, default=100.0)
    base_market_price_max = Column(Float, nullable=False, default=200.0)
    current_benchmark_price = Column(Float, nullable=False, default=150.0)
    recoverable_materials = Column(JSON, default=list)
    icon_name = Column(String(50), default="cpu")
    safety_notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    price_history = relationship("PriceHistory", back_populates="material", cascade="all, delete-orphan")
    offers = relationship("RecyclerOffer", back_populates="material", cascade="all, delete-orphan")
    lots = relationship("EWasteLot", back_populates="material")
