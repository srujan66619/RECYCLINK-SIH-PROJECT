from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class UserRegister(BaseModel):
    email: str
    phone: str
    full_name: str
    password: str
    role: str = "COLLECTOR" # COLLECTOR, RECYCLER (ADMIN forbidden on public registration)
    city: Optional[str] = "Hyderabad"
    state: Optional[str] = "Telangana"
    area: Optional[str] = "Banjara Hills"
    facility_name: Optional[str] = None
    authorization_no: Optional[str] = None

class UserLogin(BaseModel):
    username_or_phone: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

    def __init__(self, **data):
        if "username_or_phone" not in data or not data["username_or_phone"]:
            data["username_or_phone"] = data.get("email") or data.get("phone") or ""
        super().__init__(**data)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    role: str
    email: str
    phone: str
    profile_id: Optional[int] = None
    city: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    phone: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
