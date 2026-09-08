import React from 'react';

export default function PriceRangeBar({
  minPrice = 390,
  maxPrice = 480,
  recommendedPrice = 455,
  offerPrice = null,
  unit = '₹/kg'
}) {
  // Compute percentage positions for visualization (with 15% margin on both sides)
  const spread = Math.max(1, maxPrice - minPrice);
  const viewMin = Math.max(0, minPrice - spread * 0.25);
  const viewMax = maxPrice + spread * 0.25;
  const totalView = Math.max(1, viewMax - viewMin);

  const minPct = Math.max(5, Math.min(95, ((minPrice - viewMin) / totalView) * 100));
  const maxPct = Math.max(minPct + 5, Math.min(95, ((maxPrice - viewMin) / totalView) * 100));
  const recPct = Math.max(minPct, Math.min(maxPct, ((recommendedPrice - viewMin) / totalView) * 100));

  const offerPct = offerPrice !== null
    ? Math.max(3, Math.min(97, ((offerPrice - viewMin) / totalView) * 100))
    : null;

  const isBelowFair = offerPrice !== null && offerPrice < minPrice;
  const isAboveFair = offerPrice !== null && offerPrice > maxPrice;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-300 uppercase tracking-wider">
          Fair Commodity Range
        </span>
        <span className="font-mono text-emerald-400 font-bold">
          {unit} {minPrice} – {maxPrice}
        </span>
      </div>

      {/* The Spectrum Bar */}
      <div className="relative pt-6 pb-2">
        {/* Offer Marker if provided */}
        {offerPct !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-10"
            style={{ left: `${offerPct}%` }}
          >
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-md whitespace-nowrap ${
                isBelowFair
                  ? 'bg-rose-500 text-white'
                  : isAboveFair
                  ? 'bg-teal-400 text-slate-950'
                  : 'bg-emerald-400 text-slate-950'
              }`}
            >
              Bid: {unit} {offerPrice}
            </span>
            <div
              className={`w-0 h-0 border-x-4 border-x-transparent border-t-4 ${
                isBelowFair
                  ? 'border-t-rose-500'
                  : isAboveFair
                  ? 'border-t-teal-400'
                  : 'border-t-emerald-400'
              }`}
            />
          </div>
        )}

        {/* Track */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
          {/* Below Fair Zone */}
          <div
            className="h-full bg-rose-500/30 border-r border-rose-500/50"
            style={{ width: `${minPct}%` }}
            title="Below Fair Range"
          />
          {/* Fair Range Zone */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500/60 to-teal-500/60 border-r border-emerald-400/50"
            style={{ width: `${maxPct - minPct}%` }}
            title="CPCB Fair Benchmark Range"
          />
          {/* Premium Zone */}
          <div
            className="h-full bg-teal-500/30 flex-1"
            title="Premium Recycler Bid"
          />

          {/* Recommended Tick Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg -translate-x-1/2 z-0"
            style={{ left: `${recPct}%` }}
          />
        </div>

        {/* Labels under the bar */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5 px-0.5">
          <span>₹{Math.round(viewMin)}</span>
          <span className="text-emerald-300 font-bold">CPCB Benchmark ₹{recommendedPrice}</span>
          <span>₹{Math.round(viewMax)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Below Fair
        </span>
        <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          CPCB Fair Range
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          Good Offer
        </span>
      </div>
    </div>
  );
}
