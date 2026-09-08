import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, DollarSign, RefreshCw, Package, Wallet, ShieldAlert,
  ArrowUpRight, Award, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import collectorService from '../../services/collectorService';
import { LoadingSpinner, ErrorCard } from '../../components/common/StateViews';

export default function CollectorDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectorService.getDashboard();
      setStats(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to load dashboard metrics from backend.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message={t('loading') || 'Loading recycling activity...'} />;
  }

  if (error) {
    return <ErrorCard message={error} onRetry={fetchDashboard} />;
  }

  const collectorName = stats?.collector_name || user?.full_name || 'Collector';

  return (
    <div className="space-y-5 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-emerald-900/60 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Award className="w-3 h-3" />
              Verified Kabadiwala
            </span>
            <span className="text-xs text-amber-400 font-bold flex items-center">
              ★ {stats?.rating || 4.9}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">{stats?.city || user?.city || 'Hyderabad'}</span>
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
              {t('today_earnings') || "Today's Earnings"}
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

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Total Recycled</span>
          <span className="text-lg font-black text-white">{stats?.total_kg_collected || 0} kg</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Active Lots</span>
          <span className="text-lg font-black text-amber-400">{stats?.active_lots_count || 0}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Formal Sales</span>
          <span className="text-lg font-black text-teal-400">{stats?.completed_tx_count || 0}</span>
        </div>
      </div>

      {/* Primary Actions Grid (High Accessibility Large Touch Targets) */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 px-1">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Identify E-Waste */}
          <button
            onClick={() => navigate('/collector/identify')}
            className="flex flex-col items-start justify-between p-4 bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl min-h-[112px] shadow-lg shadow-emerald-950/50 text-left transition active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">
                {t('action_identify') || 'Identify E-Waste'}
              </span>
              <span className="text-[11px] text-white/80 font-normal">AI Scanner</span>
            </div>
          </button>

          {/* Action 2: Check Fair Price */}
          <button
            onClick={() => navigate('/collector/fair-price')}
            className="flex flex-col items-start justify-between p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-white rounded-2xl min-h-[112px] shadow-md text-left transition active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">
                {t('action_price') || 'Check Fair Price'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">CPCB Rates</span>
            </div>
          </button>

          {/* Action 3: Find Recycler */}
          <button
            onClick={() => navigate('/collector/recyclers')}
            className="flex flex-col items-start justify-between p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-white rounded-2xl min-h-[112px] shadow-md text-left transition active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-700/40 text-teal-400 flex items-center justify-center group-hover:scale-110 transition">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">
                {t('action_recycler') || 'Find Recycler'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Verified Demo</span>
            </div>
          </button>

          {/* Action 4: My Lots */}
          <button
            onClick={() => navigate('/collector/lots')}
            className="flex flex-col items-start justify-between p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-white rounded-2xl min-h-[112px] shadow-md text-left transition active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">
                {t('action_lots') || 'My Lots'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {stats?.active_lots_count || 0} active
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Safety Awareness Banner Card */}
      <div 
        onClick={() => navigate('/collector/safety')}
        className="bg-gradient-to-r from-amber-950/50 to-slate-900 border border-amber-800/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-amber-700 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">E-Waste Safety Standards</h4>
            <p className="text-[11px] text-slate-300">Do NOT burn cables • Avoid acid leaching</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </div>
    </div>
  );
}
