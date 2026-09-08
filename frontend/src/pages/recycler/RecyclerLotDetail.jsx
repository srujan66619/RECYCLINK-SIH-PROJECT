import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, ShieldCheck, Scale, MapPin, 
  IndianRupee, AlertTriangle, Calendar, Clock, CheckCircle2, 
  XCircle, Truck, Sparkles, Tag, Check, X, FileCheck, Info
} from 'lucide-react';
import { 
  getRecyclerLotDetail, submitRecyclerOffer, 
  acceptRecyclerLot, rejectRecyclerLot 
} from '../../services/api';

export default function RecyclerLotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Offer Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerRate, setOfferRate] = useState('');
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeWindow, setPickupTimeWindow] = useState('10:00 AM - 01:00 PM');
  const [notes, setNotes] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRecyclerLotDetail(id);
      setLot(data);
      // Pre-fill offer rate with recommended price / weight if not set
      if (data.estimated_weight > 0 && !offerRate) {
        setOfferRate(Math.round(data.recommended_price / data.estimated_weight));
      }
      // Pre-fill tomorrow for pickup date
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setPickupDate(tmrw.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to load lot detail:', err);
      setError(err.response?.data?.detail || 'Lot could not be retrieved.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Real-time Fairness Guardian calculation
  const getOfferFairnessAssessment = () => {
    if (!lot || !offerRate || parseFloat(offerRate) <= 0) return null;
    const rate = parseFloat(offerRate);
    const benchRate = (lot.recommended_price / lot.estimated_weight) || 450.0;

    const diffPct = Math.round(((rate - benchRate) / benchRate) * 100);

    if (rate >= benchRate * 0.98) {
      return {
        tag: 'GOOD OFFER',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        message: 'This offer is at or above the regional CPCB benchmark rate.'
      };
    } else if (rate >= benchRate * 0.75) {
      return {
        tag: 'FAIR',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        message: 'Offer aligns with standard commercial scrap tolerance.'
      };
    } else {
      return {
        tag: 'BELOW FAIR',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        warning: '⚠ PRICE CHECK: This offer is significantly below the estimated fair benchmark range.'
      };
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerRate) return;
    setSubmittingOffer(true);
    setOfferSuccessMsg('');
    setError('');
    try {
      const payload = {
        lot_id: lot.lot_id,
        offer_price_per_kg: parseFloat(offerRate),
        pickup_available: pickupAvailable,
        scheduled_pickup_date: pickupDate ? new Date(pickupDate).toISOString() : null,
        pickup_time_window: pickupTimeWindow,
        notes: notes
      };
      const res = await submitRecyclerOffer(payload);
      setOfferSuccessMsg(res.message);
      setOfferModalOpen(false);
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to submit offer.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleAcceptLot = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      await acceptRecyclerLot(lot.lot_id);
      setActionMsg('✓ Lot accepted into formal custody pipeline!');
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to accept lot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectLot = async () => {
    if (!window.confirm("Are you sure you want to reject this lot? It will be released back to the open collector marketplace.")) return;
    setActionLoading(true);
    setActionMsg('');
    try {
      await rejectRecyclerLot(lot.lot_id);
      setActionMsg('Lot declined and returned to open market.');
      navigate('/recycler/incoming');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to reject lot.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-400">Loading comprehensive e-waste lot specifications...</span>
      </div>
    );
  }

  if (error && !lot) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Error Loading Lot</h3>
        <p className="text-xs text-slate-400">{error}</p>
        <Link to="/recycler/incoming" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white">
          ← Return to Incoming Lots
        </Link>
      </div>
    );
  }

  const fairnessAssessment = getOfferFairnessAssessment();
  const unitBenchRate = Math.round(lot.recommended_price / (lot.estimated_weight || 1));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/recycler/incoming')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incoming Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Trace ID:</span>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            {lot.trace_id}
          </span>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {offerSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{offerSuccessMsg}</span>
          <button onClick={() => setOfferSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Lot Primary Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                {lot.lot_id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {lot.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                lot.hazard_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                lot.hazard_level === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {lot.hazard_level} Hazard
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {lot.material_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {lot.subcategory || 'Standard Grade Scrap'} • Condition: <span className="text-slate-200 font-medium">{lot.condition}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Est. Market Value</span>
            <span className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-400 block font-mono">
              ₹{lot.recommended_price}
            </span>
            <span className="text-[11px] text-slate-400">
              Benchmark: ₹{unitBenchRate}/kg
            </span>
          </div>
        </div>

        {/* Section 9: AI Material Identification Card */}
        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-bold text-base text-white">
                AI Material Identification & Metal Yield
              </h3>
            </div>
            {/* Section 9 requirement: Label as Prototype AI Prediction */}
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {lot.ai_confidence_label} ({Math.round(lot.ai_confidence * 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block">Material Classification</span>
              <span className="font-bold text-white text-sm block">{lot.ai_classification}</span>
              <span className="text-[11px] text-emerald-400">Yield Grade: High-Purity</span>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-[10px] text-slate-400 uppercase block">Potentially Recoverable Precious Metals</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {lot.recoverable_materials.map((metal, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-semibold"
                  >
                    ✦ {metal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 10: Fair Price Intelligence Display */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-teal-400" />
              <span>CPCB Fair Price Benchmark Intelligence</span>
            </h3>
            <span className="text-[11px] text-slate-400">Open Index Reference</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Estimated Range</span>
              <span className="font-mono font-bold text-slate-200 text-sm block mt-0.5">
                ₹{lot.estimated_price_min} – ₹{lot.estimated_price_max}
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Fair Benchmark Rate</span>
              <span className="font-mono font-bold text-white text-sm block mt-0.5">
                ₹{unitBenchRate}/kg
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Recommended Total</span>
              <span className="font-mono font-bold text-emerald-400 text-sm block mt-0.5">
                ₹{lot.recommended_price}
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Collector Origin</span>
              <span className="font-medium text-slate-200 text-xs block mt-0.5 truncate">
                {lot.collector_area}, {lot.collector_city} ({lot.distance_km} km)
              </span>
            </div>
          </div>
        </div>

        {/* Existing Offer / Transaction Notice if already present */}
        {lot.existing_offer && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-cyan-300 block">Your Current Active Offer</span>
              <span className="text-slate-300">
                Rate: ₹{lot.existing_offer.offer_rate}/kg • Total: ₹{lot.existing_offer.total_val} • Status: {lot.existing_offer.status}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold uppercase text-[10px]">
              {lot.existing_offer.status}
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setOfferModalOpen(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow transition flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" />
            <span>{lot.existing_offer ? 'Update Purchase Offer' : 'Submit Formal Offer'}</span>
          </button>

          {lot.status !== 'ACCEPTED' && (
            <button
              onClick={handleAcceptLot}
              disabled={actionLoading}
              className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Lot Immediately</span>
            </button>
          )}

          {lot.status === 'ACCEPTED' && (
            <button
              onClick={() => navigate('/recycler/pickups')}
              className="py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Schedule Pickup</span>
            </button>
          )}

          <button
            onClick={handleRejectLot}
            disabled={actionLoading}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition text-sm font-semibold border border-slate-700/60"
          >
            Reject Lot
          </button>
        </div>
      </div>

      {/* Section 11 & 38: Recycler Offer Modal */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Formal Purchase Offer
                </h3>
                <span className="text-xs text-slate-400">
                  Lot: {lot.lot_id} ({lot.material_name}, {lot.estimated_weight} kg)
                </span>
              </div>
              <button
                onClick={() => setOfferModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4 text-xs">
              {/* Benchmark Reference */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">CPCB Benchmark</span>
                  <span className="font-mono font-bold text-white text-sm">₹{unitBenchRate}/kg</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Total Est. Lot Value</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">₹{lot.recommended_price}</span>
                </div>
              </div>

              {/* Offer Rate Input */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Your Offer Rate (₹ per kg) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={offerRate}
                    onChange={(e) => setOfferRate(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="465"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Computed Payout: <span className="font-mono font-bold text-white">₹{Math.round((parseFloat(offerRate) || 0) * lot.estimated_weight)}</span>
                </span>
              </div>

              {/* Real-time Fairness Feedback (Section 12 & 38) */}
              {fairnessAssessment && (
                <div className={`p-3 rounded-xl border ${fairnessAssessment.color} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wide">
                      Fairness Status: {fairnessAssessment.tag}
                    </span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  {fairnessAssessment.warning ? (
                    <p className="text-[11px] font-semibold text-amber-300">
                      {fairnessAssessment.warning}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-300">
                      {fairnessAssessment.message}
                    </p>
                  )}
                </div>
              )}

              {/* Pickup Availability Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-semibold text-white block">Logistics Pickup Service</span>
                  <span className="text-[10px] text-slate-400 block">Can your transport fleet collect from collector?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickupAvailable(!pickupAvailable)}
                  className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                    pickupAvailable ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white block shadow"></span>
                </button>
              </div>

              {/* Pickup Date & Window */}
              {pickupAvailable && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Target Pickup Date
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Time Window
                    </label>
                    <select
                      value={pickupTimeWindow}
                      onChange={(e) => setPickupTimeWindow(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM</option>
                      <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
                      <option value="05:00 PM - 08:00 PM">05:00 PM - 08:00 PM</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Optional Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Offer Remarks / Logistics Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Authorized CPCB closed-loop hydrometallurgical recovery with direct digital scale..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow disabled:opacity-50"
                >
                  {submittingOffer ? 'Recording on Audit Trail...' : 'Submit Formal Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
