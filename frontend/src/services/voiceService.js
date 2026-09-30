/**
 * RECYCLINK — National Vernacular Voice Assistant Service
 * Provides Speech Synthesis (Text-to-Speech) & Controlled-Vocabulary Speech Recognition
 * Optimized for 8 Indian Languages:
 * English (en-IN), Hindi (hi-IN), Telugu (te-IN), Tamil (ta-IN),
 * Kannada (kn-IN), Malayalam (ml-IN), Marathi (mr-IN), Bengali (bn-IN).
 * Designed for informal e-waste collectors with low digital literacy.
 */

// Safe language code mapping
const LOCALE_VOICE_MAP = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  en: 'en-IN'
};

// Controlled Vocabulary mapping for safe voice commands across all 8 languages
const COMMAND_ACTIONS = {
  // Navigation: Identify
  'identify': { action: 'NAVIGATE', path: '/collector/identify' },
  'scan': { action: 'NAVIGATE', path: '/collector/identify' },
  'photo': { action: 'NAVIGATE', path: '/collector/identify' },
  'camera': { action: 'NAVIGATE', path: '/collector/identify' },
  'पहचान': { action: 'NAVIGATE', path: '/collector/identify' },
  'पहचानें': { action: 'NAVIGATE', path: '/collector/identify' },
  'ओळखा': { action: 'NAVIGATE', path: '/collector/identify' },
  'గుర్తించు': { action: 'NAVIGATE', path: '/collector/identify' },
  'గుర్తించండి': { action: 'NAVIGATE', path: '/collector/identify' },
  'அடையாளம்': { action: 'NAVIGATE', path: '/collector/identify' },
  'ಗುರುತಿಸಿ': { action: 'NAVIGATE', path: '/collector/identify' },
  'തിരിച്ചറിയുക': { action: 'NAVIGATE', path: '/collector/identify' },
  'শনাক্ত': { action: 'NAVIGATE', path: '/collector/identify' },

  // Navigation: My Lots
  'lots': { action: 'NAVIGATE', path: '/collector/lots' },
  'my lots': { action: 'NAVIGATE', path: '/collector/lots' },
  'लॉट': { action: 'NAVIGATE', path: '/collector/lots' },
  'मेरे लॉट': { action: 'NAVIGATE', path: '/collector/lots' },
  'माझे लॉट': { action: 'NAVIGATE', path: '/collector/lots' },
  'లాట్లు': { action: 'NAVIGATE', path: '/collector/lots' },
  'லாட்கள்': { action: 'NAVIGATE', path: '/collector/lots' },
  'ಲಾಟ್‌ಗಳು': { action: 'NAVIGATE', path: '/collector/lots' },
  'ലോട്ടുകൾ': { action: 'NAVIGATE', path: '/collector/lots' },
  'আমার লট': { action: 'NAVIGATE', path: '/collector/lots' },

  // Navigation: Earnings
  'earnings': { action: 'NAVIGATE', path: '/collector/earnings' },
  'my earnings': { action: 'NAVIGATE', path: '/collector/earnings' },
  'कमाई': { action: 'NAVIGATE', path: '/collector/earnings' },
  'मेरी कमाई': { action: 'NAVIGATE', path: '/collector/earnings' },
  'माझी कमाई': { action: 'NAVIGATE', path: '/collector/earnings' },
  'సంపాదన': { action: 'NAVIGATE', path: '/collector/earnings' },
  'வருமானம்': { action: 'NAVIGATE', path: '/collector/earnings' },
  'ಗಳಿಕೆ': { action: 'NAVIGATE', path: '/collector/earnings' },
  'വരുമാനം': { action: 'NAVIGATE', path: '/collector/earnings' },
  'উপার্জন': { action: 'NAVIGATE', path: '/collector/earnings' },
  'पैसे': { action: 'NAVIGATE', path: '/collector/earnings' },

  // Navigation: Safety
  'safety': { action: 'NAVIGATE', path: '/collector/safety' },
  'सुरक्षा': { action: 'NAVIGATE', path: '/collector/safety' },
  'భద్రత': { action: 'NAVIGATE', path: '/collector/safety' },
  'பாதுகாப்பு': { action: 'NAVIGATE', path: '/collector/safety' },
  'ಸುರಕ್ಷತೆ': { action: 'NAVIGATE', path: '/collector/safety' },
  'സുരക്ഷ': { action: 'NAVIGATE', path: '/collector/safety' },

  // Navigation: Recyclers
  'recycler': { action: 'NAVIGATE', path: '/collector/recyclers' },
  'రీసైక్లర్': { action: 'NAVIGATE', path: '/collector/recyclers' },
  'மறுசுழற்சியாளர்': { action: 'NAVIGATE', path: '/collector/recyclers' },
  'ಮರುಬಳಕೆದಾರ': { action: 'NAVIGATE', path: '/collector/recyclers' },

  // Navigation: Home / Dashboard
  'dashboard': { action: 'NAVIGATE', path: '/collector/dashboard' },
  'home': { action: 'NAVIGATE', path: '/collector/dashboard' },
  'డ్యాష్‌బోర్డ్': { action: 'NAVIGATE', path: '/collector/dashboard' },
  'டாஷ்போர்டு': { action: 'NAVIGATE', path: '/collector/dashboard' },

  // Language Switch
  'telugu': { action: 'CHANGE_LANG', lang: 'te' },
  'తెలుగు': { action: 'CHANGE_LANG', lang: 'te' },
  'tamil': { action: 'CHANGE_LANG', lang: 'ta' },
  'தமிழ்': { action: 'CHANGE_LANG', lang: 'ta' },
  'kannada': { action: 'CHANGE_LANG', lang: 'kn' },
  'ಕನ್ನಡ': { action: 'CHANGE_LANG', lang: 'kn' },
  'malayalam': { action: 'CHANGE_LANG', lang: 'ml' },
  'മലയാളം': { action: 'CHANGE_LANG', lang: 'ml' },
  'bengali': { action: 'CHANGE_LANG', lang: 'bn' },
  'বাংলা': { action: 'CHANGE_LANG', lang: 'bn' },
  'hindi': { action: 'CHANGE_LANG', lang: 'hi' },
  'हिन्दी': { action: 'CHANGE_LANG', lang: 'hi' },
  'marathi': { action: 'CHANGE_LANG', lang: 'mr' },
  'मराठी': { action: 'CHANGE_LANG', lang: 'mr' },
  'english': { action: 'CHANGE_LANG', lang: 'en' },

  // Material selection commands
  'pcb': { action: 'SELECT_MATERIAL', material: 'PCB' },
  'battery': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'बैटरी': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'బ్యాటరీ': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'பேட்டரி': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'ಬ್ಯಾಟರಿ': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'ബാറ്ററി': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'cable': { action: 'SELECT_MATERIAL', material: 'Cable' },
  'কেবল': { action: 'SELECT_MATERIAL', material: 'Cable' },
  'crt': { action: 'SELECT_MATERIAL', material: 'CRT' },
  'lcd': { action: 'SELECT_MATERIAL', material: 'LCD' },
  'motor': { action: 'SELECT_MATERIAL', material: 'Motor' }
};

