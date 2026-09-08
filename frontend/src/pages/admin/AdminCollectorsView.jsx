import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Search, Filter, 
  MapPin, CheckCircle2, Lock, RefreshCw 
} from 'lucide-react';
import { getAdminCollectors } from '../../services/api';

export default function AdminCollectorsView() {
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCollectors();
  }, [cityFilter]);

  const loadCollectors = async () => {
    setLoading(true);
    try {
      const data = await getAdminCollectors({ city: cityFilter !== 'ALL' ? cityFilter : undefined });
      setCollectors(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = collectors.filter((c) => {
    const q = searchQuery.toLowerCase();
    return !q || 
      c.full_name?.toLowerCase().includes(q) ||
      c.collector_code?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              INFORMAL SECTOR INTEGRATION
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
              <Lock className="w-2.5 h-2.5" />
              <span>PRIVACY COMPLIANT</span>
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            Formalized Collector Registry
          </h1>
          <p className="text-xs text-slate-400">
            Grassroots informal aggregators (kabadiwalas) onboarded into the national circular supply chain.
          </p>
        </div>

        <button 
          onClick={loadCollectors}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2.5 text-xs text-slate-400">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Data Protection Guarantee:</strong> In adherence with national data protection regulations, individual collector telephone numbers, domestic residential addresses, and bank accounts are masked.
        </span>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by collector name, ID, or hub..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Hub / City:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium outline-none"
          >
            <option value="ALL">All Hubs (India)</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Vijayawada">Vijayawada</option>
            <option value="Guntur">Guntur</option>
            <option value="Bapatla">Bapatla</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mumbai">Mumbai</option>
          </select>
        </div>
      </div>

      {/* Collectors Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Collector Code</th>
                <th className="py-3 px-4">Collector Name</th>
                <th className="py-3 px-4">Operating Hub</th>
                <th className="py-3 px-4">Formal Status</th>
                <th className="py-3 px-4">Lots Logged</th>
                <th className="py-3 px-4">Total Weight (kg)</th>
                <th className="py-3 px-4">Disbursed Earnings (₹)</th>
                <th className="py-3 px-4">Onboarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{c.collector_code}</td>
                  <td className="py-3 px-4 font-semibold text-white">{c.full_name}</td>
                  <td className="py-3 px-4 text-slate-300">{c.city}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {c.is_verified ? "VERIFIED FORMAL" : "PENDING"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{c.total_lots_collected}</td>
                  <td className="py-3 px-4 font-mono text-slate-200">{c.total_weight_collected_kg} kg</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    ₹{(c.total_earnings || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No collectors found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
