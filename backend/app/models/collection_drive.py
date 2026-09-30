from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.database.base import Base

class CollectionDrive(Base):
    __tablename__ = "collection_drives"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    location = Column(String(200), nullable=False)
    city = Column(String(100), default="Hyderabad")
    drive_date = Column(DateTime, default=datetime.utcnow)
    target_weight_kg = Column(Float, default=1000.0)
    collected_weight_kg = Column(Float, default=0.0)
    target_collectors = Column(Integer, default=50)
    participating_collectors = Column(Integer, default=0)
    accepted_materials = Column(String(255), default="PCB, Battery, Cable, LCD, Motor")
    status = Column(String(50), default="UPCOMING")  # UPCOMING, ACTIVE, COMPLETED
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
