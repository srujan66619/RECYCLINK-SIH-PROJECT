from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class CollectorProfile(Base):
    __tablename__ = "collectors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    preferred_language = Column(String(10), default="en")
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    area = Column(String(255), nullable=True)
    city = Column(String(100), default="Hyderabad")
    state = Column(String(100), default="Telangana")
    pincode = Column(String(10), default="500001")
    upi_id = Column(String(100), nullable=True)
    photo_url = Column(String(500), nullable=True)
    total_earnings = Column(Float, default=0.0)
    total_weight_collected = Column(Float, default=0.0)

    def __init__(self, **kwargs):
        if "total_collected_kg" in kwargs and "total_weight_collected" not in kwargs:
            kwargs["total_weight_collected"] = kwargs.pop("total_collected_kg")
        super().__init__(**kwargs)

    @property
    def total_collected_kg(self):

        return self.total_weight_collected

    @total_collected_kg.setter
    def total_collected_kg(self, val):
        self.total_weight_collected = val

    rating = Column(Float, default=4.8)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


    user = relationship("User", back_populates="collector_profile")
    location = relationship("Location", back_populates="collectors")
    lots = relationship("EWasteLot", back_populates="collector", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="collector")
