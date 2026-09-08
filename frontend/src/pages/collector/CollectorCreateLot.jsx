import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, ShieldCheck, MapPin, DollarSign, CheckCircle2, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import lotService from '../../services/lotService';

export default function CollectorCreateLot() {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const material = state.material || 'Printed Circuit Board (PCB)';
  const weight = state.weight_kg || 2.4;
  const photoUrl = state.photo_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80';
  const recycler = state.recycler || {
    id: 1,
    facility_name: 'GreenCycle E-Waste Technologies',
    authorization_no: 'CPCB/AUTH/TS/2026/001',
    offered_price_per_kg: 465.0,
  };
  const rate = state.agreed_rate || recycler.offered_price_per_kg || 455.0;
  const totalAmount = Math.round(rate * weight);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmCreate = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      material_name: material,
      subcategory: 'Standard Scrap',
      weight_kg: Number(weight),
      quoted_price: Number(totalAmount),
      location_address: `${user?.city || 'Hyderabad'}, India`,
      photo_url: photoUrl,
      ai_confidence: 0.94,
      hazard_level: 'MEDIUM',
      condition: 'Standard Scrap',
    };

    try {
      const lot = await lotService.createLot(payload);
      setLoading(false);
      navigate('/collector/lot-success', {
        state: {
          lot,
          recycler,
        },
      });
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error?.message || 'Failed to create lot on backend.');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
          STEP 4 OF 4
        </span>
        <h2 className="text-xl font-black text-white tracking-tight">
          {t('confirm_lot_title') || 'Confirm E-Waste Lot'}
        </h2>
        <p className="text-xs text-slate-400">
          {t('confirm_lot_desc') || 'Review details before generating digital trace manifest'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Confirmation Summary Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Item Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <img
            src={photoUrl}
            alt={material}
            className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
          />
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400">E-Waste Category</span>
            <h3 className="text-base font-bold text-white">{material}</h3>
            <span className="text-xs text-slate-300 font-semibold">{weight} kg certified weight</span>
          </div>
        </div>

        {/* Assigned Recycler */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Assigned Recycler
          </span>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">{recycler.facility_name}</h4>
              <span className="text-[11px] text-emerald-400 font-mono">
                Auth #{recycler.authorization_no || `CPCB/2026/${recycler.id}`}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Verified
            </span>
          </div>
        </div>

        {/* Financial & Location Breakdown */}
        <div className="space-y-2.5 pt-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Offered Rate:</span>
            <span className="text-white font-semibold">₹{rate} / kg</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Intake Location:</span>
            <span className="text-white font-semibold">{user?.city || 'Hyderabad'}, India</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Settlement Channel:</span>
            <span className="text-emerald-400 font-semibold">Instant UPI Disbursal</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
            <span className="text-white">Estimated Payout:</span>
            <span className="text-xl font-black text-emerald-400">₹{totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleConfirmCreate}
        disabled={loading}
        className="w-full min-h-[52px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 active:scale-[0.98] transition disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Trace ID & QR...
          </span>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>{t('create_lot_btn') || 'CONFIRM & CREATE LOT'}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}
