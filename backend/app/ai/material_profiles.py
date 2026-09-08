from typing import Dict, Any, List, Optional

MATERIAL_PROFILES: Dict[str, Dict[str, Any]] = {
    "pcb": {
        "category": "PCB",
        "subcategory": "Electronic Printed Circuit Board",
        "description": "Multi-layer FR-4 epoxy circuit boards containing integrated circuits, surface mount devices, gold fingers, and solder joints.",
        "hazard_level": "Medium",
        "recoverable_materials": ["Copper", "Gold", "Silver", "Palladium", "Tantalum"],
        "typical_unit": "kg",
        "default_weight": 2.4,
        "base_price_per_kg": 190.0,
        "price_range": {"min": 420.0, "max": 520.0},
        "recommended_price": 455.0,
        "handling_guidance": "Avoid heating or acid washing in informal setups. Store in a dry area. Deliver to certified hydrometallurgical recyclers.",
        "prediction_explanation": "Identified as PCB based on visible circuit-board structure, electronic components, integrated chips, and copper traces.",
        "demo_confidence": 0.94,
        "sample_image_url": "/demo-materials/pcb.jpg"
    },
    "cable": {
        "category": "Cable",
        "subcategory": "Insulated Copper Telecom & Power Wire",
        "description": "Flexible multi-strand electrolytic copper wire sheathed in PVC or halogen-free cross-linked polymer insulation.",
        "hazard_level": "Low",
        "recoverable_materials": ["Copper", "Aluminium", "Polyvinyl Chloride (PVC)"],
        "typical_unit": "kg",
        "default_weight": 5.8,
        "base_price_per_kg": 195.0,
        "price_range": {"min": 980.0, "max": 1250.0},
        "recommended_price": 1120.0,
        "handling_guidance": "Strictly prohibit open burning of insulation. Mechanical stripping or granulation is legally mandated under CPCB guidelines.",
        "prediction_explanation": "Identified as Cable based on characteristic elongated stranded wiring, color-coded insulation jackets, and copper bundle core.",
        "demo_confidence": 0.96,
        "sample_image_url": "/demo-materials/cable.jpg"
    },
    "battery": {
        "category": "Battery",
        "subcategory": "Lithium-Ion / LiFePO4 Secondary Cells",
        "description": "Rechargeable energy storage units composed of transition metal oxide cathodes, graphite anodes, and volatile organic electrolytes.",
        "hazard_level": "High",
        "recoverable_materials": ["Lithium Carbonate", "Cobalt", "Nickel", "Manganese", "Copper Foil"],
        "typical_unit": "kg",
        "default_weight": 1.2,
        "base_price_per_kg": 185.0,
        "price_range": {"min": 180.0, "max": 260.0},
        "recommended_price": 225.0,
        "handling_guidance": "HIGH HAZARD: Thermal runaway & fire risk. Never puncture, crush, or immerse in water. Insulate terminals with non-conductive tape.",
        "prediction_explanation": "Identified as Battery based on rectangular/cylindrical prismatic cell form-factor, warning labels, and sealed terminal posts.",
        "demo_confidence": 0.92,
        "sample_image_url": "/demo-materials/battery.jpg"
    },
    "lcd": {
        "category": "LCD",
        "subcategory": "TFT-LCD Flat Panel Display",
        "description": "Liquid crystal active-matrix displays with ITO coated glass panes, cold cathode / LED backlighting, and driver IC flex cables.",
        "hazard_level": "Medium",
        "recoverable_materials": ["Indium Tin Oxide", "Specialty Glass", "Aluminum", "Polarizer Film"],
        "typical_unit": "kg",
        "default_weight": 3.5,
        "base_price_per_kg": 118.0,
        "price_range": {"min": 350.0, "max": 480.0},
        "recommended_price": 415.0,
        "handling_guidance": "Wear puncture-resistant gloves to prevent lacerations from tempered display glass. Maintain CCFL mercury tubes intact if present.",
        "prediction_explanation": "Identified as LCD based on flat glass panel profile, matrix reflection, bezel frame, and flex ribbon connectors.",
        "demo_confidence": 0.91,
        "sample_image_url": "/demo-materials/lcd.jpg"
    },
    "crt": {
        "category": "CRT",
        "subcategory": "Cathode Ray Tube Glass Funnel",
        "description": "High-vacuum glass picture tubes containing lead oxide shielding in the funnel and fluorescent phosphors on the faceplate.",
        "hazard_level": "High",
        "recoverable_materials": ["Copper Deflection Yoke", "Lead-bearing Glass", "Ferrous Metal Shield"],
        "typical_unit": "kg",
        "default_weight": 14.5,
        "base_price_per_kg": 23.5,
        "price_range": {"min": 280.0, "max": 400.0},
        "recommended_price": 340.0,
        "handling_guidance": "HIGH HAZARD: Serious implosion risk and toxic lead content. Do not smash glass. Handle with neck intact in authorized facilities.",
        "prediction_explanation": "Identified as CRT based on deep pyramidal glass funnel geometry, heavy electron gun neck, and copper deflection yoke.",
        "demo_confidence": 0.98,
        "sample_image_url": "/demo-materials/crt.jpg"
    },
    "motor": {
        "category": "Motor",
        "subcategory": "Fractional Electric Motor & Stator",
        "description": "Electromechanical rotational actuators featuring enamel-coated copper windings, laminated silicon steel cores, and cast aluminium/iron frames.",
        "hazard_level": "Low",
        "recoverable_materials": ["Copper", "Silicon Steel", "Cast Iron", "Aluminium"],
        "typical_unit": "kg",
        "default_weight": 4.2,
        "base_price_per_kg": 152.0,
        "price_range": {"min": 550.0, "max": 720.0},
        "recommended_price": 640.0,
        "handling_guidance": "Beware of heavy pinch points. Use gloves and steel-toe footwear when stacking or sorting motor armatures.",
        "prediction_explanation": "Identified as Motor based on cylindrical stator housing, central rotating shaft, and dense copper magnet wire winding coils.",
        "demo_confidence": 0.95,
        "sample_image_url": "/demo-materials/motor.jpg"
    },
    "magnet": {
        "category": "Magnet Assembly",
        "subcategory": "NdFeB Rare Earth Sintered Magnet",
        "description": "High-coercivity neodymium-iron-boron magnetic assemblies sourced from hard disk drives, brushless actuators, and sound transducers.",
        "hazard_level": "Low",
        "recoverable_materials": ["Neodymium", "Dysprosium", "Iron-Boron Alloy", "Nickel Coating"],
        "typical_unit": "kg",
        "default_weight": 1.8,
        "base_price_per_kg": 219.0,
        "price_range": {"min": 320.0, "max": 460.0},
        "recommended_price": 395.0,
        "handling_guidance": "Keep separated from electronic storage media, magnetic cards, and pacemakers due to high local magnetic flux.",
        "prediction_explanation": "Identified as Magnet Assembly based on metallic bracket contours and signature hard-drive actuator arm geometry.",
        "demo_confidence": 0.89,
        "sample_image_url": "/demo-materials/magnet.jpg"
    },
    "plastic": {
        "category": "Mixed Plastic",
        "subcategory": "E-Waste Polymer Casings (ABS/PC)",
        "description": "Rigid structural housings molded from engineering thermoplastics, often containing brominated flame retardants (BFRs).",
        "hazard_level": "Low",
        "recoverable_materials": ["Acrylonitrile Butadiene Styrene (ABS)", "Polycarbonate (PC)", "High Impact Polystyrene"],
        "typical_unit": "kg",
        "default_weight": 3.0,
        "base_price_per_kg": 40.0,
        "price_range": {"min": 90.0, "max": 150.0},
        "recommended_price": 120.0,
        "handling_guidance": "Segregate by resin identification code. Prohibit open thermal melting. Keep away from heat sources to avoid BFR fumes.",
        "prediction_explanation": "Identified as Mixed Plastic based on matte thermoplastic texture, molded enclosure snap-fits, and venting louvers.",
        "demo_confidence": 0.88,
        "sample_image_url": "/demo-materials/plastic.jpg"
    },
    "component": {
        "category": "Electronic Component",
        "subcategory": "Integrated Circuits & Passive Components",
        "description": "Packaged microchips, DIP/SMD integrated circuits, tantalum capacitors, transistors, and gold-plated headers.",
        "hazard_level": "Medium",
        "recoverable_materials": ["Silicon", "Gold", "Tantalum", "Copper", "Tin"],
        "typical_unit": "kg",
        "default_weight": 1.5,
        "base_price_per_kg": 186.0,
        "price_range": {"min": 220.0, "max": 340.0},
        "recommended_price": 280.0,
        "handling_guidance": "Store in sealed dry containers. Avoid mechanical crushing that disperses fine particles containing antimony or lead solder.",
        "prediction_explanation": "Identified as Electronic Component based on silicon package outlines, metal pin grids, and microchip markings.",
        "demo_confidence": 0.92,
        "sample_image_url": "/demo-materials/component.jpg"
    },
    "mixed": {
        "category": "Mixed E-Waste",
        "subcategory": "Unsorted Small Domestic E-Waste",
        "description": "Commingled small IT accessories, power supplies, adapters, and peripheral electronics needing secondary manual sorting.",
        "hazard_level": "Medium",
        "recoverable_materials": ["Mixed Metals", "Copper Wire", "Thermoplastics", "Low-Grade Boards"],
        "typical_unit": "kg",
        "default_weight": 8.0,
        "base_price_per_kg": 97.5,
        "price_range": {"min": 650.0, "max": 900.0},
        "recommended_price": 780.0,
        "handling_guidance": "Sort into segregated streams before processing to prevent cross-contamination of hazardous battery cells or mercury switches.",
        "prediction_explanation": "Identified as Mixed E-Waste based on heterogeneous composite mixture of wiring, plastic casings, and miscellaneous electronics.",
        "demo_confidence": 0.85,
        "sample_image_url": "/demo-materials/mixed.jpg"
    }
}

class MaterialProfileEngine:
    """
    Metadata engine providing material intelligence, hazard classification,
    and recoverable elements mapping.
    """

    @classmethod
    def get_profile(cls, key: str) -> Optional[Dict[str, Any]]:
        normalized = key.lower().strip()
        if normalized in MATERIAL_PROFILES:
            return MATERIAL_PROFILES[normalized]

        for k, profile in MATERIAL_PROFILES.items():
            if (k in normalized or
                profile["category"].lower() in normalized or
                profile["subcategory"].lower() in normalized):
                return profile
        return None

    @classmethod
    def get_all_profiles(cls) -> List[Dict[str, Any]]:
        return list(MATERIAL_PROFILES.values())

    @classmethod
    def find_key_by_category(cls, category: str) -> str:
        cat_lower = category.lower().strip()
        for k, v in MATERIAL_PROFILES.items():
            if v["category"].lower() == cat_lower or k == cat_lower:
                return k
        return "pcb"
