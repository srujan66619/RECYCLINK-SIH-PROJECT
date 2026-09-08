import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export function NetworkStatusBadge({ isSyncing = false }) {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isSyncing) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 border border-amber-600/40 text-amber-300">
        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
        {t('offline_badge_syncing') || 'Syncing...'}
      </span>
    );
  }

  if (!isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/80 border border-red-600/40 text-red-300">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        {t('offline_badge_offline') || 'Offline'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 border border-emerald-600/40 text-emerald-300">
      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
      {t('offline_badge_online') || 'Online'}
    </span>
  );
}

export default NetworkStatusBadge;