export const voiceService = {
  isSpeechSynthesisSupported: () => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  isSpeechRecognitionSupported: () => {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  },

  speak: (text, langCode = 'en') => {
    if (!voiceService.isSpeechSynthesisSupported()) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLocale = LOCALE_VOICE_MAP[langCode] || 'en-IN';
      utterance.lang = targetLocale;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices?.() || [];
      const matchingVoice = voices.find(v => v.lang === targetLocale || v.lang.startsWith(langCode));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice playback failed gracefully:', err);
    }
  },

  stopSpeaking: () => {
    if (voiceService.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  startListening: ({ langCode = 'en', onResult, onError, onEnd }) => {
    if (!voiceService.isSpeechRecognitionSupported()) {
      if (onError) onError('Voice input is not supported on this device.');
      return null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = LOCALE_VOICE_MAP[langCode] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event) => {
        if (!event.results || event.results.length === 0) return;

        const transcript = event.results[0][0].transcript.trim().toLowerCase();

        let matchedCommand = null;
        for (const [key, cmd] of Object.entries(COMMAND_ACTIONS)) {
          if (transcript.includes(key)) {
            matchedCommand = { key, transcript, ...cmd };
            break;
          }
        }

        if (onResult) {
          onResult({
            rawText: transcript,
            matchedCommand: matchedCommand || null
          });
        }
      };

      recognition.onerror = (event) => {
        let msg = 'Voice recognition error.';
        if (event.error === 'not-allowed') {
          msg = 'Microphone permission denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech detected. Please speak closer to microphone.';
        }
        if (onError) onError(msg);
      };

      recognition.onend = () => {
        if (onEnd) onEnd();
      };

      recognition.start();
      return recognition;
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      if (onError) onError(err.message);
      return null;
    }
  },

  speakMaterialResult: ({ material, weight, hazard, lang = 'en' }) => {
    let message = '';
    switch (lang) {
      case 'te':
        message = `ఇది ${material}. అంచనా బరువు ${weight} కిలోలు.`;
        if (hazard === 'HIGH') message += ' హెచ్చరిక! ఇది అధిక ప్రమాదకరమైన వ్యర్థం. భద్రతా మార్గదర్శిని చూడండి.';
        break;
      case 'ta':
        message = `இது ${material}. மதிப்பிடப்பட்ட எடை ${weight} கிலோ.`;
        if (hazard === 'HIGH') message += ' எச்சரிக்கை! இது அதிக ஆபத்தான கழிவு. பாதுகாப்பு வழிகாட்டியைப் பார்க்கவும்.';
        break;
      case 'kn':
        message = `ಇದು ${material}. ಅಂದಾಜು ತೂಕ ${weight} ಕಿಲೋಗ್ರಾಂಗಳು.`;
        if (hazard === 'HIGH') message += ' ಎಚ್ಚರಿಕೆ! ಇದು ಹೆಚ್ಚಿನ ಅಪಾಯದ ತ್ಯಾಜ್ಯ. ಸುರಕ್ಷತಾ ಮಾರ್ಗದರ್ಶಿಯನ್ನು ನೋಡಿ.';
        break;
      case 'ml':
        message = `ഇത് ${material} ആണ്. കണക്കാക്കിയ ഭാരം ${weight} കിലോഗ്രാം.`;
        if (hazard === 'HIGH') message += ' മുന്നറിയിപ്പ്! ഇത് ഉയർന്ന അപകടസാധ്യതയുള്ള വസ്തുവാണ്.';
        break;
      case 'bn':
        message = `এটি ${material}। আনুমানিক ওজন ${weight} কেজি।`;
        if (hazard === 'HIGH') message += ' সতর্কতা! এটি উচ্চ ঝুঁকিপূর্ণ ই-বর্জ্য।';
        break;
      case 'hi':
        message = `यह ${material} है। अनुमानित वजन ${weight} किलो है।`;
        if (hazard === 'HIGH') message += ' सावधान! यह उच्च जोखिम वाला कचरा है। सुरक्षा निर्देश देखें।';
        break;
      case 'mr':
        message = `हा ${material} आहे. अंदाजे वजन ${weight} किलो आहे.`;
        if (hazard === 'HIGH') message += ' सावध राहा! हा अतिधोकादायक कचरा आहे. सुरक्षा सूचना पहा.';
        break;
      default:
        message = `This looks like ${material}. Estimated weight is ${weight} kilograms.`;
        if (hazard === 'HIGH') message += ' Warning! High hazard material detected. Review safety guide.';
        break;
    }

    voiceService.speak(message, lang);
  },

  speakSafetyAlert: ({ material, lang = 'en' }) => {
    let message = '';
    switch (lang) {
      case 'te':
        message = `${material} కోసం భద్రతా సూచనలను సమీక్షించండి. దీన్ని కాల్చవద్దు లేదా పగలగొట్టవద్దు.`;
        break;
      case 'ta':
        message = `${material} க்கான பாதுகாப்பு வழிகாட்டுதலைப் பார்க்கவும். இதை எரிக்கவோ உடைக்கவோ வேண்டாம்.`;
        break;
      case 'kn':
        message = `${material} ಗಾಗಿ ಸುರಕ್ಷತಾ ಮಾರ್ಗದರ್ಶನ ಪರಿಶೀಲಿಸಿ. ಇದನ್ನು ಸುಡಬೇಡಿ ಅಥವಾ ಒಡೆಯಬೇಡಿ.`;
        break;
      case 'ml':
        message = `${material} സുരക്ഷാ നിർദ്ദേശങ്ങൾ പരിശോധിക്കുക. കത്തിക്കരുത്.`;
        break;
      case 'bn':
        message = `${material} এর জন্য সুরক্ষা নির্দেশিকা পর্যালোচনা করুন। এটিকে পোড়াবেন না।`;
        break;
      case 'hi':
        message = `${material} के लिए सुरक्षा निर्देश देखें। इसे कभी भी जलाएं या हथौड़े से न तोड़ें।`;
        break;
      case 'mr':
        message = `${material} साठी सुरक्षा सूचना पहा. यावर हातोडा मारू नका किंवा जाळू नका.`;
        break;
      default:
        message = `Review safety guidance for ${material}. Do not burn or crush.`;
        break;
    }

    voiceService.speak(message, lang);
  }
};

export default voiceService;
