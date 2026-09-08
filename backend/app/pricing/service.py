from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.material import MaterialCategory
from app.models.price_history import PriceHistory
from app.models.recycler_offer import RecyclerOffer
from app.models.recycler import RecyclerProfile
from app.models.location import Location

from app.pricing.schemas import (
    PriceEstimateRequest, FairPriceEstimateResponse,
    PriceTrendResponse, PriceHistoryRecord, OfferComparisonItem
)
from app.pricing.market_analyzer import MarketAnalyzer
from app.pricing.offer_analyzer import OfferAnalyzer
from app.pricing.confidence import PriceConfidenceCalculator
from app.pricing.calculator import FairPriceCalculator

class FairPriceService:
    """
    Main commercial intelligence facade for RECYCLINK.
    Unifies market ranges, historical price trends, recycler offer evaluation,
    confidence grading, and transparent recommendation explainability.
    """

    @classmethod
    def estimate_price(
        cls,
        db: Session,
        material_name: Optional[str] = "PCB",
        material_id: Optional[int] = None,
        weight_kg: float = 1.0,
        condition: str = "Standard Scrap",
        location_id: Optional[int] = None,
        location_city: str = "Hyderabad"
    ) -> FairPriceEstimateResponse:
        # Resolve material and location
        resolved_name = material_name or "PCB"
        resolved_mat_id = material_id

        if material_id and not material_name:
            mat = db.query(MaterialCategory).filter(MaterialCategory.id == material_id).first()
            if mat:
                resolved_name = mat.name
                resolved_mat_id = mat.id
        elif material_name and not material_id:
            mat = db.query(MaterialCategory).filter(
                MaterialCategory.name.ilike(f"%{material_name}%") | 
                MaterialCategory.category.ilike(f"%{material_name}%")
            ).first()
            if mat:
                resolved_mat_id = mat.id

        if location_id and not location_city:
            loc = db.query(Location).filter(Location.id == location_id).first()
            if loc:
                location_city = loc.city

        # Analyze historical trend
        trend_info = MarketAnalyzer.analyze_historical_trend(
            db=db,
            material_id=resolved_mat_id,
            material_name=resolved_name,
            days=90
        )

        # Retrieve active recycler offers from DB
        raw_offers: List[Dict[str, Any]] = []
        if db:
            query = (
                db.query(RecyclerOffer, RecyclerProfile)
                .join(RecyclerProfile, RecyclerOffer.recycler_id == RecyclerProfile.id)
                .filter(RecyclerOffer.is_active == True)
            )
            if resolved_mat_id:
                query = query.filter(RecyclerOffer.material_id == resolved_mat_id)
            db_offers = query.limit(10).all()

            for ro, rp in db_offers:
                raw_offers.append({
                    "recycler_id": rp.id,
                    "facility_name": rp.facility_name,
                    "recycler_name": rp.facility_name,
                    "authorization_status": rp.authorization_status or "VERIFIED_DEMO",
                    "distance_km": round(4.2 + (rp.id * 1.3), 1),
                    "offer_rate_per_kg": ro.offer_price_per_kg,
                    "pickup_available": ro.pickup_available,
                    "min_weight_kg": ro.min_weight_kg
                })

        # If database has few/no offers for this specific material, generate competitive local quotes
        if len(raw_offers) < 3:
            baseline = MarketAnalyzer.get_material_baseline(resolved_name)
            rec_p = baseline["recommended"]
            seeded_recyclers = (
                db.query(RecyclerProfile)
                .filter(RecyclerProfile.is_active == True)
                .limit(5)
                .all() if db else []
            )
            variations = [1.02, 0.98, 0.94, 1.05, 0.92]
            for idx, r in enumerate(seeded_recyclers):
                var = variations[idx % len(variations)]
                raw_offers.append({
                    "recycler_id": r.id,
                    "facility_name": r.facility_name,
                    "recycler_name": r.facility_name,
                    "authorization_status": r.authorization_status or "VERIFIED_DEMO",
                    "distance_km": round(3.5 + (idx * 2.1), 1),
                    "offer_rate_per_kg": round(rec_p * var, 1),
                    "pickup_available": r.pickup_available,
                    "min_weight_kg": 1.0
                })

        active_rates = [o["offer_rate_per_kg"] for o in raw_offers]

        # Calculate fair price
        calc = FairPriceCalculator.compute(
            material_name=resolved_name,
            weight_kg=weight_kg,
            condition=condition,
            location_city=location_city,
            historical_stats=trend_info,
            active_offers=active_rates
        )

        # Calculate confidence
        conf_level, conf_score, conf_reason = PriceConfidenceCalculator.calculate_confidence(
            observation_count=trend_info.get("observation_count", 0),
            offer_count=len(raw_offers)
        )

        # Classify offers
        analyzed_offers = OfferAnalyzer.analyze_offers(
            offers=raw_offers,
            market_min=calc["market_min"],
            market_max=calc["market_max"],
            recommended_price=calc["recommended_price"],
            weight_kg=weight_kg
        )

        return FairPriceEstimateResponse(
            material=resolved_name,
            material_id=resolved_mat_id,
            weight=weight_kg,
            weight_kg=weight_kg,
            market_min=calc["market_min"],
            market_max=calc["market_max"],
            recommended_price=calc["recommended_price"],
            price_per_unit=calc["price_per_unit"],
            market_range_min_per_kg=calc["market_range_min_per_kg"],
            market_range_max_per_kg=calc["market_range_max_per_kg"],
            recommended_fair_price_per_kg=calc["recommended_fair_price_per_kg"],
            total_estimated_value=calc["total_estimated_value"],
            total_value_range=calc["total_value_range"],
            confidence=conf_level,
            confidence_score=conf_score,
            confidence_reason=conf_reason,
            trend=trend_info.get("trend", "STABLE"),
            percentage_change=trend_info.get("percentage_change", 0.0),
            explanation=calc["explanation"],
            condition_adjustment=calc["condition_adjustment"],
            location_factor=calc["location_factor"],
            price_status="FAIR",
            assessment_tier="FAIR",
            nearby_recycler_offers=analyzed_offers
        )

    @classmethod
    def get_price_history(
        cls,
        db: Session,
        material_id: Optional[int] = None,
        location_id: Optional[int] = None,
        material_name: Optional[str] = None,
        limit: int = 30
    ) -> List[PriceHistoryRecord]:
        query = db.query(PriceHistory).join(MaterialCategory, PriceHistory.material_id == MaterialCategory.id, isouter=True)
        if material_id:
            query = query.filter(PriceHistory.material_id == material_id)
        elif material_name:
            query = query.filter(MaterialCategory.name.ilike(f"%{material_name}%"))

        if location_id:
            query = query.filter(PriceHistory.location_id == location_id)

        records = query.order_by(PriceHistory.effective_date.desc()).limit(limit).all()

        output = []
        for r in records:
            dt_str = r.effective_date.strftime("%b %d") if r.effective_date else "Recent"
            mat_name = r.material.name if r.material else "E-Waste"
            output.append(PriceHistoryRecord(
                id=r.id,
                date=dt_str,
                price=r.benchmark_price,
                benchmark_price=r.benchmark_price,
                market_min=r.market_min,
                market_max=r.market_max,
                material=mat_name,
                location=r.location_city or "All India"
            ))

        if not output:
            # Deterministic benchmark fallback
            baseline = MarketAnalyzer.get_material_baseline(material_name or "PCB")
            b_rec = baseline["recommended"]
            b_min = baseline["min"]
            b_max = baseline["max"]
            fallback_dates = [("Aug 01", b_rec - 15), ("Aug 10", b_rec - 10), ("Aug 20", b_rec - 5), ("Aug 30", b_rec), ("Sep 04", b_rec + 5)]
            for dt, p in fallback_dates:
                output.append(PriceHistoryRecord(
                    date=dt,
                    price=round(p, 1),
                    benchmark_price=round(p, 1),
                    market_min=b_min,
                    market_max=b_max,
                    material=material_name or "PCB",
                    location="Hyderabad"
                ))

        return output

    @classmethod
    def get_price_trend(
        cls,
        db: Session,
        material_id: int
    ) -> PriceTrendResponse:
        mat = db.query(MaterialCategory).filter(MaterialCategory.id == material_id).first()
        mat_name = mat.name if mat else f"Material #{material_id}"

        trend_data = MarketAnalyzer.analyze_historical_trend(
            db=db,
            material_id=material_id,
            material_name=mat_name,
            days=90
        )

        return PriceTrendResponse(
            material_id=material_id,
            material_name=mat_name,
            average=trend_data["average"],
            minimum=trend_data["minimum"],
            maximum=trend_data["maximum"],
            trend=trend_data["trend"],
            percentage_change=trend_data["percentage_change"],
            observation_count=trend_data["observation_count"],
            period_days=90,
            recent_average=trend_data.get("recent_average"),
            older_average=trend_data.get("older_average")
        )
