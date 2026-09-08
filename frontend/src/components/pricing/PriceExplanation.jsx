import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle2, Shield } from 'lucide-react';

export default function PriceExplanation({ explanation = null }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            How is this fair price calculated?
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 pt-1 space-y-3 text-xs text-slate-300 border-t border-slate-800/60 animate-in fade-in duration-200">
          {explanation && (
            <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300/90 font-medium leading-relaxed">
              {explanation}
            </p>
          )}

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Calculation Pipeline:
            </span>
            <div className="space-y-1 text-slate-400">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>CPCB Base Index:</strong> Official central price benchmark for the material category.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Regional Multiplier:</strong> Local transport & industrial scrap demand (e.g. Hyderabad index 1.02x).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Physical Condition:</strong> Quality bonus (+5% for clean Grade A server boards) or damage adjustment.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Competitive Bids:</strong> Incorporates live bids from authorized dismantlers within 40 km.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-[11px]">
            <Shield className="w-4 h-4 shrink-0" />
            <span>Guaranteed zero predatory middleman cuts. You negotiate directly with formal recyclers.</span>
          </div>
        </div>
      )}
    </div>
  );
}
