from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.recycler import RecyclerProfile
from app.models.recycler_offer import RecyclerOffer
from app.models.material import MaterialCategory
from app.models.location import Location
from app.matching.schemas import RecommendedRecycler, RecyclerOfferDetail, MatchComponentScores
from app.matching.distance import DistanceCalculator
from app.matching.scorer import RecyclerScorer

class RecyclerMatchingService:
    """
    Intelligent Recycler Recommendation & Smart Matching Engine.
    Matches informal collectors with certified, high-paying, proximity-optimal formal recyclers.
    """

    @classmethod
    def get_recommended_recyclers(
        cls,
        db: Session,
        material_name: Optional[str] = "PCB",
        material_id: Optional[int] = None,
        weight_kg: float = 2.4,
        condition: str = "Standard Scrap",
        location_id: Optional[int] = None,
        collector_lat: float = 17.3850,
        collector_lon: float = 78.4867,
        collector_city: Optional[str] = "Hyderabad",
        max_results: int = 10
    ) -> List[RecommendedRecycler]:
        # 1. Resolve material details
        target_material = material_name or "PCB"
        target_mat_id = material_id
        if material_id and not material_name:
            mat = db.query(MaterialCategory).filter(MaterialCategory.id == material_id).first()
            if mat:
                target_material = mat.name
                target_mat_id = mat.id
        elif material_name and not material_id:
            mat = db.query(MaterialCategory).filter(
                MaterialCategory.name.ilike(f"%{material_name}%") |
                MaterialCategory.category.ilike(f"%{material_name}%")
            ).first()
            if mat:
                target_mat_id = mat.id

        if location_id and not collector_city:
            loc = db.query(Location).filter(Location.id == location_id).first()
            if loc:
                collector_city = loc.city

        # 2. Query active recyclers
        recyclers = db.query(RecyclerProfile).filter(RecyclerProfile.is_active == True).all()
        if not recyclers:
            return []

        # 3. Retrieve baseline pricing
        base_rate = 455.0
        if "cable" in target_material.lower():
            base_rate = 210.0
        elif "battery" in target_material.lower():
            base_rate = 195.0
        elif "crt" in target_material.lower():
            base_rate = 24.0
        elif "motor" in target_material.lower():
            base_rate = 155.0
        elif "magnet" in target_material.lower():
            base_rate = 225.0
        elif "plastic" in target_material.lower():
            base_rate = 38.0

        # 4. Gather live bids and material compatibility for each recycler
        candidates = []
        for r in recyclers:
            accepted = r.accepted_materials or []
            is_compat = any(
                m.lower() in target_material.lower() or target_material.lower() in m.lower()
                for m in accepted
            )

            # Check for live offer in DB
            offer_rate = None
            if target_mat_id:
                ro = db.query(RecyclerOffer).filter(
                    RecyclerOffer.recycler_id == r.id,
                    RecyclerOffer.material_id == target_mat_id,
                    RecyclerOffer.is_active == True
                ).first()
                if ro:
                    offer_rate = ro.offer_price_per_kg

            if offer_rate is None:
                # Deterministic realistic demo bidding variation
                # GreenCycle gets top bid, EcoFormal gets competitive bid
                fname = r.facility_name.lower()
                if "green" in fname:
                    offer_rate = round(base_rate + 10.0, 1)  # e.g., 465 for PCB
                elif "eco" in fname:
                    offer_rate = round(base_rate + 25.0, 1)  # e.g., 480 for PCB
                elif "circular" in fname or "bharat" in fname:
                    offer_rate = round(base_rate - 25.0, 1)  # e.g., 430 for PCB
                else:
                    var = 1.0 + (((r.id % 5) - 2) * 0.03)
                    offer_rate = round(base_rate * var, 1)

            dist_km, dist_label = DistanceCalculator.calculate_distance(
                collector_lat=collector_lat,
                collector_lon=collector_lon,
                recycler_lat=r.latitude,
                recycler_lon=r.longitude,
                collector_city=collector_city,
                recycler_city=r.city
            )

            candidates.append({
                "recycler": r,
                "is_compatible": is_compat,
                "offer_rate": offer_rate,
                "distance_km": dist_km,
                "distance_label": dist_label
            })

        # Filter out completely incompatible recyclers unless none exist
        compatible_candidates = [c for c in candidates if c["is_compatible"]]
        eval_pool = compatible_candidates if compatible_candidates else candidates

        # Find maximum offer rate to award 'highest offer' badge
        max_rate = max((c["offer_rate"] for c in eval_pool), default=base_rate)

        # 5. Score candidates
        scored_results: List[RecommendedRecycler] = []
        for c in eval_pool:
            r = c["recycler"]
            rate = c["offer_rate"]
            is_highest = (rate == max_rate and rate > base_rate)

            overall, comp_scores, reasons = RecyclerScorer.score_recycler(
                authorization_status=r.authorization_status or "VERIFIED_DEMO",
                is_material_compatible=c["is_compatible"],
                offered_price=rate,
                benchmark_price=base_rate,
                distance_km=c["distance_km"],
                pickup_available=r.pickup_available,
                weight_kg=weight_kg,
                rating=r.rating or 4.5,
                service_radius_km=r.service_radius_km or 40.0,
                is_highest_offer=is_highest
            )

            scored_results.append(RecommendedRecycler(
                recycler_id=r.id,
                id=r.id,
                facility_name=r.facility_name,
                authorization_no=r.authorization_number or r.authorization_no or "CPCB-AUTH-2026",
                authorization_status=r.authorization_status or "VERIFIED_DEMO",
                distance_km=c["distance_km"],
                distance_label=c["distance_label"],
                offer_price=rate,
                offered_price_per_kg=rate,
                pickup_available=r.pickup_available,
                rating=r.rating or 4.5,
                reliability_score=round(overall, 1),
                overall_score=round(overall, 1),
                component_scores=comp_scores,
                match_reasons=reasons,
                accepted_materials=r.accepted_materials or [],
                city=r.city or "Hyderabad",
                state=r.state or "Telangana",
                service_radius_km=r.service_radius_km or 40.0,
                is_compatible=c["is_compatible"]
            ))

        # Sort descending by overall score
        scored_results.sort(key=lambda x: x.overall_score, reverse=True)
        return scored_results[:max_results]

    @classmethod
    def get_recycler_offers(cls, db: Session, recycler_id: int) -> List[RecyclerOfferDetail]:
        offers = (
            db.query(RecyclerOffer, MaterialCategory)
            .join(MaterialCategory, RecyclerOffer.material_id == MaterialCategory.id)
            .filter(RecyclerOffer.recycler_id == recycler_id, RecyclerOffer.is_active == True)
            .all()
        )
        result = []
        for ro, mat in offers:
            result.append(RecyclerOfferDetail(
                id=ro.id,
                recycler_id=ro.recycler_id,
                material_id=ro.material_id,
                material_name=mat.name,
                offer_price_per_kg=ro.offer_price_per_kg,
                min_weight_kg=ro.min_weight_kg,
                pickup_available=ro.pickup_available,
                valid_from=ro.valid_from,
                valid_until=ro.valid_until,
                is_active=ro.is_active
            ))
        return result
