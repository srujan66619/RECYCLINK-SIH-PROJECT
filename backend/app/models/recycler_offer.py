from datetime import datetime
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class RecyclerOffer(Base):
    __tablename__ = "recycler_offers"

    id = Column(Integer, primary_key=True, index=True)
    recycler_id = Column(Integer, ForeignKey("recyclers.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    price_per_unit = Column(Float, nullable=True)
    offer_price_per_kg = Column(Float, nullable=False)
    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    min_weight_kg = Column(Float, default=1.0)
    pickup_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    recycler = relationship("RecyclerProfile", back_populates="offers")
    material = relationship("MaterialCategory", back_populates="offers")
