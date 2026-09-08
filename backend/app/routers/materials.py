from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.material import MaterialCategory
from app.schemas.material import MaterialCategoryOut, MaterialCreate
from app.core.dependencies import require_admin
from app.models.user import User

router = APIRouter(prefix="/api/materials", tags=["Materials & E-Waste Categories"])

@router.get("", response_model=List[MaterialCategoryOut])
def list_materials(
    category: Optional[str] = Query(None, description="Filter by category"),
    hazard_level: Optional[str] = Query(None, description="Filter by hazard level"),
    search: Optional[str] = Query(None, description="Search term for name or code"),
    active_only: bool = Query(True, description="Only active materials"),
    db: Session = Depends(get_db)
):
    """
    List all cataloged e-waste material categories with benchmark pricing and hazard ratings.
    """
    query = db.query(MaterialCategory)
    if active_only:
        query = query.filter(MaterialCategory.is_active == True)
    if category:
        query = query.filter(MaterialCategory.category.ilike(f"%{category}%"))
    if hazard_level:
        query = query.filter(MaterialCategory.hazard_level == hazard_level.upper())
    if search:
        query = query.filter(
            (MaterialCategory.name.ilike(f"%{search}%")) |
            (MaterialCategory.code.ilike(f"%{search}%"))
        )
    return query.order_by(MaterialCategory.name.asc()).all()

@router.get("/{id}", response_model=MaterialCategoryOut)
def get_material(id: int, db: Session = Depends(get_db)):
    """
    Fetch a single material category by ID.
    """
    material = db.query(MaterialCategory).filter(MaterialCategory.id == id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material category not found")
    return material

@router.post("", response_model=MaterialCategoryOut, dependencies=[Depends(require_admin)])
def create_material(
    req: MaterialCreate,
    db: Session = Depends(get_db)
):
    """
    Admin-only: Create a new e-waste material category.
    """
    existing = db.query(MaterialCategory).filter(MaterialCategory.code == req.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Material with this code already exists")
    
    mat = MaterialCategory(
        code=req.code,
        name=req.name,
        category=req.category,
        subcategory=req.subcategory,
        description=req.description,
        hazard_level=req.hazard_level,
        base_market_price_min=req.base_market_price_min,
        base_market_price_max=req.base_market_price_max,
        current_benchmark_price=req.current_benchmark_price,
        recoverable_materials=req.recoverable_materials,
        is_active=True
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat
