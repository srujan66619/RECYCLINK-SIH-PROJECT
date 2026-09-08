import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';

export default function PriceAnomalyAlert({
  expectedRange = '₹390 – ₹480',
  offeredPrice = 270,
  differencePercent = -40.7,
  severity = 'HIGH',
  reason = 'Offer is significantly below the estimated fair-price range.',
  onReviewOthers = null
}) {
  const isHighRisk = severity === 'HIGH' || severity === 'CRITICAL';

  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${
      isHighRisk 
        ? 'bg-rose-950/80 border-rose-500/80 text-rose-100 shadow-xl shadow-rose-950/50' 
        : 'bg-amber-950/80 border-amber-500/80 text-amber-100 shadow-xl shadow-amber-950/50'
    } space-y-3`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${isHighRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
              isHighRisk ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {isHighRisk ? 'CRITICAL PRICE CHECK' : 'PRICE DEVIATION WARNING'}
            </span>
            <span className="text-xs font-mono font-bold">
              {differencePercent > 0 ? `+${differencePercent}%` : `${differencePercent}%`}
            </span>
          </div>
          <h4 className="font-display font-bold text-sm text-white">
            Predatory Rate Warning
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {reason}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">CPCB Fair Range</span>
          <span className="text-emerald-400 font-bold">{expectedRange} /kg</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-sans">Dismantler Bid</span>
          <span className="text-rose-400 font-bold">₹{offeredPrice} /kg</span>
        </div>
      </div>

      {onReviewOthers && (
        <button
          onClick={onReviewOthers}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Compare Higher Eligible Offers</span>
        </button>
      )}
    </div>
  );
}
