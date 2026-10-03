import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from app.database.base import Base

class PartnerType(str, enum.Enum):
    MUNICIPALITY = "MUNICIPALITY"
    EDUCATIONAL = "EDUCATIONAL"
    CORPORATE = "CORPORATE"
    NGO = "NGO"
    RECYCLER_NETWORK = "RECYCLER_NETWORK"
    COLLECTION_CENTER = "COLLECTION_CENTER"

class PartnerVerificationStatus(str, enum.Enum):
    APPLICATION = "APPLICATION"
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"

class InstitutionalPartner(Base):
    __tablename__ = "institutional_partners"

    id = Column(Integer, primary_key=True, index=True)
    partner_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    partner_type = Column(String(50), default=PartnerType.MUNICIPALITY.value)
    
    service_area = Column(String(255), nullable=False, default="Urban District")
    city = Column(String(100), default="Hyderabad")
    state = Column(String(100), default="Telangana")
    
    contact_person = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    
    verification_status = Column(String(50), default=PartnerVerificationStatus.ACTIVE.value, index=True)
    material_capabilities = Column(String(255), default="PCB, Batteries, Cables, IT Hardware")
    total_formalized_kg = Column(Float, default=0.0)
    active_campaigns_count = Column(Integer, default=0)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
