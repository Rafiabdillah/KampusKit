import { db } from './firebase';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { gpsTrackerService } from './gpsTrackerService';
import { 
  STORAGE_KEYS, 
  USER_DATA_KEYS, 
  DEVICE_PREFERENCE_KEYS_SET, 
  EPHEMERAL_DEVICE_KEYS_SET 
} from './storageKeys';

export type SyncStatusType = 'synced' | 'syncing' | 'offline' | 'error' | 'unauthenticated';

export interface SyncStatusState {
  status: SyncStatusType;
  lastSyncedAt: number | null;
  error?: string;
}

let currentUserId: string | null = null;
let currentSyncStatus: SyncStatusState = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'unauthenticated',
  lastSyncedAt: null,
};

// Map of debounce timers per storage key for cloud synchronization (1.5s debounce)
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Dispatch sync status updates to listeners across the app
 */
function broadcastSyncStatus(status: SyncStatusType, error?: string) {
  currentSyncStatus = {
    status,
    lastSyncedAt: status === 'synced' ? Date.now() : currentSyncStatus.lastSyncedAt,
    error
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kampuskit_sync_status', { detail: currentSyncStatus }));
  }
}

/**
 * Metadata Helpers for Timestamp Tracking & Offline Queue
 */
function getMetaUpdatedAtMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.META_UPDATED_AT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setKeyUpdatedAt(key: string, timestamp: number = Date.now()) {
  try {
    const map = getMetaUpdatedAtMap();
    map[key] = timestamp;
    localStorage.setItem(STORAGE_KEYS.META_UPDATED_AT, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getKeyUpdatedAt(key: string): number {
  const map = getMetaUpdatedAtMap();
  return map[key] || 0;
}

function getOfflineQueue(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function enqueueOfflineSync(key: string) {
  try {
    const queue = new Set(getOfflineQueue());
    queue.add(key);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, JSON.stringify(Array.from(queue)));
  } catch {
    // ignore
  }
}

function clearOfflineQueue() {
  localStorage.removeItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
}

// Auto-replay offline sync queue when network reconnects
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    broadcastSyncStatus('syncing');
    if (currentUserId) {
      StorageService.replayOfflineQueue(currentUserId).catch(() => {});
    } else {
      broadcastSyncStatus('unauthenticated');
    }
  });

  window.addEventListener('offline', () => {
    broadcastSyncStatus('offline');
  });
}

/**
 * Smart merge function for array-based collections with 'id' attributes.
 * Preserves newer items when changes occurred both locally and on cloud.
 */
function mergeIdArrays(localArr: any[], cloudArr: any[]): any[] {
  const mergedMap = new Map<string, any>();

  // Insert cloud items first
  for (const item of cloudArr) {
    if (item && typeof item === 'object' && item.id) {
      mergedMap.set(String(item.id), item);
    }
  }

  // Merge or override with local items
  for (const localItem of localArr) {
    if (localItem && typeof localItem === 'object' && localItem.id) {
      const id = String(localItem.id);
      const cloudItem = mergedMap.get(id);

      if (!cloudItem) {
        // Unique to local
        mergedMap.set(id, localItem);
      } else {
        // Both exist: check item-level timestamps if available
        const localTime = localItem.updatedAt || localItem.createdAt || 0;
        const cloudTime = cloudItem.updatedAt || cloudItem.createdAt || 0;

        if (localTime && cloudTime) {
          const lNum = typeof localTime === 'number' ? localTime : Date.parse(localTime);
          const cNum = typeof cloudTime === 'number' ? cloudTime : Date.parse(cloudTime);
          if (lNum > cNum) {
            mergedMap.set(id, localItem);
          }
        }
        // If no granular timestamps, default to cloud version
      }
    }
  }

  return Array.from(mergedMap.values());
}

