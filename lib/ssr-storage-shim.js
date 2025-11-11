// Minimal SSR-safe shim to prevent crashes if something touches localStorage/sessionStorage on the server
if (typeof window === 'undefined') {
  const createStorage = () => {
    const store = new Map();
    return {
      getItem(key) {
        const value = store.get(String(key));
        return value === undefined ? null : String(value);
      },
      setItem(key, value) {
        store.set(String(key), String(value));
      },
      removeItem(key) {
        store.delete(String(key));
      },
      clear() {
        store.clear();
      },
      key(index) {
        const keys = Array.from(store.keys());
        return keys[index] ?? null;
      },
      get length() {
        return store.size;
      },
    };
  };

  // Only define or replace if it's missing or malformed
  try {
    if (!globalThis.localStorage || typeof globalThis.localStorage.getItem !== 'function') {
      globalThis.localStorage = createStorage();
    }
  } catch {
    globalThis.localStorage = createStorage();
  }

  try {
    if (!globalThis.sessionStorage || typeof globalThis.sessionStorage.getItem !== 'function') {
      globalThis.sessionStorage = createStorage();
    }
  } catch {
    globalThis.sessionStorage = createStorage();
  }
}


