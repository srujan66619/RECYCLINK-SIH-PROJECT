import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class TransactionStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    OFFER_RECEIVED = "OFFER_RECEIVED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    PICKUP_IN_PROGRESS = "PICKUP_IN_PROGRESS"
    HANDOVER_VERIFICATION = "HANDOVER_VERIFICATION"
    HANDED_OVER = "HANDED_OVER"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("e_waste_lots.id"), unique=True, nullable=False)
    collector_id = Column(Integer, ForeignKey("collectors.id"), nullable=False, index=True)
    recycler_id = Column(Integer, ForeignKey("recyclers.id"), nullable=False, index=True)
    estimated_price = Column(Float, nullable=True)
    quoted_price = Column(Float, nullable=True)
    agreed_price_per_kg = Column(Float, nullable=False)
    final_weight = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    payment_status = Column(String(20), default=PaymentStatus.PENDING.value)
    transaction_status = Column(String(30), default=TransactionStatus.INITIATED.value)
    status = Column(String(30), default=TransactionStatus.INITIATED.value)
    payment_method = Column(String(50), default="UPI Instant Transfer")
    payment_ref = Column(String(100), nullable=True)
    scheduled_pickup_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lot = relationship("EWasteLot", back_populates="transaction")
    collector = relationship("CollectorProfile", back_populates="transactions")
    recycler = relationship("RecyclerProfile", back_populates="transactions")
    handover = relationship("HandoverRecord", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
    pickups = relationship("PickupRecord", back_populates="transaction", cascade="all, delete-orphan")
    anomaly_alerts = relationship("AnomalyAlert", back_populates="transaction", cascade="all, delete-orphan")
