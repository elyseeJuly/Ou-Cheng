// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('storage startup resilience', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('falls back instead of waiting forever when IndexedDB open is blocked', async () => {
    vi.useFakeTimers();
    const originalIndexedDB = window.indexedDB;
    const stalledRequest: Record<string, unknown> = {};
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: { open: () => stalledRequest },
    });
    vi.resetModules();

    try {
      const { rehydrateStorage } = await import('./storageService');
      const hydration = rehydrateStorage();
      await vi.advanceTimersByTimeAsync(1500);
      await expect(hydration).resolves.toBeUndefined();
    } finally {
      Object.defineProperty(window, 'indexedDB', {
        configurable: true,
        value: originalIndexedDB,
      });
    }
  });

  it('falls back when opening IndexedDB throws synchronously', async () => {
    const originalIndexedDB = window.indexedDB;
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: { open: () => { throw new DOMException('denied', 'SecurityError'); } },
    });
    vi.resetModules();

    try {
      const { rehydrateStorage } = await import('./storageService');
      await expect(rehydrateStorage()).resolves.toBeUndefined();
    } finally {
      Object.defineProperty(window, 'indexedDB', {
        configurable: true,
        value: originalIndexedDB,
      });
    }
  });

  it('returns safe defaults when localStorage reads are denied', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('denied', 'SecurityError'); },
      setItem: () => { throw new DOMException('denied', 'SecurityError'); },
    });
    vi.resetModules();

    try {
      const { getSettings } = await import('./storageService');
      expect(getSettings()).toMatchObject({
        defaultPenName: '居士',
        rhymeBook: 'ci_lin',
        defaultLayout: 'vertical',
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
