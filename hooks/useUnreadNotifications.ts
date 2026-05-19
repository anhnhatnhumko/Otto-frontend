import { useSyncExternalStore } from 'react';

const STORAGE_KEY_PREFIX = 'unread_notifications_';
type UnreadStore = {
  value: Set<string>;
  listeners: Set<() => void>;
};

const stores = new Map<string, UnreadStore>();

const areSetsEqual = (left: Set<string>, right: Set<string>) => {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
};

const readUnreadIds = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return new Set<string>();
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((value) => String(value).trim()).filter(Boolean));
      }
    }
  } catch (err) {
    console.warn(`Failed to load unread notifications for key: ${storageKey}`, err);
  }

  return new Set<string>();
};

const getStore = (storageKey: string) => {
  const existing = stores.get(storageKey);
  if (existing) {
    return existing;
  }

  const nextStore: UnreadStore = {
    value: readUnreadIds(storageKey),
    listeners: new Set(),
  };

  stores.set(storageKey, nextStore);

  if (typeof window !== 'undefined') {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== storageKey) {
        return;
      }

      const nextValue = readUnreadIds(storageKey);
      if (areSetsEqual(nextStore.value, nextValue)) {
        return;
      }

      nextStore.value = nextValue;
      nextStore.listeners.forEach((listener) => listener());
    };

    window.addEventListener('storage', handleStorageChange);
  }

  return nextStore;
};

const persistStore = (storageKey: string, value: Set<string>) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(value)));
  } catch (err) {
    console.warn(`Failed to save unread notifications for key: ${storageKey}`, err);
  }
};

const updateStore = (
  storageKey: string,
  updater: (prev: Set<string>) => Set<string>,
) => {
  const store = getStore(storageKey);
  const nextValue = updater(store.value);

  if (areSetsEqual(store.value, nextValue)) {
    return;
  }

  store.value = nextValue;
  persistStore(storageKey, nextValue);
  store.listeners.forEach((listener) => listener());
};

const subscribeToStore = (storageKey: string, listener: () => void) => {
  const store = getStore(storageKey);
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
  };
};

/**
 * Hook để quản lý unread notifications với localStorage persistence
 * @param key - Unique key để lưu trữ (e.g., 'tasker_requests', 'admin_notifications')
 * @returns [unreadIds Set, setUnreadIds function, addUnread, removeUnread, clearUnread]
 */
export function useUnreadNotifications(key: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;

  const unreadIds = useSyncExternalStore(
    (listener) => subscribeToStore(storageKey, listener),
    () => getStore(storageKey).value,
    () => new Set<string>(),
  );

  const setUnreadIds = (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    updateStore(storageKey, (prev) => {
      const nextValue = typeof value === 'function' ? value(prev) : value;
      return new Set(Array.from(nextValue).map((item) => String(item).trim()).filter(Boolean));
    });
  };

  const addUnread = (id: string) => {
    updateStore(storageKey, (prev) => {
      const next = new Set(prev);
      next.add(String(id).trim());
      return next;
    });
  };

  const removeUnread = (id: string) => {
    updateStore(storageKey, (prev) => {
      const next = new Set(prev);
      next.delete(String(id).trim());
      return next;
    });
  };

  const clearUnread = () => {
    updateStore(storageKey, () => new Set());
  };

  return {
    unreadIds,
    setUnreadIds,
    setUnreadRequestIds: setUnreadIds,
    addUnread,
    removeUnread,
    clearUnread,
    count: unreadIds.size,
  };
}
