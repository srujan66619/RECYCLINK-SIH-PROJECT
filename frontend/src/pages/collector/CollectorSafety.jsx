import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/I18nContext';
import {
  ShieldAlert, AlertOctagon, CheckCircle2, XCircle,
  Flame, BatteryCharging, Tv, Wrench, Volume2, VolumeX,
  Sparkles, Check, AlertTriangle, Layers
} from 'lucide-react';
import safetyService from '../../services/safetyService';
import voiceService from '../../services/voiceService';
import { LoadingSpinner } from '../../components/common/StateViews';

export default function CollectorSafety() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [guides, setGuides] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);

  const currentLang = i18n.language || 'en';

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const data = await safetyService.getSafetyGuides(currentLang);
      setGuides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading safety guides:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [currentLang]);

  const handleSpeakGuide = (guide) => {
    if (speakingId === guide.id) {
      voiceService.stopSpeaking();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(guide.id);
    const speechText = `${guide.title}. ${guide.danger_description}. ${guide.safe_practice_description}`;
    voiceService.speak(speechText, currentLang);

    // Reset speaking state after estimated duration
    const timeoutDuration = Math.min(12000, speechText.length * 75);
    setTimeout(() => {
      setSpeakingId(null);
    }, timeoutDuration);
  };

  const categories = ['ALL', ...new Set(guides.map(g => g.material_category).filter(Boolean))];
  const filteredGuides = selectedCategory === 'ALL'
    ? guides
    : guides.filter(g => g.material_category === selectedCategory);

  const getCategoryIcon = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('battery')) return <BatteryCharging className="w-5 h-5 text-amber-400" />;
    if (c.includes('cable') || c.includes('wire')) return <Flame className="w-5 h-5 text-rose-400" />;
    if (c.includes('crt') || c.includes('screen') || c.includes('tv')) return <Tv className="w-5 h-5 text-cyan-400" />;
    return <Wrench className="w-5 h-5 text-emerald-400" />;
  };

  const getHazardBadge = (type) => {
    const tStr = (type || '').toUpperCase();
    if (tStr.includes('HIGH') || tStr.includes('CRITICAL') || tStr.includes('FIRE') || tStr.includes('LEAD')) {
      return {
        label: t('safety.hazard_high'),
        className: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      };
    }
    if (tStr.includes('MED') || tStr.includes('CHEMICAL')) {
      return {
        label: t('safety.hazard_medium'),
        className: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }
    return {
      label: t('safety.hazard_low'),
      className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    };
  };

  if (loading) {
    return <LoadingSpinner message="Loading safety guides..." />;
  }

  return (
    <div className="space-y-4 pb-8 max-w-lg mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border border-rose-800/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">
              {t('dashboard.safety')}
            </h1>
            <p className="text-xs text-rose-200/90 font-medium mt-0.5">
              {currentLang === 'hi'
                ? 'कबाड़ी भाइयों के लिए आवश्यक सचित्र सुरक्षा निर्देश'
                : currentLang === 'mr'
                ? 'कबाडीवाला बांधवांसाठी आवश्यक सचित्र सुरक्षा सूचना'
                : 'Life-saving safety intelligence for informal collectors'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'ALL' ? (currentLang === 'hi' ? 'सभी' : currentLang === 'mr' ? 'सर्व' : 'All') : cat}
          </button>
        ))}
      </div>

      {/* 3. Pictorial Safety Cards List */}
      <div className="space-y-4">
        {filteredGuides.map((guide) => {
          const hazard = getHazardBadge(guide.hazard_type);
          const isSpeaking = speakingId === guide.id;

          // Parse dos & donts if stringified JSON
          const dosList = typeof guide.dos === 'string' ? JSON.parse(guide.dos || '[]') : (guide.dos || []);
          const dontsList = typeof guide.donts === 'string' ? JSON.parse(guide.donts || '[]') : (guide.donts || []);

          return (
            <div
              key={guide.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden"
            >
              {/* Category & Hazard Badge Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                    {getCategoryIcon(guide.material_category)}
                  </div>
                  <span className="text-xs font-bold text-slate-300">
                    {guide.material_category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${hazard.className}`}>
                    {hazard.label}
                  </span>

                  {/* Voice Button */}
                  <button
                    onClick={() => handleSpeakGuide(guide)}
                    title={t('voice.listen')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-md ${
                      isSpeaking
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                {guide.title}
              </h2>

              {/* Danger Warning Box */}
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{t('safety.what_to_avoid')}</span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  {guide.danger_description}
                </p>
              </div>

              {/* Safe Practice Guidance Box */}
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('safety.safe_handling')}</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  {guide.safe_practice_description}
                </p>
              </div>

              {/* Visual DOs and DON'Ts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* DOs */}
                {dosList.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      ✓ DO (सही तरीका)
                    </span>
                    <ul className="space-y-1">
                      {dosList.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DON'Ts */}
                {dontsList.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                      ✕ DON'T (कभी न करें)
                    </span>
                    <ul className="space-y-1">
                      {dontsList.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
