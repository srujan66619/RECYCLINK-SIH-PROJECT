from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.ai.image_validator import ImageValidator, ImageValidationError
from app.ai.classifier import MaterialClassifier
from app.ai.demo_model import DemoMaterialClassifier
from app.ai.material_profiles import MaterialProfileEngine, MATERIAL_PROFILES
from app.ai.price_estimator import PriceEstimator
from app.ai.anomaly_detector import AnomalyDetector
from app.models.ai_prediction import AIPrerecognition, AIPrediction
from app.models.anomaly_alert import AnomalyAlert
from app.models.trace_event import TraceStage
from app.services.trace_service import TraceService

class AIService:
    """
    Central AI Intelligence Engine for RECYCLINK.
    Coordinates image validation, model-agnostic classification,
    material profiling, price estimation, prediction persistence,
    trace recording, and anomaly detection.
    """

    def __init__(self, classifier: Optional[MaterialClassifier] = None):
        # Model-agnostic design: swappable classifier implementation
        self.classifier = classifier or DemoMaterialClassifier()

    def classify_material(
        self,
        image_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        content_type: Optional[str] = None,
        sample_key: Optional[str] = None,
        user_weight: Optional[float] = None,
        lot_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        End-to-end material classification pipeline:
        Image -> Validation -> Preprocessing -> Inference -> Profiling -> Persistence -> Trace
        """
        # 1. Validate and preprocess if image bytes are provided
        if image_bytes:
            is_valid, pil_image = ImageValidator.validate(
                image_bytes=image_bytes,
                filename=filename,
                content_type=content_type
            )
            # Standard resize/normalize
            if pil_image:
                pil_image = ImageValidator.preprocess(pil_image)

        # 2. Execute inference
        prediction = self.classifier.predict(
            image_bytes=image_bytes,
            filename=filename,
            sample_key=sample_key,
            user_weight=user_weight
        )

        # 3. Persist prediction in database if db session provided
        prediction_id = None
        if db:
            cat_name = prediction.get("material_category", "PCB")
            haz_level = prediction.get("hazard_level", "MEDIUM").upper()

            rec = AIPrediction(
                lot_id=lot_id,
                model_name=prediction.get("model_name", "recycLink-demo-classifier"),
                prediction_type="DEMO_AI",
                predicted_category=cat_name,
                detected_category=prediction.get("detected_material", cat_name),
                detected_subcategory=prediction.get("material_subcategory"),
                confidence=prediction.get("confidence", 0.90),
                confidence_score=prediction.get("confidence_score", 0.90),
                estimated_weight=prediction.get("estimated_weight", 1.0) or 1.0,
                estimated_value_min=prediction.get("estimated_value_min", 0.0),
                estimated_value_max=prediction.get("estimated_value_max", 0.0),
                value_min=prediction.get("estimated_value_min", 0.0),
                value_max=prediction.get("estimated_value_max", 0.0),
                hazard_level=haz_level,
                recoverable_metals=prediction.get("recoverable_materials", []),
                raw_response=prediction,
                metadata_json={
                    "explanation": prediction.get("explanation"),
                    "model_version": prediction.get("model_version", "1.0-demo"),
                    "confidence_band": prediction.get("confidence_band", "HIGH CONFIDENCE"),
                    "is_demo": True
                }
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            prediction_id = rec.id
            prediction["prediction_id"] = prediction_id

            # 4. Record trace event if associated with an active lot
            if lot_id:
                conf_pct = int(prediction.get("confidence", 0.90) * 100)
                TraceService.record_event(
                    db=db,
                    lot_id=lot_id,
                    stage=TraceStage.AI_IDENTIFIED.value,
                    title="AI Material Identified",
                    description=f"AI identified the material as {cat_name} with {conf_pct}% confidence.",
                    actor_role="SYSTEM",
                    actor_name=prediction.get("model_name", "recycLink-demo-classifier"),
                    metadata_json={
                        "prediction_id": prediction_id,
                        "confidence": prediction.get("confidence"),
                        "category": cat_name,
                        "hazard_level": haz_level
                    }
                )

        return prediction

    def record_manual_selection(
        self,
        material_category: str,
        weight: Optional[float] = None,
        lot_id: Optional[int] = None,
        notes: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Fallback when confidence is low or collector prefers manual selection.
        Stores prediction record with prediction_type="MANUAL".
        """
        key = MaterialProfileEngine.find_key_by_category(material_category)
        profile = MATERIAL_PROFILES.get(key, MATERIAL_PROFILES["pcb"])
        actual_weight = weight if (weight and weight > 0) else profile["default_weight"]

        base_rate = profile["base_price_per_kg"]
        val_min = round(actual_weight * (base_rate * 0.92), 2)
        val_max = round(actual_weight * (base_rate * 1.14), 2)
        val_rec = round(actual_weight * base_rate, 2)

        result = {
            "detected_material": profile["category"],
            "material_category": profile["category"],
            "material_subcategory": profile["subcategory"],
            "confidence": 1.00,
            "confidence_score": 1.00,
            "confidence_band": "MANUAL SELECTION",
            "hazard_level": profile["hazard_level"],
            "estimated_weight": actual_weight,
            "estimated_weight_kg": actual_weight,
            "estimated_value_min": val_min,
            "estimated_value_max": val_max,
            "estimated_value_range": {"min": val_min, "max": val_max},
            "recommended_fair_price": val_rec,
            "recoverable_materials": profile["recoverable_materials"],
            "model_name": "collector-manual-entry",
            "model_version": "1.0",
            "is_demo_prediction": False,
            "explanation": f"Manual selection by collector: {notes or 'Direct selection without computer vision'}.",
            "safety_summary": profile["handling_guidance"],
            "sample_image_url": profile["sample_image_url"]
        }

        if db:
            rec = AIPrediction(
                lot_id=lot_id,
                model_name="collector-manual-entry",
                prediction_type="MANUAL",
                predicted_category=profile["category"],
                detected_category=profile["category"],
                detected_subcategory=profile["subcategory"],
                confidence=1.00,
                confidence_score=1.00,
                estimated_weight=actual_weight,
                estimated_value_min=val_min,
                estimated_value_max=val_max,
                value_min=val_min,
                value_max=val_max,
                hazard_level=profile["hazard_level"].upper(),
                recoverable_metals=profile["recoverable_materials"],
                raw_response=result,
                metadata_json={"notes": notes, "manual_selection": True}
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            result["prediction_id"] = rec.id

            if lot_id:
                TraceService.record_event(
                    db=db,
                    lot_id=lot_id,
                    stage=TraceStage.AI_IDENTIFIED.value,
                    title="Manual Material Identification",
                    description=f"Collector manually specified material as {profile['category']}.",
                    actor_role="COLLECTOR",
                    actor_name="Collector Intake",
                    metadata_json={"prediction_id": rec.id, "manual": True}
                )

        return result

    def estimate_value(
        self,
        material_name: str,
        weight: float,
        condition: Optional[str] = "GOOD",
        location_id: Optional[int] = None
    ) -> Dict[str, Any]:
        return PriceEstimator.estimate_value(
            material_name=material_name,
            weight=weight,
            condition=condition,
            location_id=location_id
        )

    def detect_anomaly(
        self,
        expected_price: float,
        offered_price: float,
        material_name: Optional[str] = "PCB",
        weight: Optional[float] = None,
        transaction_id: Optional[int] = None,
        lot_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        return AnomalyDetector.detect_anomaly(
            expected_price=expected_price,
            offered_price=offered_price,
            material_name=material_name,
            weight=weight,
            transaction_id=transaction_id,
            lot_id=lot_id,
            db=db
        )

    def get_analytics(self, db: Session) -> Dict[str, Any]:
        """
        Aggregates AI performance and operational metrics for the Admin Dashboard.
        """
        total_preds = db.query(AIPrediction).count()
        high_conf = db.query(AIPrediction).filter(
            AIPrediction.confidence >= 0.90,
            AIPrediction.prediction_type != "MANUAL"
        ).count()
        med_conf = db.query(AIPrediction).filter(
            AIPrediction.confidence >= 0.70,
            AIPrediction.confidence < 0.90,
            AIPrediction.prediction_type != "MANUAL"
        ).count()
        low_conf = db.query(AIPrediction).filter(
            AIPrediction.confidence < 0.70,
            AIPrediction.prediction_type != "MANUAL"
        ).count()
        manual_count = db.query(AIPrediction).filter(
            AIPrediction.prediction_type == "MANUAL"
        ).count()
        anomalies_count = db.query(AnomalyAlert).count()

        # Top 5 materials detected
        top_cats = (
            db.query(
                AIPrediction.detected_category.label("material"),
                func.count(AIPrediction.id).label("count")
            )
            .group_by(AIPrediction.detected_category)
            .order_by(func.count(AIPrediction.id).desc())
            .limit(5)
            .all()
        )

        top_materials = [{"material": str(row.material or "Unknown"), "count": int(row.count)} for row in top_cats]

        return {
            "total_predictions": total_preds,
            "high_confidence_predictions": high_conf,
            "medium_confidence_predictions": med_conf,
            "low_confidence_predictions": low_conf,
            "manual_classifications": manual_count,
            "anomalies_detected": anomalies_count,
            "top_materials": top_materials
        }

# Global AIService singleton instance
ai_service_engine = AIService()
