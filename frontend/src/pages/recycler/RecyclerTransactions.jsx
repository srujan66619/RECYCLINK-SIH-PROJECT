import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, IndianRupee, CheckCircle2, AlertCircle, 
  RefreshCw, Search, Filter, QrCode, ChevronRight, X, Clock,
  CreditCard, ShieldCheck, Sparkles, Building2
} from 'lucide-react';
import { 
  listRecyclerTransactions, getRecyclerTransactionDetail, 
  updateRecyclerPaymentStatus 
} from '../../services/api';

export default function RecyclerTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Transaction Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await listRecyclerTransactions(params);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err.response?.data?.detail || 'Failed to load transaction ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleOpenDetail = async (txnId) => {
    setDetailModalOpen(true);
    setModalLoading(true);
    setPaymentMsg('');
    try {
      const data = await getRecyclerTransactionDetail(txnId);
      setSelectedTxn(data);
    } catch (err) {
      console.error('Failed to load txn detail:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Section 22: Demo Payment Status Update
  const handleMarkPaymentPaid = async (txnId) => {
    setUpdatingPayment(true);
    setPaymentMsg('');
    try {
      const res = await updateRecyclerPaymentStatus(txnId, {
        payment_status: 'PAID',
        payment_method: 'UPI Instant Transfer (Demo Simulated)',
        payment_notes: 'Settled directly to collector UPI VPA via RECYCLINK smart contract ledger.'
      });
      setPaymentMsg('✓ Payout confirmed as PAID! Transaction marked COMPLETED in formal registry.');
      // Refresh modal
      const data = await getRecyclerTransactionDetail(txnId);
      setSelectedTxn(data);
      // Refresh list
      await fetchTransactions();
    } catch (err) {
      console.error('Payment update error:', err);
      setPaymentMsg('Failed to update payment status.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const filteredTxns = transactions.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.lot_id.toLowerCase().includes(q) ||
      t.trace_id.toLowerCase().includes(q) ||
      t.material.toLowerCase().includes(q) ||
      t.collector_area.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Formal Custody & Settlement Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade record of physical scrap intake, calibrated scale reconciliation, and digital payouts.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Trace ID, Lot ID, material, or collector area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Filter (Section 25) */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
              <option value="HANDED_OVER">Handed Over / Verification</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading verified transaction ledger...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
          {error}
        </div>
      ) : filteredTxns.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Transactions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Transactions will appear here when you accept incoming lots and schedule logistics handovers.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Trace ID</th>
                  <th className="p-4">Lot ID</th>
                  <th className="p-4">Material</th>
                  <th className="p-4">Scale Weight</th>
                  <th className="p-4">Collector Region</th>
                  <th className="p-4">Final Valuation</th>
                  <th className="p-4">Custody Status</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTxns.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {tx.trace_id}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {tx.lot_id}
                    </td>
                    <td className="p-4 text-white font-medium">
                      {tx.material}
                    </td>
                    <td className="p-4 text-slate-300">
                      {tx.weight_kg} kg
                    </td>
                    <td className="p-4 text-slate-400">
                      {tx.collector_area}
                    </td>
                    <td className="p-4 font-mono font-bold text-white text-sm">
                      ₹{tx.final_price}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        tx.status === 'HANDED_OVER' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        tx.status === 'PICKUP_SCHEDULED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        tx.payment_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {tx.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(tx.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Detail & Audit Dossier Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Formal Custody & Pricing Dossier
                </h3>
                <span className="text-xs text-slate-400">
                  Transaction #{selectedTxn?.id} • Trace ID: {selectedTxn?.lot?.trace_id}
                </span>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading || !selectedTxn ? (
              <div className="text-center py-12 space-y-2 text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Loading chain-of-custody data...</p>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                
                {paymentMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                    {paymentMsg}
                  </div>
                )}

                {/* Section 40: Pricing Chain Display */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                    Transparent Price Breakdown
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-900 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase block">AI Est. Range</span>
                      <span className="font-mono font-bold text-slate-200">
                        ₹{selectedTxn.pricing_chain?.ai_estimate_min}–{selectedTxn.pricing_chain?.ai_estimate_max}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase block">Benchmark Rate</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{Math.round(selectedTxn.pricing_chain?.fair_benchmark_rate || 0)}/kg
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase block">Recycler Offer</span>
                      <span className="font-mono font-bold text-cyan-400">
                        ₹{selectedTxn.pricing_chain?.recycler_offer_rate}/kg
                      </span>
                    </div>

                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 uppercase block font-bold">Final Settlement</span>
                      <span className="font-mono font-bold text-white text-sm">
                        ₹{selectedTxn.pricing_chain?.final_price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Handover Specifications */}
                {selectedTxn.handover && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                      Scale Verification Metadata
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Verified Scale Weight:</span>
                        <span className="font-bold text-white font-mono">{selectedTxn.handover.verified_weight} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Scale Variance:</span>
                        <span className="font-mono text-emerald-400">{selectedTxn.handover.variance_pct}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Verified By:</span>
                        <span className="text-white">{selectedTxn.handover.verified_by}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 22: Payment Status Control */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block text-sm">Payout Settlement Status</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {/* Section 22 Requirement: Clearly label as Demo Payment Status */}
                        Mode: {selectedTxn.payment_method} • <span className="text-amber-400 font-semibold">(Demo Payment Status)</span>
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      selectedTxn.payment_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {selectedTxn.payment_status}
                    </span>
                  </div>

                  {selectedTxn.payment_ref && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400">
                      Payment Ref: {selectedTxn.payment_ref}
                    </div>
                  )}

                  {selectedTxn.payment_status !== 'PAID' && (
                    <button
                      onClick={() => handleMarkPaymentPaid(selectedTxn.id)}
                      disabled={updatingPayment}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{updatingPayment ? 'Simulating Instant Settlement...' : `Mark as PAID (Disburse ₹${selectedTxn.pricing_chain?.final_price || 0} UPI)`}</span>
                    </button>
                  )}
                </div>

                {/* Chronological Audit Trail Trace Events */}
                <div className="space-y-3 pt-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                    Chain of Custody Provenance Events ({selectedTxn.trace_events?.length || 0})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedTxn.trace_events?.map((e, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        <div className="flex items-center justify-between text-slate-400 mb-0.5">
                          <span className="font-bold text-emerald-400">{e.title || e.stage}</span>
                          <span className="text-[10px]">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-300">{e.description}</p>
                        <span className="text-[10px] text-slate-500 block mt-1">Logged by: {e.actor_name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
