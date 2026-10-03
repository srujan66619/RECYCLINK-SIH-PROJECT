import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class DisputeType(str, enum.Enum):
    WEIGHT_DISCREPANCY = "WEIGHT_DISCREPANCY"
    MATERIAL_CLASSIFICATION = "MATERIAL_CLASSIFICATION"
    PRICE_DISAGREEMENT = "PRICE_DISAGREEMENT"
    PICKUP_DELAY = "PICKUP_DELAY"
    HANDOVER_FAILED = "HANDOVER_FAILED"
    TRACEABILITY_GAP = "TRACEABILITY_GAP"

class DisputeStatus(str, enum.Enum):
    DISPUTE_CREATED = "DISPUTE_CREATED"
    EVIDENCE_COLLECTION = "EVIDENCE_COLLECTION"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class DisputeRecord(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    dispute_code = Column(String(50), unique=True, index=True, nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True, index=True)
    lot_id = Column(Integer, ForeignKey("e_waste_lots.id"), nullable=True, index=True)
    trace_id = Column(String(100), nullable=True, index=True)
    
    raised_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raised_by_role = Column(String(50), default="COLLECTOR")
    dispute_type = Column(String(50), default=DisputeType.WEIGHT_DISCREPANCY.value)
    status = Column(String(50), default=DisputeStatus.DISPUTE_CREATED.value, index=True)
    
    title = Column(String(255), nullable=False)
    claim_description = Column(Text, nullable=False)
    claimed_value = Column(Float, nullable=True)
    recorded_value = Column(Float, nullable=True)
    
    evidence_package_json = Column(Text, nullable=True)
    ai_dispute_summary = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    lot = relationship("EWasteLot", backref="disputes")
    transaction = relationship("Transaction", backref="disputes")
