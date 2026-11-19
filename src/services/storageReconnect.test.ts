// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Muse 2026-10-28：多标签/长会话下「The database connection is closing」导致保存、删除失败。
 * 这里用一个最小的假 IndexedDB 模拟连接被浏览器关闭，确认存储层会重开连接而不是一直失败。
 */
type Rec = Record<string, unknown> & { id: string };

class FakeDB {
  closed = false;
  onversionchange: (() => void) | null = null;
  onclose: (() => void) | null = null;
  objectStoreNames = { contains: () => true };
  constructor(private data: Map<string, Rec>) {}
  close() { this.closed = true; }
  createObjectStore() { return {}; }
  transaction() {
    if (this.closed) {
      throw new DOMException("Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.", 'InvalidStateError');
    }
    const data = this.data;
    const tx: { oncomplete?: () => void; onerror?: () => void; onabort?: () => void; error: null; objectStore: () => unknown } = {
      error: null,
      objectStore: () => ({
        put: (value: Rec) => { data.set(value.id, value); setTimeout(() => tx.oncomplete?.(), 0); },
        delete: (id: string) => { data.delete(id); setTimeout(() => tx.oncomplete?.(), 0); },
        clear: () => data.clear(),
        get: () => { const req: { onsuccess?: () => void; result?: unknown } = {}; setTimeout(() => req.onsuccess?.(), 0); return req; },
        getAll: () => { const req: { onsuccess?: () => void; result?: unknown } = { result: [...data.values()] }; setTimeout(() => req.onsuccess?.(), 0); return req; },
      }),
    };
    return tx;
  }
}

const poem = (id: string) => ({
  id, title: '回归', author: '居士', content: '秋夜。', heartNote: '', type: 'free', layout: 'vertical',
  paperStyle: 'meihua', rhymeBook: 'ping_shui', createdAt: Date.now(),
});

describe('IndexedDB 连接被关闭后自动重开', () => {
  let opened: FakeDB[];
  let data: Map<string, Rec>;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    opened = [];
    data = new Map();
    const fakeIndexedDB = {
      open: () => {
        const request: { result?: FakeDB; onsuccess?: () => void; onupgradeneeded?: () => void } = {};
        setTimeout(() => { const db = new FakeDB(data); opened.push(db); request.result = db; request.onsuccess?.(); }, 0);
        return request;
      },
    };
    Object.defineProperty(window, 'indexedDB', { value: fakeIndexedDB, configurable: true, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true, writable: true });
  });

  it('连接被浏览器悄悄关掉时，保存与删除仍然成功', async () => {
    const { savePoem, deletePoem, getPoems } = await import('./storageService');
    expect(await savePoem(poem('a') as never)).toEqual({ ok: true });
    expect(opened).toHaveLength(1);

    opened[0].closed = true; // 浏览器回收连接，未触发任何事件
    const second = await savePoem(poem('b') as never);
    expect(second).toEqual({ ok: true });
    expect(opened).toHaveLength(2);
    expect(data.has('b')).toBe(true);

    opened[1].closed = true;
    expect((await deletePoem('a')).ok).toBe(true);
    expect(data.has('a')).toBe(false);
    expect(getPoems().map(p => p.id)).toEqual(['b']);
  });

  it('其他标签请求升级（versionchange）时让出连接，下次读写重新打开', async () => {
    const { savePoem } = await import('./storageService');
    await savePoem(poem('a') as never);
    opened[0].onversionchange?.();
    expect(opened[0].closed).toBe(true);
    expect((await savePoem(poem('b') as never)).ok).toBe(true);
    expect(opened).toHaveLength(2);
  });
});
