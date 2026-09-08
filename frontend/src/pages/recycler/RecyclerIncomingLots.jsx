import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Inbox, Filter, ArrowUpDown, Search, MapPin, Scale, 
  IndianRupee, Sparkles, ChevronRight, CheckCircle, ShieldCheck,
  RefreshCw, AlertCircle
} from 'lucide-react';
import { getIncomingLots } from '../../services/api';

export default function RecyclerIncomingLots() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Sorting
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLots = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedMaterial) params.material = selectedMaterial;
      if (maxDistance) params.max_distance = parseFloat(maxDistance);
      if (sortBy) params.sort_by = sortBy;

      const data = await getIncomingLots(params);
      setLots(data);
    } catch (err) {
      console.error('Failed to load incoming lots:', err);
      setError(err.response?.data?.detail || 'Failed to load incoming lots queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, [selectedMaterial, maxDistance, sortBy]);

  const materials = ['All Materials', 'PCB', 'Cable', 'Battery', 'LCD', 'CRT', 'Motor'];

  const filteredLots = lots.filter(lot => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lot.lot_id.toLowerCase().includes(q) ||
      lot.trace_id.toLowerCase().includes(q) ||
      lot.material.toLowerCase().includes(q) ||
      lot.collector_area.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-emerald-400" />
            <span>Incoming E-Waste Lot Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Eligible informal collection lots matched to your facility's authorized materials & logistics radius.
          </p>
        </div>

        <button
          onClick={fetchLots}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Lot ID, Trace ID, material, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Material Filter */}
          <div>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value === 'All Materials' ? '' : e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              {materials.map(m => (
                <option key={m} value={m === 'All Materials' ? '' : m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="distance">Sort by Distance (Proximity)</option>
              <option value="weight">Sort by Weight (Highest)</option>
              <option value="price">Sort by Benchmark Value</option>
              <option value="date">Sort by Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Scanning regional collection hubs for matching lots...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
          {error}
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Matching Lots Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try broadening your material filter or increasing your logistics radius. New lots created by collectors will immediately appear in this queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map((lot) => (
            <div
              key={lot.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow transition flex flex-col justify-between space-y-4 relative group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {lot.lot_id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {lot.status}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-white group-hover:text-emerald-300 transition">
                  {lot.material}
                </h3>
                {lot.subcategory && (
                  <p className="text-xs text-slate-400">{lot.subcategory}</p>
                )}

                {/* Recommendation Reason Tag (Section 37) */}
                {lot.is_recommended && (
                  <div className="mt-2 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>Recommended for you: {lot.recommendation_reason}</span>
                  </div>
                )}
              </div>

              {/* Specifications Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase block">Lot Weight</span>
                  <span className="font-semibold text-white text-sm flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    {lot.weight_kg} kg
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase block">Proximity</span>
                  <span className="font-semibold text-white text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {lot.distance_km} km
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase block">Collector Area</span>
                  <span className="font-medium text-slate-300 truncate block" title={`${lot.collector_area}, ${lot.collector_city}`}>
                    {lot.collector_area}, {lot.collector_city}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase block">Fair Benchmark</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ₹{lot.recommended_price}
                  </span>
                </div>
              </div>

              {/* Pricing Guidance */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">AI Est. Range:</span>
                <span className="font-mono font-semibold text-slate-200">
                  ₹{lot.ai_estimate_min} – ₹{lot.ai_estimate_max}
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate(`/recycler/lots/${lot.lot_id}`)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <span>Review & Make Offer</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
