import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.recycler import RecyclerProfile
from app.models.material import MaterialCategory
from app.core.exceptions import NotFoundException

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class RecyclerService:
    @staticmethod
    def get_recyclers(db: Session, city: Optional[str] = None) -> List[RecyclerProfile]:
        query = db.query(RecyclerProfile).filter(RecyclerProfile.is_active == True)
        if city:
            query = query.filter(RecyclerProfile.city.ilike(f"%{city}%"))
        return query.all()

    @staticmethod
    def get_recycler_by_id(db: Session, recycler_id: int) -> RecyclerProfile:
        recycler = db.query(RecyclerProfile).filter(RecyclerProfile.id == recycler_id).first()
        if not recycler:
            raise NotFoundException("RECYCLER", str(recycler_id))
        return recycler

    @staticmethod
    def get_recommended(
        db: Session,
        material_name: Optional[str] = None,
        material_id: Optional[int] = None,
        location_id: Optional[int] = None,
        weight_kg: float = 2.4,
        collector_lat: float = 17.3850,
        collector_lon: float = 78.4867,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        # Resolve material name if material_id provided
        if material_id and not material_name:
            mat = db.query(MaterialCategory).filter(MaterialCategory.id == material_id).first()
            if mat:
                material_name = mat.name
        
        target_material = material_name or "PCB"

        # Query all active recyclers with VERIFIED or VERIFIED_DEMO status
        query = db.query(RecyclerProfile).filter(
            RecyclerProfile.is_active == True,
            RecyclerProfile.authorization_status.in_(["VERIFIED", "VERIFIED_DEMO"])
        ).all()

        scored_recyclers = []

        for r in query:
            accepted = r.accepted_materials or []
            is_compatible = any(
                m.lower() in target_material.lower() or target_material.lower() in m.lower()
                for m in accepted
            )

            dist = haversine_distance(collector_lat, collector_lon, r.latitude, r.longitude)

            base_rate = 450.0
            if "pcb" in target_material.lower():
                base_rate = 465.0 if "green" in r.facility_name.lower() else 445.0
            elif "cable" in target_material.lower():
                base_rate = 220.0
            elif "battery" in target_material.lower():
                base_rate = 205.0

            # Composite deterministic ranking score (0-100)
            dist_score = max(0, 100 - (dist * 2.0))
            price_score = min(100, (base_rate / 500.0) * 100)
            rating_score = (r.rating / 5.0) * 100
            pickup_bonus = 100 if (r.pickup_available and weight_kg >= r.pickup_min_weight_kg) else 50

            composite = (
                (dist_score * 0.35) +
                (price_score * 0.35) +
                (rating_score * 0.20) +
                (pickup_bonus * 0.10)
            )

            scored_recyclers.append({
                "id": r.id,
                "facility_name": r.facility_name,
                "authorization_no": r.authorization_number,
                "authorization_status": r.authorization_status,
                "distance_km": dist,
                "accepted_materials": accepted,
                "offered_price_per_kg": base_rate,
                "pickup_available": r.pickup_available,
                "rating": r.rating,
                "reliability_score": round(composite, 1),
                "city": r.city,
                "service_radius_km": r.service_radius_km,
                "is_compatible": is_compatible
            })

        # Sort by compatibility then composite score
        scored_recyclers.sort(key=lambda x: (x["is_compatible"], x["reliability_score"]), reverse=True)
        return scored_recyclers[:max_results]
