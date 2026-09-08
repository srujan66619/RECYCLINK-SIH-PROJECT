import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RecyclerComparison({
  offers = [],
  fairRange = '₹390 – ₹480',
  bestMatchName = null,
  onSelectRecycler = () => {}
}) {
  if (!offers || offers.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Recycler Offer Comparison
        </h4>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">
          Fair Benchmark: {fairRange}/kg
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
              <th className="pb-2 font-bold">Recycler</th>
              <th className="pb-2 font-bold text-right">Offer Rate</th>
              <th className="pb-2 font-bold text-center">Status</th>
              <th className="pb-2 font-bold text-right">Distance</th>
              <th className="pb-2 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {offers.map((o, idx) => {
              const isBest = bestMatchName && (
                o.facility_name?.toLowerCase().includes(bestMatchName.toLowerCase()) ||
                o.recycler_name?.toLowerCase().includes(bestMatchName.toLowerCase()) ||
                idx === 0
              );
              const isBelow = o.status_label === 'BELOW FAIR';
              const isGood = o.status_label === 'GOOD OFFER';

              return (
                <tr
                  key={o.recycler_id || idx}
                  className={`hover:bg-slate-800/40 transition ${isBest ? 'bg-emerald-950/20' : ''}`}
                >
                  <td className="py-2.5 pr-2 font-medium text-white flex items-center gap-1.5">
                    {isBest && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span>{o.facility_name || o.recycler_name}</span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                    ₹{o.offer_rate_per_kg || o.offered_price_per_kg}/kg
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isGood
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : isBelow
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {o.status_label || 'FAIR'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-slate-400 font-mono">
                    {o.distance_km} km
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectRecycler(o)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                        isBest
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Choose
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
