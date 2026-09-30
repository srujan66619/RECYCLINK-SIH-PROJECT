import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, DollarSign, RefreshCw, AlertTriangle, ShieldCheck,
  ArrowRight, Layers, Award, Volume2, ShieldAlert, Check
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import voiceService from '../../services/voiceService';
import safetyService from '../../services/safetyService';

export default function CollectorMaterialResult() {
  const { t, locale } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state;
  const result = state?.result;
  const photoUrl = state?.photo_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80';
  const initialWeight = state?.weight_kg || 2.4;

  const [acknowledged, setAcknowledged] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  if (!result) {
    return (
      <div className="text-center py-12 space-y-4 max-w-md mx-auto">
        <p className="text-slate-400 text-sm">No identification result found.</p>
        <button
          onClick={() => navigate('/collector/identify')}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg"
        >
          Scan Material Now
        </button>
      </div>
    );
  }

  const materialName = result.detected_material || 'Printed Circuit Board (PCB)';
  const confidence = Math.round((result.confidence || 0.94) * 100);
  const weight = result.estimated_weight_kg || initialWeight;
  const priceMin = result.estimated_price_range?.min || Math.round(weight * 390);
  const priceMax = result.estimated_price_range?.max || Math.round(weight * 480);
  const hazard = result.hazard_level || 'MEDIUM';
  const metals = result.recoverable_materials || ['Copper', 'Gold', 'Silver', 'Tin'];

  const isHighHazard = hazard === 'HIGH' || hazard === 'CRITICAL' || materialName.includes('Battery') || materialName.includes('CRT');

  const handleSpeak = () => {
    setIsPlayingVoice(true);
    voiceService.speakMaterialResult({
      material: materialName,
      weight,
      hazard,
      lang: locale
    });
    setTimeout(() => setIsPlayingVoice(false), 4000);
  };

  const handleAcknowledge = async () => {
    setAcknowledged(true);
    await safetyService.acknowledgeSafety({
      material_name: materialName,
      hazard_level: hazard
    });
  };

  const handleCheckFairPrice = () => {
    navigate('/collector/fair-price', {
      state: {
        material: materialName,
        weight_kg: weight,
        photo_url: photoUrl,
        hazard_level: hazard,
        confidence: result.confidence || 0.94,
        recoverable_materials: metals,
      },
    });
  };

  return (
    <div className="space-y-4 pb-8 max-w-lg mx-auto">
      {/* 1. Step Indicator (Step 2 of 6) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            Step 2 of 6
          </span>
          <h1 className="text-sm font-bold text-white">
            AI Identification Result
          </h1>
        </div>
        <div className="flex gap-1">
          <span className="w-5 h-2 rounded-full bg-emerald-500"></span>
          <span className="w-5 h-2 rounded-full bg-emerald-500"></span>
          <span className="w-5 h-2 rounded-full bg-slate-700"></span>
          <span className="w-5 h-2 rounded-full bg-slate-700"></span>
        </div>
      </div>

      {/* 2. HIGH HAZARD IMMEDIATE SAFETY ALERT (Battery, CRT) */}
      {isHighHazard && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500 rounded-3xl p-4 shadow-xl space-y-3 animate-in shake duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>{t('safety.alert_title')}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider">
              {t('safety.hazard_high')}
            </span>
          </div>

          <p className="text-xs text-rose-200 leading-snug">
            {locale === 'hi'
              ? 'सावधान! इस कचरे को हथौड़े से तोड़ना या आग में जलाना जानलेवा हो सकता है। कृपया पहले सुरक्षा निर्देश देखें।'
              : locale === 'mr'
              ? 'सावध राहा! या कचऱ्यावर हातोडा मारणे किंवा जाळणे अत्यंत घातक ठरू शकते. कृपया आधी सुरक्षा सूचना वाचा.'
              : 'Warning! Puncturing, crushing or burning this material poses severe chemical and fire hazards.'}
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => navigate('/collector/safety')}
              className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t('safety.view_guide')}</span>
            </button>

            {!acknowledged ? (
              <button
                onClick={handleAcknowledge}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
              >
                {t('safety.i_understand')}
              </button>
            ) : (
              <div className="px-3 py-2 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Acknowledged</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Result Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Photo Container */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-800">
          <img src={photoUrl} alt={materialName} className="w-full h-full object-cover" />
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-md">
              <Award className="w-3.5 h-3.5" />
              {confidence}% {t('confidence_label')}
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border uppercase ${
              isHighHazard ? 'bg-rose-950/80 border-rose-700 text-rose-400' : 'bg-amber-950/80 border-amber-700 text-amber-400'
            }`}>
              {hazard}
            </span>
          </div>
        </div>

        {/* Material Identification Header & Voice Listen Action */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {materialName}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {result.subcategory || 'Grade A E-Waste'}
            </p>
          </div>

          {/* Voice Output Button (Listen / सुनें / ऐका) */}
          <button
            onClick={handleSpeak}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md active:scale-95 ${
              isPlayingVoice
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{t('voice.listen')}</span>
          </button>
        </div>

        {/* Estimated Weight & Approximate Price */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('est_weight_label')}
            </span>
            <span className="text-lg font-black text-white mt-0.5 block">
              {weight} kg
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('est_value_label')}
            </span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">
              ₹{priceMin} – ₹{priceMax}
            </span>
          </div>
        </div>

        {/* Recoverable Materials Chips */}
        {metals && metals.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {t('recoverable_label')}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {metals.map((m, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950 text-teal-300 border border-teal-800/40"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button: Check Fair Price (Touch Target 64px+) */}
      <div className="pt-2 space-y-2">
        <button
          onClick={handleCheckFairPrice}
          className="w-full min-h-[64px] py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <span>{t('check_fair_price_btn')}</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>

        <button
          onClick={() => navigate('/collector/identify')}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition"
        >
          {t('try_another_btn')}
        </button>
      </div>
    </div>
  );
}
