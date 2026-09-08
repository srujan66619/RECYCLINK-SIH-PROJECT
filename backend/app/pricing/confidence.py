from typing import Tuple
from app.pricing.schemas import PriceConfidenceLevel

class PriceConfidenceCalculator:
    """
    Computes pricing confidence strictly based on economic data evidence:
    - Number of historical observations in region
    - Recency of historical transaction updates
    - Agreement / variance between historical and live bids
    - Number of active competitive recycler offers
    """

    @classmethod
    def calculate_confidence(
        cls,
        observation_count: int,
        offer_count: int,
        days_since_latest: int = 2,
        variance_ratio: float = 0.08
    ) -> Tuple[str, float, str]:
        """
        Returns (confidence_level, confidence_score_0_to_1, rationale)
        """
        # Score components (max 100)
        # 1. Historical count (max 40 pts)
        if observation_count >= 15:
            hist_score = 40.0
        elif observation_count >= 5:
            hist_score = 25.0
        elif observation_count >= 1:
            hist_score = 10.0
        else:
            hist_score = 0.0

        # 2. Recycler offer competition (max 30 pts)
        if offer_count >= 4:
            offer_score = 30.0
        elif offer_count >= 2:
            offer_score = 20.0
        elif offer_count >= 1:
            offer_score = 10.0
        else:
            offer_score = 5.0

        # 3. Recency (max 20 pts)
        if days_since_latest <= 7:
            recency_score = 20.0
        elif days_since_latest <= 30:
            recency_score = 12.0
        else:
            recency_score = 5.0

        # 4. Low variance / agreement (max 10 pts)
        if variance_ratio <= 0.10:
            agreement_score = 10.0
        elif variance_ratio <= 0.20:
            agreement_score = 6.0
        else:
            agreement_score = 2.0

        total_score = hist_score + offer_score + recency_score + agreement_score
        normalized_score = round(min(1.0, max(0.2, total_score / 100.0)), 2)

        if total_score >= 70.0:
            level = PriceConfidenceLevel.HIGH.value
            reason = "Strong price evidence from recent transactions and competitive recycler bids."
        elif total_score >= 40.0:
            level = PriceConfidenceLevel.MEDIUM.value
            reason = "Moderate evidence; fewer recent observations or offers available."
        else:
            level = PriceConfidenceLevel.LOW.value
            reason = "Limited price data. Treat this estimate as indicative."

        return level, normalized_score, reason
