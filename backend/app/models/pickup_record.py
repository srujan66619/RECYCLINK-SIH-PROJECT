from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class PickupStatus:
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    ARRIVED = "ARRIVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PickupRecord(Base):
    __tablename__ = "pickup_records"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    recycler_id = Column(Integer, ForeignKey("recyclers.id"), nullable=False, index=True)
    collector_id = Column(Integer, ForeignKey("collectors.id"), nullable=True, index=True)
    lot_id = Column(Integer, ForeignKey("e_waste_lots.id"), nullable=True, index=True)

    scheduled_date = Column(DateTime, nullable=False)
    time_window = Column(String(100), default="10:00 AM - 01:00 PM")
    status = Column(String(50), default=PickupStatus.SCHEDULED)
    pickup_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="pickups")
    recycler = relationship("RecyclerProfile", back_populates="pickups")
    lot = relationship("EWasteLot", back_populates="pickups")
