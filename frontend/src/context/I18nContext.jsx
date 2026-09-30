import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';
import te from '../locales/te.json';
import ta from '../locales/ta.json';
import kn from '../locales/kn.json';
import ml from '../locales/ml.json';
import bn from '../locales/bn.json';

const translations = { en, hi, mr, te, ta, kn, ml, bn };

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
];

function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (navLang.startsWith('te')) return 'te';
  if (navLang.startsWith('ta')) return 'ta';
  if (navLang.startsWith('kn')) return 'kn';
  if (navLang.startsWith('ml')) return 'ml';
  if (navLang.startsWith('mr')) return 'mr';
  if (navLang.startsWith('bn')) return 'bn';
  if (navLang.startsWith('hi')) return 'hi';
  return 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return (
      localStorage.getItem('preferred_language') ||
      localStorage.getItem('recyclink_locale') ||
      detectBrowserLanguage()
    );
  });

  const [accessibilityMode, setAccessibilityMode] = useState(() => {
    return localStorage.getItem('recyclink_ui_mode') || 'standard'; // 'standard' | 'simple'
  });

  const changeLanguage = (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('preferred_language', newLocale);
      localStorage.setItem('recyclink_locale', newLocale);
    }
  };

  const toggleAccessibilityMode = () => {
    const nextMode = accessibilityMode === 'simple' ? 'standard' : 'simple';
    setAccessibilityMode(nextMode);
    localStorage.setItem('recyclink_ui_mode', nextMode);
  };

  const t = (key, defaultOrParams = "") => {
    let text = translations[locale]?.[key] || translations['en']?.[key];
    if (!text) {
      if (typeof defaultOrParams === 'string' && defaultOrParams) {
        text = defaultOrParams;
      } else {
        // Never show raw translation keys like "dashboard.identify"
        const lastPart = key.split('.').pop() || key;
        text = lastPart.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // Support param interpolation if second arg is an object
    if (typeof defaultOrParams === 'object' && defaultOrParams !== null) {
      Object.entries(defaultOrParams).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }

    return text;
  };

  const contextValue = {
    locale,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    accessibilityMode,
    toggleAccessibilityMode,
    isSimpleMode: accessibilityMode === 'simple',
    t,
    i18n: {
      language: locale,
      changeLanguage
    }
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

// Alias for components expecting useTranslation
export function useTranslation() {
  return useI18n();
}
