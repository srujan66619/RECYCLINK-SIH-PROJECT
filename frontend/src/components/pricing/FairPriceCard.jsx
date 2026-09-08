import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Minus, ShieldCheck, Info } from 'lucide-react';

export default function FairPriceCard({
  material = 'PCB',
  weight = 2.4,
  recommendedPrice = 455,
  minPrice = 390,
  maxPrice = 480,
  totalValue = 1092,
  confidence = 'HIGH',
  confidenceScore = 0.88,
  trend = 'STABLE',
  pctChange = 0.0,
  condition = 'Standard Scrap',
  location = 'Hyderabad'
}) {
  const getConfidenceBadge = () => {
    if (confidence === 'HIGH') {
      return {
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        label: 'High Price Confidence'
      };
    } else if (confidence === 'MEDIUM') {
      return {
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        label: 'Moderate Evidence'
      };
    }
    return {
      bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      label: 'Indicative Estimate'
    };
  };

  const getTrendBadge = () => {
    if (trend === 'RISING') {
      return (
        <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[11px]">
          <TrendingUp className="w-3.5 h-3.5" />
          RISING {pctChange > 0 ? `+${pctChange}%` : ''}
        </span>
      );
    } else if (trend === 'FALLING') {
      return (
        <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 text-[11px]">
          <TrendingDown className="w-3.5 h-3.5" />
          FALLING {pctChange < 0 ? `${pctChange}%` : ''}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 text-[11px]">
        <Minus className="w-3.5 h-3.5 text-slate-400" />
        STABLE TREND
      </span>
    );
  };

  const confBadge = getConfidenceBadge();

  return (
    <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${confBadge.bg}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {confBadge.label}
        </span>
        {getTrendBadge()}
      </div>

      {/* Hero Payout Numbers */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="text-xs text-slate-400 font-medium block">
            Estimated Fair Value ({weight} kg)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ₹{totalValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium block">
            Recommended Rate
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400">
            ₹{recommendedPrice}
            <span className="text-xs text-slate-400 font-normal"> /kg</span>
          </span>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">CPCB Range</span>
          <span className="font-mono font-bold text-slate-200">₹{minPrice} – ₹{maxPrice} /kg</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Condition & Hub</span>
          <span className="text-slate-200 font-medium">{condition} • {location}</span>
        </div>
      </div>
    </div>
  );
}
