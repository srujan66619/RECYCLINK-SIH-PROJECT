import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class LotStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IDENTIFIED = "IDENTIFIED"
    PRICE_ESTIMATED = "PRICE_ESTIMATED"
    PRICED = "PRICED"
    RECYCLER_SELECTED = "RECYCLER_SELECTED"
    OFFER_RECEIVED = "OFFER_RECEIVED"
    ACCEPTED = "ACCEPTED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    PICKUP_IN_PROGRESS = "PICKUP_IN_PROGRESS"
    HANDED_OVER = "HANDED_OVER"
    HANDOVER_VERIFIED = "HANDOVER_VERIFIED"
    FORMAL_RECYCLING = "FORMAL_RECYCLING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class EWasteLot(Base):
    __tablename__ = "e_waste_lots"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(String(50), unique=True, index=True, nullable=False) # LOT-2026-000001
    trace_id = Column(String(50), unique=True, index=True, nullable=False) # RC-2026-000001
    client_action_id = Column(String(100), unique=True, index=True, nullable=True) # UUID/client ID for offline idempotency
    collector_id = Column(Integer, ForeignKey("collectors.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    material_name = Column(String(100), nullable=False)
    subcategory = Column(String(100), nullable=True)
    photo_url = Column(String(500), nullable=True)
    estimated_weight = Column(Float, nullable=False)
    final_weight = Column(Float, nullable=True)
    estimated_price_min = Column(Float, nullable=False, default=0.0)
    estimated_price_max = Column(Float, nullable=False, default=0.0)
    recommended_price = Column(Float, nullable=False, default=0.0)
    quoted_price = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)
    condition = Column(String(100), default="Standard Scrap")
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    location_address = Column(String(500), nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    qr_code_url = Column(String(500), nullable=True)
    ai_confidence = Column(Float, default=0.94)
    hazard_level = Column(String(20), default="MEDIUM")
    status = Column(String(30), default=LotStatus.DRAFT.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    collector = relationship("CollectorProfile", back_populates="lots")
    material = relationship("MaterialCategory", back_populates="lots")
    location = relationship("Location", back_populates="lots")
    transaction = relationship("Transaction", back_populates="lot", uselist=False, cascade="all, delete-orphan")
    pickups = relationship("PickupRecord", back_populates="lot", cascade="all, delete-orphan")
    trace_events = relationship("TraceEvent", back_populates="lot", cascade="all, delete-orphan", order_by="TraceEvent.created_at")
    ai_predictions = relationship("AIPrerecognition", back_populates="lot", cascade="all, delete-orphan")
