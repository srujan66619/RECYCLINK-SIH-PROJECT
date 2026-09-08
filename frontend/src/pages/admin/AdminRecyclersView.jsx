import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Search, Filter, 
  MapPin, Phone, CheckCircle2, Star, RefreshCw 
} from 'lucide-react';
import { getAdminRecyclers } from '../../services/api';

export default function AdminRecyclersView() {
  const [recyclers, setRecyclers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecyclers();
  }, [cityFilter]);

  const loadRecyclers = async () => {
    setLoading(true);
    try {
      const data = await getAdminRecyclers({ city: cityFilter !== 'ALL' ? cityFilter : undefined });
      setRecyclers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = recyclers.filter((r) => {
    const q = searchQuery.toLowerCase();
    return !q || 
      r.facility_name?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q) ||
      r.authorization_number?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CPCB RECYCLER DIRECTORY
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            Authorized Formal Recycler Network
          </h1>
          <p className="text-xs text-slate-400">
            CPCB licensed facilities with verified capacity, material compatibility, and compliance ratings.
          </p>
        </div>

        <button 
          onClick={loadRecyclers}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by facility name, city, CPCB license..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Filter City:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium outline-none"
          >
            <option value="ALL">All Hubs (India)</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Vijayawada">Vijayawada</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Delhi">Delhi</option>
          </select>
        </div>
      </div>

      {/* Recyclers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div key={r.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-purple-500/40 transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-1">{r.facility_name}</h3>
                <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  <span>{r.city}, {r.state}</span>
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {r.authorization_status || 'VERIFIED DEMO'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">License No:</span>
                <span className="font-mono text-slate-300">{r.authorization_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reliability Score:</span>
                <span className="font-bold text-emerald-400">{r.reliability_score || 98.5}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compliance Rating:</span>
                <span className="text-amber-400 font-bold flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{r.rating || 4.9} / 5.0</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
              <span>Contact: {r.contact_phone}</span>
              <span className="text-emerald-400 font-bold">CPCB Compliant</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
