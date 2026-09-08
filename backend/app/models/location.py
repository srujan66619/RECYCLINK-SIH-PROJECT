from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    collectors = relationship("CollectorProfile", back_populates="location")
    recyclers = relationship("RecyclerProfile", back_populates="location")
    lots = relationship("EWasteLot", back_populates="location")
