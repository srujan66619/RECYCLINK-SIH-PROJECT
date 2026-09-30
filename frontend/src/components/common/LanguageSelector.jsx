import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, Eye, Smartphone } from 'lucide-react';
import { useI18n, SUPPORTED_LANGUAGES } from '../../context/I18nContext';

export default function LanguageSelector({ variant = 'compact' }) {
  const { locale, changeLanguage, accessibilityMode, toggleAccessibilityMode, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === locale) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 text-xs font-medium transition shadow-sm"
        title="Select National Language (8 Languages Supported)"
        aria-label="Select National Language"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold text-white">{currentLang.native}</span>
        <span className="text-[10px] text-slate-400 uppercase hidden sm:inline">({currentLang.code})</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
            <span>National Languages</span>
            <span className="text-[10px] text-emerald-400 font-mono">8 Available</span>
          </div>

          <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto pr-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition text-left ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs">{lang.native}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-slate-900/80' : 'text-slate-400'}`}>
                      {lang.name}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Simple Accessibility Mode Toggle */}
          <div className="mt-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                toggleAccessibilityMode();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              <div className="flex items-center space-x-2">
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span>Accessibility Mode</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                accessibilityMode === 'simple'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {accessibilityMode === 'simple' ? 'SIMPLE' : 'STANDARD'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
