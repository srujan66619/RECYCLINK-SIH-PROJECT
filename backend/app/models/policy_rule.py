from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database.base import Base

class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(Integer, primary_key=True, index=True)
    policy_key = Column(String(100), unique=True, nullable=False, index=True)
    policy_category = Column(String(50), nullable=False)  # TRUST, INCENTIVE, OPERATIONAL, CAPACITY, TRACEABILITY
    name = Column(String(255), nullable=False)
    value_type = Column(String(20), default="FLOAT")  # FLOAT, INT, STRING, BOOLEAN
    current_value = Column(String(255), nullable=False)
    default_value = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    
    updated_by_admin_id = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(Integer, primary_key=True, index=True)
    policy_key = Column(String(100), nullable=False, index=True)
    previous_value = Column(String(255), nullable=True)
    new_value = Column(String(255), nullable=False)
    version = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    changed_by_admin_name = Column(String(100), default="Admin Authority")
    created_at = Column(DateTime, default=datetime.utcnow)
