import hashlib
from typing import Dict, Any, Optional, List
from app.ai.classifier import MaterialClassifier
from app.ai.material_profiles import MATERIAL_PROFILES, MaterialProfileEngine

EXPLAINABILITY_MAP = {
    "pcb": [
        "Planar FR-4 circuit board laminate structure detected",
        "Surface-mount electronic IC packages and chips visible",
        "Multi-trace copper bus routing and solder pads observed"
    ],
    "cable": [
        "Continuous multi-strand flexible copper core geometry",
        "Polyvinyl chloride (PVC) insulation jacket cross-section",
        "High-density electrolytic copper wire bundle identified"
    ],
    "battery": [
        "Prismatic / cylindrical sealed metal cell form-factor",
        "Hazardous lithium electrolyte warning markings present",
        "Heavy-gauge anode and cathode terminal contacts observed"
    ],
    "lcd": [
        "Thin active-matrix liquid crystal glass substrate pane",
        "Flat form-factor display bezel and polarizer film",
        "Integrated flexible ribbon connector routing"
    ],
    "crt": [
        "High-tension vacuum envelope leaded glass funnel",
        "Narrow rear electron gun glass neck assembly present",
        "High-implosion risk phosphor-coated display profile"
    ],
    "motor": [
        "Cylindrical stator and rotor silicon steel laminations",
        "Heavy-gauge insulated copper magnet wire field coils",
        "Industrial mechanical mounting chassis and drive shaft"
    ],
    "component": [
        "Dual in-line (DIP) and quad flat-pack integrated circuit packaging",
        "Gold-plated contact leads and silicon die packaging",
        "Miniaturized electronic component matrix"
    ],
    "plastic": [
        "Molded flame-retardant ABS/PC polymer electronic enclosures",
        "Recycling resin code stamp profile observed",
        "Non-conductive thermoplastic housing geometry"
    ],
    "magnet": [
        "High-field rare-earth sintered NdFeB block geometry",
        "Nickel-copper-nickel anti-corrosion barrier plating",
        "Hard disk drive actuator assembly mount profile"
    ],
    "mixed": [
        "Heterogeneous composite electronic assembly mixture",
        "Multi-material unsorted consumer appliance enclosure",
        "Integrated electrical supply cabling and mechanical chassis"
    ]
}

ALTERNATIVES_MAP = {
    "pcb": [{"material": "Electronic Components", "confidence": 0.04}, {"material": "Mixed E-Waste", "confidence": 0.02}],
    "cable": [{"material": "Electric Motor", "confidence": 0.03}, {"material": "Mixed E-Waste", "confidence": 0.01}],
    "battery": [{"material": "Electronic Components", "confidence": 0.05}, {"material": "Mixed E-Waste", "confidence": 0.03}],
    "lcd": [{"material": "CRT Glass Tube", "confidence": 0.04}, {"material": "Mixed Plastic", "confidence": 0.03}],
    "crt": [{"material": "LCD Display", "confidence": 0.03}, {"material": "Mixed E-Waste", "confidence": 0.02}],
    "motor": [{"material": "Insulated Cable", "confidence": 0.04}, {"material": "Mixed E-Waste", "confidence": 0.02}],
    "component": [{"material": "PCB", "confidence": 0.05}, {"material": "Mixed E-Waste", "confidence": 0.03}],
    "plastic": [{"material": "Mixed E-Waste", "confidence": 0.06}, {"material": "LCD Display", "confidence": 0.03}],
    "magnet": [{"material": "Electronic Components", "confidence": 0.05}, {"material": "Motor", "confidence": 0.04}],
    "mixed": [{"material": "PCB", "confidence": 0.08}, {"material": "Electronic Components", "confidence": 0.06}]
}

RECYCLABILITY_MAP = {
    "pcb": "HIGH",
    "cable": "HIGH",
    "motor": "HIGH",
    "battery": "SPECIALIZED_CONTROLLED",
    "crt": "SPECIALIZED_CONTROLLED",
    "component": "HIGH",
    "magnet": "HIGH",
    "lcd": "MEDIUM",
    "plastic": "MEDIUM",
    "mixed": "MEDIUM"
}

RECYCLER_CAT_MAP = {
    "battery": "AUTHORIZED_BATTERY_RECYCLER",
    "crt": "AUTHORIZED_HAZARDOUS_DISMANTLER",
    "pcb": "PRECIOUS_METAL_REFINER",
    "component": "PRECIOUS_METAL_REFINER",
    "cable": "FORMAL_EWASTE_PROCESSOR",
    "motor": "FORMAL_EWASTE_PROCESSOR",
    "lcd": "FORMAL_EWASTE_PROCESSOR",
    "magnet": "SPECIALTY_MAGNET_RECYCLER",
    "plastic": "POLYMER_REPROCESSOR",
    "mixed": "INTEGRATED_EWASTE_RECYCLER"
}

class DemoMaterialClassifier(MaterialClassifier):
    """
    Deterministic Demo Material Classifier (National Scale v2.0).
    Provides reproducible, transparent prototype inference across 10 e-waste categories
    with explainable AI reasons, alternatives, and circular economy intelligence.
    """

    MODEL_NAME = "recycLink-demo-classifier"
    MODEL_VERSION = "2.0-national"

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

        reasons = EXPLAINABILITY_MAP.get(target_key, [
            "Geometric profile matches e-waste category visual markers",
            "Surface textures align with CPCB e-waste catalog",
            "Hardware taxonomy pattern match confirmed"
        ])

        alts = ALTERNATIVES_MAP.get(target_key, [])
        recyclability = RECYCLABILITY_MAP.get(target_key, "HIGH")
        recycler_cat = RECYCLER_CAT_MAP.get(target_key, "E-WASTE_RECYCLER")

        return {
            "material": profile["category"],
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
            "explanation": f"AI Explanation: {profile['prediction_explanation']}",
            "explainability_reasons": reasons,
            "reasons": reasons,
            "safety_summary": profile["handling_guidance"],
            "safety_guidance": profile["handling_guidance"],
            "recyclability_category": recyclability,
            "recommended_handling": profile["handling_guidance"],
            "recommended_recycler_category": recycler_cat,
            "possible_alternatives": alts,
            "alternatives": alts,
            "sample_image_url": profile["sample_image_url"]
        }
