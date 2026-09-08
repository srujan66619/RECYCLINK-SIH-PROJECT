from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.collector import CollectorProfile
from app.models.material import MaterialCategory
from app.models.user import User, UserRole
from app.schemas.lot import LotCreate, LotUpdate
from app.utils.ids import generate_lot_id, generate_trace_id
from app.traceability.qr_generator import generate_qr_data_url
from app.services.trace_service import TraceService
from app.core.exceptions import NotFoundException, ForbiddenException, AppException

class LotService:
    @staticmethod
    def create_lot(db: Session, collector_user: User, data: LotCreate) -> EWasteLot:
        # Validate collector profile
        profile = collector_user.collector_profile
        if not profile:
            profile = db.query(CollectorProfile).filter(CollectorProfile.user_id == collector_user.id).first()
            if not profile:
                profile = db.query(CollectorProfile).first()
                if not profile:
                    raise AppException("COLLECTOR_PROFILE_MISSING", "Collector profile not found for user")

        # Validate material if ID supplied, otherwise match by name
        material = None
        if data.material_id:
            material = db.query(MaterialCategory).filter(MaterialCategory.id == data.material_id).first()
            if not material:
                raise NotFoundException("MATERIAL", str(data.material_id))
        else:
            material = db.query(MaterialCategory).filter(MaterialCategory.name.ilike(f"%{data.material_name}%")).first()

        lot_id = generate_lot_id(db)
        trace_id = generate_trace_id(db)
        qr_url = generate_qr_data_url(trace_id)

        bench_rate = material.current_benchmark_price if material else 455.0
        rec_price = round(bench_rate * data.weight_kg, 2)
        quoted_price = data.quoted_price if data.quoted_price is not None else rec_price

        lot = EWasteLot(
            lot_id=lot_id,
            trace_id=trace_id,
            collector_id=profile.id,
            material_id=material.id if material else None,
            material_name=data.material_name,
            subcategory=data.subcategory or (material.subcategory if material else "Grade A"),
            photo_url=data.photo_url or "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
            estimated_weight=data.weight_kg,
            estimated_price_min=round(rec_price * 0.88, 2),
            estimated_price_max=round(rec_price * 1.12, 2),
            recommended_price=rec_price,
            quoted_price=quoted_price,
            condition=data.condition or "Standard Scrap",
            location_address=data.location_address or f"{profile.city}, India",
            location_lat=data.location_lat or 17.3850,
            location_lng=data.location_lng or 78.4867,
            qr_code_url=qr_url,
            ai_confidence=data.ai_confidence or 0.94,
            hazard_level=data.hazard_level or (material.hazard_level if material else "MEDIUM"),
            status=LotStatus.DRAFT.value
        )
        db.add(lot)
        db.commit()
        db.refresh(lot)

        # Create Initial Trace Event: COLLECTED
        TraceService.record_event(
            db=db,
            lot_id=lot.id,
            trace_id=lot.trace_id,
            stage="COLLECTED",
            title="Material Deposited by Informal Collector",
            description=f"Intake of {data.weight_kg} kg {lot.material_name} registered into RECYCLINK.",
            actor_role="COLLECTOR",
            actor_name=collector_user.full_name,
            actor_id=collector_user.id,
            location=lot.location_address,
            metadata_json={"lot_id": lot.lot_id, "weight_kg": data.weight_kg}
        )

        return lot

    @staticmethod
    def get_lot(db: Session, lot_id_or_pk: str, current_user: Optional[User] = None) -> EWasteLot:
        query = db.query(EWasteLot)
        if lot_id_or_pk.isdigit():
            lot = query.filter(EWasteLot.id == int(lot_id_or_pk)).first()
        else:
            lot = query.filter((EWasteLot.lot_id == lot_id_or_pk) | (EWasteLot.trace_id == lot_id_or_pk)).first()
        
        if not lot:
            raise NotFoundException("LOT", str(lot_id_or_pk))
        
        # Enforce collector data isolation
        if current_user and current_user.role == UserRole.COLLECTOR.value:
            if current_user.collector_profile and lot.collector_id != current_user.collector_profile.id:
                raise ForbiddenException("Collectors cannot view or access lots belonging to other collectors")
        
        return lot

    @staticmethod
    def list_lots(
        db: Session,
        current_user: Optional[User] = None,
        status: Optional[str] = None,
        collector_id: Optional[int] = None
    ) -> List[EWasteLot]:
        query = db.query(EWasteLot).order_by(EWasteLot.created_at.desc())
        
        # Isolation: If user is collector, restrict strictly to their own lots
        if current_user and current_user.role == UserRole.COLLECTOR.value:
            prof_id = current_user.collector_profile.id if current_user.collector_profile else -1
            query = query.filter(EWasteLot.collector_id == prof_id)
        elif collector_id:
            query = query.filter(EWasteLot.collector_id == collector_id)
            
        if status:
            query = query.filter(EWasteLot.status == status)
            
        return query.limit(100).all()

    @staticmethod
    def update_lot(db: Session, lot_id_or_pk: str, data: LotUpdate, current_user: User) -> EWasteLot:
        lot = LotService.get_lot(db, lot_id_or_pk, current_user)
        
        if data.weight_kg is not None:
            lot.estimated_weight = data.weight_kg
        if data.quoted_price is not None:
            lot.quoted_price = data.quoted_price
        if data.condition is not None:
            lot.condition = data.condition
        if data.status is not None:
            lot.status = data.status
            
        db.commit()
        db.refresh(lot)
        return lot
