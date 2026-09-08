import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship, synonym
from app.database.base import Base

class AuthorizationStatus(str, enum.Enum):
    VERIFIED_DEMO = "VERIFIED_DEMO"
    VERIFIED = "VERIFIED"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"
    REJECTED = "REJECTED"

class RecyclerProfile(Base):
    __tablename__ = "recyclers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    facility_name = Column(String(255), nullable=False)
    authorization_status = Column(String(50), default=AuthorizationStatus.VERIFIED_DEMO.value)
    authorization_number = Column(String(100), unique=True, nullable=False)

    def __init__(self, **kwargs):
        if "authorization_no" in kwargs and "authorization_number" not in kwargs:
            kwargs["authorization_number"] = kwargs.pop("authorization_no")
        kwargs.pop("state_pcb_cert", None)
        super().__init__(**kwargs)

    @property
    def authorization_no(self):

        return self.authorization_number

    @authorization_no.setter
    def authorization_no(self, value):
        self.authorization_number = value

    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(255), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), default="Hyderabad")
    state = Column(String(100), default="Telangana")
    pincode = Column(String(10), default="500051")
    latitude = Column(Float, default=17.3850)
    longitude = Column(Float, default=78.4867)
    accepted_materials = Column(JSON, default=list)
    service_radius_km = Column(Float, default=30.0)
    pickup_available = Column(Boolean, default=True)
    pickup_min_weight_kg = Column(Float, default=2.0)
    reliability_score = Column(Float, default=92.0)
    verification_status = Column(String(50), default="VERIFIED_DEMO")
    rating = Column(Float, default=4.9)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="recycler_profile")
    location = relationship("Location", back_populates="recyclers")
    transactions = relationship("Transaction", back_populates="recycler")
    offers = relationship("RecyclerOffer", back_populates="recycler", cascade="all, delete-orphan")
    pickups = relationship("PickupRecord", back_populates="recycler", cascade="all, delete-orphan")
