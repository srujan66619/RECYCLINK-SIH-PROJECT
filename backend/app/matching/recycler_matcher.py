import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import RecyclerProfile, AuthorizationStatus

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great circle distance between two points in kilometers."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class RecyclerMatcher:
    """
    Smart Recycler Recommendation Engine.
    Scores and ranks authorized recyclers based on material acceptance,
    geographic proximity, offered price, pickup feasibility, and reliability.
    """

    @classmethod
    def recommend_recyclers(
        cls,
        db: Session,
        material_name: str,
        weight_kg: float,
        collector_lat: float = 17.3850,
        collector_lon: float = 78.4867,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        # Fetch all verified active recyclers
        query = db.query(RecyclerProfile).filter(
            RecyclerProfile.is_active == True,
            RecyclerProfile.authorization_status == AuthorizationStatus.VERIFIED.value
        ).all()

        scored_recyclers = []

        for r in query:
            # Check material compatibility
            accepted = r.accepted_materials or []
            is_compatible = any(
                m.lower() in material_name.lower() or material_name.lower() in m.lower()
                for m in accepted
            )
            # Distance computation
            dist = haversine_distance(collector_lat, collector_lon, r.latitude, r.longitude)

            # Check if within service radius or default 40 km
            max_radius = r.service_radius_km or 40.0
            within_reach = dist <= (max_radius * 2.5) # allow slight regional margin

            # Calculate offered price (base pricing + margin)
            base_rate = 450.0
            if "pcb" in material_name.lower():
                base_rate = 465.0 if r.facility_name.startswith("Green") else 445.0
            elif "cable" in material_name.lower():
                base_rate = 220.0
            elif "battery" in material_name.lower():
                base_rate = 205.0

            # Composite scoring formula (0-100)
            # Distance score: closer is higher (weight 35%)
            dist_score = max(0, 100 - (dist * 2.0))
            # Price score: higher offer is higher (weight 35%)
            price_score = min(100, (base_rate / 500.0) * 100)
            # Rating/Reliability (weight 20%)
            rating_score = (r.rating / 5.0) * 100
            # Pickup availability (weight 10%)
            pickup_bonus = 100 if (r.pickup_available and weight_kg >= r.pickup_min_weight_kg) else 50

            composite_score = (
                (dist_score * 0.35) +
                (price_score * 0.35) +
                (rating_score * 0.20) +
                (pickup_bonus * 0.10)
            )

            scored_recyclers.append({
                "id": r.id,
                "facility_name": r.facility_name,
                "authorization_no": r.authorization_no,
                "authorization_status": r.authorization_status,
                "distance_km": dist,
                "accepted_materials": accepted,
                "offered_price_per_kg": base_rate,
                "pickup_available": r.pickup_available,
                "rating": r.rating,
                "reliability_score": round(composite_score, 1),
                "city": r.city,
                "service_radius_km": r.service_radius_km,
                "is_compatible": is_compatible
            })

        # Sort by composite score descending
        scored_recyclers.sort(key=lambda x: (x["is_compatible"], x["reliability_score"]), reverse=True)
        return scored_recyclers[:max_results]
