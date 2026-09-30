import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import offlineDb from './offlineDb';

// Reusable network state constants
export const NetworkState = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  SYNCING: 'SYNCING',
  SYNC_ERROR: 'SYNC_ERROR',
  SYNC_COMPLETE: 'SYNC_COMPLETE'
};

// Listeners for network status updates
const subscribers = new Set();
let currentNetworkState = typeof navigator !== 'undefined' && navigator.onLine ? NetworkState.ONLINE : NetworkState.OFFLINE;
let isSyncInProgress = false;

function notifySubscribers() {
  subscribers.forEach(cb => cb(currentNetworkState));
}

export const offlineSyncManager = {
  getNetworkState: () => currentNetworkState,

  /**
   * Save a lot locally when offline or in unstable network.
   * Generates a temporary LOCAL-LOT-XXXXXX and queues CREATE_LOT action.
   */
  createOfflineLotDraft: async (lotData) => {
    const tempId = `LOCAL-LOT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const clientActionId = `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const draft = {
      local_id: tempId,
      client_action_id: clientActionId,
      material_name: lotData.material_name || lotData.material || 'PCB',
      subcategory: lotData.subcategory || 'Offline Intake',
      estimated_weight: parseFloat(lotData.estimated_weight || lotData.weight_kg || 2.0),
      photo_url: lotData.photo_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
      hazard_level: lotData.hazard_level || 'MEDIUM',
      estimated_price_min: lotData.estimated_price_min || 400.0,
      estimated_price_max: lotData.estimated_price_max || 500.0,
      recommended_price: lotData.recommended_price || 455.0,
      status: 'PENDING_SYNC',
      created_at: new Date().toISOString(),
      location_address: lotData.location_address || 'Field Collection (Offline)'
    };

    // 1. Save in offline_lots store
    await offlineDb.saveOfflineLot(draft);

    // 2. Queue in sync_queue store
    await offlineDb.enqueueAction({
      client_action_id: clientActionId,
      action_type: 'CREATE_LOT',
      entity_type: 'EWasteLot',
      local_entity_id: tempId,
      payload: draft
    });

    // If online, trigger background sync immediately
    if (navigator.onLine && !isSyncInProgress) {
      setTimeout(() => offlineSyncManager.processQueue(), 500);
    }

    return draft;
  },

  /**
   * Process all pending sync queue actions against server batch sync endpoint.
   * Ensures idempotency: duplicate retries are safely recognized on server.
   */
  processQueue: async () => {
    if (isSyncInProgress) return { synced: 0, message: 'Sync already in progress' };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      currentNetworkState = NetworkState.OFFLINE;
      notifySubscribers();
      return { synced: 0, message: 'Device is offline' };
    }

    const pending = await offlineDb.getPendingActions();
    if (pending.length === 0) {
      currentNetworkState = NetworkState.SYNC_COMPLETE;
      notifySubscribers();
      return { synced: 0, message: 'Queue is clean' };
    }

    isSyncInProgress = true;
    currentNetworkState = NetworkState.SYNCING;
    notifySubscribers();

    try {
      // Mark actions as SYNCING
      for (const act of pending) {
        await offlineDb.updateActionStatus(act.client_action_id, 'SYNCING');
      }

      // Format batch sync payload with client_action_ids
      const payload = {
        device_id: localStorage.getItem('recyclink_device_id') || `device-${Math.random().toString(36).substr(2, 9)}`,
        actions: pending.map(act => ({
          client_action_id: act.client_action_id,
          action_type: act.action_type,
          payload: act.payload
        }))
      };

      const response = await axios.post('/api/sync/batch', payload);
      const results = response.data?.results || [];

      let syncedCount = 0;
      for (const res of results) {
        if (res.status === 'SYNCED') {
          syncedCount++;
          // Update queue action
          await offlineDb.updateActionStatus(res.client_action_id, 'SYNCED', {
            server_id: res.server_id,
            trace_id: res.trace_id,
            server_lot_id: res.server_lot_id || res.lot_id
          });

          // If this was a lot creation, update offline_lots record
          const matchedAction = pending.find(a => a.client_action_id === res.client_action_id);
          if (matchedAction && matchedAction.local_entity_id) {
            await offlineDb.updateOfflineLot(matchedAction.local_entity_id, {
              status: 'SYNCED',
              server_id: res.server_id,
              trace_id: res.trace_id,
              server_lot_id: res.server_lot_id || res.lot_id,
              synced_at: new Date().toISOString()
            });
          }
        }
      }

      localStorage.setItem('recyclink_last_synced_at', new Date().toISOString());
      currentNetworkState = NetworkState.SYNC_COMPLETE;
      notifySubscribers();

      return {
        synced: syncedCount,
        results
      };
    } catch (err) {
      console.warn('[SyncService] Batch sync failure:', err.message);
      // Mark as FAILED and increment retry count with backoff
      for (const act of pending) {
        await offlineDb.updateActionStatus(act.client_action_id, 'FAILED', {
          last_error: err.message,
          retry_count: (act.retry_count || 0) + 1
        });
      }
      currentNetworkState = NetworkState.SYNC_ERROR;
      notifySubscribers();
      return { synced: 0, error: err.message };
    } finally {
      isSyncInProgress = false;
    }
  },

  /**
   * Get all lots (local offline drafts + cached server lots)
   */
  getMergedLots: async (serverLots = []) => {
    const offlineDrafts = await offlineDb.getOfflineLots();
    // Return pending offline lots first, followed by synced server lots
    return [...offlineDrafts.filter(d => d.status === 'PENDING_SYNC'), ...serverLots];
  }
};

// Global network online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentNetworkState = NetworkState.ONLINE;
    notifySubscribers();
    // Auto-sync pending actions on network return
    setTimeout(() => {
      offlineSyncManager.processQueue();
    }, 1000);
  });

  window.addEventListener('offline', () => {
    currentNetworkState = NetworkState.OFFLINE;
    notifySubscribers();
  });
}

/**
 * Reusable React Hook for network & sync status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [networkState, setNetworkState] = useState(currentNetworkState);
  const [stats, setStats] = useState({ total: 0, pending: 0, syncing: 0, synced: 0, failed: 0 });
  const [lastSyncedAt, setLastSyncedAt] = useState(() => localStorage.getItem('recyclink_last_synced_at') || null);

  const refreshStats = useCallback(async () => {
    const qStats = await offlineDb.getQueueStats();
    setStats(qStats);
    setLastSyncedAt(localStorage.getItem('recyclink_last_synced_at'));
  }, []);

  useEffect(() => {
    refreshStats();

    const handleStateChange = (state) => {
      setNetworkState(state);
      setIsOnline(navigator.onLine);
      refreshStats();
    };

    subscribers.add(handleStateChange);
    return () => {
      subscribers.delete(handleStateChange);
    };
  }, [refreshStats]);

  const syncNow = async () => {
    const res = await offlineSyncManager.processQueue();
    await refreshStats();
    return res;
  };

  return {
    isOnline,
    networkState,
    pendingCount: stats.pending,
    queueStats: stats,
    lastSyncedAt,
    syncNow,
    refreshStats
  };
}

export default offlineSyncManager;
