import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, DollarSign, RefreshCw, AlertTriangle, ShieldCheck, ArrowRight, Layers, Award } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function CollectorMaterialResult() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state;
  const result = state?.result;
  const photoUrl = state?.photo_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80';

  if (!result) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-slate-400 text-sm">No identification result found.</p>
        <button
          onClick={() => navigate('/collector/identify')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Scan Material Now
        </button>
      </div>
    );
  }

  const materialName = result.detected_material || 'Printed Circuit Board (PCB)';
  const confidence = Math.round((result.confidence || 0.94) * 100);
  const weight = result.estimated_weight_kg || 2.4;
  const priceMin = result.estimated_price_range?.min || Math.round(weight * 390);
  const priceMax = result.estimated_price_range?.max || Math.round(weight * 480);
  const hazard = result.hazard_level || 'MEDIUM';
  const metals = result.recoverable_materials || ['Copper', 'Gold', 'Silver', 'Tin'];

  const getHazardBadge = (level) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-950/80 border-red-700/60 text-red-400';
      case 'MEDIUM':
        return 'bg-amber-950/80 border-amber-700/60 text-amber-400';
      default:
        return 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400';
    }
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
    <div className="space-y-4 pb-6">
      {/* Simulation Transparency Banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('ai_demo_prediction') || 'AI Demo Prediction'}</span>
        </div>
        <span className="text-slate-400 font-mono text-[10px]">Vision Engine v2.0</span>
      </div>

      {/* Main Material Result Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Photo with Overlay Badge */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-800">
          <img src={photoUrl} alt={materialName} className="w-full h-full object-cover" />
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {confidence}% {t('confidence_label') || 'Confidence'}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase ${getHazardBadge(hazard)}`}>
              {hazard} Hazard
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">
            AI IDENTIFIED
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {materialName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            High-grade electronic scrap suitable for closed-loop hydrometallurgical recovery.
          </p>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('est_weight_label') || 'Estimated Weight'}
            </span>
            <span className="text-2xl font-black text-white">
              {weight} <span className="text-sm font-semibold text-slate-400">kg</span>
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('est_value_label') || 'Estimated Value'}
            </span>
            <span className="text-2xl font-black text-emerald-400">
              ₹{priceMin} – ₹{priceMax}
            </span>
          </div>
        </div>

        {/* Recoverable Precious Materials */}
        <div className="pt-1">
          <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">
            {t('recoverable_label') || 'Recoverable Precious Elements'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {metals.map((metal, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-200"
              >
                ✦ {metal}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleCheckFairPrice}
          className="w-full min-h-[52px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 active:scale-[0.98] transition"
        >
          <DollarSign className="w-5 h-5" />
          <span>{t('check_fair_price_btn') || 'CHECK FAIR PRICE'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/collector/identify')}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('try_another_btn') || 'TRY ANOTHER IMAGE'}</span>
        </button>
      </div>
    </div>
  );
}
