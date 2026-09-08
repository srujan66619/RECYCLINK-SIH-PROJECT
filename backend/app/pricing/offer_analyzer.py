from typing import List, Dict, Any, Optional
from app.pricing.schemas import OfferComparisonItem, OfferTier

class OfferAnalyzer:
    """
    Compares recycler offers against the estimated fair price range.
    Classifies bids into BELOW FAIR, FAIR, or GOOD OFFER without subjective bias.
    """

    @classmethod
    def classify_offer(
        cls,
        offer_rate: float,
        market_min: float,
        market_max: float,
        recommended_price: float
    ) -> str:
        """
        Fair Range: [market_min, market_max]
        Above upper range or at/above premium threshold -> GOOD OFFER
        Within fair boundary -> FAIR
        Significantly below lower boundary -> BELOW FAIR
        """
        if offer_rate > market_max or (recommended_price > 0 and offer_rate >= recommended_price * 1.03):
            return OfferTier.GOOD_OFFER.value
        elif offer_rate < market_min:
            return OfferTier.BELOW_FAIR.value
        else:
            return OfferTier.FAIR.value

    @classmethod
    def analyze_offers(
        cls,
        offers: List[Dict[str, Any]],
        market_min: float,
        market_max: float,
        recommended_price: float,
        weight_kg: float
    ) -> List[OfferComparisonItem]:
        result = []
        for o in offers:
            rate = float(o.get("offer_rate_per_kg", o.get("offer_price_per_kg", recommended_price)))
            tier = cls.classify_offer(rate, market_min, market_max, recommended_price)
            diff_pct = 0.0
            if recommended_price > 0:
                diff_pct = round(((rate - recommended_price) / recommended_price) * 100, 1)

            facility = o.get("facility_name", o.get("recycler_name", "Authorized Recycler"))
            item = OfferComparisonItem(
                recycler_id=int(o.get("recycler_id", o.get("id", 1))),
                facility_name=facility,
                recycler_name=facility,
                authorization_status=o.get("authorization_status", "VERIFIED_DEMO"),
                distance_km=round(float(o.get("distance_km", 5.0)), 1),
                offer_rate_per_kg=round(rate, 1),
                total_offer_amount=round(rate * weight_kg, 2),
                status_label=tier,
                status_tier=tier,
                pickup_available=bool(o.get("pickup_available", True)),
                difference_percent=diff_pct
            )
            result.append(item)

        # Sort descending by offer rate
        result.sort(key=lambda x: x.offer_rate_per_kg, reverse=True)
        return result
