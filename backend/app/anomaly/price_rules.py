from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.ewaste_lot import EWasteLot

class AnomalyPriceRules:
    """
    Deterministic rule engine for transaction fairness and anomaly detection.
    """

    @classmethod
    def evaluate_predatory_pricing(
        cls,
        expected_rate: float,
        offered_rate: float
    ) -> Optional[Tuple[str, str, float, str]]:
        """
        Returns (alert_type, severity, diff_percent, reason) or None.
        """
        if expected_rate <= 0:
            return None

        diff_pct = round(((expected_rate - offered_rate) / expected_rate) * 100, 1)

        # > 30% below expected
        if diff_pct >= 30.0:
            severity = "HIGH" if diff_pct >= 40.0 else "MEDIUM"
            reason = "Offer is significantly below the estimated fair-price range."
            return "PREDATORY_PRICING", severity, diff_pct, reason

        return None

    @classmethod
    def evaluate_inflated_pricing(
        cls,
        expected_rate: float,
        offered_rate: float
    ) -> Optional[Tuple[str, str, float, str]]:
        """
        Returns (alert_type, severity, diff_percent, reason) or None.
        """
        if expected_rate <= 0:
            return None

        over_pct = round(((offered_rate - expected_rate) / expected_rate) * 100, 1)

        # > 60% above benchmark
        if over_pct >= 60.0:
            severity = "HIGH" if over_pct >= 100.0 else "MEDIUM"
            reason = "Offer is abnormally higher than regional market benchmark."
            return "INFLATED_PRICE", severity, over_pct, reason

        return None

    @classmethod
    def evaluate_weight_price_inconsistency(
        cls,
        weight_kg: float,
        expected_rate: float,
        total_offered: float
    ) -> Optional[Tuple[str, str, float, str]]:
        """
        Detects mismatch between scale weight and total transaction valuation.
        """
        if weight_kg <= 0 or expected_rate <= 0:
            return None

        expected_total = weight_kg * expected_rate
        if total_offered >= expected_total * 2.5:
            diff_pct = round(((total_offered - expected_total) / expected_total) * 100, 1)
            return (
                "UNUSUAL_VALUE",
                "HIGH" if total_offered >= expected_total * 3.5 else "MEDIUM",
                diff_pct,
                "Transaction value is significantly higher than the expected range for this material and weight."
            )
        elif total_offered <= expected_total * 0.35:
            diff_pct = round(((expected_total - total_offered) / expected_total) * 100, 1)
            return (
                "UNUSUAL_VALUE",
                "HIGH",
                diff_pct,
                "Transaction value is severely depressed relative to verified lot weight."
            )

        return None

    @classmethod
    def evaluate_duplicate_transaction(
        cls,
        db: Session,
        collector_id: Optional[int],
        recycler_id: Optional[int],
        weight_kg: float,
        lot_id: Optional[int] = None,
        window_minutes: int = 15
    ) -> Optional[Tuple[str, str, float, str]]:
        """
        Detects possible duplicate transactions created within a tight time window.
        """
        if not db or not collector_id or not recycler_id:
            return None

        since_time = datetime.utcnow() - timedelta(minutes=window_minutes)
        query = (
            db.query(Transaction)
            .filter(
                Transaction.collector_id == collector_id,
                Transaction.recycler_id == recycler_id,
                Transaction.created_at >= since_time
            )
        )
        if lot_id:
            query = query.filter(Transaction.lot_id != lot_id)

        recent_txns = query.all()
        for txn in recent_txns:
            # Check weight similarity (+- 10%)
            if txn.lot and abs(txn.lot.estimated_weight - weight_kg) <= (weight_kg * 0.10):
                return (
                    "POSSIBLE_DUPLICATE",
                    "MEDIUM",
                    0.0,
                    f"Possible duplicate transaction detected with Recycler #{recycler_id} within the last {window_minutes} minutes."
                )

        return None
