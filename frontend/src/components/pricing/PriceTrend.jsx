import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import pricingService from '../../services/pricingService';

export default function PriceTrend({ material = 'PCB', materialId = null }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await pricingService.getHistory(material);
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            // Reverse so oldest is on left, newest on right
            const formatted = [...data].reverse().map(item => ({
              date: item.date,
              price: item.benchmark_price || item.price,
              min: item.market_min,
              max: item.market_max
            }));
            setHistoryData(formatted);
          } else {
            setHistoryData([]);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setHistoryData([]);
          setLoading(false);
        }
      }
    };
    loadHistory();
    return () => { isMounted = false; };
  }, [material, materialId]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Historical Price Index (₹/kg)
          </h4>
        </div>
        <div className="flex gap-1 text-[10px] font-bold">
          <button
            onClick={() => setPeriodDays(30)}
            className={`px-2 py-0.5 rounded ${periodDays === 30 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            30D
          </button>
          <button
            onClick={() => setPeriodDays(90)}
            className={`px-2 py-0.5 rounded ${periodDays === 90 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            90D
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-xs text-slate-500">
          Loading price movements...
        </div>
      ) : historyData.length < 2 ? (
        <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-400 gap-1.5 p-4 text-center">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <span>Not enough historical price records for this category yet.</span>
          <span className="text-[10px] text-slate-500">Central CPCB benchmark baseline will be used.</span>
        </div>
      ) : (
        <div className="h-40 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis domain={['dataMin - 20', 'dataMax + 20']} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val) => [`₹${val}/kg`, 'Benchmark Rate']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
