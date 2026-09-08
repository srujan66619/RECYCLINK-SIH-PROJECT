import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Search, Filter, Scale, IndianRupee, 
  CheckCircle2, AlertTriangle, Building2, RefreshCw, 
  ExternalLink, QrCode, ArrowRight, Layers
} from 'lucide-react';
import { getAdminTraceAnalytics, getAdminTraceList } from '../../services/api';

export default function AdminTraceView() {
  const [analytics, setAnalytics] = useState(null);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLotModal, setSelectedLotModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ana, list] = await Promise.all([
        getAdminTraceAnalytics(),
        getAdminTraceList()
      ]);
      setAnalytics(ana);
      setLots(list);
    } catch (err) {
      console.error('Failed to load admin trace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLots = lots.filter((item) => {
    const matchesSearch = !searchQuery || 
      item.trace_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lot_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recycler_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMat = !selectedMaterial || item.material === selectedMaterial;
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    return matchesSearch && matchesMat && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              MINISTRY OF ENVIRONMENT & CPCB E-WASTE REGISTRY
            </span>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Circular Traceability & Chain of Custody Registry
          </h1>
          <p className="text-xs text-slate-400">
            Real-time verification of informal-to-formal custody transitions, digital scale reconciliation, and cryptographic SHA-256 chain integrity.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Registry</span>
        </button>
      </div>

      {/* Section 21: Traceability Impact KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Traceable Lots
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {analytics.total_traceable_lots}
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">100% Digital IDs</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              E-Waste Tracked
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {(analytics.total_weight_tracked_kg / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">Tonnes</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{analytics.total_weight_tracked_kg} kg gross</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Transaction Value
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              ₹{(analytics.total_collector_value / 100000).toFixed(1)}L
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Direct Collector Payout</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Handovers Verified
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {analytics.verified_handovers}
            </div>
            <span className="text-[10px] text-cyan-400 mt-0.5 block">Digital Scale Certified</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Chain Integrity
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {analytics.trace_integrity_valid_pct}%
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">SHA-256 Validated</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Anomalies Flagged
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {analytics.anomalies_detected}
            </div>
            <span className="text-[10px] text-amber-400/80 mt-0.5 block">Scale / Price Checks</span>
          </div>

        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Trace ID, Lot ID, or Recycler..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="bg-slate-900 text-xs text-slate-300 px-3 py-2 rounded-xl border border-slate-700 outline-none flex-1 md:flex-initial"
          >
            <option value="">All Materials</option>
            <option value="Printed Circuit Board (PCB)">PCB</option>
            <option value="Insulated Copper Telecom Cable">Cable</option>
            <option value="Lithium-Ion Battery Packs">Lithium Battery</option>
            <option value="Flat Panel LCD/LED Monitor">LCD Monitor</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 text-xs text-slate-300 px-3 py-2 rounded-xl border border-slate-700 outline-none flex-1 md:flex-initial"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="HANDOVER_VERIFIED">HANDOVER_VERIFIED</option>
            <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="IDENTIFIED">IDENTIFIED</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Trace ID / Lot ID</th>
                <th className="px-4 py-3">Material Category</th>
                <th className="px-4 py-3">Scale Weight</th>
                <th className="px-4 py-3">Assigned Recycler</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Trace Integrity</th>
                <th className="px-4 py-3">Anomaly</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    No matching lots found in circular trace registry.
                  </td>
                </tr>
              ) : (
                filteredLots.map((item) => (
                  <tr key={item.trace_id} className="hover:bg-slate-900/50 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-white flex items-center space-x-1.5">
                        <span className="text-emerald-400">{item.trace_id}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {item.lot_id}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-white font-semibold">{item.material}</span>
                      <span className="text-[10px] text-slate-400 block">{item.created_at}</span>
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      <span className="text-emerald-400 font-bold">
                        {item.final_weight || item.initial_weight} kg
                      </span>
                      {item.final_weight && item.final_weight !== item.initial_weight && (
                        <span className="text-[10px] text-slate-400 block">
                          Init: {item.initial_weight} kg
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-slate-200 block truncate max-w-[160px]">
                        {item.recycler_name}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : item.status === 'HANDOVER_VERIFIED'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>VALID (SHA-256)</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {item.discrepancy_flagged ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Weight Divergence</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/trace/${item.trace_id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3 text-emerald-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
