import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Inbox, Tag, Truck, Scale, FileText, 
  CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, 
  IndianRupee, ShieldCheck, MapPin, Calendar, Clock, QrCode
} from 'lucide-react';
import { getRecyclerDashboard } from '../../services/api';

export default function RecyclerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRecyclerDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load recycler dashboard:', err);
      setError(err.response?.data?.detail || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-400">Loading live recycler operations metrics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Failed to connect to Recycler Engine</h3>
        <p className="text-xs text-slate-400">{error || 'Server unreachable'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {stats.authorization_status || '✓ CPCB LICENSED RECYCLER'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {stats.authorization_number}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Good morning, {stats.facility_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Formal E-Waste Ingestion Facility • Reliability Score: <span className="font-bold text-emerald-400">{stats.reliability_score}%</span>
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          title="Refresh Live Data"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700/60 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Realtime</span>
        </button>
      </div>

      {/* Real-time KPI Cards Grid (Section 5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Incoming Lots</span>
            <Inbox className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            {stats.incoming_lots_count}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1">
            Compatible scrap available
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Offers</span>
            <Tag className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-extrabold text-cyan-400">
            {stats.pending_offers_count}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Awaiting collector acceptance
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Scheduled Pickups</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-extrabold text-amber-400">
            {stats.scheduled_pickups_count}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Active transport logistics
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Lots</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-400">
            {stats.completed_transactions_count}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Formal chain custody sealed
          </span>
        </div>
      </div>

      {/* Aggregate Material & Payout Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
              Total E-Waste Ingested
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-emerald-400 mt-1 block">
              {stats.total_weight_kg.toLocaleString()} kg
            </span>
            <span className="text-xs text-slate-400 mt-1 block">
              High-yield PCB, cables, lithium-ion batched
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
              Total Purchase Value Settled
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-white mt-1 block">
              ₹{stats.total_purchase_value.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 mt-1 block">
              ✓ Direct UPI Instant Settlement (Demo)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Dashboard Actions (Section 6 & 13) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          to="/recycler/incoming"
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition text-center space-y-1 group"
        >
          <Inbox className="w-5 h-5 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white block">Incoming Lots</span>
          <span className="text-[10px] text-slate-400 block">Review queue</span>
        </Link>

        <Link
          to="/recycler/offers"
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition text-center space-y-1 group"
        >
          <Tag className="w-5 h-5 text-cyan-400 mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white block">Manage Offers</span>
          <span className="text-[10px] text-slate-400 block">Pricing bids</span>
        </Link>

        <Link
          to="/recycler/pickups"
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition text-center space-y-1 group"
        >
          <Truck className="w-5 h-5 text-amber-400 mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white block">View Pickups</span>
          <span className="text-[10px] text-slate-400 block">Fleet logistics</span>
        </Link>

        <Link
          to="/recycler/scan"
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition text-center space-y-1 group"
        >
          <QrCode className="w-5 h-5 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white block">Scan Trace ID</span>
          <span className="text-[10px] text-slate-400 block">Camera / Manual</span>
        </Link>

        <Link
          to="/recycler/handover"
          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 transition text-center space-y-1 group"
        >
          <Scale className="w-5 h-5 text-purple-400 mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white block">Verify Handover</span>
          <span className="text-[10px] text-slate-400 block">Scale reconciliation</span>
        </Link>
      </div>

      {/* Incoming Lot Queue Table Preview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Incoming E-Waste Lot Opportunities
            </h3>
            <p className="text-xs text-slate-400">
              Grassroots collector lots compatible with your facility's environmental authorization
            </p>
          </div>
          <Link
            to="/recycler/incoming"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View All ({stats.incoming_lots_count})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recent_incoming_lots.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No pending incoming lots in your service radius right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Lot ID</th>
                  <th className="p-3">Material</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Proximity</th>
                  <th className="p-3">Fair Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recent_incoming_lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {lot.lot_id}
                    </td>
                    <td className="p-3 text-white font-medium">
                      {lot.material}
                    </td>
                    <td className="p-3 text-slate-300">
                      {lot.weight_kg} kg
                    </td>
                    <td className="p-3 text-slate-300">
                      {lot.distance_km} km
                    </td>
                    <td className="p-3 font-mono text-emerald-400">
                      ₹{lot.recommended_price}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {lot.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/recycler/lots/${lot.lot_id}`)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Column Layout: Today's Pickups + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Pickups */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Today's Logistics Queue</span>
            </h3>
            <Link to="/recycler/pickups" className="text-xs text-amber-400 hover:underline">
              Manage Pickups
            </Link>
          </div>

          {stats.today_pickups.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
              No pickups scheduled for today. Logistics fleet on standby.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.today_pickups.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{p.lot_id} • {p.material}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {p.time_window} • {p.weight_kg} kg
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Recent Custody Handover Ledger</span>
            </h3>
            <Link to="/recycler/transactions" className="text-xs text-emerald-400 hover:underline">
              View History
            </Link>
          </div>

          {stats.recent_transactions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_transactions.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-400 block">{t.trace_id}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {t.material} • {t.weight_kg} kg • {t.date}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block font-mono">₹{t.total_amount}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.2 rounded inline-block mt-0.5 ${
                      t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
