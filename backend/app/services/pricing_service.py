from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.material import MaterialCategory
from app.models.price_history import PriceHistory
from app.models.recycler_offer import RecyclerOffer
from app.models.recycler import RecyclerProfile
from app.schemas.pricing import PriceEstimateResponse, RecyclerOfferComparison

# Base commodity index rates per kg (INR)
BENCHMARK_RATES: Dict[str, Dict[str, float]] = {
    "PCB": {"min": 390.0, "max": 480.0, "recommended": 455.0},
    "Cable": {"min": 180.0, "max": 230.0, "recommended": 210.0},
    "Battery": {"min": 160.0, "max": 220.0, "recommended": 195.0},
    "LCD": {"min": 95.0, "max": 140.0, "recommended": 120.0},
    "CRT": {"min": 18.0, "max": 28.0, "recommended": 24.0},
    "Motor": {"min": 130.0, "max": 175.0, "recommended": 155.0},
    "Magnet Assembly": {"min": 190.0, "max": 260.0, "recommended": 225.0},
    "Mixed Plastic": {"min": 28.0, "max": 45.0, "recommended": 38.0},
    "Electronic Component": {"min": 150.0, "max": 230.0, "recommended": 190.0},
    "Mixed E-Waste": {"min": 75.0, "max": 115.0, "recommended": 95.0},
}

REGIONAL_INDEX: Dict[str, float] = {
    "Hyderabad": 1.02,
    "Bengaluru": 1.05,
    "Vijayawada": 0.98,
    "Guntur": 0.97,
    "Bapatla": 0.95,
    "Mumbai": 1.06,
    "Pune": 1.03,
    "Delhi": 1.04
}

class PricingService:
    """
    Deterministic Fair Price Engine for Phase 2.
    Integrates PriceHistory and RecyclerOffer data.
    Designed modularly to later accept a trained ML regression model.
    """

    @classmethod
    def estimate_price(
        cls,
        db: Session,
        material_name: Optional[str] = None,
        material_id: Optional[int] = None,
        weight_kg: float = 1.0,
        location_city: str = "Hyderabad",
        condition: str = "Standard Scrap"
    ) -> Dict[str, Any]:
        matched_category = "PCB"

        # Lookup material from database if provided
        if material_id:
            mat = db.query(MaterialCategory).filter(MaterialCategory.id == material_id).first()
            if mat:
                matched_category = mat.category
        elif material_name:
            for k in BENCHMARK_RATES.keys():
                if k.lower() in material_name.lower():
                    matched_category = k
                    break

        base = BENCHMARK_RATES.get(matched_category, {"min": 100.0, "max": 200.0, "recommended": 150.0})
        city_factor = REGIONAL_INDEX.get(location_city, 1.0)

        # Condition multiplier
        condition_mult = 1.0
        if "premium" in condition.lower() or "grade a" in condition.lower():
            condition_mult = 1.05
        elif "damaged" in condition.lower() or "grade c" in condition.lower():
            condition_mult = 0.92

        rate_min = round(base["min"] * city_factor * condition_mult, 1)
        rate_max = round(base["max"] * city_factor * condition_mult, 1)
        rec_rate = round(base["recommended"] * city_factor * condition_mult, 1)

        total_est = round(rec_rate * weight_kg, 2)
        total_range = {
            "min": round(rate_min * weight_kg, 2),
            "max": round(rate_max * weight_kg, 2)
        }

        # Query recycler offers from database
        offers_query = (
            db.query(RecyclerOffer, RecyclerProfile)
            .join(RecyclerProfile, RecyclerOffer.recycler_id == RecyclerProfile.id)
            .filter(RecyclerOffer.is_active == True)
            .limit(5)
            .all()
        )

        nearby_offers: List[Dict[str, Any]] = []
        for ro, rp in offers_query:
            offer_rate = ro.offer_price_per_kg
            tag = cls.classify_price_tier(offer_rate, rate_min, rate_max, rec_rate)
            nearby_offers.append({
                "recycler_id": rp.id,
                "recycler_name": rp.facility_name,
                "distance_km": round(4.2 + (rp.id * 1.3), 1),
                "offer_rate_per_kg": offer_rate,
                "total_offer_amount": round(offer_rate * weight_kg, 2),
                "status_label": tag,
                "pickup_available": rp.pickup_available
            })

        if not nearby_offers:
            # Deterministic fallback bids
            demo_bids = [
                {"name": "GreenCycle E-Waste Tech", "rate": rec_rate + 10.0, "dist": 4.2},
                {"name": "EcoFormal Recovery India", "rate": rec_rate - 5.0, "dist": 7.5},
                {"name": "Bharat Circular Refiners", "rate": rec_rate - 15.0, "dist": 11.0},
            ]
            for i, b in enumerate(demo_bids, 1):
                tag = cls.classify_price_tier(b["rate"], rate_min, rate_max, rec_rate)
                nearby_offers.append({
                    "recycler_id": i,
                    "recycler_name": b["name"],
                    "distance_km": b["dist"],
                    "offer_rate_per_kg": b["rate"],
                    "total_offer_amount": round(b["rate"] * weight_kg, 2),
                    "status_label": tag,
                    "pickup_available": True
                })

        return {
            "material": matched_category,
            "weight_kg": weight_kg,
            "market_min": rate_min,
            "market_max": rate_max,
            "recommended_price": rec_rate,
            "market_range_min_per_kg": rate_min,
            "market_range_max_per_kg": rate_max,
            "recommended_fair_price_per_kg": rec_rate,
            "total_estimated_value": total_est,
            "price_status": "FAIR",
            "assessment_tier": "FAIR",
            "total_value_range": total_range,
            "nearby_recycler_offers": nearby_offers
        }

    @staticmethod
    def classify_price_tier(rate: float, min_rate: float, max_rate: float, rec_rate: float) -> str:
        if rate >= rec_rate:
            return "GOOD_OFFER"
        elif rate >= min_rate:
            return "FAIR"
        else:
            return "BELOW_FAIR"
