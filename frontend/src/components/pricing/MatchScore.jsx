import React, { useState } from 'react';
import { Award, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function MatchScore({
  overallScore = 92,
  componentScores = null
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
    if (score >= 70) return 'text-teal-400 border-teal-500/50 bg-teal-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
  };

  const scoreColor = getScoreColor(overallScore);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-xl border font-mono font-black text-xs flex items-center gap-1.5 ${scoreColor}`}>
            <Award className="w-3.5 h-3.5" />
            <span>Match Score: {overallScore}%</span>
          </div>
          {overallScore >= 90 && (
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              ⭐ Top Recommendation
            </span>
          )}
        </div>

        {componentScores && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdown(!showBreakdown);
            }}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5 underline font-medium"
          >
            <span>Score Breakdown</span>
            {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showBreakdown && componentScores && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs animate-in fade-in duration-150">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Scoring Criteria Breakdown:
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">License Auth (30%):</span>
              <span className="font-mono font-bold text-emerald-400">{componentScores.authorization_score}/100</span>
            </div>
            <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Material Match (20%):</span>
              <span className="font-mono font-bold text-emerald-400">{componentScores.material_score}/100</span>
            </div>
            <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Price Rate (20%):</span>
              <span className="font-mono font-bold text-teal-400">{componentScores.price_score}/100</span>
            </div>
            <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Proximity (10%):</span>
              <span className="font-mono font-bold text-slate-200">{componentScores.distance_score}/100</span>
            </div>
            <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Pickup Logistics (10%):</span>
              <span className="font-mono font-bold text-emerald-400">{componentScores.pickup_score}/100</span>
            </div>
            <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Reliability (10%):</span>
              <span className="font-mono font-bold text-slate-200">{componentScores.reliability_score}/100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
