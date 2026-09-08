import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  BrainCircuit, Scale, IndianRupee, ShieldAlert, 
  AlertTriangle, CheckCircle2, TrendingUp, Sparkles, 
  Layers, Flame, Activity
} from 'lucide-react';
import { 
  getAdminCollectorImpact, getAdminPriceFairness, 
  getAdminAIMetrics, getAdminSafetyMetrics 
} from '../../services/api';

export default function AdminAnalyticsView() {
  const [collectorImpact, setCollectorImpact] = useState(null);
  const [priceFairness, setPriceFairness] = useState(null);
  const [aiMetrics, setAIMetrics] = useState(null);
  const [safetyMetrics, setSafetyMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ci, pf, ai, sf] = await Promise.all([
          getAdminCollectorImpact(),
          getAdminPriceFairness(),
          getAdminAIMetrics(),
          getAdminSafetyMetrics()
        ]);
        setCollectorImpact(ci);
        setPriceFairness(pf);
        setAIMetrics(ai);
        setSafetyMetrics(sf);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const fairnessPie = priceFairness ? [
    { name: "Within Fair Range", value: priceFairness.offers_within_fair_range, color: "#10b981" },
    { name: "Good Offer (>+5%)", value: priceFairness.offers_above_fair_range, color: "#3b82f6" },
    { name: "Below Fair (<-5%)", value: priceFairness.offers_below_fair_range, color: "#ef4444" },
  ] : [];

  const aiBuckets = aiMetrics ? Object.entries(aiMetrics.confidence_distribution || {}).map(([k, v]) => ({
    bracket: k,
    count: v
  })) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DEEP INTELLIGENCE & GOVERNANCE
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            E-Waste Sector Economics & AI Governance
          </h1>
          <p className="text-xs text-slate-400">
            Collector financial inclusion, CPCB price benchmarks, prototype AI precision, and hazardous fraction diversion.
          </p>
        </div>
      </div>

      {/* SECTION 1: COLLECTOR ECONOMIC IMPACT */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Collector Economic Impact & Fair Earnings</h2>
          </div>
          <span className="text-xs text-slate-400 italic">
            {collectorImpact?.baseline_note}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Total Collector Earnings</span>
            <span className="text-2xl font-bold font-display text-emerald-400 block mt-1">
              ₹{(collectorImpact?.total_collector_value_inr || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Disbursed into bank/UPI</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Average Transaction Value</span>
            <span className="text-2xl font-bold font-display text-white block mt-1">
              ₹{(collectorImpact?.average_transaction_value_inr || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Per verified lot handover</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Average Price Realized</span>
            <span className="text-2xl font-bold font-display text-teal-400 block mt-1">
              ₹{collectorImpact?.average_value_per_kg_inr || 455}/kg
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across high-grade fractions</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Top Revenue Stream</span>
            <span className="text-base font-bold text-white block mt-1 truncate">
              {collectorImpact?.top_material_by_earnings || "PCB"}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Highest margin commodity</span>
          </div>
        </div>

        {/* Weekly Earnings Progression */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Weekly Disbursed Informal Earnings Progression
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={collectorImpact?.earnings_over_time || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                />
                <Line type="monotone" dataKey="earnings_inr" name="Payout (₹)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: PRICE FAIRNESS & BENCHMARK INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fairness Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">CPCB Price Fairness Index</h2>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
              {priceFairness?.within_fair_pct || 90}% Conformance
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fairnessPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {fairnessPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block">Within Fair</span>
              <span className="font-bold text-emerald-400 text-sm">{priceFairness?.offers_within_fair_range || 0}</span>
              <span className="text-[10px] text-slate-400 block">({priceFairness?.within_fair_pct || 0}%)</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] text-slate-400 block">Good Offer</span>
              <span className="font-bold text-blue-400 text-sm">{priceFairness?.offers_above_fair_range || 0}</span>
              <span className="text-[10px] text-slate-400 block">({priceFairness?.above_fair_pct || 0}%)</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] text-slate-400 block">Below Fair</span>
              <span className="font-bold text-rose-400 text-sm">{priceFairness?.offers_below_fair_range || 0}</span>
              <span className="text-[10px] text-slate-400 block">({priceFairness?.below_fair_pct || 0}%)</span>
            </div>
          </div>
        </div>

        {/* Price Variance Averages */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-teal-400" />
              <span>Commercial Pricing Discrepancy Overview</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Comparison between quoted bids vs settlement prices</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Average Offered Recycler Price</span>
              <span className="font-mono font-bold text-white">₹{priceFairness?.average_offered_price || 450}/kg</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Average Verified Settlement Price</span>
              <span className="font-mono font-bold text-emerald-400">₹{priceFairness?.average_final_price || 455}/kg</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">CPCB Benchmark Reference Price</span>
              <span className="font-mono font-bold text-teal-300">₹{priceFairness?.average_fair_price || 455}/kg</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Average Price Variance vs Benchmark</span>
              <span className="font-mono font-bold text-emerald-400">+{priceFairness?.average_variance_pct || 1.2}%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 text-[11px] text-slate-400 border border-slate-800/80">
            ✓ AI Transaction Guardian automatically flags any recycler bid dropping more than 40% below national CPCB guidelines.
          </div>
        </div>
      </div>

      {/* SECTION 3: PROTOTYPE AI CONFIDENCE & SAFETY ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Prototype AI Performance */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">AI Material Intelligence & Confidence</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              PROTOTYPE AI
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Total Identifications</span>
              <span className="text-xl font-bold text-white mt-1 block">{aiMetrics?.ai_identifications_count || 30}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Mean Confidence</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">
                {((aiMetrics?.average_confidence || 0.94) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Low Conf (&lt;75%)</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{aiMetrics?.low_confidence_count || 0}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Confidence Brackets Distribution
            </span>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="bracket" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Lot Identifications" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Safety & Hazard Classifications */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white">Hazardous Material Diversion & PPE Protocol</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Guiding informal collectors away from toxic open burning & crude acid leaching
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-[10px] text-rose-300 font-bold block">HIGH HAZARD</span>
              <span className="text-2xl font-extrabold text-rose-400 block mt-1">{safetyMetrics?.high_hazard_lots || 0}</span>
              <span className="text-[9px] text-slate-400">Batteries & CRT Tubes</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[10px] text-amber-300 font-bold block">MEDIUM HAZARD</span>
              <span className="text-2xl font-extrabold text-amber-400 block mt-1">{safetyMetrics?.medium_hazard_lots || 0}</span>
              <span className="text-[9px] text-slate-400">Server PCBs & LCDs</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] text-emerald-300 font-bold block">LOW HAZARD</span>
              <span className="text-2xl font-extrabold text-emerald-400 block mt-1">{safetyMetrics?.low_hazard_lots || 0}</span>
              <span className="text-[9px] text-slate-400">Telecom Cables & Motors</span>
            </div>
          </div>

          <div className="space-y-2 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Collector Safety Guide Engagements:</span>
              <span className="font-bold text-white">{safetyMetrics?.safety_guide_views || 1420}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">High-Hazard Fraction Ratio:</span>
              <span className="font-bold text-rose-400">{safetyMetrics?.high_hazard_pct || 14.2}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Backyard Acid Leaching Avoidance:</span>
              <span className="font-bold text-emerald-400">100% Diverted to Smelters</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
