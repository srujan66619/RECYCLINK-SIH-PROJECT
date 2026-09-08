from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    effective_date = Column(DateTime, default=datetime.utcnow)
    buying_price = Column(Float, nullable=True)
    benchmark_price = Column(Float, nullable=False)
    market_min = Column(Float, nullable=False)
    market_max = Column(Float, nullable=False)
    source_type = Column(String(100), default="CPCB Benchmark")
    source = Column(String(100), default="CPCB Benchmark")
    location_city = Column(String(100), default="All India")
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("MaterialCategory", back_populates="price_history")
