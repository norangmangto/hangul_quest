import '@testing-library/jest-dom';

// Polyfill localStorage for jsdom environments that lack a full implementation
if (typeof localStorage === 'undefined' || typeof localStorage.removeItem !== 'function') {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    },
    writable: true,
  });
}
