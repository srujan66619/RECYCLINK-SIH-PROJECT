import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/I18nContext';
import { 
  IndianRupee, TrendingUp, Scale, CheckCircle2, 
  ArrowUpRight, Clock, ShieldCheck, RefreshCw, Wallet, 
  ChevronRight, Smartphone
} from 'lucide-react';
import { collectorService } from '../../services/collectorService';
import { LoadingSpinner, ErrorCard, EmptyState } from '../../components/common/StateViews';

export default function CollectorEarnings() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [dashboard, setDashboard] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEarningsData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashData, earnData, txData] = await Promise.all([
        collectorService.getDashboard().catch(() => null),
        collectorService.getEarnings().catch(() => null),
        collectorService.getTransactions().catch(() => [])
      ]);

      setDashboard(dashData);
      setEarnings(earnData);
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to load earnings ledger. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarningsData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading earnings and payout records..." />;
  }

  if (error) {
    return <ErrorCard message={error} onRetry={loadEarningsData} />;
  }

  const totalEarnings = earnings?.total_earnings || dashboard?.total_earnings || 0;
  const todayEarnings = dashboard?.today_earnings || 0;
  const totalWeight = dashboard?.total_kg_collected || 0;
  const completedCount = dashboard?.completed_tx_count || transactions.filter(tx => tx.payment_status === 'COMPLETED' || tx.status === 'COMPLETED').length;
  const upiId = earnings?.payout_channel || 'collector@upi';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('earnings.title') || 'Earnings & Payouts'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {t('earnings.subtitle') || 'Transparent formal recycling payouts directly via UPI'}
          </p>
        </div>
        <button
          onClick={loadEarningsData}
          title="Refresh Data"
          className="p-2 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Earnings Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-gray-900 to-gray-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Wallet className="w-32 h-32 text-emerald-400" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Cumulative Verified Payout</span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white">₹{totalEarnings.toLocaleString('en-IN')}</span>
            <span className="text-xs text-gray-400 font-medium">INR</span>
          </div>

          <p className="text-xs text-emerald-300/90 font-medium mt-1">
            ₹{todayEarnings} credited today
          </p>

          {/* UPI Direct Transfer Status */}
          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Direct Bank / UPI:</span>
              <span className="font-mono font-bold text-white bg-gray-900/80 px-2 py-0.5 rounded border border-gray-700">
                {upiId}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Settlement Active
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium mb-1">
            <Scale className="w-4 h-4" />
            <span>Total Recycled</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-white block">
            {totalWeight} <span className="text-xs font-normal text-gray-400">kg</span>
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Diverted from unscientific landfills</span>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settled Lots</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-white block">
            {completedCount}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">100% digital trace verified</span>
        </div>
      </div>

      {/* Fair Price Uplift Benefit Box */}
      <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 flex-shrink-0 mt-0.5">
          <ArrowUpRight className="w-5 h-5" />
        </div>
        <div className="text-xs text-gray-300 space-y-1">
          <h4 className="font-bold text-blue-200 text-sm">Formal Channel Uplift</h4>
          <p className="leading-relaxed text-gray-400">
            By selling directly to CPCB-authorized recyclers via Recyclink, collectors bypass intermediaries and earn <strong className="text-emerald-400">18% – 28% higher rates</strong> with instant digital weighing.
          </p>
        </div>
      </div>

      {/* Transactions History Ledger */}
      <div className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base">
            {t('earnings.transactions') || 'Payout History'}
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {transactions.length} Records
          </span>
        </div>

        {transactions.length === 0 ? (
          <EmptyState 
            title="No payout records yet" 
            message="Your earnings from completed e-waste lots will appear here automatically." 
          />
        ) : (
          <div className="divide-y divide-gray-800/80">
            {transactions.map((tx) => {
              const isSuccess = tx.payment_status === 'COMPLETED' || tx.status === 'COMPLETED';
              const lotName = tx.lot?.material_name || `E-Waste Lot #${tx.lot_id}`;
              const weight = tx.final_weight || tx.lot?.estimated_weight || 0;
              const rate = tx.agreed_price_per_kg || 0;
              const amount = tx.total_amount || (tx.final_price || 0);

              return (
                <div 
                  key={tx.id} 
                  onClick={() => tx.lot_id && navigate(`/collector/lots/${tx.lot_id}`)}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-sm truncate">{lotName}</h4>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                          isSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {tx.payment_status || tx.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{weight} kg</span>
                        <span>•</span>
                        <span>₹{rate}/kg</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2 flex-shrink-0">
                    <div>
                      <span className="font-bold text-emerald-400 text-sm sm:text-base block">
                        +₹{amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase">{tx.payment_method || 'UPI'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
