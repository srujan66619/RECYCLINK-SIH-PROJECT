import sys
import os
import random
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database.session import engine, SessionLocal, Base
from app.models.entities import (
    Location, User, CollectorProfile, RecyclerProfile, MaterialCategory,
    PriceHistory, RecyclerOffer, EWasteLot, Transaction, HandoverRecord,
    TraceEvent, SafetyGuide, AnomalyAlert, UserRole, AuthorizationStatus,
    LotStatus, TransactionStatus, PaymentStatus, TraceStage, HazardLevel
)
from app.auth.security import get_password_hash
from app.traceability.qr_generator import generate_qr_data_url

CITIES = [
    {"city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867},
    {"city": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480},
    {"city": "Guntur", "state": "Andhra Pradesh", "lat": 16.3067, "lon": 80.4365},
    {"city": "Bapatla", "state": "Andhra Pradesh", "lat": 15.9042, "lon": 80.4674},
    {"city": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
    {"city": "Delhi", "state": "Delhi NCR", "lat": 28.7041, "lon": 77.1025},
]

MATERIALS_DATA = [
    {
        "code": "MAT-PCB-01", "name": "Printed Circuit Board (PCB)", "category": "PCB",
        "subcategory": "High-Grade Server Board", "min_p": 390.0, "max_p": 480.0, "bench_p": 455.0,
        "hazard": "MEDIUM", "recoverable": ["Copper", "Gold", "Silver", "Palladium", "Tantalum"],
        "notes": "Rich in gold fingers and copper tracings. No open flame roasting.", "icon": "cpu"
    },
    {
        "code": "MAT-PCB-02", "name": "Consumer PCB (Greenboard)", "category": "PCB",
        "subcategory": "Motherboard & Appliance Board", "min_p": 260.0, "max_p": 340.0, "bench_p": 310.0,
        "hazard": "MEDIUM", "recoverable": ["Copper", "Tin", "Silver", "Lead"],
        "notes": "De-solder components in ventilated hoods.", "icon": "cpu"
    },
    {
        "code": "MAT-CBL-01", "name": "Insulated Copper Telecom Cable", "category": "Cable",
        "subcategory": "Cat6 & Telecom Wires", "min_p": 190.0, "max_p": 250.0, "bench_p": 230.0,
        "hazard": "LOW", "recoverable": ["Copper (99.9%)", "PVC"],
        "notes": "Strictly mechanical stripping only. Open burning illegal under CPCB Rules.", "icon": "cable"
    },
    {
        "code": "MAT-CBL-02", "name": "Heavy Industrial Copper Cable", "category": "Cable",
        "subcategory": "Armoured Power Cable", "min_p": 280.0, "max_p": 360.0, "bench_p": 330.0,
        "hazard": "LOW", "recoverable": ["Heavy Copper Rods", "Lead Sheath", "Steel Armor"],
        "notes": "High tensile copper yield.", "icon": "cable"
    },
    {
        "code": "MAT-BAT-01", "name": "Lithium-Ion Battery Packs", "category": "Battery",
        "subcategory": "Laptop & Mobile 18650 Cells", "min_p": 170.0, "max_p": 240.0, "bench_p": 210.0,
        "hazard": "HIGH", "recoverable": ["Lithium", "Cobalt", "Nickel", "Copper Foil"],
        "notes": "Thermal runaway hazard. Insulate terminal contacts with dielectric tape.", "icon": "battery-charging"
    },
    {
        "code": "MAT-BAT-02", "name": "Lead-Acid Sealed UPS Batteries", "category": "Battery",
        "subcategory": "SMF VRLA Battery", "min_p": 85.0, "max_p": 110.0, "bench_p": 98.0,
        "hazard": "HIGH", "recoverable": ["Lead Ingots", "Lead Oxide", "Polypropylene"],
        "notes": "Corrosive sulfuric acid hazard. Neutralize any spills with sodium bicarbonate.", "icon": "battery-alert"
    },
    {
        "code": "MAT-LCD-01", "name": "Flat Panel LCD/LED Monitor", "category": "LCD",
        "subcategory": "TFT Display Assembly", "min_p": 90.0, "max_p": 140.0, "bench_p": 120.0,
        "hazard": "MEDIUM", "recoverable": ["Indium Tin Oxide", "Aluminum Frame", "Sheet Glass"],
        "notes": "Avoid puncture of backlight diffuser.", "icon": "tv"
    },
    {
        "code": "MAT-CRT-01", "name": "Cathode Ray Tube (CRT)", "category": "CRT",
        "subcategory": "Television Funnel & Neck Glass", "min_p": 15.0, "max_p": 26.0, "bench_p": 22.0,
        "hazard": "CRITICAL", "recoverable": ["Leaded Glass", "Copper Yoke", "Iron Shroud"],
        "notes": "High vacuum hazard. Contains 1-3 kg toxic lead in funnel glass.", "icon": "monitor"
    },
    {
        "code": "MAT-MOT-01", "name": "Fractional Electric Motor", "category": "Motor",
        "subcategory": "Washing Machine & Fan Stator", "min_p": 130.0, "max_p": 175.0, "bench_p": 155.0,
        "hazard": "LOW", "recoverable": ["Enamelled Copper Wire", "Silicon Steel", "Cast Iron"],
        "notes": "Mechanical dismantling recommended.", "icon": "cog"
    },
    {
        "code": "MAT-MAG-01", "name": "Rare Earth Magnet Assembly", "category": "Magnet Assembly",
        "subcategory": "Hard Disk NdFeB Magnets", "min_p": 190.0, "max_p": 260.0, "bench_p": 225.0,
        "hazard": "LOW", "recoverable": ["Neodymium", "Dysprosium", "Nickel Shielding"],
        "notes": "Store in demagnetized trays. High pinch hazard.", "icon": "magnet"
    },
    {
        "code": "MAT-PLS-01", "name": "Mixed E-Waste Plastic Casings", "category": "Mixed Plastic",
        "subcategory": "ABS/FR Enclosures", "min_p": 28.0, "max_p": 45.0, "bench_p": 38.0,
        "hazard": "LOW", "recoverable": ["ABS Granules", "Polycarbonate Pellets"],
        "notes": "Separate brominated flame-retardant plastics.", "icon": "box"
    },
    {
        "code": "MAT-CMP-01", "name": "Integrated Circuits & Chips", "category": "Electronic Component",
        "subcategory": "BGA/QFP Microprocessors", "min_p": 160.0, "max_p": 240.0, "bench_p": 200.0,
        "hazard": "MEDIUM", "recoverable": ["Gold Bonding Wires", "Silicon", "Kovar Leads"],
        "notes": "Dense precious metal content. Preserve dry.", "icon": "microchip"
    },
    {
        "code": "MAT-MIX-01", "name": "Mixed Small Domestic E-Waste", "category": "Mixed E-Waste",
        "subcategory": "Unsorted Toasters/Blenders/Mixers", "min_p": 60.0, "max_p": 95.0, "bench_p": 80.0,
        "hazard": "MEDIUM", "recoverable": ["Ferrous Steel", "Copper", "Polymers"],
        "notes": "Intake shredding requires magnetic separator.", "icon": "layers"
    },
    {
        "code": "MAT-TEL-01", "name": "Telecom Base Station Board", "category": "PCB",
        "subcategory": "Gold Plated RF Board", "min_p": 550.0, "max_p": 720.0, "bench_p": 640.0,
        "hazard": "MEDIUM", "recoverable": ["Gold (Heavy immersion)", "Silver", "Palladium"],
        "notes": "Highest grade e-waste stream in India.", "icon": "radio"
    },
    {
        "code": "MAT-HDD-01", "name": "Complete Hard Disk Drives (HDD)", "category": "Electronic Component",
        "subcategory": "3.5in Enterprise SATA HDD", "min_p": 140.0, "max_p": 190.0, "bench_p": 170.0,
        "hazard": "LOW", "recoverable": ["Aluminum Platter", "NdFeB Magnet", "PCB Board"],
        "notes": "Requires physical degaussing/punching for data compliance.", "icon": "hard-drive"
    }
]

SAFETY_DATA = [
    {
        "title": "Do NOT Burn Cables (धुआं मत करो)",
        "material_category": "Cable",
        "hazard_type": "Toxic Fume Emissions",
        "danger_description": "Burning PVC insulated cables releases dioxins, furans and hydrochloric gas that cause lung cancer and irreversible air poisoning.",
        "safe_practice_description": "Always use manual or mechanical cable strippers. Authorized recyclers pay 25% MORE for clean unburnt copper strands.",
        "pictorial_icon": "flame-off",
        "dos": ["Strip insulation using sharp blades or cable peeling machine", "Sell clean peeled bright copper for maximum price", "Wear leather safety gloves"],
        "donts": ["Never light open fire in scrap yards or drains", "Never inhale black fumes from melting plastic", "Do not sell burnt copper (heavily discounted)"],
        "language": "en"
    },
    {
        "title": "Do NOT Use Acid to Leach Gold (तेजाब का उपयोग न करें)",
        "material_category": "PCB",
        "hazard_type": "Corrosive Chemical Poisoning",
        "danger_description": "Cooking motherboards in crude nitric/hydrochloric acid baths dissolves lungs, burns skin and contaminates local ground drinking water with cyanide and lead.",
        "safe_practice_description": "Formal recyclers use closed-loop hydrometallurgical recovery with zero acid discharge. Hand over intact boards to get fair weight-based value.",
        "pictorial_icon": "flask-conical-off",
        "dos": ["Store printed circuit boards dry in stacked crates", "Verify benchmark pricing on RECYCLINK before selling", "Handover to authorized facility"],
        "donts": ["Never dip boards into boiling acid pots in backyards", "Never pour chemical rinse into municipal gutters", "Never heat boards on kitchen stoves"],
        "language": "en"
    },
    {
        "title": "Handle Lithium Batteries with Extreme Care (लिथियम बैटरी सावधानी)",
        "material_category": "Battery",
        "hazard_type": "Explosion & Thermal Runaway",
        "danger_description": "Punctured or bent phone/laptop batteries ignite explosively, generating 800°C chemical fires that cannot be extinguished with water.",
        "safe_practice_description": "Insulate battery contact points using electrical tape and pack in sand or vermiculite bins.",
        "pictorial_icon": "battery-warning",
        "dos": ["Tape exposed battery terminals immediately", "Store in a cool dry ventilated shade box", "Separate swollen or leaking packs"],
        "donts": ["Never crush batteries with hammers or metal shears", "Never throw batteries into trash heaps or rivers", "Never allow opposite terminals to touch"],
        "language": "en"
    },
    {
        "title": "CRT Glass Implosion & Lead Safety (सीआरटी कांच खतरा)",
        "material_category": "CRT",
        "hazard_type": "Heavy Metal Poisoning & Vacuum Implosion",
        "danger_description": "Breaking old TV picture tubes can trigger violent implosions scattering shards. The funnel glass is loaded with up to 3 kg of toxic lead oxide.",
        "safe_practice_description": "Keep CRT bulbs intact. Authorized dismantlers use diamond wire hot-cutting under negative air pressure.",
        "pictorial_icon": "shield-alert",
        "dos": ["Wear safety goggles and heavy cut-proof gloves", "Keep picture tubes resting gently on rubber pads", "Label leaded glass before transport"],
        "donts": ["Never smash CRT monitors with bricks or sledgehammers", "Never sell crushed CRT glass to construction workers", "Keep children away from tube storage"],
        "language": "en"
    }
]

def seed_database():
    db = SessionLocal()
    try:
        print("[SEEDS] Dropping and creating database tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        print("[SEEDS] Seeding Geographic Locations...")
        loc_map = {}
        for c in CITIES:
            loc = Location(
                city=c["city"],
                state=c["state"],
                country="India",
                latitude=c["lat"],
                longitude=c["lon"]
            )
            db.add(loc)
            db.commit()
            db.refresh(loc)
            loc_map[c["city"]] = loc.id


        print("[SEEDS] Seeding Safety Guides...")
        for sg in SAFETY_DATA:
            guide = SafetyGuide(**sg)
            db.add(guide)
        db.commit()

        print("[SEEDS] Seeding Materials Catalog (15 categories)...")
        material_objects = []
        for m in MATERIALS_DATA:
            mat = MaterialCategory(
                code=m["code"],
                name=m["name"],
                category=m["category"],
                subcategory=m["subcategory"],
                base_market_price_min=m["min_p"],
                base_market_price_max=m["max_p"],
                current_benchmark_price=m["bench_p"],
                hazard_level=m["hazard"],
                recoverable_materials=m["recoverable"],
                safety_notes=m["notes"],
                icon_name=m["icon"]
            )
            db.add(mat)
            material_objects.append(mat)
        db.commit()

        # Seed 50 historical price records
        print("[SEEDS] Seeding 50 Price History records...")
        now = datetime.utcnow()
        for i in range(50):
            mat = material_objects[i % len(material_objects)]
            city_meta = CITIES[i % len(CITIES)]
            delta_days = (50 - i)
            variation = random.uniform(-15.0, 15.0)
            bench = round(mat.current_benchmark_price + variation, 1)
            hist = PriceHistory(
                material_id=mat.id,
                benchmark_price=bench,
                market_min=round(bench * 0.88, 1),
                market_max=round(bench * 1.12, 1),
                effective_date=now - timedelta(days=delta_days),
                location_city=city_meta["city"],
                source="CPCB Central Exchange"
            )
            db.add(hist)
        db.commit()

        # Seed Core Users: 1 Admin, 1 Primary Collector, 1 Primary Recycler
        print("[SEEDS] Seeding Core Users & Profiles...")
        admin_user = User(
            email="admin@recyclink.in",
            phone="9876599999",
            full_name="Dr. Sunita Sharma (CPCB E-Waste Officer)",
            role=UserRole.ADMIN.value,
            hashed_password=get_password_hash("admin123"),
            is_active=True
        )
        db.add(admin_user)

        demo_collector_user = User(
            email="collector@recyclink.in",
            phone="9876543210",
            full_name="Ramesh Kabadiwala (Smart Collector)",
            role=UserRole.COLLECTOR.value,
            hashed_password=get_password_hash("collector123"),
            is_active=True
        )
        db.add(demo_collector_user)
        db.commit()

        primary_collector_profile = CollectorProfile(
            user_id=demo_collector_user.id,
            area="Banjara Hills Scrap Guild",
            city="Hyderabad",
            state="Telangana",
            pincode="500034",
            upi_id="9876543210@paytm",
            photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
            total_collected_kg=145.0,
            total_earnings=62400.0,
            rating=4.9,
            is_verified=True
        )
        db.add(primary_collector_profile)

        # Seed 19 more Collectors (Total 20)
        collectors = [primary_collector_profile]
        collector_names = [
            ("Suresh Varma", "AutoNagar", "Vijayawada", "Andhra Pradesh"),
            ("Venkat Rao", "Gujjanagundla", "Guntur", "Andhra Pradesh"),
            ("Chinna Reddy", "Railway Colony", "Bapatla", "Andhra Pradesh"),
            ("Mohammed Ismail", "Old City", "Hyderabad", "Telangana"),
            ("Rajesh Solanki", "Dharavi Sector 5", "Mumbai", "Maharashtra"),
            ("Santosh Shinde", "Hadapsar Depot", "Pune", "Maharashtra"),
            ("Basavaraj Gowda", "Peenya Scrap Yard", "Bengaluru", "Karnataka"),
            ("Manpreet Singh", "Mayapuri Ward", "Delhi", "Delhi NCR"),
            ("Appa Rao", "Bapatla Beach Road", "Bapatla", "Andhra Pradesh"),
            ("Kishore Kumar", "Kukatpally Industrial Area", "Hyderabad", "Telangana"),
            ("Baburao Kadam", "Kurla West", "Mumbai", "Maharashtra"),
            ("Narasimha Murthy", "Gorantla", "Guntur", "Andhra Pradesh"),
            ("Anil Jadhav", "Bhosari MIDC", "Pune", "Maharashtra"),
            ("Govindamma Naidu", "Benz Circle", "Vijayawada", "Andhra Pradesh"),
            ("Ravi Shankar", "Rajajinagar", "Bengaluru", "Karnataka"),
            ("Dharmendra Prasad", "Okhla Phase 2", "Delhi", "Delhi NCR"),
            ("Somaiah Chetty", "Secunderabad Station", "Hyderabad", "Telangana"),
            ("Mallikarjun Swamy", "Shivajinagar", "Bengaluru", "Karnataka"),
            ("Ganesh Gaikwad", "Pimpri", "Pune", "Maharashtra"),
        ]

        for i, (name, area, city, state) in enumerate(collector_names, 2):
            phone = f"98111{i:05d}"
            email = f"collector{i}@recyclink.in"
            u = User(
                email=email,
                phone=phone,
                full_name=name,
                role=UserRole.COLLECTOR.value,
                hashed_password=get_password_hash("collector123"),
                is_active=True
            )
            db.add(u)
            db.commit()

            prof = CollectorProfile(
                user_id=u.id,
                area=area,
                city=city,
                state=state,
                pincode="500001",
                upi_id=f"{phone}@upi",
                photo_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
                total_collected_kg=round(random.uniform(50.0, 420.0), 1),
                total_earnings=round(random.uniform(15000.0, 180000.0), 2),
                rating=round(random.uniform(4.6, 5.0), 1),
                is_verified=True
            )
            db.add(prof)
            collectors.append(prof)
        db.commit()

        # Seed 10 Authorized Recyclers across Indian cities
        print("[SEEDS] Seeding 10 Authorized Recyclers...")
        recycler_profiles = []
        recycler_data = [
            ("GreenCycle E-Waste Technologies", "CPCB/AUTH/TS/2026/001", "Hyderabad", "Telangana", 17.3616, 78.4747, 4.2),
            ("EcoFormal Recovery India Pvt Ltd", "CPCB/AUTH/TS/2026/002", "Hyderabad", "Telangana", 17.5169, 78.3428, 7.5),
            ("Bharat Circular Refiners", "CPCB/AUTH/TS/2026/003", "Hyderabad", "Telangana", 17.4399, 78.4983, 11.0),
            ("Andhra Green Metal Recyclers Ltd", "CPCB/AUTH/AP/2026/004", "Vijayawada", "Andhra Pradesh", 16.5186, 80.6199, 5.0),
            ("Amaravati Clean-Tech Dismantlers", "CPCB/AUTH/AP/2026/005", "Guntur", "Andhra Pradesh", 16.3067, 80.4365, 8.2),
            ("Coastal Andhra E-Waste Logistics", "CPCB/AUTH/AP/2026/006", "Bapatla", "Andhra Pradesh", 15.9042, 80.4674, 3.8),
            ("Bengaluru Eco-Metallics Pvt Ltd", "CPCB/AUTH/KA/2026/007", "Bengaluru", "Karnataka", 12.9698, 77.7499, 6.4),
            ("Maharashtra Circular Smelters Ltd", "CPCB/AUTH/MH/2026/008", "Pune", "Maharashtra", 18.5204, 73.8567, 9.1),
            ("Mumbai Safe-Ecycle Solutions", "CPCB/AUTH/MH/2026/009", "Mumbai", "Maharashtra", 19.0434, 72.8562, 12.3),
            ("Capital EcoRefineries Delhi", "CPCB/AUTH/DL/2026/010", "Delhi", "Delhi NCR", 28.5355, 77.2732, 14.0)
        ]

        for i, (fname, auth_no, city, state, lat, lon, radius) in enumerate(recycler_data, 1):
            phone = "9876500001" if i == 1 else f"98222{i:05d}"
            email = "recycler@recyclink.in" if i == 1 else f"recycler{i}@recyclink.in"
            u = User(
                email=email,
                phone=phone,
                full_name=f"Director ({fname})",
                role=UserRole.RECYCLER.value,
                hashed_password=get_password_hash("recycler123"),
                is_active=True
            )
            db.add(u)
            db.commit()

            r_prof = RecyclerProfile(
                user_id=u.id,
                facility_name=fname,
                authorization_no=auth_no,
                authorization_number=auth_no,
                authorization_status=AuthorizationStatus.VERIFIED_DEMO.value,
                location_id=loc_map.get(city),
                address=f"Plot #{100+i}, Industrial Development Area, {city}",
                city=city,
                state=state,
                pincode="500051",
                latitude=lat,
                longitude=lon,
                contact_phone=phone,
                contact_email=email,
                accepted_materials=["PCB", "Cable", "Battery", "LCD", "CRT", "Motor", "Electronic Component"],
                pickup_available=True,
                pickup_min_weight_kg=2.0,
                service_radius_km=35.0,
                rating=round(4.7 + (i % 3) * 0.1, 1),
                is_active=True
            )
            db.add(r_prof)
            recycler_profiles.append(r_prof)
        db.commit()

        # Seed Recycler Offers
        print("[SEEDS] Seeding Recycler Pricing Offers...")
        for r in recycler_profiles:
            for mat in material_objects[:6]:
                offer_rate = round(mat.current_benchmark_price + random.uniform(-10.0, 15.0), 1)
                ro = RecyclerOffer(
                    recycler_id=r.id,
                    material_id=mat.id,
                    offer_price_per_kg=offer_rate,
                    min_weight_kg=2.0,
                    is_active=True
                )
                db.add(ro)
        db.commit()

        # Seed 30 E-Waste Lots, 50 Transactions, 100 Trace Events
        print("[SEEDS] Seeding 30 Lots, 50 Transactions & 100 Trace Events...")
        statuses = [
            LotStatus.FORMAL_RECYCLING.value,
            LotStatus.HANDOVER_VERIFIED.value,
            LotStatus.PICKUP_SCHEDULED.value,
            LotStatus.RECYCLER_SELECTED.value,
            LotStatus.PRICED.value,
            LotStatus.IDENTIFIED.value
        ]

        lots = []
        for i in range(1, 31):
            trace_id = f"RC-2026-{i:06d}"
            mat = material_objects[(i - 1) % len(material_objects)]
            collector = collectors[(i - 1) % len(collectors)]
            weight = round(random.uniform(2.0, 25.0), 1)
            bench = mat.current_benchmark_price
            st = statuses[i % len(statuses)] if i > 1 else LotStatus.FORMAL_RECYCLING.value

            lot = EWasteLot(
                lot_id=f"LOT-2026-{i:06d}",
                trace_id=trace_id,
                collector_id=collector.id,
                material_id=mat.id,
                material_name=mat.name,
                subcategory=mat.subcategory,
                estimated_weight=weight,
                final_weight=weight if st in [LotStatus.HANDOVER_VERIFIED.value, LotStatus.FORMAL_RECYCLING.value] else None,
                photo_url="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
                ai_confidence=round(random.uniform(0.91, 0.98), 2),
                hazard_level=mat.hazard_level,
                estimated_price_min=round(bench * 0.88 * weight, 2),
                estimated_price_max=round(bench * 1.12 * weight, 2),
                recommended_price=round(bench * weight, 2),
                quoted_price=round(bench * weight, 2),
                status=st,
                location_lat=17.3850 + (random.uniform(-0.05, 0.05)),
                location_lng=78.4867 + (random.uniform(-0.05, 0.05)),
                location_address=f"{collector.area}, {collector.city}",
                qr_code_url=generate_qr_data_url(trace_id),
                created_at=now - timedelta(days=(30 - i))
            )
            db.add(lot)
            lots.append(lot)
        db.commit()

        # Seed 50 Transactions
        print("[SEEDS] Seeding Transactions & Handover Records...")
        tx_count = 0
        for i, lot in enumerate(lots):
            recycler = recycler_profiles[i % len(recycler_profiles)]
            rate = round(lot.recommended_price / lot.estimated_weight, 1)
            total = round(rate * lot.estimated_weight, 2)
            is_completed = lot.status in [LotStatus.HANDOVER_VERIFIED.value, LotStatus.FORMAL_RECYCLING.value]

            tx = Transaction(
                lot_id=lot.id,
                collector_id=lot.collector_id,
                recycler_id=recycler.id,
                agreed_price_per_kg=rate,
                final_weight=lot.estimated_weight if is_completed else None,
                total_amount=total if is_completed else None,
                payment_status=PaymentStatus.PAID.value if is_completed else PaymentStatus.PENDING.value,
                payment_method="UPI Instant Transfer",
                payment_ref=f"UPI-20260904-{lot.id:04d}" if is_completed else None,
                scheduled_pickup_time=lot.created_at + timedelta(hours=4),
                status=TransactionStatus.COMPLETED.value if is_completed else TransactionStatus.ACCEPTED.value,
                created_at=lot.created_at
            )
            db.add(tx)
            db.commit()
            tx_count += 1

            if is_completed:
                handover = HandoverRecord(
                    transaction_id=tx.id,
                    lot_id=lot.id,
                    recycler_id=recycler.id,
                    collector_id=lot.collector_id,
                    initial_weight=lot.estimated_weight,
                    verified_weight=lot.estimated_weight,
                    weight_discrepancy_pct=0.0,
                    final_rate_per_kg=rate,
                    final_amount_paid=total,
                    handover_timestamp=lot.created_at + timedelta(hours=6),
                    recycler_digital_signature=f"SIG-{recycler.authorization_no}",
                    collector_confirmation=True,
                    remarks="Weight verified on digital scale. UPI transfer verified."
                )
                db.add(handover)

            # Generate 3 to 6 Trace Events per lot to reach > 100 trace events
            events_to_create = [
                (TraceStage.COLLECTED.value, "Informal Collection & Intake", f"Material gathered by verified collector in {lot.location_address}."),
                (TraceStage.IDENTIFIED.value, "AI Vision Verification Complete", f"AI Model classified item as {lot.material_name} ({lot.ai_confidence*100:.0f}% confidence)."),
                (TraceStage.PRICED.value, "Fair Price Benchmark Match", f"Assigned fair market baseline rate of ₹{rate}/kg based on CPCB open index."),
                (TraceStage.RECYCLER_SELECTED.value, "Authorized Recycler Matched", f"Bid awarded to {recycler.facility_name} (Auth: {recycler.authorization_no})."),
            ]
            if is_completed or lot.status == LotStatus.PICKUP_SCHEDULED.value:
                events_to_create.append((TraceStage.PICKUP_SCHEDULED.value, "Logistics Pickup En Route", "GPS-tracked collection carrier dispatched."))
            if is_completed:
                events_to_create.append((TraceStage.HANDOVER_VERIFIED.value, "Digital Handover & Scale Verification", f"Weight confirmed ({lot.estimated_weight} kg). Payout ₹{total} disbursed via UPI."))
                events_to_create.append((TraceStage.FORMAL_RECYCLING.value, "Formal Recycling Chain Ingestion", "Safely inducted into CPCB certified zero-landfill hydrometallurgical refinery."))

            for stage, title, desc in events_to_create:
                tev = TraceEvent(
                    lot_id=lot.id,
                    trace_id=lot.trace_id,
                    stage=stage,
                    title=title,
                    description=desc,
                    actor_role="COLLECTOR" if stage == TraceStage.COLLECTED.value else ("SYSTEM_AI" if stage in [TraceStage.IDENTIFIED.value, TraceStage.PRICED.value] else "RECYCLER"),
                    actor_name=recycler.facility_name if stage in [TraceStage.RECYCLER_SELECTED.value, TraceStage.HANDOVER_VERIFIED.value] else "RECYCLINK Intelligence",
                    location=lot.location_address,
                    event_timestamp=lot.created_at + timedelta(minutes=random.randint(10, 180))
                )
                db.add(tev)

        db.commit()

        # Seed Anomaly Alerts
        print("[SEEDS] Seeding Anomaly Alerts for AI Guardian...")
        alert1 = AnomalyAlert(
            transaction_id=1,
            lot_id=1,
            alert_type="PREDATORY_PRICING",
            severity="CRITICAL",
            description="⚠ PRICE ANOMALY: Recycler bid of ₹270/kg was flagged (40.7% below market benchmark of ₹455/kg). Corrected by AI Guardian.",
            deviation_pct=40.7,
            benchmark_value=455.0,
            actual_value=270.0,
            status="RESOLVED"
        )
        alert2 = AnomalyAlert(
            transaction_id=2,
            lot_id=2,
            alert_type="WEIGHT_MISMATCH",
            severity="WARNING",
            description="⚠ WEIGHT MISMATCH: Handover scale recorded 4.2 kg vs initial 5.8 kg intake. Verified moisture evaporation.",
            deviation_pct=27.5,
            benchmark_value=5.8,
            actual_value=4.2,
            status="REVIEWED"
        )
        db.add(alert1)
        db.add(alert2)
        db.commit()

        print("[SUCCESS] Seeding complete! Summary:")
        print(f"  - Users: {db.query(User).count()}")
        print(f"  - Collectors: {db.query(CollectorProfile).count()}")
        print(f"  - Recyclers: {db.query(RecyclerProfile).count()}")
        print(f"  - Materials: {db.query(MaterialCategory).count()}")
        print(f"  - Price Records: {db.query(PriceHistory).count()}")
        print(f"  - Lots: {db.query(EWasteLot).count()}")
        print(f"  - Transactions: {db.query(Transaction).count()}")
        print(f"  - Trace Events: {db.query(TraceEvent).count()}")
        print(f"  - Safety Guides: {db.query(SafetyGuide).count()}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
