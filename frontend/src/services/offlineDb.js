/**
 * RECYCLINK — IndexedDB Offline Storage Engine
 * Provides persistent structured storage for offline lot drafts,
 * synchronization queue, and cached sector intelligence (safety, prices, profiles).
 */

const DB_NAME = 'recyclink_offline_db';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available, falling back to in-memory/localStorage.');
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Sync Queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'client_action_id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // 2. Offline Lot Drafts store
      if (!db.objectStoreNames.contains('offline_lots')) {
        const lotStore = db.createObjectStore('offline_lots', { keyPath: 'local_id' });
        lotStore.createIndex('status', 'status', { unique: false });
        lotStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // 3. Cached Data (key-value store)
      if (!db.objectStoreNames.contains('cached_data')) {
        db.createObjectStore('cached_data', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      resolve(null);
    };
  });

  return dbPromise;
}

export const offlineDb = {
  // Sync Queue
  async enqueueAction(action) {
    const db = await openDB();
    const item = {
      ...action,
      client_action_id: action.client_action_id || `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: action.created_at || new Date().toISOString(),
      retry_count: action.retry_count || 0,
      status: action.status || 'PENDING', // PENDING, SYNCING, SYNCED, FAILED
      last_error: null,
      synced_at: null
    };

    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.put(item);
        tx.oncomplete = () => resolve(item);
        tx.onerror = () => reject(tx.error);
      });
    } else {
      // LocalStorage Fallback
      const queue = JSON.parse(localStorage.getItem('recyclink_sync_queue') || '[]');
      queue.push(item);
      localStorage.setItem('recyclink_sync_queue', JSON.stringify(queue));
      return item;
    }
  },

  async getPendingActions() {
    const db = await openDB();
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const request = store.getAll();
        request.onsuccess = () => {
          const all = request.result || [];
          resolve(all.filter(a => a.status === 'PENDING' || a.status === 'FAILED'));
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      const queue = JSON.parse(localStorage.getItem('recyclink_sync_queue') || '[]');
      return queue.filter(a => a.status === 'PENDING' || a.status === 'FAILED');
    }
  },

  async updateActionStatus(client_action_id, status, extra = {}) {
    const db = await openDB();
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        const req = store.get(client_action_id);
        req.onsuccess = () => {
          const item = req.result;
          if (item) {
            Object.assign(item, { status, ...extra });
            if (status === 'SYNCED') item.synced_at = new Date().toISOString();
            store.put(item);
          }
          resolve(item);
        };
        req.onerror = () => reject(req.error);
      });
    } else {
      const queue = JSON.parse(localStorage.getItem('recyclink_sync_queue') || '[]');
      const item = queue.find(a => a.client_action_id === client_action_id);
      if (item) {
        Object.assign(item, { status, ...extra });
        if (status === 'SYNCED') item.synced_at = new Date().toISOString();
        localStorage.setItem('recyclink_sync_queue', JSON.stringify(queue));
      }
      return item;
    }
  },

  async getQueueStats() {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const req = store.getAll();
        req.onsuccess = () => {
          const all = req.result || [];
          resolve({
            total: all.length,
            pending: all.filter(a => a.status === 'PENDING').length,
            syncing: all.filter(a => a.status === 'SYNCING').length,
            synced: all.filter(a => a.status === 'SYNCED').length,
            failed: all.filter(a => a.status === 'FAILED').length,
          });
        };
        req.onerror = () => resolve({ total: 0, pending: 0, syncing: 0, synced: 0, failed: 0 });
      });
    } else {
      const queue = JSON.parse(localStorage.getItem('recyclink_sync_queue') || '[]');
      return {
        total: queue.length,
        pending: queue.filter(a => a.status === 'PENDING').length,
        syncing: queue.filter(a => a.status === 'SYNCING').length,
        synced: queue.filter(a => a.status === 'SYNCED').length,
        failed: queue.filter(a => a.status === 'FAILED').length,
      };
    }
  },

  // Offline Lots (Drafts created in field)
  async saveOfflineLot(lot) {
    const db = await openDB();
    const item = {
      ...lot,
      local_id: lot.local_id || `LOCAL-LOT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'PENDING_SYNC',
      created_at: lot.created_at || new Date().toISOString()
    };

    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_lots', 'readwrite');
        tx.objectStore('offline_lots').put(item);
        tx.oncomplete = () => resolve(item);
        tx.onerror = () => reject(tx.error);
      });
    } else {
      const lots = JSON.parse(localStorage.getItem('recyclink_offline_lots') || '[]');
      lots.unshift(item);
      localStorage.setItem('recyclink_offline_lots', JSON.stringify(lots));
      return item;
    }
  },

  async getOfflineLots() {
    const db = await openDB();
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_lots', 'readonly');
        const req = tx.objectStore('offline_lots').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } else {
      return JSON.parse(localStorage.getItem('recyclink_offline_lots') || '[]');
    }
  },

  async updateOfflineLot(local_id, update) {
    const db = await openDB();
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_lots', 'readwrite');
        const store = tx.objectStore('offline_lots');
        const req = store.get(local_id);
        req.onsuccess = () => {
          const item = req.result;
          if (item) {
            Object.assign(item, update);
            store.put(item);
          }
          resolve(item);
        };
        req.onerror = () => reject(req.error);
      });
    } else {
      const lots = JSON.parse(localStorage.getItem('recyclink_offline_lots') || '[]');
      const item = lots.find(l => l.local_id === local_id);
      if (item) {
        Object.assign(item, update);
        localStorage.setItem('recyclink_offline_lots', JSON.stringify(lots));
      }
      return item;
    }
  },

  // Key-Value Cache
  async setCache(key, data) {
    const db = await openDB();
    const entry = {
      key,
      data,
      cached_at: new Date().toISOString()
    };
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cached_data', 'readwrite');
        tx.objectStore('cached_data').put(entry);
        tx.oncomplete = () => resolve(entry);
        tx.onerror = () => reject(tx.error);
      });
    } else {
      localStorage.setItem(`recyclink_cache_${key}`, JSON.stringify(entry));
      return entry;
    }
  },

  async getCache(key, maxAgeMins = 1440) {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('cached_data', 'readonly');
        const req = tx.objectStore('cached_data').get(key);
        req.onsuccess = () => {
          const res = req.result;
          if (!res) {
            resolve(null);
            return;
          }
          resolve(res.data);
        };
        req.onerror = () => resolve(null);
      });
    } else {
      const raw = localStorage.getItem(`recyclink_cache_${key}`);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed.data;
      } catch {
        return null;
      }
    }
  }
};

export default offlineDb;
