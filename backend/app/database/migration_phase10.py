import sqlite3
import os
import json
from datetime import datetime, timedelta

def migrate_database_phase10(db_path: str = "recyclink.db"):
    if not os.path.exists(db_path):
        print(f"[Phase 10 Migration] Database {db_path} not found. Skipping.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print(f"[Phase 10 Migration] Checking Phase 10 schema for {db_path}...")

    # 1. Create ai_feedback table if it doesn't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction_id INTEGER,
            lot_id INTEGER,
            original_prediction VARCHAR(100) NOT NULL,
            original_confidence FLOAT,
            corrected_material VARCHAR(100) NOT NULL,
            user_role VARCHAR(50) DEFAULT 'COLLECTOR',
            user_id INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lot_id) REFERENCES e_waste_lots(id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_ai_feedback_prediction_id ON ai_feedback(prediction_id)")

    # 2. Create collection_drives table if it doesn't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS collection_drives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(200) NOT NULL,
            location VARCHAR(200) NOT NULL,
            city VARCHAR(100) DEFAULT 'Hyderabad',
            drive_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            target_weight_kg FLOAT DEFAULT 1000.0,
            collected_weight_kg FLOAT DEFAULT 0.0,
            target_collectors INTEGER DEFAULT 50,
            participating_collectors INTEGER DEFAULT 0,
            accepted_materials VARCHAR(255) DEFAULT 'PCB, Battery, Cable, LCD, Motor',
            status VARCHAR(50) DEFAULT 'UPCOMING',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 3. Seed community collection drives if none exist
    cur.execute("SELECT count(*) FROM collection_drives")
    drive_count = cur.fetchone()[0]
    if drive_count == 0:
        print("  Seeding initial community collection drives...")
        now = datetime.utcnow()
        sample_drives = [
            (
                "Cyberabad E-Waste Clean Drive 2026",
                "Hitec City Junction / Madhapur Ground",
                "Hyderabad",
                (now + timedelta(days=4)).isoformat(),
                1500.0,
                380.0,
                60,
                24,
                "PCB, Smartphone, Battery, Laptop, Cable",
                "ACTIVE",
                "CPCB-supported community collection drive bringing informal collectors and residents together for verified formal e-waste aggregation."
            ),
            (
                "Old City Informal Aggregation Drive",
                "Charminar Scrap Hub, Moghalpura",
                "Hyderabad",
                (now + timedelta(days=10)).isoformat(),
                2500.0,
                0.0,
                100,
                15,
                "CRT, Metal Scrap, Wiring, Transformers, Mixed E-Waste",
                "UPCOMING",
                "Targeted informal collector formalization drive with on-spot fair price cash transfers and digital material passports."
            ),
            (
                "Secunderabad Cantonment Green Electronics Drive",
                "Trimulgherry Civic Center",
                "Secunderabad",
                (now - timedelta(days=3)).isoformat(),
                1000.0,
                1120.0,
                45,
                48,
                "Batteries, Cables, Small Appliances, PCB",
                "COMPLETED",
                "Successfully aggregated 1.12 tonnes with 100% formal recycler handover and zero informal open burning."
            )
        ]
        for drive in sample_drives:
            cur.execute("""
                INSERT INTO collection_drives (
                    title, location, city, drive_date, target_weight_kg,
                    collected_weight_kg, target_collectors, participating_collectors,
                    accepted_materials, status, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, drive)

    # 4. Seed multilingual safety guidelines in Telugu (te), Tamil (ta), Kannada (kn), Malayalam (ml), Bengali (bn)
    new_languages = ["te", "ta", "kn", "ml", "bn"]
    for lang in new_languages:
        count = cur.execute("SELECT count(*) FROM safety_guides WHERE language = ?", (lang,)).fetchone()[0]
        if count == 0:
            print(f"  Seeding multilingual safety guidelines for {lang}...")
            if lang == "te":
                guides = [
                    {
                        "language": "te",
                        "title": "లిథియం బ్యాటరీ: ఆకస్మిక మంటలు మరియు పేలుడు ప్రమాదం",
                        "material_category": "Battery",
                        "hazard_type": "HIGH_HAZARD_FIRE",
                        "danger_description": "లిథియం బ్యాటరీలను పగలగొట్టడం లేదా నొక్కడం వల్ల తీవ్రమైన పేలుడు జరిగి విషపూరిత హైడ్రోఫ్లోరిక్ యాసిడ్ వాయువులు వెలువడతాయి.",
                        "safe_practice_description": "బ్యాటరీ టెర్మినల్స్‌పై ఇన్సులేషన్ టేప్ వేయండి. పొడి ఇసుక డబ్బాలో విడిగా నిల్వ చేయండి. ఎట్టిపరిస్థితుల్లోనూ పగలగొట్టవద్దు.",
                        "pictorial_icon": "battery-charging",
                        "dos": json.dumps(["టెర్మినల్స్‌కు ప్లాస్టిక్ టేప్ అతికించండి", "పొడి ఇసుక బకెట్‌లో విడిగా ఉంచండి", "రక్షణ గ్లౌజులు ధరించండి", "అధికారిక రీసైక్లర్‌కు నేరుగా ఇవ్వండి"]),
                        "donts": json.dumps(["బ్యాటరీలను సుత్తితో కొట్టవద్దు", "ఎండలో లేదా మంటల వద్ద పెట్టవద్దు", "ఉబ్బిన బ్యాటరీలను సాధారణ చెత్తలో కలపవద్దు"])
                    },
                    {
                        "language": "te",
                        "title": "సర్క్యూట్ బోర్డులు (PCB): ప్రమాదకరమైన యాసిడ్ లీచింగ్",
                        "material_category": "PCB",
                        "hazard_type": "CHEMICAL_CORROSION",
                        "danger_description": "బంగారం తీయడానికి నైట్రిక్ యాసిడ్‌లో బోర్డులు వేస్తే ఊపిరితిత్తులను నాశనం చేసే నైట్రోజన్ డయాక్సైడ్ విష వాయువు వస్తుంది.",
                        "safe_practice_description": "బోర్డులను విడదీసి పొడిగా ఉంచండి. లైసెన్స్ ఉన్న రీసైక్లింగ్ కేంద్రాల ద్వారా పూర్తి విలువ పొందండి.",
                        "pictorial_icon": "flask",
                        "dos": json.dumps(["బోర్డులను పొడిగా మరియు శుభ్రంగా ఉంచండి", "చేతులకు గ్లౌజులు వేసుకోండి", "అధికారిక రీసైక్లర్‌కు విక్రయించండి"]),
                        "donts": json.dumps(["ఓపెన్ యాసిడ్ వాడవద్దు", "పొయ్యిపై బోర్డులను కాల్చవద్దు", "యాసిడ్ నీటిని కాలువల్లో పోయవద్దు"])
                    },
                    {
                        "language": "te",
                        "title": "వైర్లు మరియు కేబుల్స్: విషపూరిత ప్లాస్టిక్ పొగ",
                        "material_category": "Cable",
                        "hazard_type": "TOXIC_FUMES",
                        "danger_description": "రాగి కోసం వైర్లను కాల్చడం వల్ల క్యాన్సర్ కలిగించే డయాక్సిన్ వాయువు వెలువడుతుంది.",
                        "safe_practice_description": "వైర్ స్ట్రిప్పర్ సాధనంతో తొక్క తీయండి లేదా కోటింగ్‌తో సహా రీసైక్లర్‌కు విక్రయించండి.",
                        "pictorial_icon": "flame",
                        "dos": json.dumps(["వైర్ స్ట్రిప్పర్ ఉపయోగించండి", "వైర్లను కట్టలుగా కట్టి పొడిగా ఉంచండి", "కవచంతో సహా విక్రయిస్తే మంచి ధర లభిస్తుంది"]),
                        "donts": json.dumps(["వైర్లను అగ్నిలో కాల్చవద్దు", "నల్లటి పొగను పీల్చవద్దు", "ఇళ్ల దగ్గర కాల్చవద్దు"])
                    },
                    {
                        "language": "te",
                        "title": "CRT మానిటర్లు: వాక్యూమ్ పేలుడు మరియు సీసం (Lead)",
                        "material_category": "CRT",
                        "hazard_type": "HIGH_HAZARD_LEAD",
                        "danger_description": "పాత టీవీలలో 2-3 కిలోల విషపూరిత సీసం ఉంటుంది. గొట్టాన్ని పగలగొడితే పేలుడు జరిగి గ్లాస్ ముక్కలు మరియు విషపూరిత పొడి ఎగురుతాయి.",
                        "safe_practice_description": "టీవీని బయటి ఫ్రేమ్ ద్వారా మాత్రమే ఎత్తండి. వెనుక గొట్టాన్ని పగలగొట్టవద్దు.",
                        "pictorial_icon": "tv",
                        "dos": json.dumps(["బయటి ప్లాస్టిక్ బాడీతో పట్టుకోండి", "సమతల నేలపై ఉంచండి", "రక్షణ కళ్లద్దాలు మరియు గ్లౌజులు వాడండి", "పగలగొట్టకుండా అప్పగించండి"]),
                        "donts": json.dumps(["రాగి కాయిల్ కోసం గొట్టాన్ని పగలగొట్టవద్దు", "పగిలిన గాజును కాలువల్లో వేయవద్దు", "తెల్లటి పౌడర్‌ను తాకవద్దు"])
                    }
                ]
            elif lang == "ta":
                guides = [
                    {
                        "language": "ta",
                        "title": "லித்தியம் பேட்டரி: திடீர் தீ மற்றும் வெடிப்பு அபாயம்",
                        "material_category": "Battery",
                        "hazard_type": "HIGH_HAZARD_FIRE",
                        "danger_description": "லித்தியம் பேட்டரிகளை அழுத்துவது அல்லது உடைப்பது தீ விபத்து மற்றும் நச்சு வாயுக்களை உருவாக்கும்.",
                        "safe_practice_description": "டெர்மினல்களில் இன்சுலேஷன் டேப் ஒட்டவும். உலர் மணல் வாளியில் பாதுகாக்கவும்.",
                        "pictorial_icon": "battery-charging",
                        "dos": json.dumps(["பிளாஸ்டிக் டேப் ஒட்டவும்", "உலர் மணலில் தனித்து வைக்கவும்", "கையுறை அணியவும்", "அங்கீகரிக்கப்பட்ட மறுசுழற்சியாளரிடம் ஒப்படைக்கவும்"]),
                        "donts": json.dumps(["சுத்தியலால் உடைக்காதீர்கள்", "நெருப்பு அல்லது வெயிலில் வைக்காதீர்கள்", "வீங்கிய பேட்டரிகளை குப்பையில் போடாதீர்கள்"])
                    },
                    {
                        "language": "ta",
                        "title": "சர்க்யூட் போர்டுகள் (PCB): கொடிய அமில அரிப்பு ஆபத்து",
                        "material_category": "PCB",
                        "hazard_type": "CHEMICAL_CORROSION",
                        "danger_description": "தங்கம் பிரித்தெடுக்க அமிலத்தில் போடுவதால் வெளிவரும் வாயு நுரையீரலை எரித்துவிடும்.",
                        "safe_practice_description": "போர்டுகளை உலர்ந்த நிலையில் வைத்திருக்கவும். உரிமம் பெற்ற மறுசுழற்சியாளரிடம் விற்கவும்.",
                        "pictorial_icon": "flask",
                        "dos": json.dumps(["போர்டுகளை உலர வைக்கவும்", "பாதுகாப்பு கையுறைகளை அணியவும்", "அங்கீகரிக்கப்பட்ட இடத்தில் விற்கவும்"]),
                        "donts": json.dumps(["அமிலத்தில் போடாதீர்கள்", "அடுப்பில் சூடாக்காதீர்கள்", "கழிவுநீரை சாக்கடையில் விடாதீர்கள்"])
                    }
                ]
            elif lang == "kn":
                guides = [
                    {
                        "language": "kn",
                        "title": "ಲಿಥಿಯಂ ಬ್ಯಾಟರಿ: ಹಠಾತ್ ಬೆಂಕಿ ಮತ್ತು ಸ್ಫೋಟದ ಅಪಾಯ",
                        "material_category": "Battery",
                        "hazard_type": "HIGH_HAZARD_FIRE",
                        "danger_description": "ಲಿಥಿಯಂ ಬ್ಯಾಟರಿಗಳನ್ನು ಒಡೆದರೆ ಅಥವಾ ಒತ್ತಿದರೆ ತಕ್ಷಣ ಸ್ಫೋಟಗೊಂಡು ವಿಷಕಾರಿ ಅನಿಲ ಹೊರಬರುತ್ತದೆ.",
                        "safe_practice_description": "ಟರ್ಮಿನಲ್‌ಗಳಿಗೆ ಇನ್ಸುಲೇಷನ್ ಟೇಪ್ ಹಚ್ಚಿ. ಒಣ ಮರಳಿನ ಪಾತ್ರೆಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿಡಿ.",
                        "pictorial_icon": "battery-charging",
                        "dos": json.dumps(["ಟರ್ಮಿನಲ್‌ಗಳಿಗೆ ಟೇಪ್ ಅಂಟಿಸಿ", "ಒಣ ಮರಳಿನಲ್ಲಿ ಪ್ರತ್ಯೇಕವಾಗಿಡಿ", "ಕೈಗವಸು ಧರಿಸಿ", "ಅಧಿಕೃತ ಮರುಬಳಕೆದಾರರಿಗೆ ನೀಡಿ"]),
                        "donts": json.dumps(["ಸುತ್ತಿಗೆಯಿಂದ ಒಡೆಯಬೇಡಿ", "ಬಿಸಿಲು ಅಥವಾ ಬೆಂಕಿಯಲ್ಲಿ ಇಡಬೇಡಿ", "ಉಬ್ಬಿದ ಬ್ಯಾಟರಿಗಳನ್ನು ಕಸಕ್ಕೆ ಎಸೆಯಬೇಡಿ"])
                    },
                    {
                        "language": "kn",
                        "title": "ಸರ್ಕ್ಯೂಟ್ ಬೋರ್ಡ್‌ಗಳು (PCB): ಮಾರಣಾಂತಿಕ ಆಸಿಡ್ ಅಪಾಯ",
                        "material_category": "PCB",
                        "hazard_type": "CHEMICAL_CORROSION",
                        "danger_description": "ಚಿನ್ನ ತೆಗೆಯಲು ಆಸಿಡ್ ಬಳಸಿದರೆ ಹೊರಬರುವ ಹಳದಿ ಹೊಗೆ ಶ್ವಾಸಕೋಶವನ್ನು ಶಾಶ್ವತವಾಗಿ ಹಾನಿಗೊಳಿಸುತ್ತದೆ.",
                        "safe_practice_description": "ಬೋರ್ಡ್‌ಗಳನ್ನು ಒಣಗಿಸಿ ಹಾಗೇ ಇರಿಸಿ. ಪ್ರಮಾಣೀಕೃತ ಮರುಬಳಕೆದಾರರಿಗೆ ಮಾರಾಟ ಮಾಡಿ.",
                        "pictorial_icon": "flask",
                        "dos": json.dumps(["ಬೋರ್ಡ್ ಒಣಗಿ ಸುರಕ್ಷಿತವಾಗಿಡಿ", "ಕಟ್-ನಿರೋಧಕ ಕೈಗವಸು ಬಳಸಿ", "ಅಧಿಕೃತ ಕೇಂದ್ರಗಳಿಗೆ ನೀಡಿ"]),
                        "donts": json.dumps(["ಆಸಿಡ್ ಬಳಸಬೇಡಿ", "ಒಲೆಯಲ್ಲಿ ಬಿಸಿಮಾಡಬೇಡಿ", "ಚರಂಡಿಗೆ ಆಸಿಡ್ ಸುರಿಯಬೇಡಿ"])
                    }
                ]
            elif lang == "ml":
                guides = [
                    {
                        "language": "ml",
                        "title": "ലിഥിയം ബാറ്ററി: പെട്ടെന്നുള്ള തീപിടുത്തവും പൊട്ടിത്തെറിയും",
                        "material_category": "Battery",
                        "hazard_type": "HIGH_HAZARD_FIRE",
                        "danger_description": "ലിഥിയം ബാറ്ററികൾ തുളയ്ക്കുകയോ മർദ്ദിക്കുകയോ ചെയ്താൽ മാരകമായ വിഷവാതകവും തീപിടുത്തവും ഉണ്ടാകും.",
                        "safe_practice_description": "ടെർമിനലുകളിൽ ടേപ്പ് ഒട്ടിക്കുക. ഉണങ്ങിയ മണൽ പാത്രത്തിൽ സൂക്ഷിക്കുക.",
                        "pictorial_icon": "battery-charging",
                        "dos": json.dumps(["പ്ലാസ്റ്റിക് ടേപ്പ് ഒട്ടിക്കുക", "ഉണങ്ങിയ മണലിൽ വെക്കുക", "കയ്യുറകൾ ധരിക്കുക", "റീസൈക്ലർക്ക് നൽകുക"]),
                        "donts": json.dumps(["ചുറ്റിക കൊണ്ട് അടിക്കരുത്", "തീയുടെ അടുത്ത് വെക്കരുത്", "പൊട്ടിയ ബാറ്ററി സാധാരണ മാലിന്യത്തിൽ ഇടരുത്"])
                    }
                ]
            elif lang == "bn":
                guides = [
                    {
                        "language": "bn",
                        "title": "লিথিয়াম ব্যাটারি: হঠাৎ আগুন এবং বিস্ফোরণের ঝুঁকি",
                        "material_category": "Battery",
                        "hazard_type": "HIGH_HAZARD_FIRE",
                        "danger_description": "লিথিয়াম ব্যাটারিতে চাপ দিলে বা খোঁচা দিলে হঠাৎ বিস্ফোরণ ঘটে এবং মারাত্মক বিষাক্ত গ্যাস বের হয়।",
                        "safe_practice_description": "টার্মিনালে টেপ লাগান। শুকনো বালির পাত্রে আলাদা রাখুন। কখনোই ভাঙবেন না।",
                        "pictorial_icon": "battery-charging",
                        "dos": json.dumps(["টার্মিনালে টেপ লাগান", "শুকনো বালির পাত্রে রাখুন", "গ্লাভস পরুন", "অনুমোদিত রিসাইক্লারকে দিন"]),
                        "donts": json.dumps(["হাতুড়ি দিয়ে ভাঙবেন না", "আগুনের কাছে রাখবেন না", "ফোলা ব্যাটারি সাধারণ ভাঙারির সাথে মেশাবেন না"])
                    },
                    {
                        "language": "bn",
                        "title": "সার্কিট বোর্ড (PCB): মারাত্মক অ্যাসিড ব্যবহারের বিপদ",
                        "material_category": "PCB",
                        "hazard_type": "CHEMICAL_CORROSION",
                        "danger_description": "সোনা বের করার জন্য অ্যাসিড ব্যবহার করলে নির্গত বিষাক্ত ধোঁয়া ফুসফুস নষ্ট করে দেয়।",
                        "safe_practice_description": "বোর্ড শুকনো এবং অক্ষত রাখুন। অনুমোদিত রিসাইক্লারকে বিক্রি করে ন্যায্য মূল্য পান।",
                        "pictorial_icon": "flask",
                        "dos": json.dumps(["বোর্ড শুকনো রাখুন", "হাতে শক্ত গ্লাভস পরুন", "সরাসরি অনুমোদিত রিসাইক্লারকে দিন"]),
                        "donts": json.dumps(["অ্যাসিডে ভেজাবেন না", "আগুনে গরম করবেন না", "অ্যাসিড ড্রেনে ফেলবেন না"])
                    }
                ]

            for g in guides:
                cur.execute("""
                    INSERT INTO safety_guides (
                        title, description, danger_description, safe_practice_description,
                        language, category, material_category, hazard_type,
                        pictorial_icon, dos, donts, is_active, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
                """, (
                    g["title"], g["title"], g["danger_description"], g["safe_practice_description"],
                    g["language"], "E-Waste", g["material_category"], g["hazard_type"],
                    g["pictorial_icon"], g["dos"], g["donts"]
                ))

    conn.commit()
    conn.close()
    print(f"[Phase 10 Migration] Schema migration completed successfully for {db_path}.")

if __name__ == "__main__":
    migrate_database_phase10("recyclink.db")
