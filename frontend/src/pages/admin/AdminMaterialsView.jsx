import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, ShieldCheck, Flame, 
  Sparkles, RefreshCw, Cpu, Cable, Battery 
} from 'lucide-react';
import { getAdminMaterials } from '../../services/api';

export default function AdminMaterialsView() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getAdminMaterials();
      setMaterials(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = materials.filter((m) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      m.name?.toLowerCase().includes(q) ||
      m.code?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              COMMODITY BENCHMARKS
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              CPCB GUIDELINES
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            E-Waste Material Catalog & Commodity Rates
          </h1>
          <p className="text-xs text-slate-400">
            Approved material streams, baseline recovery pricing, and mandatory CPCB environmental handling rules.
          </p>
        </div>

        <button 
          onClick={loadMaterials}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center space-x-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter materials by code, name, category..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Materials Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Material Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Hazard Rating</th>
                <th className="py-3 px-4">Benchmark Price</th>
                <th className="py-3 px-4">Acceptable Range</th>
                <th className="py-3 px-4">Handling Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">{m.code}</td>
                  <td className="py-3 px-4 font-semibold text-white">{m.name}</td>
                  <td className="py-3 px-4 text-slate-300">{m.category}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      m.hazard_level === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : m.hazard_level === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {m.hazard_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    ₹{m.benchmark_price_per_kg}/kg
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    ₹{m.min_price_per_kg} – ₹{m.max_price_per_kg}/kg
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                    {m.notes || 'Mechanical dismantling in certified hood only'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No materials found matching search query.
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
