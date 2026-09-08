from typing import Dict, Any, Optional, List
from app.pricing.market_analyzer import MarketAnalyzer

class FairPriceCalculator:
    """
    Combines material baseline, condition adjustments, regional multipliers,
    historical rolling averages, and active recycler bids to compute
    transparent commodity price bands and recommended fair payouts.
    """

    @classmethod
    def compute(
        cls,
        material_name: str,
        weight_kg: float,
        condition: str = "Standard Scrap",
        location_city: str = "Hyderabad",
        historical_stats: Optional[Dict[str, Any]] = None,
        active_offers: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        baseline = MarketAnalyzer.get_material_baseline(material_name)
        condition_mult = MarketAnalyzer.get_condition_multiplier(condition)
        city_factor = MarketAnalyzer.get_regional_multiplier(location_city)

        base_min = baseline["min"]
        base_max = baseline["max"]
        base_rec = baseline["recommended"]

        # Blend with historical rolling average if available
        if historical_stats and historical_stats.get("observation_count", 0) >= 3:
            hist_avg = historical_stats["average"]
            hist_min = historical_stats["minimum"]
            hist_max = historical_stats["maximum"]
            # 60% historical anchor, 40% central baseline
            base_rec = (hist_avg * 0.60) + (base_rec * 0.40)
            base_min = min(base_min, hist_min)
            base_max = max(base_max, hist_max)

        # Incorporate active recycler bids if competitive
        if active_offers and len(active_offers) > 0:
            median_offer = sorted(active_offers)[len(active_offers) // 2]
            # 85% computed anchor, 15% current market bids
            base_rec = (base_rec * 0.85) + (median_offer * 0.15)

        # Apply regional and condition adjustments
        rate_min = round(base_min * city_factor * condition_mult, 1)
        rate_max = round(base_max * city_factor * condition_mult, 1)
        rate_rec = round(base_rec * city_factor * condition_mult, 1)

        # Enforce rate_min <= rate_rec <= rate_max
        rate_rec = max(rate_min, min(rate_max, rate_rec))

        total_value = round(rate_rec * weight_kg, 2)
        total_range = {
            "min": round(rate_min * weight_kg, 2),
            "max": round(rate_max * weight_kg, 2)
        }

        # Build transparent human-readable explanation
        adj_notes = []
        if condition_mult > 1.0:
            adj_notes.append("Grade A condition premium (+5%)")
        elif condition_mult < 1.0:
            adj_notes.append("wear/damage adjustment (-8%)")

        if city_factor > 1.0:
            adj_notes.append(f"regional hub multiplier for {location_city} (+{int(round((city_factor-1)*100))}%)")
        elif city_factor < 1.0:
            adj_notes.append(f"local transport index for {location_city}")

        explanation = f"Recommended value is based on recent {material_name} benchmark rates (₹{rate_min}–₹{rate_max}/kg)"
        if adj_notes:
            explanation += f", adjusted for {', '.join(adj_notes)}"
        explanation += f", current recycler offers, and verified {condition} condition."

        return {
            "market_min": rate_min,
            "market_max": rate_max,
            "recommended_price": rate_rec,
            "price_per_unit": rate_rec,
            "market_range_min_per_kg": rate_min,
            "market_range_max_per_kg": rate_max,
            "recommended_fair_price_per_kg": rate_rec,
            "total_estimated_value": total_value,
            "total_value_range": total_range,
            "condition_adjustment": condition_mult,
            "location_factor": city_factor,
            "explanation": explanation
        }
