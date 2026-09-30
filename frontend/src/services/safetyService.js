import apiClient from './apiClient';
import offlineDb from './offlineDb';

const FALLBACK_GUIDES = {
  en: [
    {
      id: 1,
      title: "Lithium Battery: Thermal Runaway & Explosion Hazard",
      material_category: "Battery",
      hazard_type: "HIGH_HAZARD_FIRE",
      danger_description: "Lithium-ion cells release flammable gases and explode under physical pressure, puncture, or short-circuit. Chemical fires emit toxic hydrofluoric acid fumes.",
      safe_practice_description: "Keep batteries isolated in dry sand bins. Insulate terminals with non-conductive electrical tape immediately.",
      pictorial_icon: "battery-charging",
      dos: ["Cover positive and negative terminals with insulating tape", "Store in a non-conductive, fire-resistant sand bucket", "Wear protective nitrile gloves", "Hand over intact to authorized recyclers immediately"],
      donts: ["DO NOT puncture, hammer, or crush battery casings", "DO NOT expose to direct sunlight, open flames, or water", "DO NOT mix swollen or leaking batteries with standard scrap"]
    },
    {
      id: 2,
      title: "CRT Screens: Vacuum Implosion & Toxic Lead Poisoning",
      material_category: "CRT",
      hazard_type: "HIGH_HAZARD_LEAD",
      danger_description: "Cathode Ray Tubes hold a vacuum under high tension and contain 1.5–3 kg of toxic lead. Smashing the neck causes an explosive implosion spraying razor-sharp glass and toxic phosphors.",
      safe_practice_description: "Handle monitors by the chassis frame only. Keep the glass envelope completely intact without breaking the rear neck.",
      pictorial_icon: "tv",
      dos: ["Carry by external chassis or plastic casing", "Store upright on cushioned rubber/wood pallet", "Wear eye goggles and heavy leather work gloves", "Deliver intact to specialized CRT recycler"],
      donts: ["DO NOT hammer or break the glass funnel or neck", "DO NOT break CRT tubes in open residential neighborhoods", "DO NOT allow children near broken phosphor-coated glass"]
    },
    {
      id: 3,
      title: "Printed Circuit Boards (PCB): Acid Leaching Hazards",
      material_category: "PCB",
      hazard_type: "CHEMICAL_CORROSION",
      danger_description: "Attempting to recover gold using nitric acid or open heating produces lethal nitrogen dioxide fumes that permanently damage human lungs and pollute groundwater.",
      safe_practice_description: "Keep circuit boards completely intact and dry. Deliver to authorized formal recyclers equipped with automated hydrometallurgical facilities.",
      pictorial_icon: "flask",
      dos: ["Keep boards dry in sheltered storage", "Wear protective gloves during sorting", "Sell intact to authorized formal recyclers for fair market value"],
      donts: ["DO NOT use aqua regia or nitric acid baths in informal yards", "DO NOT heat boards over open stoves or charcoal embers", "DO NOT dump acid waste into open drains or municipal sewers"]
    }
  ],
  hi: [
    {
      id: 1,
      title: "लिथियम बैटरी: भयानक आग और विस्फोट का खतरा",
      material_category: "Battery",
      hazard_type: "HIGH_HAZARD_FIRE",
      danger_description: "लिथियम बैटरी को ठोकने, दबाने या छेड़ने से अचानक भीषण आग और विस्फोट होता है जिससे जानलेवा जहरीली गैस निकलती है।",
      safe_practice_description: "बैटरी के सिरों पर प्लास्टिक टेप लगाएं। सूखी रेत या सुरक्षित डिब्बे में अलग रखें। कभी भी न तोड़ें।",
      pictorial_icon: "battery-charging",
      dos: ["बैटरी के दोनों सिरों पर तुरंत प्लास्टिक टेप चिपकाएं", "सूखी रेत या प्लास्टिक की बाल्टी में सुरक्षित रखें", "सुरक्षा दस्ताने पहनकर ही छुएं", "प्रमाणित रीसाइक्लिंग केंद्र को साबुत सौंपें"],
      donts: ["बैटरी पर कभी भी हथौड़ा न मारें या धारदार चीज से न काटें", "आग, तेज धूप या पानी के पास कभी न रखें", "फूली हुई या रिसती बैटरी को अन्य कबाड़ में न मिलाएं"]
    },
    {
      id: 2,
      title: "सीआरटी स्क्रीन: वैक्यूम विस्फोट और जहरीले लेड का खतरा",
      material_category: "CRT",
      hazard_type: "HIGH_HAZARD_LEAD",
      danger_description: "पुराने टीवी और मॉनिटर के ट्यूब में खिंचाव (वैक्यूम) और 2 से 3 किलो जहरीला सीसा (Lead) होता है। इसे फोड़ने पर शीशे के टुकड़े गोली की तरह छिटकते हैं।",
      safe_practice_description: "स्क्रीन को पीछे की गर्दन से कभी न तोड़ें। बाहरी फ्रेम पकड़कर ही उठाएं।",
      pictorial_icon: "tv",
      dos: ["केवल बाहरी प्लास्टिक फ्रेम को पकड़कर ही उठाएं", "समतल और सुरक्षित जगह पर सीधा खड़ा रखें", "मोटे चमड़े के दस्ताने और चश्मा पहनें", "साबुत टीवी अधिकृत रीसायकलर को दें"],
      donts: ["पीछे की कांच की गर्दन पर कभी भी हथौड़ा न मारें", "रिहायशी बस्ती या बच्चों के सामने कांच न तोड़ें", "सफेद जहरीले पाउडर को खुले हाथों से न छुएं"]
    },
    {
      id: 3,
      title: "सर्किट बोर्ड (PCB): तेजाब और विषैले धुएं का जानलेवा खतरा",
      material_category: "PCB",
      hazard_type: "CHEMICAL_CORROSION",
      danger_description: "सोना निकालने के लिए तेजाब (एसिड) डालने से निकलने वाला पीला धुआं फेफड़ों को गला देता है और जीवन भर के लिए सांस की बीमारी हो जाती है।",
      safe_practice_description: "बोर्ड को सूखा और साबुत रखें। सरकारी रीसायकलर आधुनिक मशीनों से सोना निकालकर पूरा दाम देते हैं।",
      pictorial_icon: "flask",
      dos: ["सर्किट बोर्ड को सूखी जगह पर सुरक्षित रखें", "सॉर्टिंग करते समय हाथ में दस्ताने पहनें", "साबुत बोर्ड सीधे अधिकृत रीसायकलर को बेचें"],
      donts: ["सोना निकालने के लिए कभी भी तेजाब या एसिड का उपयोग न करें", "चूल्हे या अंगीठी पर बोर्ड को कभी न जलाएं", "एसिड का कचरा नाली या जमीन में कभी न बहाएं"]
    }
  ],
  mr: [
    {
      id: 1,
      title: "लिथियम बॅटरी: अचानक आग आणि स्फोटाचा अतिधोका",
      material_category: "Battery",
      hazard_type: "HIGH_HAZARD_FIRE",
      danger_description: "लिथियम बॅटरीवर दाब आल्यास किंवा कापल्यास अचानक स्फोट होऊन विषारी वायू आणि भीषण आग लागते, जी साध्या पाण्याने विझत नाही.",
      safe_practice_description: "बॅटरीच्या दोन्ही टोकांवर इन्सुलेशन टेप लावा. कोरड्या वाळूच्या भांड्यात स्वतंत्र ठेवा. हातोडा कधीही मारू नका.",
      pictorial_icon: "battery-charging",
      dos: ["बॅटरीच्या टोकांवर लगेच प्लास्टिक टेप लावा", "कोरड्या वाळूच्या किंवा प्लास्टिक डब्यात स्वतंत्र ठेवा", "जाड हातमोजे आणि संरक्षणात्मक गॉगल वापरा", "अधिकृत ई-कचरा पुनर्चक्रण केंद्राला साबूत द्या"],
      donts: ["बॅटरीवर हातोडा मारू नका किंवा कापू नका", "उघड्या उन्हात, पाण्यात किंवा आगीजवळ ठेवू नका", "फुगलेल्या बॅटरी इतर भंगारामध्ये मिसळू नका"]
    },
    {
      id: 2,
      title: "सीआरटी स्क्रीन: व्हॅक्यूम स्फोट आणि विषारी शिसे (Lead)",
      material_category: "CRT",
      hazard_type: "HIGH_HAZARD_LEAD",
      danger_description: "जुन्या टीव्हीच्या काचेच्या नळीमध्ये प्रचंड व्हॅक्यूम ताण आणि २ ते ३ किलो घातक शिसे असते. गळा फोडल्यास काच उडून गंभीर इजा होते.",
      safe_practice_description: "टीव्हीच्या काचेवर आघात करू नका. सुरक्षितपणे उचलून थेट अधिकृत पुनर्चक्रण केंद्राला द्या.",
      pictorial_icon: "tv",
      dos: ["टीव्ही बाहेरील प्लास्टिक बॉडीवरूनच उचला", "रबरी मॅटवर किंवा सुरक्षित जागी उभा ठेवा", "मजबूत हातमोजे आणि चष्मा वापरा", "साबूत टीव्ही अधिकृत केंद्राकडे सोपवा"],
      donts: ["काचेच्या मागच्या नळीवर हातोडा मारू नका", "वस्तीमध्ये किंवा रस्त्यावर काच फोडू नका", "विषारी पावडरला उघड्या हाताने स्पर्श करू नका"]
    },
    {
      id: 3,
      title: "सर्किट बोर्ड (PCB): ॲसिडचे घातक व प्राणघातक धोके",
      material_category: "PCB",
      hazard_type: "CHEMICAL_CORROSION",
      danger_description: "सोने काढण्यासाठी उघड्यावर ॲसिड वापरल्यास निघणारा पिवळा धूर फुफ्फुसांना जाळून टाकतो आणि कायमचे अपंगत्व किंवा मृत्यू येऊ शकतो.",
      safe_practice_description: "बोर्ड कोरडे आणि अखंड ठेवा. औपचारिक रिसायकलर आधुनिक पद्धतीने प्रक्रिया करून चांगला मोबदला देतात.",
      pictorial_icon: "flask",
      dos: ["सर्किट बोर्ड कोरड्या जागेवर सुरक्षित ठेवा", "सॉर्टिंग करताना हातामध्ये जाड हातमोजे वापरा", "अखंड बोर्ड थेट अधिकृत रिसायकलरला विका"],
      donts: ["सोने काढण्यासाठी कधीही तेजाब किंवा ॲसिड वापरू नका", "स्टोव्ह किंवा शेगडीवर बोर्ड गरम करू नका", "ॲसिडचे पाणी सांडपाण्यात किंवा जमिनीत टाकू नका"]
    }
  ]
};

