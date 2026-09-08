from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class HandoverRecord(Base):
    __tablename__ = "handover_records"

    id = Column(Integer, primary_key=True, index=True)
    handover_id = Column(String(50), unique=True, index=True, nullable=True) # HR-2026-000241
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False)
    lot_id = Column(Integer, nullable=True)
    recycler_id = Column(Integer, nullable=True)
    collector_id = Column(Integer, nullable=True)

    def __init__(self, **kwargs):
        if "final_weight" not in kwargs or kwargs["final_weight"] is None:
            kwargs["final_weight"] = kwargs.get("verified_weight", 0.0)
        if "verified_weight" not in kwargs or kwargs["verified_weight"] is None:
            kwargs["verified_weight"] = kwargs.get("final_weight", 0.0)
        if "final_price" not in kwargs or kwargs["final_price"] is None:
            kwargs["final_price"] = kwargs.get("final_amount_paid", 0.0)
        if "final_amount_paid" not in kwargs or kwargs["final_amount_paid"] is None:
            kwargs["final_amount_paid"] = kwargs.get("final_price", 0.0)
        super().__init__(**kwargs)

    verified_by = Column(String(255), nullable=True)
    material_name = Column(String(100), nullable=True)
    initial_weight = Column(Float, default=0.0)
    final_weight = Column(Float, nullable=False)
    verified_weight = Column(Float, nullable=False)
    weight_discrepancy_pct = Column(Float, default=0.0)
    final_rate_per_kg = Column(Float, default=0.0)
    quoted_price = Column(Float, nullable=True)
    final_price = Column(Float, nullable=False)
    final_amount_paid = Column(Float, nullable=False)
    handover_photo = Column(String(500), nullable=True)
    photo_proof_url = Column(String(500), nullable=True)
    evidence_photo = Column(String(500), nullable=True)
    handover_location = Column(String(255), nullable=True)
    status = Column(String(50), default="VERIFIED")
    handover_timestamp = Column(DateTime, default=datetime.utcnow)
    recycler_digital_signature = Column(String(255), nullable=True)
    collector_confirmation = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="handover")
