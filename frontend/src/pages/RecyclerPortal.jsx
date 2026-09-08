import React, { useState, useEffect } from 'react';
import { 
  Building2, CheckCircle, Truck, Scale, QrCode, AlertTriangle, 
  ArrowUpRight, Clock, FileCheck, Check, X, ShieldCheck, IndianRupee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listTransactions, updateTransactionStatus, confirmHandover, listLots } from '../services/api';

export default function RecyclerPortal({ onHandoverCompleted }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [finalScaleWeight, setFinalScaleWeight] = useState(2.4);
  const [finalRate, setFinalRate] = useState(465.0);
  const [handoverSuccess, setHandoverSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await listTransactions({ recycler_id: user?.profile_id || 1 });
      setTransactions(data);
    } catch {
      // Fallback
    }
  };

  const handleSchedulePickup = async (txId) => {
    try {
      await updateTransactionStatus(txId, 'PICKUP_SCHEDULED');
      await loadData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleOpenHandover = (tx) => {
    setSelectedTx(tx);
    const weight = tx.final_weight || tx.lot?.estimated_weight || 2.4;
    setFinalScaleWeight(weight);
    setFinalRate(tx.agreed_price_per_kg || 465.0);
    setHandoverSuccess(null);
    setHandoverModalOpen(true);
  };

  const submitHandover = async () => {
    if (!selectedTx) return;
    setIsLoading(true);
    try {
      const res = await confirmHandover(selectedTx.id, {
        final_verified_weight: parseFloat(finalScaleWeight),
        final_agreed_rate_per_kg: parseFloat(finalRate),
        remarks: "Scale calibrated under CPCB standards. Immediate UPI credit.",
        recycler_signature: `AUTH-RECYC-${user?.user_id || 22}`
      });
      setHandoverSuccess(res);
      await loadData();
      if (onHandoverCompleted) onHandoverCompleted(res);
    } catch (err) {
      alert("Handover failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = transactions.filter(t => t.status === 'COMPLETED').length;
  const pendingCount = transactions.filter(t => t.status !== 'COMPLETED').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Recycler Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ✓ CPCB LICENSED RECYCLER
            </span>
            <span className="text-xs text-slate-400">CPCB/AUTH/TS/2026/001</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            {user?.full_name || 'GreenCycle E-Waste Technologies'}
          </h2>
          <p className="text-xs text-slate-400">
            Plot #101, Industrial Development Area, Hyderabad, Telangana
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Formal Handover Success</span>
            <span className="text-xl font-display font-bold text-emerald-400">{completedCount} Lots</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Pending Pickups</span>
            <span className="text-xl font-display font-bold text-amber-400">{pendingCount} Lots</span>
          </div>
        </div>
      </div>

      {/* Recycler Operations KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Incoming Bids</span>
          <span className="text-2xl font-bold font-display text-white mt-1">12</span>
          <span className="text-[10px] text-emerald-400 block mt-1">Ready for pickup</span>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Pending Logistics</span>
          <span className="text-2xl font-bold font-display text-amber-400 mt-1">{pendingCount}</span>
          <span className="text-[10px] text-slate-400 block mt-1">GPS fleet allocated</span>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Ingested E-Waste</span>
          <span className="text-2xl font-bold font-display text-emerald-400 mt-1">1,840 kg</span>
          <span className="text-[10px] text-teal-400 block mt-1">High grade circuit boards</span>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Payout Disbursed</span>
          <span className="text-2xl font-bold font-display text-white mt-1">₹8,55,600</span>
          <span className="text-[10px] text-emerald-400 block mt-1">100% UPI Settlement</span>
        </div>
      </div>

      {/* Operations Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-white">
            Allocated Collector E-Waste Lots
          </h3>
          <span className="text-xs text-slate-400">
            Showing {transactions.length} transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 sm:p-4">Trace ID</th>
                <th className="p-3 sm:p-4">Material Grade</th>
                <th className="p-3 sm:p-4">Weight (kg)</th>
                <th className="p-3 sm:p-4">Agreed Rate</th>
                <th className="p-3 sm:p-4">Total Amount</th>
                <th className="p-3 sm:p-4">Status</th>
                <th className="p-3 sm:p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3 sm:p-4 font-bold text-emerald-400 font-mono">
                    {tx.lot?.trace_id || `RC-2026-${String(tx.id).padStart(6, '0')}`}
                  </td>
                  <td className="p-3 sm:p-4 text-white font-medium">
                    {tx.lot?.material_name || "PCB Motherboard"}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-300">
                    {tx.final_weight || tx.lot?.estimated_weight || 2.4} kg
                  </td>
                  <td className="p-3 sm:p-4 text-slate-300 font-mono">
                    ₹{tx.agreed_price_per_kg}/kg
                  </td>
                  <td className="p-3 sm:p-4 font-bold text-white font-mono">
                    ₹{tx.total_amount || (tx.agreed_price_per_kg * (tx.lot?.estimated_weight || 2.4)).toFixed(0)}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                      tx.status === 'PICKUP_SCHEDULED' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right space-x-2">
                    {tx.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleSchedulePickup(tx.id)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                      >
                        Schedule Pickup
                      </button>
                    )}

                    {tx.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => handleOpenHandover(tx)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                      >
                        Verify Handover
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center justify-end space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Formally Ingested</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIGITAL HANDOVER VERIFICATION MODAL */}
      {handoverModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h4 className="font-display font-bold text-lg text-white">Digital Handover Verification</h4>
              </div>
              <button 
                onClick={() => setHandoverModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {handoverSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h5 className="font-display text-xl font-bold text-white">Handover Confirmed & Locked!</h5>
                <p className="text-xs text-slate-300">
                  Certified weight: {handoverSuccess.verified_weight_kg} kg <br />
                  Final Disbursal: ₹{handoverSuccess.final_amount_paid} via UPI <br />
                  Trace ID: <strong className="text-emerald-400 font-mono">{handoverSuccess.trace_id}</strong>
                </p>
                <button
                  onClick={() => setHandoverModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 font-bold text-slate-950 text-sm"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div>Trace ID: <strong className="text-emerald-400 font-mono">{selectedTx.lot?.trace_id}</strong></div>
                  <div>Material: <strong className="text-white">{selectedTx.lot?.material_name}</strong></div>
                  <div>Initial Collector Estimate: <strong className="text-white">{selectedTx.lot?.estimated_weight} kg</strong></div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Certified Digital Scale Weight (kg):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={finalScaleWeight}
                    onChange={(e) => setFinalScaleWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-base focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Final Agreed Scrap Rate (₹ / kg):
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={finalRate}
                    onChange={(e) => setFinalRate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-base focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-xs text-slate-400 block">Instant UPI Collector Payout:</span>
                  <span className="text-2xl font-display font-extrabold text-emerald-400">
                    ₹{(parseFloat(finalScaleWeight || 0) * parseFloat(finalRate || 0)).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={submitHandover}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold text-sm transition disabled:opacity-50"
                >
                  {isLoading ? 'Processing Digital Signature...' : 'Confirm Handover & Disburse UPI'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
