import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Scale, ShieldCheck, CheckCircle2, AlertTriangle, 
  IndianRupee, ArrowRight, ArrowDown, FileCheck, RefreshCw, 
  Sparkles, Check, X, Camera, QrCode, Printer, ExternalLink
} from 'lucide-react';
import { 
  listRecyclerTransactions, getHandoverVerifyDetails, 
  submitHandoverVerification, getTraceProvenance, submitHandover
} from '../../services/api';

export default function RecyclerHandover() {
  const [searchParams] = useSearchParams();
  const { lotId, transactionId, id: routeId } = useParams();
  const navigate = useNavigate();
  const initialParam = searchParams.get('txn') || transactionId || lotId || routeId;

  const [eligibleTxns, setEligibleTxns] = useState([]);
  const [selectedTxnId, setSelectedTxnId] = useState(initialParam || '');
  const [lotDetails, setLotDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [finalScaleWeight, setFinalScaleWeight] = useState('');
  const [finalRate, setFinalRate] = useState('');
  const [remarks, setRemarks] = useState('Scale calibrated under CPCB standards. Immediate UPI credit.');
  const [signature, setSignature] = useState('AUTH-REC-LICENSED');
  const [submitting, setSubmitting] = useState(false);
  const [handoverResult, setHandoverResult] = useState(null);

  const loadEligibleTransactions = async () => {
    setLoading(true);
    try {
      const allTxns = await listRecyclerTransactions();
      // Lots ready for handover or in logistics
      const pending = allTxns.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
      setEligibleTxns(pending);

      let targetId = selectedTxnId;
      if (!targetId && pending.length > 0) {
        targetId = String(pending[0].id);
        setSelectedTxnId(targetId);
      }

      if (targetId) {
        await loadLotDetails(targetId);
      }
    } catch (err) {
      console.error('Failed to load eligible transactions:', err);
      setError('Unable to load pending custody lots.');
    } finally {
      setLoading(false);
    }
  };

  const loadLotDetails = async (txnId) => {
    setError('');
    setHandoverResult(null);
    try {
      if (String(txnId).startsWith('RC-') || String(txnId).startsWith('LOT-')) {
        const trace = await getTraceProvenance(txnId);
        const initW = trace.initial_weight || trace.estimated_weight || 2.4;
        const finalW = trace.final_weight || initW;
        const rate = trace.quoted_price ? Math.round(trace.quoted_price / initW) : 200.0;
        setLotDetails({
          transaction_id: txnId,
          lot_id: trace.lot_id,
          trace_id: trace.trace_id,
          material: trace.material,
          initial_estimated_weight: initW,
          collector_area: trace.collector_city,
          pickup_status: trace.current_status,
          recycler_offer_rate: rate,
          fair_recommended_rate: rate
        });
        setFinalScaleWeight(finalW);
        setFinalRate(rate);
        return;
      }
      const data = await getHandoverVerifyDetails(txnId);
      setLotDetails(data);
      setFinalScaleWeight(data.initial_estimated_weight || 2.4);
      setFinalRate(data.recycler_offer_rate || 465.0);
    } catch (err) {
      console.error('Failed to load handover details for txn:', txnId, err);
      setError('Failed to load lot specifications.');
    }
  };

  useEffect(() => {
    loadEligibleTransactions();
  }, []);

  const handleTxnSelectChange = async (e) => {
    const id = e.target.value;
    setSelectedTxnId(id);
    if (id) {
      await loadLotDetails(id);
    } else {
      setLotDetails(null);
    }
  };

  // Section 19: Final Weight & Variance Calculation
  const getWeightVariance = () => {
    if (!lotDetails || !finalScaleWeight) return { diff: 0, pct: 0, isAnomaly: false };
    const init = lotDetails.initial_estimated_weight || 1.0;
    const finalW = parseFloat(finalScaleWeight) || 0;
    const diff = roundTo2(finalW - init);
    const pct = Math.round((Math.abs(diff) / init) * 100);
    return {
      diff,
      pct,
      isAnomaly: pct >= 25.0
    };
  };

  const roundTo2 = (num) => Math.round(num * 100) / 100;

  // Section 20: Pricing calculations
  const weightVariance = getWeightVariance();
  const currentFinalRate = parseFloat(finalRate) || (lotDetails?.recycler_offer_rate || 465);
  const currentFinalWeight = parseFloat(finalScaleWeight) || 0;
  const computedFinalTotal = roundTo2(currentFinalWeight * currentFinalRate);

  const handleConfirmHandover = async (e) => {
    e.preventDefault();
    if (!selectedTxnId || !currentFinalWeight) return;
    setSubmitting(true);
    setError('');
    try {
      let res;
      if (String(selectedTxnId).startsWith('RC-') || String(selectedTxnId).startsWith('LOT-')) {
        res = await submitHandover({
          lot_id: selectedTxnId,
          final_weight: currentFinalWeight,
          final_price: computedFinalTotal,
          condition: 'Verified on calibrated scale',
          notes: remarks
        });
      } else {
        const payload = {
          final_verified_weight: currentFinalWeight,
          final_agreed_rate_per_kg: currentFinalRate,
          final_price: computedFinalTotal,
          remarks: remarks,
          recycler_signature: signature
        };
        res = await submitHandoverVerification(selectedTxnId, payload);
      }
      setHandoverResult(res);
      await loadEligibleTransactions();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Handover verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-purple-400" />
            <span>Digital Custody Handover Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated digital scale weight reconciliation, transparency comparison, and tamper-evident custody seal.
          </p>
        </div>

        <button
          onClick={loadEligibleTransactions}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Handover Success Banner */}
      {handoverResult && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Material Handover Formally Verified & Sealed!
              </h3>
              <span className="text-xs text-emerald-400 font-mono">
                Lot {handoverResult.lot_id} • Trace ID: {handoverResult.trace_id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Verified Scale Weight</span>
              <span className="font-bold text-white text-sm">{handoverResult.final_weight} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Scale Variance</span>
              <span className={`font-bold text-sm ${handoverResult.is_variance_anomaly ? 'text-amber-400' : 'text-emerald-400'}`}>
                {handoverResult.variance_pct}% ({handoverResult.weight_difference_kg > 0 ? `+${handoverResult.weight_difference_kg}` : handoverResult.weight_difference_kg} kg)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Agreed Rate</span>
              <span className="font-bold text-white text-sm">₹{handoverResult.final_rate_per_kg}/kg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Final Settlement Payout</span>
              <span className="font-bold text-emerald-400 text-sm">₹{handoverResult.final_price}</span>
            </div>
          </div>

          {handoverResult.variance_warning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              {handoverResult.variance_warning}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to={`/trace/${handoverResult.trace_id}`}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Inspect Public Trace Manifest</span>
            </Link>

            <Link
              to="/recycler/transactions"
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              Proceed to Transactions & Payouts →
            </Link>
          </div>
        </div>
      )}

      {/* Transaction Selection Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Select E-Waste Lot Ready for Custody Handover:
        </label>
        <select
          value={selectedTxnId}
          onChange={handleTxnSelectChange}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          {eligibleTxns.length === 0 ? (
            <option value="">No pending lots awaiting verification</option>
          ) : (
            eligibleTxns.map((t) => (
              <option key={t.id} value={t.id}>
                TXN-{t.id} • {t.lot_id} — {t.material} ({t.weight_kg} kg) • Collector: {t.collector_area} [{t.status}]
              </option>
            ))
          )}
        </select>
      </div>

      {lotDetails && (
        <form onSubmit={handleConfirmHandover} className="space-y-6">
          
          {/* Section 39: Handover Verification Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
                  HANDOVER VERIFICATION DOCKET
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">
                  {lotDetails.material}
                </h2>
                <span className="text-xs text-slate-400">
                  Origin: {lotDetails.collector_area} • Lot ID: {lotDetails.lot_id}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Transaction Status</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {lotDetails.status}
                </span>
              </div>
            </div>

            {/* Section 20 & 40: Complete Pricing Chain Transparency Display */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Transparent Pricing Chain Verification</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">CPCB Audit Compliant</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                {/* Step 1: AI Estimate */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">1. AI Estimate</span>
                  <span className="font-mono font-bold text-slate-300 text-sm block">
                    ₹{lotDetails.fair_price_min}–{lotDetails.fair_price_max}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Initial Computer Vision</span>
                </div>

                {/* Step 2: Fair Price Benchmark */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">2. Fair Benchmark</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm block">
                    ₹{lotDetails.fair_recommended_rate}/kg
                  </span>
                  <span className="text-[10px] text-slate-500 block">CPCB Commodity Index</span>
                </div>

                {/* Step 3: Recycler Offer */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">3. Recycler Offer</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm block">
                    ₹{lotDetails.recycler_offer_rate}/kg
                  </span>
                  <span className="text-[10px] text-slate-500 block">Agreed Logistics Bid</span>
                </div>

                {/* Step 4: Final Settlement */}
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/40 space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono block">4. Final Valuation</span>
                  <span className="font-mono font-bold text-white text-base block">
                    ₹{computedFinalTotal}
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-semibold">
                    {currentFinalWeight} kg @ ₹{currentFinalRate}/kg
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs: Final Weight & Rate Calibration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Final Scale Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Calibrated Digital Scale Weight (kg) *
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={finalScaleWeight}
                    onChange={(e) => setFinalScaleWeight(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="2.3"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Initial Estimated: {lotDetails.initial_estimated_weight} kg</span>
                  <span className={`font-mono font-semibold ${weightVariance.diff < 0 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                    Difference: {weightVariance.diff > 0 ? `+${weightVariance.diff}` : weightVariance.diff} kg
                  </span>
                </div>
              </div>

              {/* Final Rate per kg */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Final Agreed Rate (₹ per kg) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={finalRate}
                    onChange={(e) => setFinalRate(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="465"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Benchmark Reference: ₹{lotDetails.fair_recommended_rate}/kg
                </span>
              </div>

            </div>

            {/* Section 19: Scale Weight Variance Warning Banner */}
            {weightVariance.isAnomaly && (
              <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>⚠ WEIGHT VARIANCE: {weightVariance.pct}% Discrepancy Detected</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Final scale weight ({currentFinalWeight} kg) differs significantly from the collector's initial estimate ({lotDetails.initial_estimated_weight} kg). 
                  RECYCLINK Anomaly Guardian will flag this for regulatory audit log without blocking transaction completion.
                </p>
              </div>
            )}

            {/* Verification Checklist */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Physical scrap lot matches declared grade ({lotDetails.material})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Weighed on certified calibrated digital platform scale</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Collector presented physical manifest / Circular QR ID</span>
              </div>
            </div>

            {/* Remarks & Recycler Signature */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Handover Remarks / Scale Serial No.
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Authorized Recycler Digital Signature Stamp
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Confirmation CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-purple-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileCheck className="w-5 h-5" />
              <span>{submitting ? 'Sealing Chain of Custody...' : `CONFIRM DIGITAL HANDOVER (₹${computedFinalTotal})`}</span>
            </button>

          </div>
        </form>
      )}

    </div>
  );
}
