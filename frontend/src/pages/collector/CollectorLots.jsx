import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, ChevronRight, Calendar, ArrowUpRight, ShieldCheck, Tag } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import collectorService from '../../services/collectorService';
import { LoadingSpinner, ErrorCard, EmptyState } from '../../components/common/StateViews';

export default function CollectorLots() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchLots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectorService.getLots();
      setLots(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to fetch your lots.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FORMAL_RECYCLING':
      case 'COMPLETED':
      case 'PAID':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'HANDOVER_VERIFIED':
      case 'HANDED_OVER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'PICKUP_IN_PROGRESS':
      case 'PICKUP_SCHEDULED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'ACCEPTED':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'OFFER_RECEIVED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'RECYCLER_SELECTED':
      case 'PRICED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-700';
    }
  };

  const filteredLots = lots.filter((lot) => {
    if (activeTab === 'ACTIVE') {
      return !['COMPLETED', 'FORMAL_RECYCLING', 'CANCELLED'].includes(lot.status);
    }
    if (activeTab === 'COMPLETED') {
      return ['COMPLETED', 'FORMAL_RECYCLING'].includes(lot.status);
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header & New Lot Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {t('nav_lots') || 'My Lots'}
          </h2>
          <p className="text-xs text-slate-400">
            {lots.length} total e-waste manifests recorded
          </p>
        </div>

        <button
          onClick={() => navigate('/collector/identify')}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Lot</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-2 rounded-xl font-semibold transition ${
            activeTab === 'ALL'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Lots ({lots.length})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex-1 py-2 rounded-xl font-semibold transition ${
            activeTab === 'ACTIVE'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex-1 py-2 rounded-xl font-semibold transition ${
            activeTab === 'COMPLETED'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Main List Body */}
      {loading ? (
        <LoadingSpinner message="Fetching lots from ledger..." />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchLots} />
      ) : filteredLots.length === 0 ? (
        <EmptyState
          title={t('no_data_empty') || 'No e-waste lots yet'}
          message="Scan your first e-waste item to receive a fair market quote and circular trace ID."
          actionLabel="Identify E-Waste Now"
          onAction={() => navigate('/collector/identify')}
          icon={Package}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredLots.map((lot) => (
            <div
              key={lot.id}
              onClick={() => navigate(`/collector/lots/${lot.id}`)}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md transition cursor-pointer active:scale-[0.99] space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[11px] font-bold text-emerald-400">
                      {lot.lot_id || `LOT-2026-${lot.id}`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getStatusBadge(lot.status)}`}>
                      {lot.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{lot.material_name}</h3>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-white block leading-tight">
                    {lot.estimated_weight} <span className="text-xs font-normal text-slate-400">kg</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    ₹{lot.final_price || lot.quoted_price || lot.recommended_price || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {lot.created_at ? new Date(lot.created_at).toLocaleDateString('en-IN') : 'Today'}
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                  Trace details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
