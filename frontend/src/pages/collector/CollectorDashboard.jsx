import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, DollarSign, RefreshCw, Package, Wallet, ShieldAlert,
  Award, Wifi, WifiOff, Mic, MicOff, Volume2, ArrowRight,
  CheckCircle2, AlertTriangle, ChevronRight, Globe, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import collectorService from '../../services/collectorService';
import { getCollectorInsights } from '../../services/api';
import { useNetworkStatus } from '../../services/offlineSync';

import voiceService from '../../services/voiceService';
import offlineDb from '../../services/offlineDb';
import { LoadingSpinner } from '../../components/common/StateViews';
import LanguageSelector from '../../components/common/LanguageSelector';

export default function CollectorDashboard() {
  const { user } = useAuth();
  const { t, locale, changeLanguage, accessibilityMode, toggleAccessibilityMode } = useI18n();
  const navigate = useNavigate();
  const { isOnline, networkState, pendingCount, queueStats, lastSyncedAt, syncNow } = useNetworkStatus();

  const [stats, setStats] = useState(null);
  const [collectorInsights, setCollectorInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(null);

  const fetchDashboard = async () => {
    try {
      if (navigator.onLine) {
        const [data, insights] = await Promise.all([
          collectorService.getDashboard(),
          getCollectorInsights().catch(() => null)
        ]);
        setStats(data);
        if (insights) setCollectorInsights(insights);
        await offlineDb.setCache('collector_dashboard', data);
      } else {

        const cached = await offlineDb.getCache('collector_dashboard');
        if (cached) {
          setStats(cached);
        } else {
          setStats({
            collector_name: user?.full_name || 'Collector',
            today_earnings: 0,
            total_earnings: 0,
            active_lots_count: 0,
            completed_tx_count: 0,
            total_kg_collected: 0,
            city: user?.city || 'Local'
          });
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch offline fallback:', err);
      const cached = await offlineDb.getCache('collector_dashboard');
      if (cached) setStats(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [isOnline]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
      await fetchDashboard();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVoiceCommand = () => {
    if (!voiceService.isSpeechRecognitionSupported()) {
      alert(t('voice.not_supported'));
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceFeedback({ text: t('voice.listening'), type: 'info' });

    voiceService.startListening({
      langCode: locale,
      onResult: ({ rawText, matchedCommand }) => {
        setIsListening(false);
        if (matchedCommand) {
          setVoiceFeedback({
            text: `Command recognized: "${rawText}"`,
            type: 'success'
          });

          // Execute safe command
          if (matchedCommand.action === 'NAVIGATE') {
            setTimeout(() => navigate(matchedCommand.path), 600);
          } else if (matchedCommand.action === 'CHANGE_LANG') {
            changeLanguage(matchedCommand.lang);
          } else if (matchedCommand.action === 'SELECT_MATERIAL') {
            navigate('/collector/identify', { state: { presetMaterial: matchedCommand.material } });
          }
        } else {
          setVoiceFeedback({
            text: `Heard: "${rawText}". Try saying: "पहचानें", "कमाई", "लॉट" or "सुरक्षा"`,
            type: 'warning'
          });
        }
      },
      onError: (msg) => {
        setIsListening(false);
        setVoiceFeedback({ text: msg, type: 'error' });
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const collectorName = stats?.collector_name || user?.full_name || 'Collector';

  // Format sync timestamp
  const formattedSyncTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not yet';

  if (loading) {
    return <LoadingSpinner message={t('loading') || 'Loading recycling activity...'} />;
  }

  return (
    <div className="space-y-4 pb-8 max-w-lg mx-auto">
      {/* 1. Network Status Bar & Quick Language Switcher */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-md">
        {/* Network Pill */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {networkState === 'SYNCING' || isSyncing ? t('offline.syncing') : t('offline.online')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              {t('offline.offline')}
            </span>
          )}

          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingCount} {t('offline.pending_sync') || 'Pending'}
            </span>
          )}
        </div>

        {/* National Vernacular Language Selector & Mode */}
        <div className="flex items-center gap-1.5">
          <LanguageSelector />
        </div>
      </div>

      {/* 2. Offline Warning Banner (Shown only when offline) */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-600/50 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-amber-200 leading-snug">
              {t('offline.banner')}
            </p>
          </div>
        </div>
      )}

      {/* 3. Sync Status Card (Visible if pending queue or sync stats exist) */}
      {(pendingCount > 0 || queueStats.failed > 0 || isSyncing) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {t('offline.pending_count', { count: pendingCount }).replace('{count}', pendingCount)}
              </span>
              {queueStats.failed > 0 && (
                <span className="text-[10px] text-rose-400 font-bold">
                  ({queueStats.failed} failed)
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block">
              {t('offline.last_synced')}: {formattedSyncTime}
            </span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              !isOnline || isSyncing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('offline.syncing') : t('offline.retry_btn')}</span>
          </button>
        </div>
      )}

      {/* 4. Voice Feedback Popup Bar */}
      {voiceFeedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between animate-in fade-in duration-150 ${
            voiceFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700/50 text-emerald-200'
              : voiceFeedback.type === 'error'
              ? 'bg-rose-950/80 border-rose-700/50 text-rose-200'
              : 'bg-slate-800 border-slate-700 text-slate-200'
          }`}
        >
          <span>{voiceFeedback.text}</span>
          <button
            onClick={() => setVoiceFeedback(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Accessibility Simple Mode vs Standard Mode */}
      {accessibilityMode === 'simple' ? (
        <div className="space-y-4 pt-1">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              SIMPLE ACCESSIBILITY MODE
            </span>
            <button
              onClick={toggleAccessibilityMode}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            >
              Switch to Standard
            </button>
          </div>

          {/* Big Hero Camera Button */}
          <button
            onClick={() => navigate('/collector/identify')}
            className="w-full min-h-[96px] p-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xl rounded-3xl shadow-2xl flex items-center justify-between active:scale-95 transition border-2 border-white/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950/20 flex items-center justify-center">
                <Camera className="w-9 h-9 text-slate-950" />
              </div>
              <div className="text-left">
                <div className="text-xl font-extrabold">{t('dashboard.identify')}</div>
                <div className="text-xs font-bold text-slate-900/80">Take Scrap Photo</div>
              </div>
            </div>
            <ArrowRight className="w-8 h-8 text-slate-950" />
          </button>

          {/* Big Voice Button */}
          <button
            onClick={handleVoiceCommand}
            className={`w-full min-h-[84px] p-5 rounded-3xl font-black text-lg flex items-center justify-between shadow-xl active:scale-95 transition border-2 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse border-white'
                : 'bg-slate-900 text-emerald-400 border-emerald-500/40 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                {isListening ? <MicOff className="w-8 h-8 text-rose-300" /> : <Mic className="w-8 h-8 text-emerald-400" />}
              </div>
              <div className="text-left">
                <div className="text-lg">{isListening ? 'Listening...' : 'Voice Assistant'}</div>
                <div className="text-xs font-semibold text-slate-400">Speak in your language</div>
              </div>
            </div>
            <Volume2 className="w-6 h-6 text-slate-400" />
          </button>

          {/* Big My Lots Button */}
          <button
            onClick={() => navigate('/collector/lots')}
            className="w-full min-h-[84px] p-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-3xl border border-slate-800 flex items-center justify-between active:scale-95 transition shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Package className="w-8 h-8" />
              </div>
              <div className="text-left">
                <div className="text-lg">{t('dashboard.my_lots')}</div>
                <div className="text-xs font-semibold text-slate-400">View collected e-waste</div>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-400" />
          </button>

          {/* Big Safety Button */}
          <button
            onClick={() => navigate('/collector/safety')}
            className="w-full min-h-[84px] p-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-3xl border border-slate-800 flex items-center justify-between active:scale-95 transition shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="text-left">
                <div className="text-lg">{t('dashboard.safety')}</div>
                <div className="text-xs font-semibold text-slate-400">Hazard warnings & guidelines</div>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-400" />
          </button>

          {/* Simple Total Earnings Display */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-xs uppercase font-bold text-slate-400">{t('dashboard.earnings')}</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              ₹{stats?.total_earnings?.toLocaleString('en-IN') || 0}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 5. Welcome & Earnings Overview Banner */}
          <div className="bg-gradient-to-br from-emerald-900/60 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Award className="w-3 h-3" />
                  Verified Collector
                </span>
              </div>

              {/* Voice Assistant Mic Trigger Button */}
              <button
                onClick={handleVoiceCommand}
                title={t('voice.tap_to_speak')}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              {t('welcome_msg', { name: collectorName }).replace('{name}', collectorName)}
            </h2>
            <p className="text-xs text-emerald-300/90 font-medium mt-0.5">
              {t('ready_to_recycle') || 'Ready to recycle smarter today?'}
            </p>

            {/* Quick Earnings Metric */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                  {t('dashboard.earnings') || "My Earnings"}
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  ₹{stats?.today_earnings?.toLocaleString('en-IN') || 0}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                  {t('total_earnings') || 'Total Earned'}
                </span>
                <span className="text-xl font-bold text-white">
                  ₹{stats?.total_earnings?.toLocaleString('en-IN') || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 6. PRIMARY HERO ACTION (Large Touch Target 64px+) */}
          <div>
            <button
              onClick={() => navigate('/collector/identify')}
              className="w-full min-h-[72px] p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-3xl shadow-xl shadow-emerald-950/60 flex items-center justify-between transition active:scale-[0.98] group border border-emerald-400/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-105 transition shadow-inner">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-base font-black tracking-tight block">
                    {t('dashboard.identify')}
                  </span>
                  <span className="text-xs text-white/80 font-medium block">
                    {isOnline ? 'AI Scanner + Fair Price' : 'Offline Draft Intake'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>

          {/* 7. SECONDARY ACTIONS GRID (Large Touch Targets 56px+) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Action: My Lots */}
            <button
              onClick={() => navigate('/collector/lots')}
              className="flex flex-col items-start justify-between p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-white rounded-2xl min-h-[110px] shadow-md text-left transition active:scale-[0.98] group relative"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-700/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block leading-tight">
                  {t('dashboard.my_lots')}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {stats?.active_lots_count || 0} {t('active_lots') || 'active'}
                </span>
              </div>
            </button>

            {/* Action: Safety Guides */}
            <button
              onClick={() => navigate('/collector/safety')}
              className="flex flex-col items-start justify-between p-4 bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-white rounded-2xl min-h-[110px] shadow-md text-left transition active:scale-[0.98] group"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-700/40 text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block leading-tight text-rose-300">
                  {t('dashboard.safety')}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Battery, CRT, PCB
                </span>
              </div>
            </button>

            {/* Action: My Earnings */}
            <button
              onClick={() => navigate('/collector/earnings')}
              className="flex flex-col items-start justify-between p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-white rounded-2xl min-h-[110px] shadow-md text-left transition active:scale-[0.98] group"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block leading-tight">
                  {t('dashboard.earnings')}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  CPCB Fair Rates
                </span>
              </div>
            </button>

            {/* Action: Track Lot */}
            <button
              onClick={() => navigate('/trace')}
              className="flex flex-col items-start justify-between p-4 bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-white rounded-2xl min-h-[110px] shadow-md text-left transition active:scale-[0.98] group"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-950/80 border border-teal-700/40 text-teal-400 flex items-center justify-center group-hover:scale-110 transition">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block leading-tight">
                  {t('dashboard.track_lot')}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Trace ID & QR
                </span>
              </div>
            </button>
          </div>

          {/* 8. Safety Awareness Teaser Card */}
          <div
            onClick={() => navigate('/collector/safety')}
            className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border border-rose-900/40 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-rose-700 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {locale === 'hi'
                    ? 'सुरक्षा निर्देश: बैटरी और सीआरटी'
                    : locale === 'mr'
                    ? 'सुरक्षा सूचना: बॅटरी व सीआरटी'
                    : 'Safety Protocols: Battery & CRT'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {locale === 'hi'
                    ? 'कभी भी आग में न जलाएं • तेजाब से बचें'
                    : locale === 'mr'
                    ? 'कधीही जाळू नका • ॲसिड वापरू नका'
                    : 'Do NOT burn cables • Avoid acid leaching'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          {/* 9. Phase 11: Collector Opportunity Insights (Non-sensitive, privacy-preserving) */}
          {collectorInsights && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Your Monthly Impact &amp; Insights
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Private &amp; Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Collections this Month</span>
                  <span className="text-lg font-bold text-white">{collectorInsights.completed_collections_month} lots</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Top Handled Material</span>
                  <span className="text-lg font-bold text-emerald-300 truncate block">{collectorInsights.most_frequent_material}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-snug bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                💡 <span className="font-semibold text-white">{collectorInsights.recommendation_tip}</span>
              </p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
