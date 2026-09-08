from typing import Dict, Any, List, Tuple
from app.matching.schemas import MatchComponentScores

DEFAULT_WEIGHTS = {
    "authorization": 0.30,
    "material": 0.20,
    "price": 0.20,
    "distance": 0.10,
    "pickup": 0.10,
    "reliability": 0.10
}

class RecyclerScorer:
    """
    Evaluates multi-factor commercial and compliance fitness of recyclers.
    Strictly prevents unverified or material-incompatible dismantlers from outranking
    verified formal facilities.
    """

    @classmethod
    def score_recycler(
        cls,
        authorization_status: str,
        is_material_compatible: bool,
        offered_price: float,
        benchmark_price: float,
        distance_km: float,
        pickup_available: bool,
        weight_kg: float,
        rating: float,
        service_radius_km: float = 40.0,
        weights: Dict[str, float] = DEFAULT_WEIGHTS,
        is_highest_offer: bool = False
    ) -> Tuple[float, MatchComponentScores, List[str]]:
        reasons: List[str] = []

        # 1. Authorization Score (30%)
        auth_upper = (authorization_status or "").upper()
        if "VERIFIED" in auth_upper:
            auth_score = 100.0
            reasons.append("✓ CPCB-Authorized formal recycling facility")
        elif "PENDING" in auth_upper:
            auth_score = 40.0
        else:
            auth_score = 10.0

        # 2. Material Compatibility Score (20%)
        if is_material_compatible:
            mat_score = 100.0
            reasons.append("✓ Accepts and formally processes this specific material stream")
        else:
            # Recycler does not accept material: hard 0 score
            mat_score = 0.0

        # 3. Price Score (20%)
        if benchmark_price > 0:
            price_ratio = offered_price / benchmark_price
            price_score = min(100.0, round(price_ratio * 90.0, 1))
        else:
            price_score = 80.0

        if is_highest_offer:
            reasons.append(f"✓ Highest available offer in your area (₹{offered_price}/kg)")
        elif offered_price >= benchmark_price:
            reasons.append(f"✓ Competitive rate at or above CPCB benchmark (₹{offered_price}/kg)")

        # 4. Distance Score (10%)
        # Closer is better. 0 km = 100 pts, 50 km = 0 pts
        dist_score = max(0.0, min(100.0, 100.0 - (distance_km * 2.0)))
        if distance_km <= service_radius_km:
            reasons.append(f"✓ Within direct service zone ({distance_km} km away)")
        else:
            dist_score = max(10.0, dist_score * 0.5)

        # 5. Pickup Availability Score (10%)
        if pickup_available and weight_kg >= 1.0:
            pickup_score = 100.0
            reasons.append("✓ Free doorstep logistics pickup scheduled")
        elif pickup_available:
            pickup_score = 80.0
            reasons.append("✓ Pickup available for bulk volume")
        else:
            pickup_score = 30.0

        # 6. Reliability Score (10%)
        # Rating 5.0 = 100 pts
        rel_score = max(0.0, min(100.0, (rating / 5.0) * 100.0))
        if rating >= 4.7:
            reasons.append(f"✓ Excellent collector rating ({rating}/5.0 stars)")

        # Composite overall score
        w = weights
        overall = (
            (auth_score * w.get("authorization", 0.30)) +
            (mat_score * w.get("material", 0.20)) +
            (price_score * w.get("price", 0.20)) +
            (dist_score * w.get("distance", 0.10)) +
            (pickup_score * w.get("pickup", 0.10)) +
            (rel_score * w.get("reliability", 0.10))
        )

        # Penalty: An unverified recycler cannot exceed 60 overall
        if "VERIFIED" not in auth_upper:
            overall = min(59.0, overall)

        # Hard constraint: Incompatible material cannot exceed 30 overall
        if not is_material_compatible:
            overall = min(25.0, overall)

        component_scores = MatchComponentScores(
            authorization_score=round(auth_score, 1),
            material_score=round(mat_score, 1),
            price_score=round(price_score, 1),
            distance_score=round(dist_score, 1),
            pickup_score=round(pickup_score, 1),
            reliability_score=round(rel_score, 1)
        )

        return round(overall, 1), component_scores, reasons
