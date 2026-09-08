from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.anomaly_alert import AnomalyAlert, AnomalySeverity

class AnomalyDetector:
    """
    AI Transaction Guardian & Anomaly Detection Engine.
    Monitors transactions, recycler offers, and scale weights to protect
    informal kabadiwalas from predatory underpricing and identify data irregularities.
    """

    @classmethod
    def detect_anomaly(
        cls,
        expected_price: float,
        offered_price: float,
        material_name: Optional[str] = "PCB",
        weight: Optional[float] = None,
        transaction_id: Optional[int] = None,
        lot_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Deterministic foundation for transaction anomaly detection.
        Flags transactions where offered price deviates severely (>30% below, or >40% critical, or >60% inflated).
        """
        if expected_price <= 0:
            return {
                "is_anomaly": False,
                "severity": "NONE",
                "reason": "Expected benchmark price is not established.",
                "difference_percent": 0.0,
                "alert_type": None,
                "alert_id": None
            }

        diff_pct = round(((expected_price - offered_price) / expected_price) * 100, 1)

        # Predatory underpricing check (> 30% below expected benchmark)
        if diff_pct >= 30.0:
            severity = "HIGH" if diff_pct >= 40.0 else "MEDIUM"
            reason = "Offer is significantly below the expected range."
            alert_type = "PREDATORY_PRICING"

            alert_id = None
            if db:
                alert = AnomalyAlert(
                    transaction_id=transaction_id,
                    lot_id=lot_id,
                    alert_type=alert_type,
                    severity=AnomalySeverity.CRITICAL.value if severity == "HIGH" else AnomalySeverity.WARNING.value,
                    expected_value=expected_price,
                    benchmark_value=expected_price,
                    actual_value=offered_price,
                    deviation_pct=diff_pct,
                    reason=reason,
                    description=f"Price anomaly: Offered ₹{offered_price} is {diff_pct}% below expected ₹{expected_price} for {material_name}.",
                    status="OPEN"
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                alert_id = alert.id

            return {
                "is_anomaly": True,
                "severity": severity,
                "reason": reason,
                "difference_percent": diff_pct,
                "alert_type": alert_type,
                "alert_id": alert_id
            }

        # Inflated overpricing check (> 60% above expected)
        over_pct = round(((offered_price - expected_price) / expected_price) * 100, 1)
        if over_pct >= 60.0:
            severity = "MEDIUM"
            reason = "Offer is abnormally higher than regional market benchmark."
            alert_type = "INFLATED_PRICE"

            alert_id = None
            if db:
                alert = AnomalyAlert(
                    transaction_id=transaction_id,
                    lot_id=lot_id,
                    alert_type=alert_type,
                    severity=AnomalySeverity.WARNING.value,
                    expected_value=expected_price,
                    benchmark_value=expected_price,
                    actual_value=offered_price,
                    deviation_pct=over_pct,
                    reason=reason,
                    description=f"Unusual high rate: Offered ₹{offered_price} exceeds market benchmark ₹{expected_price} by {over_pct}%.",
                    status="OPEN"
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                alert_id = alert.id

            return {
                "is_anomaly": True,
                "severity": severity,
                "reason": reason,
                "difference_percent": over_pct,
                "alert_type": alert_type,
                "alert_id": alert_id
            }

        return {
            "is_anomaly": False,
            "severity": "NONE",
            "reason": "Pricing is within standard fair market tolerance.",
            "difference_percent": diff_pct,
            "alert_type": None,
            "alert_id": None
        }

    @classmethod
    def evaluate_pricing(
        cls,
        db: Session,
        transaction_id: Optional[int],
        lot_id: Optional[int],
        offered_price: float,
        benchmark_price: float,
        material_name: str
    ) -> Optional[Dict[str, Any]]:
        res = cls.detect_anomaly(
            expected_price=benchmark_price,
            offered_price=offered_price,
            material_name=material_name,
            transaction_id=transaction_id,
            lot_id=lot_id,
            db=db
        )
        if res["is_anomaly"]:
            return {
                "alert_triggered": True,
                "alert_id": res["alert_id"],
                "severity": res["severity"],
                "description": res["reason"],
                "deviation_pct": res["difference_percent"]
            }
        return None

    @classmethod
    def evaluate_weight_handover(
        cls,
        db: Session,
        transaction_id: int,
        lot_id: int,
        initial_weight: float,
        final_scale_weight: float
    ) -> Optional[Dict[str, Any]]:
        if initial_weight <= 0:
            return None

        diff = abs(final_scale_weight - initial_weight)
        discrepancy_pct = round((diff / initial_weight) * 100, 1)

        # Scale discrepancy > 25% requires regulatory review
        if discrepancy_pct >= 25.0:
            description = (
                f"⚠ WEIGHT DISCREPANCY: Verified scale weight ({final_scale_weight} kg) differs "
                f"by {discrepancy_pct}% from initial collector intake ({initial_weight} kg)."
            )
            alert = AnomalyAlert(
                transaction_id=transaction_id,
                lot_id=lot_id,
                alert_type="WEIGHT_MISMATCH",
                severity=AnomalySeverity.WARNING.value,
                expected_value=initial_weight,
                benchmark_value=initial_weight,
                actual_value=final_scale_weight,
                deviation_pct=discrepancy_pct,
                reason="Scale verification weight mismatch",
                description=description,
                status="OPEN"
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            return {
                "alert_triggered": True,
                "alert_id": alert.id,
                "severity": "WARNING",
                "description": description,
                "discrepancy_pct": discrepancy_pct
            }

        return None
