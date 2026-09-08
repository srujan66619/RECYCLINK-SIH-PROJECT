from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.price_history import PriceHistory
from app.models.material import MaterialCategory

# CPCB-Referenced Base Commodity Rates (INR/kg)
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
    "Delhi": 1.04,
    "All India": 1.00
}

class MarketAnalyzer:
    """
    Analyzes commodity benchmarks, regional factors, and historical transaction prices.
    """

    @classmethod
    def get_material_baseline(cls, material_name: str) -> Dict[str, float]:
        norm = (material_name or "PCB").lower()
        for key, val in BENCHMARK_RATES.items():
            if key.lower() in norm or norm in key.lower():
                return val
        return {"min": 100.0, "max": 200.0, "recommended": 150.0}

    @classmethod
    def get_regional_multiplier(cls, city: Optional[str]) -> float:
        if not city:
            return 1.0
        for known_city, factor in REGIONAL_INDEX.items():
            if known_city.lower() in city.lower() or city.lower() in known_city.lower():
                return factor
        return 1.0

    @classmethod
    def get_condition_multiplier(cls, condition: Optional[str]) -> float:
        if not condition:
            return 1.0
        c = condition.lower()
        if "premium" in c or "grade a" in c or "clean" in c or "unstripped" in c:
            return 1.05
        elif "damaged" in c or "grade c" in c or "burnt" in c or "corroded" in c:
            return 0.92
        return 1.0

    @classmethod
    def analyze_historical_trend(
        cls,
        db: Session,
        material_id: Optional[int] = None,
        material_name: Optional[str] = None,
        days: int = 90
    ) -> Dict[str, Any]:
        """
        Calculates price trend, average, min, max, and percentage change.
        Returns 'INSUFFICIENT DATA' if fewer than 3 records exist.
        """
        query = db.query(PriceHistory)
        if material_id:
            query = query.filter(PriceHistory.material_id == material_id)
        elif material_name:
            query = query.join(MaterialCategory, PriceHistory.material_id == MaterialCategory.id, isouter=True)\
                         .filter(MaterialCategory.name.ilike(f"%{material_name}%"))

        since_date = datetime.utcnow() - timedelta(days=days)
        history = query.filter(PriceHistory.effective_date >= since_date)\
                       .order_by(PriceHistory.effective_date.asc())\
                       .all()

        if len(history) < 3:
            # Fallback to all-time or report insufficient data
            all_records = query.order_by(PriceHistory.effective_date.asc()).all()
            if len(all_records) >= 3:
                history = all_records
            else:
                baseline = cls.get_material_baseline(material_name or "PCB")
                return {
                    "trend": "INSUFFICIENT DATA",
                    "percentage_change": 0.0,
                    "average": baseline["recommended"],
                    "minimum": baseline["min"],
                    "maximum": baseline["max"],
                    "observation_count": len(history),
                    "recent_average": None,
                    "older_average": None
                }

        prices = [h.benchmark_price for h in history]
        avg_price = round(sum(prices) / len(prices), 1)
        min_price = round(min(prices), 1)
        max_price = round(max(prices), 1)

        # Split into older half and recent half
        mid = len(history) // 2
        older_half = history[:mid]
        recent_half = history[mid:]

        older_avg = sum(h.benchmark_price for h in older_half) / len(older_half)
        recent_avg = sum(h.benchmark_price for h in recent_half) / len(recent_half)

        if older_avg > 0:
            pct_change = round(((recent_avg - older_avg) / older_avg) * 100, 1)
        else:
            pct_change = 0.0

        if pct_change > 1.5:
            trend = "RISING"
        elif pct_change < -1.5:
            trend = "FALLING"
        else:
            trend = "STABLE"

        return {
            "trend": trend,
            "percentage_change": pct_change,
            "average": avg_price,
            "minimum": min_price,
            "maximum": max_price,
            "observation_count": len(history),
            "recent_average": round(recent_avg, 1),
            "older_average": round(older_avg, 1)
        }
