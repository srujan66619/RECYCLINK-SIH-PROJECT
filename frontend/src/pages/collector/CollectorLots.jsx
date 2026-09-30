import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, ChevronRight, Calendar, ArrowUpRight,
  ShieldCheck, Tag, RefreshCw, WifiOff, Clock
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import collectorService from '../../services/collectorService';
import offlineSyncManager, { useNetworkStatus } from '../../services/offlineSync';
import offlineDb from '../../services/offlineDb';
import { LoadingSpinner, ErrorCard, EmptyState } from '../../components/common/StateViews';

export default function CollectorLots() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { isOnline, syncNow } = useNetworkStatus();

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLots = async () => {
    setLoading(true);
    setError(null);
    try {
      let serverLots = [];
      if (navigator.onLine) {
        try {
          serverLots = await collectorService.getLots();
          await offlineDb.setCache('collector_lots', serverLots);
        } catch (netErr) {
          console.warn('Could not fetch server lots, reading cache:', netErr);
          serverLots = (await offlineDb.getCache('collector_lots')) || [];
        }
      } else {
        serverLots = (await offlineDb.getCache('collector_lots')) || [];
      }

      // Merge with pending offline drafts
      const merged = await offlineSyncManager.getMergedLots(serverLots);
      setLots(merged);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to fetch your lots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, [isOnline]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
      await fetchLots();
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_SYNC':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
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

  const getStatusLabel = (status) => {
    if (status === 'PENDING_SYNC') return t('offline.pending_sync');
    if (status === 'HANDOVER_VERIFIED') return t('status.waiting_for_handover');
    return status.replace(/_/g, ' ');
  };

  const filteredLots = lots.filter((lot) => {
    if (activeTab === 'ACTIVE') {
      return !['COMPLETED', 'FORMAL_RECYCLING', 'CANCELLED'].includes(lot.status);
    }
    if (activeTab === 'PENDING') {
      return lot.status === 'PENDING_SYNC';
    }
    if (activeTab === 'COMPLETED') {
      return ['COMPLETED', 'FORMAL_RECYCLING'].includes(lot.status);
    }
    return true;
  });

  const pendingOfflineCount = lots.filter(l => l.status === 'PENDING_SYNC').length;

  if (loading) {
    return <LoadingSpinner message={t('loading') || 'Loading lots...'} />;
  }

  if (error && lots.length === 0) {
    return <ErrorCard message={error} onRetry={fetchLots} />;
  }

  return (
    <div className="space-y-4 pb-8 max-w-lg mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {t('dashboard.my_lots')}
          </h1>
          <p className="text-xs text-slate-400">
            {lots.length} {t('active_lots') || 'total items recorded'}
          </p>
        </div>

        <button
          onClick={() => navigate('/collector/identify')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ {t('dashboard.identify')}</span>
        </button>
      </div>

      {/* 2. Pending Offline Sync Notice Bar */}
      {pendingOfflineCount > 0 && (
        <div className="bg-amber-950/70 border border-amber-600/50 rounded-2xl p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-200">
              {pendingOfflineCount} {t('offline.pending_sync')}
            </span>
          </div>

          {isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? t('offline.syncing') : t('offline.retry_btn')}</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Filter Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs font-bold">
        {['ALL', 'PENDING', 'ACTIVE', 'COMPLETED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === tab
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'PENDING' ? `${tab} (${pendingOfflineCount})` : tab}
          </button>
        ))}
      </div>

      {/* 4. Lots List */}
      {filteredLots.length === 0 ? (
        <EmptyState
          title={t('no_data_empty')}
          description="Start by scanning e-waste to create digital intake lot manifests."
          actionText={t('dashboard.identify')}
          onAction={() => navigate('/collector/identify')}
        />
      ) : (
        <div className="space-y-3">
          {filteredLots.map((lot) => {
            const isOfflineDraft = lot.status === 'PENDING_SYNC';
            const displayId = lot.local_id || lot.lot_id || `LOT-${lot.id}`;
            const displayTraceId = lot.trace_id || 'PENDING SYNC';
            const weight = lot.estimated_weight || lot.weight_kg || 2.0;

            return (
              <div
                key={lot.local_id || lot.id}
                onClick={() => {
                  if (!isOfflineDraft) {
                    navigate(`/collector/lots/${lot.id || lot.lot_id}`);
                  }
                }}
                className={`p-4 rounded-3xl border transition flex items-center justify-between gap-3 shadow-md ${
                  isOfflineDraft
                    ? 'bg-amber-950/30 border-amber-700/50 cursor-default'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 cursor-pointer active:scale-[0.99]'
                }`}
              >
                {/* Image */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black flex-shrink-0 border border-slate-800">
                  <img
                    src={lot.photo_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80'}
                    alt={lot.material_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400 truncate">
                      {displayId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(lot.status)}`}>
                      {getStatusLabel(lot.status)}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white truncate">
                    {lot.material_name}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-emerald-400">{weight} kg</span>
                    {lot.recommended_price && (
                      <span>₹{Math.round(lot.recommended_price)}</span>
                    )}
                    {isOfflineDraft && (
                      <span className="text-[10px] text-amber-400 italic">
                        {t('offline.official_id_notice')}
                      </span>
                    )}
                  </div>
                </div>

                {!isOfflineDraft && (
                  <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
