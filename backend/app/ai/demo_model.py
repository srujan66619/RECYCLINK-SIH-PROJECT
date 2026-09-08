import hashlib
from typing import Dict, Any, Optional
from app.ai.classifier import MaterialClassifier
from app.ai.material_profiles import MATERIAL_PROFILES, MaterialProfileEngine

class DemoMaterialClassifier(MaterialClassifier):
    """
    Deterministic Demo Material Classifier.
    Provides reproducible, transparent prototype inference across 10 e-waste categories.
    Follows responsible AI transparency guidelines — clearly marked as Prototype AI.
    """

    MODEL_NAME = "recycLink-demo-classifier"
    MODEL_VERSION = "1.0-demo"

    def predict(
        self,
        image_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        sample_key: Optional[str] = None,
        user_weight: Optional[float] = None
    ) -> Dict[str, Any]:
        target_key = "pcb"

        # 1. Check explicit sample_key
        if sample_key and sample_key.lower() in MATERIAL_PROFILES:
            target_key = sample_key.lower()
        # 2. Check filename keywords
        elif filename:
            fn_lower = filename.lower()
            for cand in MATERIAL_PROFILES.keys():
                if cand in fn_lower:
                    target_key = cand
                    break
            else:
                # Deterministic filename hash
                fn_hash = int(hashlib.md5(filename.encode("utf-8")).hexdigest(), 16)
                keys = list(MATERIAL_PROFILES.keys())
                target_key = keys[fn_hash % len(keys)]
        # 3. Deterministic image bytes hash
        elif image_bytes:
            content_hash = int(hashlib.sha256(image_bytes[:2048]).hexdigest(), 16)
            keys = list(MATERIAL_PROFILES.keys())
            target_key = keys[content_hash % len(keys)]

        profile = MATERIAL_PROFILES[target_key]
        confidence = profile["demo_confidence"]

        # Confidence categorization
        if confidence >= 0.90:
            confidence_band = "HIGH CONFIDENCE"
        elif confidence >= 0.70:
            confidence_band = "MEDIUM CONFIDENCE"
        else:
            confidence_band = "LOW CONFIDENCE"

        weight = user_weight if (user_weight and user_weight > 0) else profile["default_weight"]
        base_rate = profile["base_price_per_kg"]
        val_min = round(weight * (base_rate * 0.92), 2)
        val_max = round(weight * (base_rate * 1.14), 2)
        val_rec = round(weight * base_rate, 2)

        return {
            "detected_material": profile["category"],
            "material_category": profile["category"],
            "material_subcategory": profile["subcategory"],
            "confidence": confidence,
            "confidence_score": confidence,
            "confidence_band": confidence_band,
            "hazard_level": profile["hazard_level"],
            "estimated_weight": weight,
            "estimated_weight_kg": weight,
            "estimated_value_min": val_min,
            "estimated_value_max": val_max,
            "estimated_value_range": {
                "min": val_min,
                "max": val_max
            },
            "recommended_fair_price": val_rec,
            "recoverable_materials": profile["recoverable_materials"],
            "model_name": self.MODEL_NAME,
            "model_version": self.MODEL_VERSION,
            "is_demo_prediction": True,
            "explanation": f"Prediction explanation: {profile['prediction_explanation']}",
            "safety_summary": profile["handling_guidance"],
            "sample_image_url": profile["sample_image_url"]
        }
