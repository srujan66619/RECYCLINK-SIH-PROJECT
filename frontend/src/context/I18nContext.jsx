import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';

const translations = { en, hi, mr };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('recyclink_locale') || 'en');

  const changeLanguage = (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('recyclink_locale', newLocale);
    }
  };

  const t = (key, defaultOrParams = "") => {
    let text = translations[locale]?.[key] || translations['en']?.[key];
    if (!text) {
      if (typeof defaultOrParams === 'string' && defaultOrParams) {
        text = defaultOrParams;
      } else {
        text = key;
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
