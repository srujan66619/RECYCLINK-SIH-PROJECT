import React from 'react';
import { ShieldCheck, Truck, Star, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import MatchScore from './MatchScore';

export default function RecyclerOfferCard({
  recycler,
  weight = 2.4,
  isBestMatch = false,
  onSelect = () => {},
  selected = false
}) {
  const rate = recycler.offered_price_per_kg || recycler.offer_price || 455.0;
  const total = Math.round(rate * weight);
  const reasons = recycler.match_reasons || [
    'CPCB-Licensed e-waste dismantler',
    'Accepts this material stream',
    'Doorstep pickup available'
  ];

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer relative overflow-hidden space-y-3.5 ${
        selected
          ? 'bg-slate-900 border-emerald-400 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/50'
          : isBestMatch
          ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/70 hover:border-emerald-400 shadow-lg'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      {isBestMatch && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
          BEST MATCH
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 pr-16">
        <div>
          <h3 className="font-display font-bold text-white text-base leading-snug">
            {recycler.facility_name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Formal Recycler
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {recycler.rating || 4.8}
            </span>
          </div>
        </div>
      </div>

      {/* Price & Payout Row */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
            Offered Rate
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            ₹{rate}
            <span className="text-xs text-slate-400 font-normal"> /kg</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
            Total Payout ({weight} kg)
          </span>
          <span className="text-lg font-bold text-white font-mono">
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Logistics & Distance Tags */}
      <div className="flex items-center gap-3 text-xs text-slate-300">
        <span className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          {recycler.distance_km} km away
        </span>
        {recycler.pickup_available && (
          <span className="flex items-center gap-1 text-teal-300 font-medium">
            <Truck className="w-3.5 h-3.5" />
            Free Doorstep Pickup
          </span>
        )}
      </div>

      {/* Recommender Match Score & Component Breakdown */}
      <MatchScore
        overallScore={recycler.overall_score || recycler.reliability_score || 90}
        componentScores={recycler.component_scores}
      />

      {/* Explainability Bullets: Why Recommended */}
      <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
          Why Recommended:
        </span>
        <div className="space-y-0.5">
          {reasons.map((r, i) => (
            <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Select Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
          selected
            ? 'bg-emerald-400 text-slate-950'
            : isBestMatch
            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            : 'bg-slate-800 hover:bg-slate-700 text-white'
        }`}
      >
        <span>{selected ? 'SELECTED RECYCLER' : 'SELECT THIS RECYCLER'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