export const StorageService = {
  setUserId: (userId: string | null) => {
    currentUserId = userId;
    if (!userId) {
      broadcastSyncStatus('unauthenticated');
    }
  },

  getUserId: (): string | null => {
    return currentUserId;
  },

  getSyncStatus: (): SyncStatusState => {
    return currentSyncStatus;
  },

  /**
   * Check if the logged-in user matches the owner of the local data.
   * Prevents Account A's local data from pushing to Account B's cloud.
   */
  checkAccountOwnership: (newUid: string): 'same' | 'first' | 'mismatch' => {
    const storedOwner = localStorage.getItem(STORAGE_KEYS.OWNER_UID);
    if (!storedOwner) {
      localStorage.setItem(STORAGE_KEYS.OWNER_UID, newUid);
      return 'first';
    }
    if (storedOwner === newUid) {
      return 'same';
    }
    return 'mismatch';
  },

  setOwnerUid: (uid: string) => {
    localStorage.setItem(STORAGE_KEYS.OWNER_UID, uid);
  },

  getOwnerUid: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.OWNER_UID);
  },

  /**
   * Clears user data from localStorage on logout or account switch,
   * while preserving device preferences (language, sidebar, theme).
   */
  clearUserData: (preserveDevicePrefs = true) => {
    try {
      gpsTrackerService.stopTracking().catch(() => {});
    } catch {
      // ignore
    }

    const keysToPreserve = preserveDevicePrefs ? DEVICE_PREFERENCE_KEYS_SET : new Set<string>();
    const allKeys = Object.keys(localStorage);

    for (const key of allKeys) {
      if (!keysToPreserve.has(key)) {
        localStorage.removeItem(key);
      }
    }

    localStorage.removeItem(STORAGE_KEYS.OWNER_UID);
    localStorage.removeItem(STORAGE_KEYS.META_UPDATED_AT);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
    currentUserId = null;
    broadcastSyncStatus('unauthenticated');
  },

  /**
   * Delete all user data stored in the Firebase Firestore cloud store.
   */
  clearCloudData: async (userId: string): Promise<boolean> => {
    try {
      broadcastSyncStatus('syncing');
      const storeRef = collection(db, 'users', userId, 'store');
      const snapshot = await getDocs(storeRef);
      const deletePromises: Promise<void>[] = [];
      snapshot.forEach(docSnap => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });
      await Promise.all(deletePromises);
      broadcastSyncStatus('synced');
      return true;
    } catch (err: any) {
      console.error("[StorageService] Error deleting cloud data:", err);
      broadcastSyncStatus('error', err?.message || 'Gagal menghapus data awan');
      return false;
    }
  },

  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      const parsed = JSON.parse(item);
      if (parsed === null || parsed === undefined) return defaultValue;
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
      if (defaultValue === null && Array.isArray(parsed)) return defaultValue;
      if (!Array.isArray(defaultValue) && typeof defaultValue !== 'object' && typeof parsed !== typeof defaultValue) {
        return defaultValue;
      }
      if (
        typeof defaultValue === 'object' &&
        defaultValue !== null &&
        !Array.isArray(defaultValue) &&
        (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      ) {
        return defaultValue;
      }
      return parsed;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage`, error);
      return defaultValue;
    }
  },

  setItem: <T>(key: string, value: T): void => {
    try {
      // Security: Strip personal API keys from user profile to prevent cloud leak
      let cleanValue = value;
      if (key === STORAGE_KEYS.USER_PROFILE && value && typeof value === 'object') {
        const copy: any = { ...value };
        delete copy.geminiApiKey;
        cleanValue = copy;
      }

      const stringValue = JSON.stringify(cleanValue);
      const existing = localStorage.getItem(key);

      // Skip redundant write if unchanged
      if (existing === stringValue) {
        return;
      }

      // Check document size limit (warn if approaching 1MB Firestore limit)
      const byteSize = new Blob([stringValue]).size;
      if (byteSize > 900 * 1024) {
        console.warn(`[StorageService] Peringatan: Dokumen '${key}' berukuran ${Math.round(byteSize / 1024)} KB (> 900 KB). Mendekati batas dokumen Firestore 1 MB.`);
      }

      localStorage.setItem(key, stringValue);
      setKeyUpdatedAt(key, Date.now());

      // Never sync ephemeral hardware/cache keys or device-level preferences
      if (EPHEMERAL_DEVICE_KEYS_SET.has(key) || DEVICE_PREFERENCE_KEYS_SET.has(key)) {
        return;
      }

      // Check account ownership & network
      const storedOwner = localStorage.getItem(STORAGE_KEYS.OWNER_UID);
      const isOwnerMatch = !storedOwner || storedOwner === currentUserId;

      if (!currentUserId || !isOwnerMatch) {
        return;
      }

      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

      if (!isOnline) {
        enqueueOfflineSync(key);
        broadcastSyncStatus('offline');
        return;
      }

      // Debounce cloud write per key (1.5 seconds)
      const existingTimer = debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      broadcastSyncStatus('syncing');

      const timer = setTimeout(async () => {
        debounceTimers.delete(key);
        try {
          if (!currentUserId) return;
          const docRef = doc(db, 'users', currentUserId, 'store', key);
          await setDoc(docRef, {
            value: stringValue,
            updatedAt: new Date()
          });
          broadcastSyncStatus('synced');
        } catch (err: any) {
          console.warn(`[StorageService] Debounced sync for '${key}' failed, queued for retry:`, err);
          enqueueOfflineSync(key);
          broadcastSyncStatus('error', err?.message);
        }
      }, 1500);

      debounceTimers.set(key, timer);
    } catch (error) {
      if (error instanceof DOMException && (
          error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn("Penyimpanan lokal perangkat penuh! Bersihkan data lama atau kurangi cache.");
      }
      console.error(`Error saving ${key} to localStorage`, error);
    }
  },

  /**
   * Replay keys accumulated while device was offline
   */
  replayOfflineQueue: async (userId: string) => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    broadcastSyncStatus('syncing');
    const remainingQueue: string[] = [];

    for (const key of queue) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          const docRef = doc(db, 'users', userId, 'store', key);
          await setDoc(docRef, {
            value: val,
            updatedAt: new Date()
          });
        } catch {
          remainingQueue.push(key);
        }
      }
    }

    if (remainingQueue.length === 0) {
      clearOfflineQueue();
      broadcastSyncStatus('synced');
    } else {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, JSON.stringify(remainingQueue));
      broadcastSyncStatus('error', 'Beberapa perubahan offline belum terunggah');
    }
  },

  /**
   * Synchronize all local user data to Firebase Firestore
   */
  syncToFirebase: async (userId: string): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      broadcastSyncStatus('offline');
      return false;
    }

    const storedOwner = localStorage.getItem(STORAGE_KEYS.OWNER_UID);
    if (storedOwner && storedOwner !== userId) {
      console.warn("[StorageService] Aborting syncToFirebase: Account ownership mismatch.");
      return false;
    }

    broadcastSyncStatus('syncing');

    try {
      const promises: Promise<void>[] = [];

      for (const key of USER_DATA_KEYS) {
        let item = localStorage.getItem(key);
        if (item) {
          if (key === STORAGE_KEYS.USER_PROFILE) {
            try {
              const parsed = JSON.parse(item);
              if (parsed.geminiApiKey) {
                delete parsed.geminiApiKey;
                item = JSON.stringify(parsed);
              }
            } catch {
              // ignore
            }
          }

          const docRef = doc(db, 'users', userId, 'store', key);
          promises.push(setDoc(docRef, {
            value: item,
            updatedAt: new Date()
          }));
        }
      }

      await Promise.all(promises);
      localStorage.setItem(STORAGE_KEYS.OWNER_UID, userId);
      clearOfflineQueue();
      broadcastSyncStatus('synced');
      return true;
    } catch (error: any) {
      console.warn("[StorageService] Could not sync to Firebase:", error);
      broadcastSyncStatus('error', error?.message || 'Gagal sinkronisasi ke awan');
      return false;
    }
  },

  /**
   * Synchronize data from Firebase Firestore with timestamp comparison & conflict merging
   */
  syncFromFirebase: async (userId: string): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      broadcastSyncStatus('offline');
      return false;
    }

    broadcastSyncStatus('syncing');

    try {
      const storeRef = collection(db, 'users', userId, 'store');
      
      // Single unified timeout (6 seconds) to prevent frozen screens on poor mobile connectivity
      const fetchPromise = getDocs(storeRef);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout sinkronisasi server")), 6000)
      );

      const querySnapshot = await Promise.race([fetchPromise, timeoutPromise]);
      let dataChanged = false;

      querySnapshot.forEach((docSnap) => {
        const key = docSnap.id;
        const data = docSnap.data();

        if (data && typeof data.value === 'string') {
          // Never overwrite device ephemeral keys
          if (EPHEMERAL_DEVICE_KEYS_SET.has(key)) return;

          const cloudRaw = data.value;
          const cloudUpdatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
          const localRaw = localStorage.getItem(key);
          const localUpdatedAt = getKeyUpdatedAt(key);

          // If local doesn't have the data, clean write from cloud
          if (!localRaw) {
            if (key === STORAGE_KEYS.USER_PROFILE) {
              try {
                const parsed = JSON.parse(cloudRaw);
                delete parsed.geminiApiKey;
                localStorage.setItem(key, JSON.stringify(parsed));
              } catch {
                localStorage.setItem(key, cloudRaw);
              }
            } else {
              localStorage.setItem(key, cloudRaw);
            }
            setKeyUpdatedAt(key, cloudUpdatedAt || Date.now());
            dataChanged = true;
            return;
          }

          // Both exist: check timestamps
          if (cloudUpdatedAt > localUpdatedAt) {
            // Cloud is newer
            // Check if local also had edits after last known sync
            try {
              const localParsed = JSON.parse(localRaw);
              const cloudParsed = JSON.parse(cloudRaw);

              if (Array.isArray(localParsed) && Array.isArray(cloudParsed)) {
                // Merge array collections by ID
                const merged = mergeIdArrays(localParsed, cloudParsed);
                localStorage.setItem(key, JSON.stringify(merged));
                setKeyUpdatedAt(key, Date.now());
                dataChanged = true;
                return;
              }
            } catch {
              // Not an array or JSON parse failed: fallback to saving conflict backup
              localStorage.setItem(`conflict_backup_${key}`, localRaw);
            }

            // Normal replacement by newer cloud version
            if (key === STORAGE_KEYS.USER_PROFILE) {
              try {
                const parsed = JSON.parse(cloudRaw);
                delete parsed.geminiApiKey;
                localStorage.setItem(key, JSON.stringify(parsed));
              } catch {
                localStorage.setItem(key, cloudRaw);
              }
            } else {
              localStorage.setItem(key, cloudRaw);
            }
            setKeyUpdatedAt(key, cloudUpdatedAt);
            dataChanged = true;
          } else if (localUpdatedAt > cloudUpdatedAt) {
            // Local is newer: push local copy to cloud in background
            const docRef = doc(db, 'users', userId, 'store', key);
            setDoc(docRef, {
              value: localRaw,
              updatedAt: new Date()
            }).catch(() => {});
          }
        }
      });

      localStorage.setItem(STORAGE_KEYS.OWNER_UID, userId);
      broadcastSyncStatus('synced');

      if (dataChanged && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('kampuskit_sync_complete'));
      }

      return dataChanged;
    } catch (error: any) {
      console.warn("[StorageService] Could not sync from Firebase:", error);
      broadcastSyncStatus('error', error?.message || 'Gagal mengunduh dari awan');
      return false;
    }
  },

  /**
   * Export all user data conforming to standardized backup schema
   */
  exportBackupJson: (): string => {
    const dataObj: Record<string, any> = {};

    for (const key of USER_DATA_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          dataObj[key] = JSON.parse(raw);
        } catch {
          dataObj[key] = raw;
        }
      }
    }

    // Include device preferences
    for (const prefKey of DEVICE_PREFERENCE_KEYS_SET) {
      const prefRaw = localStorage.getItem(prefKey);
      if (prefRaw !== null) {
        try {
          dataObj[prefKey] = JSON.parse(prefRaw);
        } catch {
          dataObj[prefKey] = prefRaw;
        }
      }
    }

    const payload = {
      app: 'kampuskit',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      data: dataObj
    };

    return JSON.stringify(payload, null, 2);
  },

  /**
   * Validate and import user backup data
   */
  importBackupJson: (jsonString: string): { 
    valid: boolean; 
    summary: Record<string, number>; 
    error?: string; 
    data?: Record<string, any> 
  } => {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate signature & app name
      if (!parsed || typeof parsed !== 'object' || parsed.app !== 'kampuskit') {
        return {
          valid: false,
          summary: {},
          error: 'File cadangan tidak valid atau bukan berasal dari KampusKit.'
        };
      }

      if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 2) {
        return {
          valid: false,
          summary: {},
          error: 'Versi schema cadangan tidak didukung.'
        };
      }

      if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
        return {
          valid: false,
          summary: {},
          error: 'Data cadangan tidak memiliki struktur yang valid.'
        };
      }

      const allowedKeys = new Set<string>([...USER_DATA_KEYS, ...DEVICE_PREFERENCE_KEYS_SET]);
      const data = Object.fromEntries(
        Object.entries(parsed.data).filter(([key]) => allowedKeys.has(key))
      );
      const summary: Record<string, number> = {};

      // Compute summary counts
      for (const [k, v] of Object.entries(data)) {
        if (Array.isArray(v)) {
          summary[k] = v.length;
        } else if (v && typeof v === 'object') {
          summary[k] = Object.keys(v).length;
        } else if (v !== null && v !== undefined) {
          summary[k] = 1;
        }
      }

      return {
        valid: true,
        summary,
        data
      };
    } catch {
      return {
        valid: false,
        summary: {},
        error: 'Format JSON file cadangan rusak atau tidak dapat dibaca.'
      };
    }
  },

  /**
   * Apply validated backup data into storage with automatic pre-import safety backup
   */
  applyBackupData: (data: Record<string, any>): void => {
    // 1. Create automatic emergency snapshot of current state
    try {
      const currentBackup = StorageService.exportBackupJson();
      localStorage.setItem('kampuskit_auto_backup_before_import', currentBackup);
    } catch {
      // ignore
    }

    // 2. Overwrite user data keys from backup
    const allowedKeys = new Set<string>([...USER_DATA_KEYS, ...DEVICE_PREFERENCE_KEYS_SET]);
    for (const [key, value] of Object.entries(data)) {
      if (!allowedKeys.has(key) || EPHEMERAL_DEVICE_KEYS_SET.has(key)) continue;

      let cleanVal = value;
      if (key === STORAGE_KEYS.USER_PROFILE && typeof value === 'object' && value) {
        cleanVal = { ...value };
        delete cleanVal.geminiApiKey;
      }

      const stringified = typeof cleanVal === 'string' ? cleanVal : JSON.stringify(cleanVal);
      localStorage.setItem(key, stringified);
      setKeyUpdatedAt(key, Date.now());
    }

    // 3. Trigger cloud sync if logged in
    if (currentUserId) {
      StorageService.syncToFirebase(currentUserId).catch(() => {});
    }
  },

  // Helper to generate IDs
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
};