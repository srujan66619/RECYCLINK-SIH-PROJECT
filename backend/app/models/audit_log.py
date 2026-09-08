from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from app.database.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
