import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  Scale, ShieldAlert, CheckCircle2, TrendingUp, 
  IndianRupee, Users, Building2, AlertTriangle, 
  ArrowRight, ShieldCheck, Zap, Sparkles, Filter, 
  Layers, QrCode, RefreshCw, AlertOctagon, FileText
} from 'lucide-react';
import { 
  getAdminDashboard, getAdminAnalytics, getAdminHotspots, 
  getAdminFormalizationFunnel, getAdminAttentionItems, 
  getAdminInsights, getAdminImpactScorecard 
} from '../services/api';

export default function AdminDashboard({ selectedPeriod: propPeriod, selectedCity: propCity }) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const activePeriod = outletCtx.selectedPeriod || propPeriod || "All Time";
  const activeCity = outletCtx.selectedCity || propCity || "ALL";

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [attention, setAttention] = useState([]);
  const [insights, setInsights] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState('weight'); // 'weight' | 'lots' | 'value'

  useEffect(() => {
    loadAllData();
  }, [activePeriod, activeCity]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dash, ana, hot, fn, att, ins, sc] = await Promise.all([
        getAdminDashboard({ period: activePeriod, city: activeCity }),
        getAdminAnalytics({ city: activeCity }),
        getAdminHotspots(),
        getAdminFormalizationFunnel({ city: activeCity }),
        getAdminAttentionItems(),
        getAdminInsights(),
        getAdminImpactScorecard({ city: activeCity })
      ]);
      setStats(dash);
      setAnalytics(ana);
      setHotspots(hot || []);
      setFunnel(fn || []);
      setAttention(att || []);
      setInsights(ins || []);
      setScorecard(sc);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = stats?.kpis || {};

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Dashboard Executive Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 tracking-wide">
              MINISTRY OF ENVIRONMENT & CPCB NATIONAL OVERSIGHT
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            E-WASTE CIRCULAR ECONOMY COMMAND CENTER
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Monitor collection, pricing, traceability and formal recycling activity. Real-time digital provenance from informal kabadiwalas to authorized smelters.
          </p>
        </div>

        {/* Formalization Rate Headline Badge */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 flex items-center space-x-4 min-w-[220px]">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-lg">
            {stats?.formalization_rate_pct || 78.5}%
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Formalization Rate</span>
            <span className="text-xs font-semibold text-emerald-300">Intake to Smelter Loop</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Zero Landfill Leakage</span>
          </div>
        </div>
      </div>

      {/* WHAT NEEDS ATTENTION / PRIORITY ACTIONS */}
      {attention.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
              <AlertOctagon className="w-4 h-4" />
              <span>WHAT NEEDS ATTENTION — HIGH PRIORITY ITEMS</span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
              {attention.length} Active Alerts
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attention.map((item, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                      {item.priority}
                    </span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                </div>
                <button
                  onClick={() => navigate(item.action_url)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition whitespace-nowrap"
                >
                  {item.action_label}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXECUTIVE 8 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Weight */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">TOTAL E-WASTE TRACKED</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-display text-white">
              {stats?.total_weight ? stats.total_weight.toLocaleString('en-IN') : '0'}
            </span>
            <span className="text-xs text-slate-400 font-bold">kg ({stats?.total_e_waste_tonnes || 0} T)</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-emerald-400 font-bold">
              {kpis?.total_weight?.trend_pct ? `+${kpis.total_weight.trend_pct}%` : '—'}
            </span>
            <span className="text-slate-400 text-[10px]">
              {kpis?.total_weight?.trend_label || 'vs previous period'}
            </span>
          </div>
        </div>

        {/* KPI 2: Traceable Lots */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">TRACEABLE LOTS</span>
            <QrCode className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-display text-white">
              {stats?.traceable_lots || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">lots</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-blue-400 font-bold">
              {kpis?.traceable_lots?.trend_pct ? `+${kpis.traceable_lots.trend_pct}%` : '—'}
            </span>
            <span className="text-slate-400 text-[10px]">Active QR Ledgers</span>
          </div>
        </div>

        {/* KPI 3: Completed Transactions */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">COMPLETED TRANSACTIONS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-display text-emerald-400">
              {stats?.completed_transactions || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ {stats?.total_transactions || 0} total</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-emerald-400 font-bold">100%</span>
            <span className="text-slate-400 text-[10px]">Digital Settled</span>
          </div>
        </div>

        {/* KPI 4: Collector Value */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">COLLECTOR VALUE</span>
            <IndianRupee className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              ₹{stats?.total_transaction_value_inr ? stats.total_transaction_value_inr.toLocaleString('en-IN') : '0'}
            </span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-teal-400 font-bold">Direct UPI</span>
            <span className="text-slate-400 text-[10px]">Grassroots Beneficiaries</span>
          </div>
        </div>

        {/* KPI 5: Verified Handovers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">VERIFIED HANDOVERS</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-display text-white">
              {stats?.verified_handovers || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">verified</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-teal-400 font-bold">Zero Discrepancy</span>
            <span className="text-slate-400 text-[10px]">Scale Reconciled</span>
          </div>
        </div>

        {/* KPI 6: Active Recyclers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">ACTIVE RECYCLERS</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-display text-white">
              {stats?.verified_recyclers || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">facilities</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-purple-400 font-bold">CPCB Authorized</span>
            <span className="text-slate-400 text-[10px]">100% Certified</span>
          </div>
        </div>

        {/* KPI 7: Registered Collectors */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">REGISTERED COLLECTORS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-display text-white">
              {stats?.active_collectors || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">aggregators</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-cyan-400 font-bold">Formalized Channel</span>
            <span className="text-slate-400 text-[10px]">Trilingual PWA</span>
          </div>
        </div>

        {/* KPI 8: Open Anomalies */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">AI GUARDIAN ANOMALIES</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-display text-amber-400">
              {stats?.anomaly_count || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">open</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            <span className="text-amber-400 font-bold">Surveillance Active</span>
            <span className="text-slate-400 text-[10px]">Predatory Price Guard</span>
          </div>
        </div>
      </div>

      {/* EXPLAINABLE INSIGHTS BANNER */}
      {insights.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900 to-slate-950 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>DATA-DRIVEN GOVERNANCE INSIGHTS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {insights.map((txt, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
                {txt}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARTS ROW: COLLECTION TREND & MATERIAL MIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Time-Series Collection Trend (2 Cols) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>E-Waste Collection & Formalization Trend</span>
              </h2>
              <p className="text-xs text-slate-400">Aggregated real intake vs formalized processing</p>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setChartMetric('weight')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${chartMetric === 'weight' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
              >
                Weight (kg)
              </button>
              <button
                onClick={() => setChartMetric('lots')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${chartMetric === 'lots' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
              >
                Lot Count
              </button>
              <button
                onClick={() => setChartMetric('value')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${chartMetric === 'value' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
              >
                Payout (₹)
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.monthly_collection_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {chartMetric === 'weight' && (
                  <>
                    <Bar dataKey="collected_kg" name="Intake Collected (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="formalized_kg" name="Formal Handover (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </>
                )}
                {chartMetric === 'lots' && (
                  <Bar dataKey="lots_count" name="Traceable Lots Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                )}
                {chartMetric === 'value' && (
                  <Bar dataKey="value_inr" name="Collector Value (₹)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* E-Waste Material Mix Donut (1 Col) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>E-Waste Material Mix</span>
            </h2>
            <p className="text-xs text-slate-400">Component distribution & hazardous fraction</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.material_distribution || []}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {(analytics?.material_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {(analytics?.material_distribution || []).map((mat, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mat.color }}></span>
                  <span className="text-slate-300 font-medium truncate">{mat.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-mono text-[11px]">{mat.weight_kg} kg</span>
                  <span className="font-bold text-white text-[11px]">{mat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORMALIZATION FUNNEL */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Informal → Formal Recycling Transition Funnel</span>
            </h2>
            <p className="text-xs text-slate-400">
              8-stage progression verifying how informal collection lots convert to formal smelting
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Lifecycle Efficiency: {stats?.formalization_rate_pct || 78.5}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {funnel.map((stg, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between space-y-2 hover:border-emerald-500/40 transition"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                  Stage {idx + 1}
                </span>
                <span className="text-xs font-bold text-white block mt-0.5 line-clamp-1">
                  {stg.stage_id}
                </span>
              </div>
              <div>
                <span className="text-xl font-extrabold font-display text-emerald-400 block">
                  {stg.count}
                </span>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Retention:</span>
                  <span className="font-bold text-slate-200">{stg.retained_pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOCATION INTELLIGENCE & RECYCLER NETWORK PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Collection Locations Leaderboard (2 Cols) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Geographic Collection Hotspots & Volume Leaderboard</span>
              </h2>
              <p className="text-xs text-slate-400">Aggregated urban intake clusters (Privacy protected)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Location / Hub</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Total Intake (kg)</th>
                  <th className="py-2.5 px-3">Active Lots</th>
                  <th className="py-2.5 px-3">Payout Flow (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {hotspots.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-bold text-emerald-400">#{h.rank || idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{h.city} Hub</td>
                    <td className="py-2.5 px-3 text-slate-400">India</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{h.weight_kg} kg</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{h.lots_count || h.lots}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">₹{(h.value_inr || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CPCB Verified Recyclers Quick Preview (1 Col) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Authorized Recyclers</span>
              </h2>
              <p className="text-xs text-slate-400">Licensed processing facilities</p>
            </div>
            <button 
              onClick={() => navigate('/admin/recyclers')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {[
              { name: "GreenCycle Recycling Plant", city: "Hyderabad", auth: "VERIFIED DEMO", reliability: 98.5 },
              { name: "EcoFormal Recovery Facility", city: "Hyderabad", auth: "VERIFIED DEMO", reliability: 96.0 },
              { name: "Andhra Green Recyclers Ltd", city: "Vijayawada", auth: "VERIFIED DEMO", reliability: 97.2 },
              { name: "Whitefield Tech Recovery", city: "Bengaluru", auth: "VERIFIED DEMO", reliability: 99.1 },
              { name: "Maharashtra EcoRefinery", city: "Pune", auth: "VERIFIED DEMO", reliability: 95.8 },
            ].map((r, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{r.name}</span>
                  <span className="text-[10px] text-slate-400 block">{r.city}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {r.auth}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{r.reliability}% score</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESG IMPACT SCORECARD */}
      {scorecard && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold font-display text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>RECYCLINK Circular Impact Scorecard</span>
              </h2>
              <p className="text-xs text-slate-400">
                Triple bottom line accountability across environmental, economic, governance & social domains
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/reports')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Impact Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Environmental */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block">
                1. Environmental
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">E-Waste Tracked:</span>
                  <span className="font-bold text-white">{scorecard.environmental?.e_waste_tracked_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toxic Leakage Diverted:</span>
                  <span className="font-bold text-emerald-400">{scorecard.environmental?.toxic_leakage_diverted_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CO2 Emissions Avoided:</span>
                  <span className="font-bold text-teal-300">{scorecard.environmental?.co2_emissions_avoided_kg} kg</span>
                </div>
              </div>
            </div>

            {/* Economic */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wider block">
                2. Economic
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Collector Earnings:</span>
                  <span className="font-bold text-white">₹{(scorecard.economic?.total_collector_value_inr || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Transaction Value:</span>
                  <span className="font-bold text-teal-400">₹{scorecard.economic?.average_transaction_value_inr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fair Price Compliance:</span>
                  <span className="font-bold text-emerald-400">{scorecard.economic?.fair_price_compliance_pct}%</span>
                </div>
              </div>
            </div>

            {/* Governance */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider block">
                3. Governance
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified Handovers:</span>
                  <span className="font-bold text-white">{scorecard.governance?.verified_handovers_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trace Hash Integrity:</span>
                  <span className="font-bold text-blue-400">{scorecard.governance?.trace_integrity_rate_pct}% Valid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CPCB Certified Recyclers:</span>
                  <span className="font-bold text-emerald-400">{scorecard.governance?.cpcb_authorized_recyclers_pct}%</span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider block">
                4. Social
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Collectors:</span>
                  <span className="font-bold text-white">{scorecard.social?.active_collectors_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Safety Engagements:</span>
                  <span className="font-bold text-purple-400">{scorecard.social?.safety_guideline_engagements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UPI Banking Inclusion:</span>
                  <span className="font-bold text-emerald-400">{scorecard.social?.formal_banking_inclusion_pct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
