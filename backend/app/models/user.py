import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class UserRole(str, enum.Enum):
    COLLECTOR = "COLLECTOR"
    RECYCLER = "RECYCLER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    def __init__(self, **kwargs):
        if "hashed_password" in kwargs and "password_hash" not in kwargs:
            kwargs["password_hash"] = kwargs.pop("hashed_password")
        super().__init__(**kwargs)

    @property
    def hashed_password(self):
        return self.password_hash


    @hashed_password.setter
    def hashed_password(self, val):
        self.password_hash = val

    role = Column(String(20), nullable=False, default=UserRole.COLLECTOR.value)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    collector_profile = relationship("CollectorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recycler_profile = relationship("RecyclerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
