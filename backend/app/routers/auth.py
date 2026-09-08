from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import User, CollectorProfile, RecyclerProfile, UserRole, AuthorizationStatus
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegister, db: Session = Depends(get_db)):
    # Check existing user
    existing = db.query(User).filter((User.email == req.email) | (User.phone == req.phone)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or phone number already exists."
        )

    role_val = req.role.upper()
    if role_val == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be registered publicly."
        )
    if role_val not in [UserRole.COLLECTOR.value, UserRole.RECYCLER.value]:
        role_val = UserRole.COLLECTOR.value

    hashed = get_password_hash(req.password)
    user = User(
        email=req.email,
        phone=req.phone,
        full_name=req.full_name,
        role=role_val,
        hashed_password=hashed,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile_id = None
    if role_val == UserRole.COLLECTOR.value:
        profile = CollectorProfile(
            user_id=user.id,
            area=req.area or "Banjara Hills",
            city=req.city or "Hyderabad",
            state=req.state or "Telangana",
            pincode="500034",
            upi_id=f"{req.phone}@upi",
            rating=5.0
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        profile_id = profile.id
    elif role_val == UserRole.RECYCLER.value:
        profile = RecyclerProfile(
            user_id=user.id,
            facility_name=req.facility_name or f"{req.full_name} Recycling Works",
            authorization_no=req.authorization_no or f"CPCB/EW/2026/{user.id:04d}",
            authorization_status=AuthorizationStatus.VERIFIED.value,
            address=f"{req.area or 'Industrial Area'}, {req.city or 'Hyderabad'}",
            city=req.city or "Hyderabad",
            state=req.state or "Telangana",
            pincode="500051",
            latitude=17.4399,
            longitude=78.4983,
            contact_phone=req.phone,
            contact_email=req.email,
            accepted_materials=["PCB", "Cable", "Battery", "Electronic Component"],
            pickup_available=True,
            rating=4.9
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        profile_id = profile.id

    token = create_access_token({"sub": str(user.id), "user_id": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
        email=user.email,
        phone=user.phone,
        profile_id=profile_id,
        city=req.city or "Hyderabad"
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == req.username_or_phone) | (User.phone == req.username_or_phone)
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify phone number and password."
        )

    profile_id = None
    city = "Hyderabad"
    if user.role == UserRole.COLLECTOR.value and user.collector_profile:
        profile_id = user.collector_profile.id
        city = user.collector_profile.city
    elif user.role == UserRole.RECYCLER.value and user.recycler_profile:
        profile_id = user.recycler_profile.id
        city = user.recycler_profile.city

    token = create_access_token({"sub": str(user.id), "user_id": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
        email=user.email,
        phone=user.phone,
        profile_id=profile_id,
        city=city
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
