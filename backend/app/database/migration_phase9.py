import sqlite3
import os
import json

def migrate_database_phase9(db_path: str = "recyclink.db"):
    if not os.path.exists(db_path):
        print(f"[Phase 9 Migration] Database {db_path} not found. Skipping.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print(f"[Phase 9 Migration] Checking schema for {db_path}...")

    # 1. Update e_waste_lots table with client_action_id
    lot_cols = [r[1] for r in cur.execute("PRAGMA table_info(e_waste_lots)").fetchall()]
    if "client_action_id" not in lot_cols:
        print("  Adding column client_action_id to e_waste_lots")
        cur.execute("ALTER TABLE e_waste_lots ADD COLUMN client_action_id TEXT")
        cur.execute("CREATE INDEX IF NOT EXISTS ix_e_waste_lots_client_action_id ON e_waste_lots(client_action_id)")

    # 2. Seed multilingual safety guidelines (English, Hindi, Marathi)
    # Check current count of guides by language
    en_count = cur.execute("SELECT count(*) FROM safety_guides WHERE language = 'en'").fetchone()[0]
    hi_count = cur.execute("SELECT count(*) FROM safety_guides WHERE language = 'hi'").fetchone()[0]
    mr_count = cur.execute("SELECT count(*) FROM safety_guides WHERE language = 'mr'").fetchone()[0]

    multilingual_guides = [
        # BATTERY (High Hazard)
        {
            "language": "en",
            "title": "Lithium Battery: Thermal Runaway & Explosion Hazard",
            "material_category": "Battery",
            "hazard_type": "HIGH_HAZARD_FIRE",
            "danger_description": "Lithium-ion cells release flammable gases and explode under physical pressure, puncture, or short-circuit. Chemical fires emit toxic hydrofluoric acid fumes.",
            "safe_practice_description": "Keep batteries isolated in dry sand bins. Insulate terminals with non-conductive electrical tape immediately.",
            "pictorial_icon": "battery-charging",
            "dos": json.dumps([
                "Cover positive and negative terminals with insulating tape",
                "Store in a non-conductive, fire-resistant sand bucket",
                "Wear protective nitrile gloves and safety eye goggles",
                "Hand over intact to authorized recyclers immediately"
            ]),
            "donts": json.dumps([
                "DO NOT puncture, hammer, or crush battery casings",
                "DO NOT expose to direct sunlight, open flames, or water",
                "DO NOT mix swollen or leaking batteries with standard scrap"
            ])
        },
        {
            "language": "hi",
            "title": "लिथियम बैटरी: भयानक आग और विस्फोट का खतरा",
            "material_category": "Battery",
            "hazard_type": "HIGH_HAZARD_FIRE",
            "danger_description": "लिथियम बैटरी को ठोकने, दबाने या छेड़ने से अचानक भीषण आग और विस्फोट होता है जिससे जानलेवा जहरीली गैस निकलती है जिसे पानी से नहीं बुझाया जा सकता।",
            "safe_practice_description": "बैटरी के सिरों (टर्मिनलों) पर प्लास्टिक टेप लगाएं। सूखी रेत या सुरक्षित डिब्बे में अलग रखें। कभी भी न तोड़ें।",
            "pictorial_icon": "battery-charging",
            "dos": json.dumps([
                "बैटरी के दोनों सिरों पर तुरंत प्लास्टिक बिजली टेप चिपकाएं",
                "सूखी रेत या प्लास्टिक की बाल्टी में सुरक्षित रखें",
                "सुरक्षा दस्ताने और चश्मा पहनकर ही छुएं",
                "प्रमाणित रीसाइक्लिंग केंद्र को साबुत सौंपें"
            ]),
            "donts": json.dumps([
                "बैटरी पर कभी भी हथौड़ा न मारें या धारदार चीज से न काटें",
                "आग, तेज धूप या पानी के पास कभी न रखें",
                "फूली हुई या रिसती बैटरी को अन्य कबाड़ में न मिलाएं"
            ])
        },
        {
            "language": "mr",
            "title": "लिथियम बॅटरी: अचानक आग आणि स्फोटाचा अतिधोका",
            "material_category": "Battery",
            "hazard_type": "HIGH_HAZARD_FIRE",
            "danger_description": "लिथियम बॅटरीवर दाब आल्यास किंवा कापल्यास अचानक स्फोट होऊन विषारी वायू आणि भीषण आग लागते, जी साध्या पाण्याने विझत नाही.",
            "safe_practice_description": "बॅटरीच्या दोन्ही टोकांवर इन्सुलेशन टेप लावा. कोरड्या वाळूच्या भांड्यात स्वतंत्र ठेवा. हातोडा कधीही मारू नका.",
            "pictorial_icon": "battery-charging",
            "dos": json.dumps([
                "बॅटरीच्या टोकांवर लगेच प्लास्टिक टेप लावा",
                "कोरड्या वाळूच्या किंवा प्लास्टिक डब्यात स्वतंत्र ठेवा",
                "जाड हातमोजे आणि संरक्षणात्मक गॉगल वापरा",
                "अधिकृत ई-कचरा पुनर्चक्रण केंद्राला साबूत द्या"
            ]),
            "donts": json.dumps([
                "बॅटरीवर हातोडा मारू नका किंवा कापू नका",
                "उघड्या उन्हात, पाण्यात किंवा आगीजवळ ठेवू नका",
                "फुगलेल्या बॅटरी इतर भंगारामध्ये मिसळू नका"
            ])
        },

        # CRT MONITORS & TVS (High Hazard)
        {
            "language": "en",
            "title": "CRT Screens: Vacuum Implosion & Toxic Lead Poisoning",
            "material_category": "CRT",
            "hazard_type": "HIGH_HAZARD_LEAD",
            "danger_description": "Cathode Ray Tubes hold a vacuum under high tension and contain 1.5–3 kg of toxic lead. Smashing the neck causes an explosive implosion spraying razor-sharp glass and toxic phosphors.",
            "safe_practice_description": "Handle monitors by the chassis frame only. Keep the glass envelope completely intact without breaking the rear neck.",
            "pictorial_icon": "tv",
            "dos": json.dumps([
                "Lift and carry using the outer plastic or metal casing",
                "Keep covered in dry storage on flat ground",
                "Wear impact-grade protective goggles and leather gloves",
                "Transfer intact for automated mechanical dismantling"
            ]),
            "donts": json.dumps([
                "DO NOT smash CRT neck or funnel glass to extract copper coils",
                "DO NOT discard broken glass shards in open landfills or drains",
                "DO NOT inhale white phosphor powder from inside broken tubes"
            ])
        },
        {
            "language": "hi",
            "title": "सीआरटी स्क्रीन: वैक्यूम विस्फोट और जहरीला सीसा (Lead)",
            "material_category": "CRT",
            "hazard_type": "HIGH_HAZARD_LEAD",
            "danger_description": "पुराने टीवी और कंप्यूटर स्क्रीन में भारी वैक्यूम होता है और 2 से 3 किलो जहरीला सीसा भरा होता है। कांच फोड़ने पर भयानक विस्फोट होता है और जहरीली धूल फेफड़ों में भर जाती है।",
            "safe_practice_description": "स्क्रीन को हमेशा बाहर के प्लास्टिक ढांचे से ही पकड़ें। तांबे के लिए कांच को कभी भी न फोड़ें।",
            "pictorial_icon": "tv",
            "dos": json.dumps([
                "टीवी या मॉनिटर को बाहर की बॉडी से ही उठाएं",
                "कांच फूटने से बचाने के लिए सुरक्षित व समतल जगह रखें",
                "आंखों पर सुरक्षा चश्मा और हाथों में दस्ताने पहनें",
                "बिना तोड़े प्रमाणित रीसाइक्लर को सौंपें"
            ]),
            "donts": json.dumps([
                "तांबे की तार निकालने के लिए स्क्रीन की गर्दन या कांच न फोड़ें",
                "टूटे कांच को खुली नाली या जमीन पर न फेंके",
                "अंदर के सफेद लेप या पाउडर को सूंघने से बचें"
            ])
        },
        {
            "language": "mr",
            "title": "सीआरटी स्क्रीन: व्हॅक्यूम स्फोट आणि विषारी शिसे (Lead)",
            "material_category": "CRT",
            "hazard_type": "HIGH_HAZARD_LEAD",
            "danger_description": "जुन्या टीव्हीच्या काचेच्या नळीत प्रचंड व्हॅक्यूम असतो आणि 2 ते 3 किलो विषारी शिसे असते. नळी फोडल्यास तीव्र स्फोट होऊन धारदार काच उडते व विषारी धूळ पसरते.",
            "safe_practice_description": "स्क्रीन नेहमी बाहेरील कव्हरनेच उचला. तांब्याची कॉइल काढण्यासाठी काच किंवा मागची मान कधीही फोडू नका.",
            "pictorial_icon": "tv",
            "dos": json.dumps([
                "टीव्हीला बाहेरील प्लास्टिक बॉडीनेच उचला",
                "काच फुटू नये म्हणून सावलीत सपाट जागेवर ठेवा",
                "सुरक्षा चष्मा आणि मजबूत हातमोजे वापरा",
                "अखंड स्थितीत अधिकृत रिसायकलरला द्या"
            ]),
            "donts": json.dumps([
                "तांब्यासाठी मागची मान किंवा काच हातोड्याने फोडू नका",
                "फुटलेली काच उघड्यावर किंवा गटारात टाकू नका",
                "आतील पांढऱ्या विषारी भुकटीला हात लावू नका"
            ])
        },

        # CABLES & WIRING
        {
            "language": "en",
            "title": "Cables & Wiring: Toxic Dioxin & Carcinogen Smoke",
            "material_category": "Cable",
            "hazard_type": "TOXIC_FUMES",
            "danger_description": "Burning PVC-coated copper wires releases cancer-causing dioxins, furans, and hydrochloric acid gas that permanently damage lungs and nervous systems.",
            "safe_practice_description": "Use mechanical stripping tools or sell insulated copper directly to certified mechanical recyclers for higher value.",
            "pictorial_icon": "flame",
            "dos": json.dumps([
                "Use simple hand wire strippers or stripping machines",
                "Keep wiring dry, bundled, and sorted by thickness",
                "Sell insulated wire directly for maximum formal market rate"
            ]),
            "donts": json.dumps([
                "DO NOT burn wires in open pits, drums, or indoor rooms",
                "DO NOT breathe burning plastic fumes",
                "DO NOT burn insulation near residential areas or food sources"
            ])
        },
        {
            "language": "hi",
            "title": "तार व केबल: जहरीला धुआं और फेफड़ों का कैंसर",
            "material_category": "Cable",
            "hazard_type": "TOXIC_FUMES",
            "danger_description": "तारों का प्लास्टिक जलाने से अत्यंत जहरीला धुआं और डायऑक्सिन गैस निकलती है, जिससे फेफड़े खराब होते हैं और कैंसर का खतरा होता है।",
            "safe_practice_description": "तार छीलने के औजार (स्ट्रिपर) का उपयोग करें या प्लास्टिक सहित तार सीधे रीसाइक्लर को बेचें।",
            "pictorial_icon": "flame",
            "dos": json.dumps([
                "तार छीलने के लिए हाथ के औजार का प्रयोग करें",
                "तारों को बंडल बनाकर सूखा रखें",
                "कवर सहित तार बेचने पर रीसाइक्लर पूरा दाम देते हैं"
            ]),
            "donts": json.dumps([
                "तारों को आग में कभी भी न जलाएं",
                "प्लास्टिक के काले धुएं के पास खड़े न हों",
                "बस्ती या बच्चों के पास तार न जलाएं"
            ])
        },
        {
            "language": "mr",
            "title": "केबल्स व तारा: विषारी धूर आणि कॅन्सरचा धोका",
            "material_category": "Cable",
            "hazard_type": "TOXIC_FUMES",
            "danger_description": "तांब्याची तार काढण्यासाठी प्लास्टिक जाळल्यास डायऑक्सिन नावाचा विषारी धूर निर्माण होतो, ज्यामुळे फुफ्फुसांचा कर्करोग आणि दमा होतो.",
            "safe_practice_description": "वायर स्ट्रिपरने वायर सोलून घ्या किंवा कव्हरसहित तार थेट अधिकृत रिसायकलरला विका.",
            "pictorial_icon": "flame",
            "dos": json.dumps([
                "तार सोलण्यासाठी हाताच्या औजाराचा वापर करा",
                "तारांचे बंडल कोरड्या जागी सुरक्षित ठेवा",
                "कव्हरसह विकल्यास योग्य व कायदेशीर भाव मिळतो"
            ]),
            "donts": json.dumps([
                "तारांना कधीही आग लावून जाळू नका",
                "जळणाऱ्या प्लास्टिकचा काळा धूर श्वासात घेऊ नका",
                "घराजवळ किंवा वस्तीत तार जाळू नका"
            ])
        },

        # PCB & MOTHERBOARDS
        {
            "language": "en",
            "title": "Printed Circuit Boards: Lethal Acid Leaching Hazards",
            "material_category": "PCB",
            "hazard_type": "CHEMICAL_CORROSION",
            "danger_description": "Dipping circuit boards in nitric or aqua regia acids creates nitrogen dioxide gas clouds that cause pulmonary edema and fatal chemical lung burns.",
            "safe_practice_description": "Dismantle components mechanically. Store dry and intact for automated hydrometallurgical smelting in formal plants.",
            "pictorial_icon": "flask",
            "dos": json.dumps([
                "Keep circuit boards clean, dry, and undamaged",
                "Wear cut-resistant gloves during manual sorting",
                "Deliver intact to high-recovery formal smelters"
            ]),
            "donts": json.dumps([
                "DO NOT use open acid baths (tezaab) to extract gold",
                "DO NOT heat circuit boards over open charcoal gas stoves",
                "DO NOT wash acidic residue into street drains or water bodies"
            ])
        },
        {
            "language": "hi",
            "title": "सर्किट बोर्ड (PCB): तेजाब (एसिड) के जानलेवा खतरे",
            "material_category": "PCB",
            "hazard_type": "CHEMICAL_CORROSION",
            "danger_description": "सोना-चांदी निकालने के लिए तेजाब (नाइट्रिक एसिड) में बोर्ड डालने से जानलेवा पीला धुआं निकलता है जो फेफड़ों को तुरंत गला देता है।",
            "safe_practice_description": "बोर्ड को सूखा और साबुत रखें। बड़े रिसाइक्लर आधुनिक मशीनों से पूरा पैसा देते हैं।",
            "pictorial_icon": "flask",
            "dos": json.dumps([
                "सर्किट बोर्ड को सूखा और सुरक्षित रखें",
                "हाथ में कट-रोधी दस्ताने पहनें",
                "साबुत बोर्ड सीधे प्रमाणित खरीदार को बेचें"
            ]),
            "donts": json.dumps([
                "सोने के लालच में तेजाब या एसिड का इस्तेमाल कभी न करें",
                "चूल्हे या कोयले पर सर्किट बोर्ड को न सेकें",
                "तेजाब का पानी नाली या जमीन में न बहाएं"
            ])
        },
        {
            "language": "mr",
            "title": "सर्किट बोर्ड (PCB): ॲसिडचे घातक व प्राणघातक धोके",
            "material_category": "PCB",
            "hazard_type": "CHEMICAL_CORROSION",
            "danger_description": "सोने काढण्यासाठी उघड्यावर ॲसिड वापरल्यास निघणारा पिवळा धूर फुफ्फुसांना जाळून टाकतो आणि कायमचे अपंगत्व किंवा मृत्यू येऊ शकतो.",
            "safe_practice_description": "बोर्ड कोरडे आणि अखंड ठेवा. औपचारिक रिसायकलर आधुनिक पद्धतीने प्रक्रिया करून चांगला मोबदला देतात.",
            "pictorial_icon": "flask",
            "dos": json.dumps([
                "सर्किट बोर्ड कोरड्या जागेवर सुरक्षित ठेवा",
                "सॉर्टिंग करताना हातामध्ये जाड हातमोजे वापरा",
                "अखंड बोर्ड थेट अधिकृत रिसायकलरला विका"
            ]),
            "donts": json.dumps([
                "सोने काढण्यासाठी कधीही तेजाब किंवा ॲसिड वापरू नका",
                "स्टोव्ह किंवा शेगडीवर बोर्ड गरम करू नका",
                "ॲसिडचे पाणी सांडपाण्यात किंवा जमिनीत टाकू नका"
            ])
        }
    ]

    for guide in multilingual_guides:
        # Check if already exists by language and material_category
        cur.execute(
            "SELECT id FROM safety_guides WHERE language = ? AND material_category = ?",
            (guide["language"], guide["material_category"])
        )
        row = cur.fetchone()
        if not row:
            print(f"  Inserting safety guide: {guide['material_category']} ({guide['language']})")
            cur.execute("""
                INSERT INTO safety_guides (
                    title, description, danger_description, safe_practice_description,
                    language, category, material_category, hazard_type,
                    pictorial_icon, dos, donts, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
            """, (
                guide["title"], guide["title"], guide["danger_description"], guide["safe_practice_description"],
                guide["language"], "E-Waste", guide["material_category"], guide["hazard_type"],
                guide["pictorial_icon"], guide["dos"], guide["donts"]
            ))
        else:
            # Update existing to ensure latest rich descriptions
            cur.execute("""
                UPDATE safety_guides SET
                    title = ?, danger_description = ?, safe_practice_description = ?,
                    hazard_type = ?, pictorial_icon = ?, dos = ?, donts = ?
                WHERE id = ?
            """, (
                guide["title"], guide["danger_description"], guide["safe_practice_description"],
                guide["hazard_type"], guide["pictorial_icon"], guide["dos"], guide["donts"],
                row[0]
            ))

    conn.commit()
    conn.close()
    print(f"[Phase 9 Migration] Schema migration and multilingual safety seeding completed successfully for {db_path}.")

if __name__ == "__main__":
    migrate_database_phase9("recyclink.db")
