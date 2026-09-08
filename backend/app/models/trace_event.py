import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

class TraceStage(str, enum.Enum):
    LOT_CREATED = "LOT_CREATED"
    COLLECTED = "COLLECTED"
    AI_IDENTIFIED = "AI_IDENTIFIED"
    IDENTIFIED = "IDENTIFIED"
    PRICE_ESTIMATED = "PRICE_ESTIMATED"
    PRICED = "PRICED"
    RECYCLER_SELECTED = "RECYCLER_SELECTED"
    OFFER_RECEIVED = "OFFER_RECEIVED"
    ACCEPTED = "ACCEPTED"
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    REJECTED = "REJECTED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    PICKUP_STARTED = "PICKUP_STARTED"
    PICKUP_ARRIVED = "PICKUP_ARRIVED"
    HANDOVER_VERIFIED = "HANDOVER_VERIFIED"
    FINAL_WEIGHT_RECORDED = "FINAL_WEIGHT_RECORDED"
    FINAL_PRICE_RECORDED = "FINAL_PRICE_RECORDED"
    PAYMENT_COMPLETED = "PAYMENT_COMPLETED"
    TRANSACTION_COMPLETED = "TRANSACTION_COMPLETED"
    FORMAL_RECYCLING = "FORMAL_RECYCLING"
    ANOMALY_DETECTED = "ANOMALY_DETECTED"
    STATUS_UPDATED = "STATUS_UPDATED"
    DOCUMENT_ATTACHED = "DOCUMENT_ATTACHED"
    RECYCLER_CONFIRMED = "RECYCLER_CONFIRMED"

class TraceEvent(Base):
    __tablename__ = "trace_events"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("e_waste_lots.id"), nullable=False, index=True)
    trace_id = Column(String(50), nullable=True, index=True)
    event_type = Column(String(50), nullable=False)
    stage = Column(String(50), nullable=False)
    event_status = Column(String(50), default="COMPLETED")

    def __init__(self, **kwargs):
        if "event_type" not in kwargs or kwargs["event_type"] is None:
            kwargs["event_type"] = kwargs.get("stage", "TRACE_EVENT")
        if "timestamp" not in kwargs:
            kwargs["timestamp"] = kwargs.get("event_timestamp", datetime.utcnow())
        super().__init__(**kwargs)

    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    actor_id = Column(Integer, nullable=True)
    actor_role = Column(String(50), default="SYSTEM")
    actor_name = Column(String(255), default="RECYCLINK Engine")
    location_id = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_accuracy = Column(Float, nullable=True)
    evidence_url = Column(String(500), nullable=True)
    metadata_json = Column(JSON, default=dict)
    previous_event_hash = Column(String(64), nullable=True)
    event_hash = Column(String(64), nullable=True)
    event_timestamp = Column(DateTime, default=datetime.utcnow)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    lot = relationship("EWasteLot", back_populates="trace_events")
