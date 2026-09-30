/**
 * RECYCLINK — Vernacular Voice Assistant Service
 * Provides Speech Synthesis (Text-to-Speech) & Controlled-Vocabulary Speech Recognition
 * Optimized for Hindi (hi-IN), Marathi (mr-IN), and Indian English (en-IN).
 * Designed for informal e-waste collectors with low digital literacy.
 */

// Safe language code mapping
const LOCALE_VOICE_MAP = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN'
};

// Vocabulary mapping for safe voice commands
const COMMAND_ACTIONS = {
  // Navigation: Identify
  'identify': { action: 'NAVIGATE', path: '/collector/identify' },
  'scan': { action: 'NAVIGATE', path: '/collector/identify' },
  'photo': { action: 'NAVIGATE', path: '/collector/identify' },
  'camera': { action: 'NAVIGATE', path: '/collector/identify' },
  'पहचान': { action: 'NAVIGATE', path: '/collector/identify' },
  'पहचानें': { action: 'NAVIGATE', path: '/collector/identify' },
  'फोटो': { action: 'NAVIGATE', path: '/collector/identify' },
  'ओळखा': { action: 'NAVIGATE', path: '/collector/identify' },

  // Navigation: My Lots
  'lots': { action: 'NAVIGATE', path: '/collector/lots' },
  'my lots': { action: 'NAVIGATE', path: '/collector/lots' },
  'लॉट': { action: 'NAVIGATE', path: '/collector/lots' },
  'मेरे लॉट': { action: 'NAVIGATE', path: '/collector/lots' },
  'माझे लॉट': { action: 'NAVIGATE', path: '/collector/lots' },

  // Navigation: Earnings
  'earnings': { action: 'NAVIGATE', path: '/collector/earnings' },
  'my earnings': { action: 'NAVIGATE', path: '/collector/earnings' },
  'कमाई': { action: 'NAVIGATE', path: '/collector/earnings' },
  'मेरी कमाई': { action: 'NAVIGATE', path: '/collector/earnings' },
  'माझी कमाई': { action: 'NAVIGATE', path: '/collector/earnings' },
  'पैसे': { action: 'NAVIGATE', path: '/collector/earnings' },

  // Navigation: Safety
  'safety': { action: 'NAVIGATE', path: '/collector/safety' },
  'सुरक्षा': { action: 'NAVIGATE', path: '/collector/safety' },

  // Navigation: Recyclers
  'recycler': { action: 'NAVIGATE', path: '/collector/recyclers' },
  'रीसायकलर': { action: 'NAVIGATE', path: '/collector/recyclers' },
  'रिसायकलर': { action: 'NAVIGATE', path: '/collector/recyclers' },

  // Navigation: Home / Dashboard
  'dashboard': { action: 'NAVIGATE', path: '/collector/dashboard' },
  'home': { action: 'NAVIGATE', path: '/collector/dashboard' },
  'डैशबोर्ड': { action: 'NAVIGATE', path: '/collector/dashboard' },
  'डॅशबोर्ड': { action: 'NAVIGATE', path: '/collector/dashboard' },

  // Language Switch
  'hindi': { action: 'CHANGE_LANG', lang: 'hi' },
  'हिन्दी': { action: 'CHANGE_LANG', lang: 'hi' },
  'हिंदी': { action: 'CHANGE_LANG', lang: 'hi' },
  'marathi': { action: 'CHANGE_LANG', lang: 'mr' },
  'मराठी': { action: 'CHANGE_LANG', lang: 'mr' },
  'english': { action: 'CHANGE_LANG', lang: 'en' },
  'अंग्रेजी': { action: 'CHANGE_LANG', lang: 'en' },

  // Material selection commands
  'pcb': { action: 'SELECT_MATERIAL', material: 'PCB' },
  'circuit board': { action: 'SELECT_MATERIAL', material: 'PCB' },
  'battery': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'बैटरी': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'बॅटरी': { action: 'SELECT_MATERIAL', material: 'Battery' },
  'cable': { action: 'SELECT_MATERIAL', material: 'Cable' },
  'तार': { action: 'SELECT_MATERIAL', material: 'Cable' },
  'केबल': { action: 'SELECT_MATERIAL', material: 'Cable' },
  'crt': { action: 'SELECT_MATERIAL', material: 'CRT' },
  'tv': { action: 'SELECT_MATERIAL', material: 'CRT' },
  'lcd': { action: 'SELECT_MATERIAL', material: 'LCD' },
  'screen': { action: 'SELECT_MATERIAL', material: 'LCD' },
  'motor': { action: 'SELECT_MATERIAL', material: 'Motor' },
  'मोटर': { action: 'SELECT_MATERIAL', material: 'Motor' }
};

export const voiceService = {
  /**
   * Check if speech synthesis is available
   */
  isSpeechSynthesisSupported: () => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  /**
   * Check if speech recognition is available
   */
  isSpeechRecognitionSupported: () => {
    return typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  },

  /**
   * Speak text in vernacular Indian accent/locale with graceful fallback
   */
  speak: (text, langCode = 'hi') => {
    if (!voiceService.isSpeechSynthesisSupported()) {
      console.warn('Speech synthesis not supported on this browser/device.');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLocale = LOCALE_VOICE_MAP[langCode] || 'hi-IN';
      utterance.lang = targetLocale;
      utterance.rate = 0.92; // Slightly slower, clear cadence for low-literacy users
      utterance.pitch = 1.0;

      // Find best matching installed voice
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

  /**
   * Stop any current speech
   */
  stopSpeaking: () => {
    if (voiceService.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  /**
   * Listen for controlled voice commands
   */
  startListening: ({ langCode = 'hi', onResult, onError, onEnd }) => {
    if (!voiceService.isSpeechRecognitionSupported()) {
      if (onError) onError('Voice input is not supported on this device.');
      return null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = LOCALE_VOICE_MAP[langCode] || 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event) => {
        if (!event.results || event.results.length === 0) return;
        
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        
        // Controlled vocabulary matching
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

  /**
   * Speak localized identification result
   */
  speakMaterialResult: ({ material, weight, hazard, lang = 'hi' }) => {
    let message = '';
    if (lang === 'hi') {
      message = `यह ${material} है। अनुमानित वजन ${weight} किलो है।`;
      if (hazard === 'HIGH') {
        message += ' सावधान! यह उच्च जोखिम वाला कचरा है। सुरक्षा निर्देश देखें।';
      }
    } else if (lang === 'mr') {
      message = `हा ${material} आहे. अंदाजे वजन ${weight} किलो आहे.`;
      if (hazard === 'HIGH') {
        message += ' सावध राहा! हा अतिधोकादायक कचरा आहे. सुरक्षा सूचना पहा.';
      }
    } else {
      message = `This looks like ${material}. Estimated weight is ${weight} kilograms.`;
      if (hazard === 'HIGH') {
        message += ' Warning! High hazard material detected. Review safety guide.';
      }
    }

    voiceService.speak(message, lang);
  },

  /**
   * Speak localized safety alert
   */
  speakSafetyAlert: ({ material, lang = 'hi' }) => {
    let message = '';
    if (lang === 'hi') {
      message = `${material} के लिए सुरक्षा निर्देश देखें। इसे कभी भी जलाएं या हथौड़े से न तोड़ें।`;
    } else if (lang === 'mr') {
      message = `${material} साठी सुरक्षा सूचना पहा. यावर हातोडा मारू नका किंवा जाळू नका.`;
    } else {
      message = `Review safety guidance for ${material}. Do not burn or crush.`;
    }

    voiceService.speak(message, lang);
  }
};

export default voiceService;
