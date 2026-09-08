import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { 
  ShieldAlert, AlertOctagon, CheckCircle2, XCircle, 
  Flame, BatteryCharging, Tv, Wrench, PhoneCall, Volume2, 
  Info, RefreshCw, Sparkles, Filter
} from 'lucide-react';
import { safetyService } from '../../services/safetyService';
import { LoadingSpinner, ErrorCard } from '../../components/common/StateViews';

export default function CollectorSafety() {
  const { t, i18n } = useTranslation();
  const [guides, setGuides] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [speakingId, setSpeakingId] = useState(null);

  const fetchGuides = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await safetyService.getSafetyGuides(i18n.language || 'en');
      setGuides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load safety guides:', err);
      setError('Unable to load safety guides. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [i18n.language]);

  const speakGuide = (guide) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    if (speakingId === guide.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const text = `${guide.title}. Danger: ${guide.danger_description}. Safe practice: ${guide.safe_practice_description}. Important rules: ${guide.donts?.join(', ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(guide.id);
    window.speechSynthesis.speak(utterance);
  };

  const categories = ['ALL', ...new Set(guides.map(g => g.material_category).filter(Boolean))];
  const filteredGuides = selectedCategory === 'ALL' 
    ? guides 
    : guides.filter(g => g.material_category === selectedCategory);

  const getCategoryIcon = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('battery')) return <BatteryCharging className="w-5 h-5 text-amber-400" />;
    if (c.includes('cable') || c.includes('wire')) return <Flame className="w-5 h-5 text-rose-400" />;
    if (c.includes('crt') || c.includes('screen') || c.includes('monitor')) return <Tv className="w-5 h-5 text-cyan-400" />;
    return <Wrench className="w-5 h-5 text-emerald-400" />;
  };

  if (loading) {
    return <LoadingSpinner message="Loading pictorial safety intelligence..." />;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <span>{t('safety.title') || 'Collector Safety & Health'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {t('safety.subtitle') || 'Pictorial warnings to protect kabadiwalas from toxic e-waste hazards'}
          </p>
        </div>
        <button
          onClick={fetchGuides}
          title="Refresh Guides"
          className="p-2 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Critical Alert Warning Box */}
      <div className="bg-gradient-to-r from-rose-950/60 via-gray-900 to-gray-900 border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-rose-200 text-sm sm:text-base">
              Absolute Prohibition: Open Burning & Chemical Leaching
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Burning copper wires releases toxic dioxins and furans that cause permanent lung and nerve damage. Acid-washing circuit boards contaminates local groundwater. Authorized recyclers pay for the intact material — do not burn or dissolve!
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Helpline Banner */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <PhoneCall className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>CPCB Hazardous Material Helpline: <strong className="text-white">1800-11-8005</strong></span>
        </div>
        <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
          Toll Free
        </span>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-gray-500 flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5" />
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-700/60'
              }`}
            >
              {cat === 'ALL' ? 'All Guides' : cat}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={fetchGuides} />}

      {/* Safety Cards Grid */}
      <div className="space-y-4">
        {filteredGuides.length === 0 ? (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
            No safety guides found for this category.
          </div>
        ) : (
          filteredGuides.map((guide) => (
            <div 
              key={guide.id}
              className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 transition-all hover:border-gray-700"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gray-800 border border-gray-700 flex-shrink-0 mt-0.5">
                    {getCategoryIcon(guide.material_category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        {guide.material_category}
                      </span>
                      {guide.hazard_type && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {guide.hazard_type}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {guide.title}
                    </h3>
                  </div>
                </div>

                {/* Voice Readout Button */}
                <button
                  onClick={() => speakGuide(guide)}
                  className={`p-2 rounded-xl border transition-all ${
                    speakingId === guide.id
                      ? 'bg-emerald-500 text-black border-emerald-400 ring-2 ring-emerald-500/40'
                      : 'bg-gray-800/80 text-gray-300 hover:text-white border-gray-700 hover:bg-gray-700'
                  }`}
                  title="Listen in Audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Danger Description */}
              <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300/90">
                <strong className="text-rose-300 block mb-0.5">Hazard Risk:</strong>
                {guide.danger_description}
              </div>

              {/* Safe Practice Description */}
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300/90">
                <strong className="text-emerald-300 block mb-0.5">Prescribed Safe Practice:</strong>
                {guide.safe_practice_description}
              </div>

              {/* Dos and Don'ts Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* DOs */}
                <div className="bg-gray-950/60 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Safe Dos (सुरक्षित)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {guide.dos && guide.dos.length > 0 ? (
                      guide.dos.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 italic">Handle with protective gloves and mask</li>
                    )}
                  </ul>
                </div>

                {/* DON'Ts */}
                <div className="bg-gray-950/60 border border-rose-500/20 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wide">
                    <XCircle className="w-4 h-4" />
                    <span>Never Do (खतरा)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {guide.donts && guide.donts.length > 0 ? (
                      guide.donts.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 italic">Do not burn or break components</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
