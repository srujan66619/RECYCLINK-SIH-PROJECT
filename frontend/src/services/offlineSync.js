import axios from 'axios';

const STORAGE_KEY = 'recyclink_offline_queue';

export const offlineSyncManager = {
  getQueue: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  enqueueDraft: (draft) => {
    const queue = offlineSyncManager.getQueue();
    const item = {
      ...draft,
      client_id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      queued_at: new Date().toISOString()
    };
    queue.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return item;
  },

  clearQueue: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },

  syncPending: async () => {
    const queue = offlineSyncManager.getQueue();
    if (queue.length === 0) return { synced: 0 };

    try {
      const res = await axios.post('/api/sync/batch', queue);
      if (res.data?.status === 'SUCCESS') {
        offlineSyncManager.clearQueue();
        return { synced: queue.length, data: res.data };
      }
      return { synced: 0, error: 'Partial sync' };
    } catch (err) {
      console.warn('Offline sync failed, keeping items in queue:', err.message);
      return { synced: 0, error: err.message };
    }
  }
};
