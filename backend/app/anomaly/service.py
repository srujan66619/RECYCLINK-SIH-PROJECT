from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.anomaly_alert import AnomalyAlert, AnomalyStatus
from app.models.material import MaterialCategory
from app.pricing.market_analyzer import MarketAnalyzer
from app.anomaly.schemas import AnomalyCheckRequest, AnomalyCheckResult
from app.anomaly.price_rules import AnomalyPriceRules

class TransactionFairnessService:
    """
    Transaction Fairness & AI Anomaly Guardian.
    Guards informal collectors against predatory undervaluation and protects
    the formal recycling chain from fraudulent weight or pricing anomalies.
    """

    @classmethod
    def evaluate_fairness(
        cls,
        db: Optional[Session],
        offered_price: float,
        expected_price: Optional[float] = None,
        material_name: Optional[str] = "PCB",
        weight_kg: float = 1.0,
        collector_id: Optional[int] = None,
        recycler_id: Optional[int] = None,
        transaction_id: Optional[int] = None,
        lot_id: Optional[int] = None,
        persist_alert: bool = True
    ) -> AnomalyCheckResult:
        # Resolve benchmark price if not explicitly provided
        if expected_price is None or expected_price <= 0:
            baseline = MarketAnalyzer.get_material_baseline(material_name or "PCB")
            expected_price = baseline["recommended"]

        # 1. Check predatory pricing (>30% below expected)
        predatory = AnomalyPriceRules.evaluate_predatory_pricing(expected_price, offered_price)
        if predatory:
            alert_type, severity, diff_pct, reason = predatory
            rec_action = "Review other offers — this offer is significantly below the fair benchmark."
            alert_id = cls._record_alert(
                db=db,
                alert_type=alert_type,
                severity=severity,
                expected_val=expected_price,
                actual_val=offered_price,
                deviation_pct=diff_pct,
                reason=reason,
                description=f"Fairness alert: Offered ₹{offered_price}/kg is {diff_pct}% below benchmark ₹{expected_price}/kg for {material_name}.",
                transaction_id=transaction_id,
                lot_id=lot_id,
                persist=persist_alert
            )
            return AnomalyCheckResult(
                is_anomaly=True,
                severity=severity,
                alert_type=alert_type,
                reason=reason,
                difference_percent=diff_pct,
                expected_value=expected_price,
                actual_value=offered_price,
                recommended_action=rec_action,
                alert_id=alert_id
            )

        # 2. Check inflated price (>60% above expected)
        inflated = AnomalyPriceRules.evaluate_inflated_pricing(expected_price, offered_price)
        if inflated:
            alert_type, severity, diff_pct, reason = inflated
            rec_action = "Verify authorization and scale details before proceeding."
            alert_id = cls._record_alert(
                db=db,
                alert_type=alert_type,
                severity=severity,
                expected_val=expected_price,
                actual_val=offered_price,
                deviation_pct=diff_pct,
                reason=reason,
                description=f"Market alert: Offered ₹{offered_price}/kg exceeds regional benchmark ₹{expected_price}/kg by {diff_pct}%.",
                transaction_id=transaction_id,
                lot_id=lot_id,
                persist=persist_alert
            )
            return AnomalyCheckResult(
                is_anomaly=True,
                severity=severity,
                alert_type=alert_type,
                reason=reason,
                difference_percent=diff_pct,
                expected_value=expected_price,
                actual_value=offered_price,
                recommended_action=rec_action,
                alert_id=alert_id
            )

        # 3. Check weight-price inconsistency
        total_offered = offered_price * weight_kg
        inconsistency = AnomalyPriceRules.evaluate_weight_price_inconsistency(
            weight_kg=weight_kg,
            expected_rate=expected_price,
            total_offered=total_offered
        )
        if inconsistency:
            alert_type, severity, diff_pct, reason = inconsistency
            rec_action = "Verify certified scale weight calibration."
            alert_id = cls._record_alert(
                db=db,
                alert_type=alert_type,
                severity=severity,
                expected_val=expected_price * weight_kg,
                actual_val=total_offered,
                deviation_pct=diff_pct,
                reason=reason,
                description=f"Valuation anomaly: Total payout ₹{total_offered} deviates {diff_pct}% from expected ₹{expected_price * weight_kg}.",
                transaction_id=transaction_id,
                lot_id=lot_id,
                persist=persist_alert
            )
            return AnomalyCheckResult(
                is_anomaly=True,
                severity=severity,
                alert_type=alert_type,
                reason=reason,
                difference_percent=diff_pct,
                expected_value=round(expected_price * weight_kg, 2),
                actual_value=round(total_offered, 2),
                recommended_action=rec_action,
                alert_id=alert_id
            )

        # 4. Check duplicate transaction
        if db and collector_id and recycler_id:
            duplicate = AnomalyPriceRules.evaluate_duplicate_transaction(
                db=db,
                collector_id=collector_id,
                recycler_id=recycler_id,
                weight_kg=weight_kg,
                lot_id=lot_id
            )
            if duplicate:
                alert_type, severity, diff_pct, reason = duplicate
                rec_action = "Check recent lot history to avoid duplicate dispatch."
                alert_id = cls._record_alert(
                    db=db,
                    alert_type=alert_type,
                    severity=severity,
                    expected_val=0.0,
                    actual_val=0.0,
                    deviation_pct=0.0,
                    reason=reason,
                    description=reason,
                    transaction_id=transaction_id,
                    lot_id=lot_id,
                    persist=persist_alert
                )
                return AnomalyCheckResult(
                    is_anomaly=True,
                    severity=severity,
                    alert_type=alert_type,
                    reason=reason,
                    difference_percent=0.0,
                    expected_value=expected_price,
                    actual_value=offered_price,
                    recommended_action=rec_action,
                    alert_id=alert_id
                )

        # Fair transaction
        diff_pct = round(((offered_price - expected_price) / expected_price) * 100, 1) if expected_price > 0 else 0.0
        return AnomalyCheckResult(
            is_anomaly=False,
            severity="NONE",
            alert_type=None,
            reason="Offer aligns with CPCB fair market benchmark range.",
            difference_percent=diff_pct,
            expected_value=expected_price,
            actual_value=offered_price,
            recommended_action="Offer is verified fair — proceed to create transaction.",
            alert_id=None
        )

    @classmethod
    def _record_alert(
        cls,
        db: Optional[Session],
        alert_type: str,
        severity: str,
        expected_val: float,
        actual_val: float,
        deviation_pct: float,
        reason: str,
        description: str,
        transaction_id: Optional[int] = None,
        lot_id: Optional[int] = None,
        persist: bool = True
    ) -> Optional[int]:
        if not db or not persist:
            return None
        try:
            alert = AnomalyAlert(
                transaction_id=transaction_id,
                lot_id=lot_id,
                alert_type=alert_type,
                severity=severity,
                expected_value=expected_val,
                benchmark_value=expected_val,
                actual_value=actual_val,
                deviation_pct=deviation_pct,
                reason=reason,
                description=description,
                status=AnomalyStatus.OPEN.value
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            return alert.id
        except Exception:
            db.rollback()
            return None

# Alias for backward compatibility
AnomalyService = TransactionFairnessService