export const safetyService = {
  getSafetyGuides: async (lang = 'en') => {
    const cacheKey = `safety_guides_${lang}`;
    try {
      const res = await apiClient.get('/safety-guides', {
        params: { lang },
      });
      const data = res.data || [];
      if (data.length > 0) {
        await offlineDb.setCache(cacheKey, data);
        return data;
      }
    } catch (err) {
      console.warn('[SafetyService] Online fetch failed, trying offline cache:', err.message);
    }

    // Try IndexedDB Cache
    const cached = await offlineDb.getCache(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Built-in hard fallback ensuring 100% offline availability
    return FALLBACK_GUIDES[lang] || FALLBACK_GUIDES['en'];
  },

  getGuideByMaterial: async (material, lang = 'en') => {
    try {
      const res = await apiClient.get(`/safety-guides/material/${material}`, {
        params: { lang }
      });
      return res.data;
    } catch (err) {
      const guides = await safetyService.getSafetyGuides(lang);
      return guides.find(g => (g.material_category || '').toLowerCase().includes(material.toLowerCase())) || guides[0];
    }
  },

  acknowledgeSafety: async (data) => {
    try {
      const res = await apiClient.post('/safety-guides/acknowledge', data);
      return res.data;
    } catch {
      return { status: 'ACKNOWLEDGED_OFFLINE', ...data };
    }
  }
};

export default safetyService;
