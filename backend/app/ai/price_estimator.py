from typing import Dict, Any, Optional
from app.ai.material_profiles import MATERIAL_PROFILES, MaterialProfileEngine

CONDITION_MULTIPLIERS = {
    "NEW": 1.10,
    "LIKE_NEW": 1.05,
    "GOOD": 1.00,
    "FAIR": 0.90,
    "POOR": 0.75,
    "DAMAGED": 0.60,
}

class PriceEstimator:
    """
    AI Price Estimation Foundation for RECYCLINK.
    Computes transparent, deterministic value projections based on material
    category baselines, collector-verified weight, and component condition.
    """

    METHOD = "DEMO_PRICE_MODEL"

    @classmethod
    def estimate_value(
        cls,
        material_name: str,
        weight: float,
        condition: Optional[str] = "GOOD",
        location_id: Optional[int] = None,
        base_rate_override: Optional[float] = None
    ) -> Dict[str, Any]:
        if weight <= 0:
            weight = 1.0

        key = MaterialProfileEngine.find_key_by_category(material_name)
        profile = MATERIAL_PROFILES.get(key, MATERIAL_PROFILES["pcb"])

        base_rate = base_rate_override or profile["base_price_per_kg"]
        cond_key = (condition or "GOOD").upper()
        multiplier = CONDITION_MULTIPLIERS.get(cond_key, 1.00)

        recommended_val = round(base_rate * weight * multiplier, 2)
        min_val = round(recommended_val * 0.92, 2)
        max_val = round(recommended_val * 1.14, 2)

        return {
            "material": profile["category"],
            "material_subcategory": profile["subcategory"],
            "weight": weight,
            "condition": cond_key,
            "estimated_min": min_val,
            "estimated_max": max_val,
            "recommended_value": recommended_val,
            "confidence": profile["demo_confidence"],
            "method": cls.METHOD,
            "currency": "INR",
            "is_demo_estimate": True
        }
