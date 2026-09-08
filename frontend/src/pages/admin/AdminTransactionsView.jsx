import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, Search, Filter, CheckCircle2, 
  Clock, IndianRupee, Scale, Building2, RefreshCw 
} from 'lucide-react';
import { getAdminTransactions, getAdminTransactionPipeline } from '../../services/api';

export default function AdminTransactionsView() {
  const [transactions, setTransactions] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txList, pipe] = await Promise.all([
        getAdminTransactions({ status: selectedStatus !== 'ALL' ? selectedStatus : undefined }),
        getAdminTransactionPipeline()
      ]);
      setTransactions(txList || []);
      setPipeline(pipe);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { key: "ALL", label: "All Transactions" },
    { key: "INITIATED", label: "Initiated" },
    { key: "OFFER_RECEIVED", label: "Offer Received" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "PICKUP_SCHEDULED", label: "Pickup Scheduled" },
    { key: "HANDOVER_VERIFICATION", label: "Handover Verification" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const filtered = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      String(t.id).includes(q) ||
      String(t.lot_id).includes(q) ||
      t.status?.toLowerCase().includes(q) ||
      t.payment_status?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              COMMERCIAL OPERATIONS
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            Transaction Pipeline & Settlements
          </h1>
          <p className="text-xs text-slate-400">
            Real-time monitoring of informal collector trade lots, recycler offers, and verified UPI disbursements.
          </p>
        </div>

        <button 
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Pipeline Stages Navigation Bar */}
      {pipeline && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap gap-2">
          {stages.map((stg) => {
            const count = stg.key === "ALL" ? pipeline.total_in_pipeline : (pipeline.stages?.[stg.key] || 0);
            const isSelected = selectedStatus === stg.key;
            return (
              <button
                key={stg.key}
                onClick={() => setSelectedStatus(stg.key)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSelected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{stg.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isSelected ? 'bg-emerald-500/40 text-white font-bold' : 'bg-slate-800 text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="flex items-center space-x-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by Transaction ID, Lot ID, status..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Lot Reference</th>
                <th className="py-3 px-4">Collector</th>
                <th className="py-3 px-4">Recycler</th>
                <th className="py-3 px-4">Agreed Rate</th>
                <th className="py-3 px-4">Settled Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-white">#TX-{t.id}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">LOT-{t.lot_id}</td>
                  <td className="py-3 px-4 text-slate-300">COL-{t.collector_id}</td>
                  <td className="py-3 px-4 text-slate-300">REC-{t.recycler_id}</td>
                  <td className="py-3 px-4 font-mono">₹{t.agreed_price_per_kg}/kg</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    ₹{(t.final_price || t.total_amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.status === 'COMPLETED' 
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.payment_status === 'PAID'
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {t.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No transactions found matching filter criteria.
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
