import { Poem, PoemBase, UserSettings, Seal, OuchengBackupV2, CreateDraft } from '../types';
import { PoemForm } from '../data/poemForms';
import { PouchItem, usePouch } from '../stores/pouchStore';
import { validatePoem, validateUserSettings, validateCustomForm, validatePouchItem, validateSeal, validateBackupV2, validateDraft } from './schemaValidator';

const POEMS_KEY = 'oucheng_poems_v4';
const SETTINGS_KEY = 'oucheng_settings_v4';
const SEALS_KEY = 'oucheng_seals_v4';
export const CUSTOM_FORMS_KEY = 'oucheng_custom_forms';
const POUCH_KEY = 'oucheng_pouch';
const DRAFT_KEY = 'oucheng_create_draft_v1';
const CLEANUP_MARKER = 'oucheng_local_only_v1';
const PRIMARY_POEMS_STORE = 'poems';
const PRIMARY_POEMS_MARKER = 'primary_poems_initialized_v1';

const sanitizePoem = (value: unknown): Poem | null => {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  if (!source.id) return null;
  const base: PoemBase = {
    id: String(source.id),
    title: String(source.title || '无题'),
    author: String(source.author || '佚名'),
    content: String(source.content || ''),
    heartNote: String(source.heartNote || ''),
    layout: source.layout === 'horizontal' ? 'horizontal' : 'vertical',
    paperStyle: ['xuan', 'meihua', 'yunwen', 'zhu', 'lianhua'].includes(String(source.paperStyle)) ? source.paperStyle as PoemBase['paperStyle'] : 'xuan',
    rhymeBook: ['ci_lin', 'ping_shui', 'xin_yun'].includes(String(source.rhymeBook)) ? source.rhymeBook as PoemBase['rhymeBook'] : 'ci_lin',
    createdAt: Number(source.createdAt) || Date.now(),
  };
  const optionalKeys: Array<keyof PoemBase> = [
    'horizontalSubMode', 'sealId', 'backgroundImage', 'fontStyle',
    'collectionName', 'updatedAt', 'favorite', 'draft', 'aiComment',
  ];
  optionalKeys.forEach(key => {
    if (source[key] !== undefined) Object.assign(base, { [key]: source[key] });
  });
  const type = String(source.type || 'free');
  if (type === 'cipai' && typeof source.cipaiName === 'string' && source.cipaiName.trim()
    && typeof source.cipaiVariantId === 'string' && source.cipaiVariantId.trim()) {
    return validatePoem({ ...base, type, cipaiName: source.cipaiName, cipaiVariantId: source.cipaiVariantId });
  }
  if (type === 'sonnet' && ['shakespeare', 'petrarchan', 'chinese_modern'].includes(String(source.sonnetType))) {
    return validatePoem({
      ...base,
      type,
      sonnetType: source.sonnetType,
      ...(typeof source.formId === 'string' ? { formId: source.formId } : {}),
      ...(typeof source.formName === 'string' ? { formName: source.formName } : {}),
    });
  }
  if (['jueju_5', 'jueju_7', 'lvshi_5', 'lvshi_7'].includes(type)) {
    return validatePoem({ ...base, type, ...(typeof source.jintiVariant === 'string' ? { jintiVariant: source.jintiVariant } : {}) });
  }
  return validatePoem({
    ...base,
    type: 'free',
    ...(typeof source.formId === 'string' ? { formId: source.formId } : {}),
    ...(typeof source.formName === 'string' ? { formName: source.formName } : {}),
  });
};

const sanitizeSettings = (value: unknown): UserSettings => {
  const source: Record<string, unknown> = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const penNames = Array.isArray(source.penNames)
    ? source.penNames.filter((name: unknown) => typeof name === 'string' && name.trim() && name !== '偶成君' && name !== '测试笔名')
    : [];
  const clean: UserSettings = {
    penNames: penNames.length ? penNames : ['居士', '散人'],
    defaultPenName: typeof source.defaultPenName === 'string' && source.defaultPenName && source.defaultPenName !== '偶成君' && source.defaultPenName !== '测试笔名'
      ? source.defaultPenName
      : (penNames[0] || '居士'),
    rhymeBook: ['ci_lin', 'ping_shui', 'xin_yun'].includes(String(source.rhymeBook)) ? source.rhymeBook as UserSettings['rhymeBook'] : 'ci_lin',
    defaultPaperStyle: ['xuan', 'meihua', 'yunwen', 'zhu', 'lianhua'].includes(String(source.defaultPaperStyle)) ? source.defaultPaperStyle as UserSettings['defaultPaperStyle'] : 'xuan',
    defaultLayout: source.defaultLayout === 'horizontal' ? 'horizontal' : 'vertical',
    theme: ['day', 'night', 'auto'].includes(String(source.theme)) ? source.theme as UserSettings['theme'] : 'day',
    hapticsEnabled: source.hapticsEnabled !== undefined ? !!source.hapticsEnabled : true,
    beatTickHapticsEnabled: source.beatTickHapticsEnabled !== undefined ? !!source.beatTickHapticsEnabled : false,
  };
  if (typeof source.defaultSealId === 'string') {
    const rawSeals = safeParse<Array<{ id?: string; name?: string }>>(SEALS_KEY, []);
    const seal = rawSeals.find(s => s?.id === source.defaultSealId);
    if (!seal || seal.name !== '测试印') {
      clean.defaultSealId = source.defaultSealId;
    }
  }
  if (['lxgw_wenkai', 'noto_serif', 'ma_shan_zheng', 'none'].includes(String(source.globalFont))) clean.globalFont = source.globalFont as UserSettings['globalFont'];
  if (typeof source.rhymeHintEnabled === 'boolean') clean.rhymeHintEnabled = source.rhymeHintEnabled;
  // Option B：保留用户自带的 AI 接入配置
  if (typeof source.apiKey === 'string') clean.apiKey = source.apiKey;
  if (typeof source.apiBaseUrl === 'string') clean.apiBaseUrl = source.apiBaseUrl;
  if (typeof source.apiModel === 'string') clean.apiModel = source.apiModel;
  return clean;
};

const sanitizeDraft = (value: unknown): CreateDraft | null => validateDraft(value);
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

// ── Environment-Safe Safe Parse Helper ────────────────────
const safeParse = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored);
  } catch (e) {
    console.error(`LocalStorage key ${key} is unavailable or corrupted. Falling back.`, e);
    try {
      if (stored !== null) localStorage.setItem(`${key}_corrupt_${Date.now()}`, stored);
    } catch (_) {}
    return fallback;
  }
};

// ── IndexedDB primary store + small-state mirror setup ──
const INDEXED_DB_OPEN_TIMEOUT_MS = 1500;

// 连接按需打开并缓存；浏览器关闭连接（多标签升级、后台回收、onclose）后自动重开。
// Muse 2026-10-28：多标签长会话下出现 "The database connection is closing"，旧实现把连接固定在模块级 Promise 里，连接被关后再也不会重开。
let dbCache: Promise<IDBDatabase | null> | null = null;

const openDatabase = (): Promise<IDBDatabase | null> => new Promise<IDBDatabase | null>((resolve) => {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    resolve(null);
    return;
  }

  let settled = false;
  let timeoutId: number | undefined;
  const settle = (database: IDBDatabase | null) => {
    if (settled) {
      database?.close();
      return;
    }
    settled = true;
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (database) {
      const forget = () => { dbCache = null; };
      // 另一个标签要升级库：让出连接，下次读写时重开
      database.onversionchange = () => { database.close(); forget(); };
      // 浏览器异常关闭连接（存储被清、进程回收）
      database.onclose = forget;
    }
    // 打开失败/超时/被阻塞：沿用旧语义，本次会话退回 localStorage，不再每次等待超时
    resolve(database);
  };

  let request: IDBOpenDBRequest;
  try {
    request = window.indexedDB.open('oucheng_vault', 2);
  } catch (_) {
    settle(null);
    return;
  }
  timeoutId = window.setTimeout(() => settle(null), INDEXED_DB_OPEN_TIMEOUT_MS);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('backup_store')) {
      db.createObjectStore('backup_store');
    }
    if (!db.objectStoreNames.contains(PRIMARY_POEMS_STORE)) {
      db.createObjectStore(PRIMARY_POEMS_STORE, { keyPath: 'id' });
    }
  };
  request.onsuccess = () => settle(request.result);
  request.onerror = () => settle(null);
  request.onblocked = () => settle(null);
});

const getDatabase = (): Promise<IDBDatabase | null> => {
  if (!dbCache) dbCache = openDatabase();
  return dbCache;
};

const isClosingError = (error: unknown): boolean => {
  const record = error && typeof error === 'object' ? error as { name?: string; message?: string } : {};
  return record.name === 'InvalidStateError' || /closing|closed/i.test(String(record.message ?? error));
};

/**
 * 在一个事务里执行 run；连接已关闭/正在关闭时丢弃缓存、重开连接再试一次。
 * 返回 null 表示 IndexedDB 不可用（沿用旧语义：调用方退回 localStorage）。
 */
const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T>,
): Promise<T | null> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const db = await getDatabase();
    if (!db) return null;
    let tx: IDBTransaction;
    try {
      tx = db.transaction(storeName, mode);
    } catch (error) {
      if (attempt === 0 && isClosingError(error)) {
        if (dbCache) dbCache = null;
        try { db.close(); } catch (_) {}
        continue;
      }
      throw error;
    }
    return run(tx.objectStore(storeName), tx);
  }
  return null;
};

const completion = (tx: IDBTransaction, label: string): Promise<true> => new Promise<true>((resolve, reject) => {
  tx.oncomplete = () => resolve(true);
  tx.onerror = () => reject(tx.error || new Error(`IndexedDB ${label} failed`));
  tx.onabort = () => reject(tx.error || new Error(`IndexedDB ${label} aborted`));
});

const backupToDB = async (key: string, value: unknown): Promise<void> => {
  await withStore('backup_store', 'readwrite', (store, tx) => {
    const done = completion(tx, 'backup write');
    store.put(JSON.parse(JSON.stringify(value)), key);
    return done;
  });
};

const deleteFromDB = async (key: string): Promise<void> => {
  await withStore('backup_store', 'readwrite', (store, tx) => {
    const done = completion(tx, 'backup delete');
    store.delete(key);
    return done;
  });
};

const backupBestEffort = (key: string, value: unknown): void => {
  void backupToDB(key, value).catch(error => {
    console.warn(`IndexedDB backup failed for ${key}:`, error);
  });
};

const getFromDB = async <T>(key: string): Promise<T | null> => {
  try {
    return await withStore<T | null>('backup_store', 'readonly', (store) => new Promise<T | null>((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T || null);
      req.onerror = () => resolve(null);
    }));
  } catch (e) {
    return null;
  }
};

const getPrimaryPoems = async (): Promise<Poem[] | null> =>
  withStore<Poem[]>(PRIMARY_POEMS_STORE, 'readonly', (store) => new Promise<Poem[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as unknown[])
      .map(sanitizePoem)
      .filter((poem): poem is Poem => Boolean(poem))
      .sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error || new Error('IndexedDB poem read failed'));
  }));

const putPrimaryPoem = async (poem: Poem): Promise<boolean> =>
  (await withStore(PRIMARY_POEMS_STORE, 'readwrite', (store, tx) => {
    const done = completion(tx, 'poem write');
    store.put(JSON.parse(JSON.stringify(poem)));
    return done;
  })) ?? false;

const deletePrimaryPoem = async (id: string): Promise<boolean> =>
  (await withStore(PRIMARY_POEMS_STORE, 'readwrite', (store, tx) => {
    const done = completion(tx, 'poem delete');
    store.delete(id);
    return done;
  })) ?? false;

const replacePrimaryPoems = async (poems: Poem[]): Promise<boolean> =>
  (await withStore(PRIMARY_POEMS_STORE, 'readwrite', (store, tx) => {
    const done = completion(tx, 'poem replacement');
    store.clear();
    poems.forEach(poem => store.put(JSON.parse(JSON.stringify(poem))));
    return done;
  })) ?? false;

export const rehydrateStorage = async (): Promise<void> => {
  if (typeof localStorage === 'undefined') return;
  const localPoems = safeParse<unknown[]>(POEMS_KEY, [])
    .map(sanitizePoem)
    .filter((poem): poem is Poem => Boolean(poem));
  const primaryInitialized = await getFromDB<boolean>(PRIMARY_POEMS_MARKER);
  if (primaryInitialized) {
    const primaryPoems = await getPrimaryPoems();
    if (primaryPoems) localStorage.setItem(POEMS_KEY, JSON.stringify(primaryPoems));
  } else {
    const legacyBackup = await getFromDB<unknown[]>(POEMS_KEY);
    const seed = localPoems.length > 0 ? localPoems : (legacyBackup || [])
      .map(sanitizePoem)
      .filter((poem): poem is Poem => Boolean(poem));
    if (await replacePrimaryPoems(seed)) {
      await backupToDB(PRIMARY_POEMS_MARKER, true);
      localStorage.setItem(POEMS_KEY, JSON.stringify(seed));
    }
  }

  const keys = [SETTINGS_KEY, SEALS_KEY, CUSTOM_FORMS_KEY, POUCH_KEY];
  for (const key of keys) {
    const localVal = localStorage.getItem(key);
    let isCorrupted = false;
    if (localVal) {
      try {
        JSON.parse(localVal);
      } catch (_) {
        isCorrupted = true;
      }
    }
    
    if (!localVal || isCorrupted) {
      const backup = await getFromDB<unknown>(key);
      if (backup) {
        localStorage.setItem(key, JSON.stringify(backup));
        console.log(`Successfully recovered ${key} from IndexedDB backup ${isCorrupted ? '(repaired corruption)' : ''}.`);
      }
    }
  }
  await migrateRemovedProductData();
};

export const migrateRemovedProductData = async (): Promise<void> => {
  if (typeof localStorage === 'undefined') return;
  const poems = safeParse<unknown[]>(POEMS_KEY, []).map(sanitizePoem).filter((poem): poem is Poem => Boolean(poem));
  const settings = sanitizeSettings(safeParse<unknown>(SETTINGS_KEY, {}));
  const draftKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((key): key is string => key === DRAFT_KEY || Boolean(key?.startsWith(`${DRAFT_KEY}:`)));
  const drafts = draftKeys.map(key => [key, sanitizeDraft(safeParse<unknown>(key, null))] as const);
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  drafts.forEach(([key, draft]) => {
    if (draft && Object.keys(draft).length) localStorage.setItem(key, JSON.stringify(draft));
    else localStorage.removeItem(key);
  });
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index);
    if (key?.startsWith(`${SETTINGS_KEY}_corrupt_`)) localStorage.removeItem(key);
  }
  const primaryReady = await replacePrimaryPoems(poems);
  await Promise.allSettled([
    ...(primaryReady ? [backupToDB(PRIMARY_POEMS_MARKER, true)] : []),
    backupToDB(SETTINGS_KEY, settings),
    ...drafts.map(([key, draft]) => backupToDB(key, draft || {})),
  ]);
  localStorage.setItem(CLEANUP_MARKER, '1');
};

// ── Legacy migration ──────────────────────────────────────
function migrateLegacy() {
  if (typeof localStorage === 'undefined') return;
  try {
    const old = localStorage.getItem('oucheng_poems');
    if (old && !localStorage.getItem(POEMS_KEY)) {
      localStorage.setItem(POEMS_KEY, old);
    }
  } catch (_) {}
}
migrateLegacy();

// ── Poems ─────────────────────────────────────────────────
export const getPoems = (): Poem[] => safeParse<unknown[]>(POEMS_KEY, [])
  .map(sanitizePoem)
  .filter((poem): poem is Poem => Boolean(poem));

export const savePoem = async (poem: Poem): Promise<{ ok: boolean; error?: string }> => {
  if (typeof localStorage === 'undefined') return { ok: false, error: '存储环境不可用' };
  try {
    const cleanPoem = validatePoem(poem);
    if (!cleanPoem) return { ok: false, error: '作品数据不符合当前格式，未写入存储' };
    const poems = getPoems();
    const idx = poems.findIndex(p => p.id === cleanPoem.id);
    if (idx >= 0) poems[idx] = cleanPoem;
    else poems.unshift(cleanPoem);

    await putPrimaryPoem(cleanPoem);
    
    try {
      localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
    } catch (err: unknown) {
      const record = err && typeof err === 'object' ? err as { name?: string; code?: number } : {};
      const isQuotaError = record.name === 'QuotaExceededError' || record.code === 22 || errorMessage(err).includes('QuotaExceededError');
      if (isQuotaError) {
        return { ok: false, error: '存储空间已满 (QuotaExceededError)，请在设置/我的页面导出备份后整理作品。' };
      }
      return { ok: false, error: `写入存储失败: ${errorMessage(err)}` };
    }
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, error: `作品主存储写入失败：${errorMessage(error)}` };
  }
};

export const deletePoem = async (id: string): Promise<{ ok: boolean; error?: string }> => {
  if (typeof localStorage === 'undefined') return { ok: false, error: '存储环境不可用' };
  try {
    const poems = getPoems().filter(p => p.id !== id);
    await deletePrimaryPoem(id);
    localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error) || '删除作品失败' };
  }
};

export const getPoemById = (id: string): Poem | undefined =>
  getPoems().find(p => p.id === id);

export const exportAllPoems = (): string => {
  const poems = getPoems();
  const settings = getSettings();
  const seals = getSeals();
  const customForms = getCustomFormsFromStorage();
  const pouch = getPouchItemsFromStorage();
  const drafts = typeof localStorage === 'undefined' ? [] : Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((key): key is string => key === DRAFT_KEY || Boolean(key?.startsWith(`${DRAFT_KEY}:`)))
    .flatMap(key => {
      const draft = validateDraft(safeParse<unknown>(key, null));
      return draft ? [{ key, data: draft }] : [];
    });

  const pkg: OuchengBackupV2 = {
    schemaVersion: 2,
    exportedAt: Date.now(),
    poems,
    settings,
    seals,
    customForms,
    pouch,
    drafts,
  };
  return JSON.stringify(pkg, null, 2);
};

export const importPoems = async (jsonStr: string): Promise<{ addedCount: number; isV2: boolean; error?: string }> => {
  if (typeof localStorage === 'undefined') return { addedCount: 0, isV2: false, error: '存储环境不可用' };
  try {
    const rawData = JSON.parse(jsonStr);
    if (
      rawData && typeof rawData === 'object' && !Array.isArray(rawData)
      && 'schemaVersion' in rawData && rawData.schemaVersion !== 2
    ) {
      return { addedCount: 0, isV2: false, error: `不支持的备份版本：${String(rawData.schemaVersion)}` };
    }
    const validatedV2 = validateBackupV2(rawData);
    if (rawData?.schemaVersion === 2 && !validatedV2) {
      return { addedCount: 0, isV2: true, error: 'V2 备份不完整或包含无效数据，未导入任何内容。请使用完整备份文件。' };
    }
    const isV2 = Boolean(validatedV2);
    
    const rawPoems = validatedV2?.poems ?? (Array.isArray(rawData) ? rawData : (rawData?.poems || []));
    if (!Array.isArray(rawPoems)) return { addedCount: 0, isV2, error: '数据包缺少作品列表' };

    const newPoems = rawPoems.map(sanitizePoem).filter((poem): poem is Poem => Boolean(poem));
    const existing = getPoems();
    const existingIds = new Set(existing.map(p => p.id));
    let addedCount = 0;

    newPoems.forEach(p => {
      if (!existingIds.has(p.id)) {
        existing.push(p);
        existingIds.add(p.id);
        addedCount++;
      }
    });

    existing.sort((a, b) => b.createdAt - a.createdAt);
    await replacePrimaryPoems(existing);
    localStorage.setItem(POEMS_KEY, JSON.stringify(existing));

    if (validatedV2) {
      if (Array.isArray(validatedV2.seals)) {
        validatedV2.seals.forEach(seal => saveSeal(seal));
      }
      if (Array.isArray(validatedV2.customForms)) {
        validatedV2.customForms.forEach(form => {
          if (form.name && !form.builtin) {
            saveCustomFormToStorage(form);
          }
        });
      }
      if (Array.isArray(validatedV2.pouch)) {
        savePouchItemsToStorage(validatedV2.pouch);
        usePouch.setState({ items: validatedV2.pouch });
      }
      if (validatedV2.settings) {
        saveSettings(validatedV2.settings);
      }
      for (const draft of validatedV2.drafts || []) {
        if (draft.key === DRAFT_KEY || draft.key.startsWith(`${DRAFT_KEY}:`)) {
          localStorage.setItem(draft.key, JSON.stringify(draft.data));
          await backupToDB(draft.key, draft.data);
        }
      }
    }

    return { addedCount, isV2 };
  } catch (error: unknown) {
    console.error("Failed to import poems", error);
    return { addedCount: 0, isV2: false, error: errorMessage(error) || '解析备份数据失败' };
  }
};

// ── Settings ──────────────────────────────────────────────
const DEFAULT_SETTINGS: UserSettings = {
  penNames: ['居士', '散人'],
  defaultPenName: '居士',
  rhymeBook: 'ci_lin',
  defaultPaperStyle: 'xuan',
  defaultLayout: 'vertical',
  theme: 'day',
};

export const getSettings = (): UserSettings => {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
  return sanitizeSettings(safeParse(SETTINGS_KEY, DEFAULT_SETTINGS));
};

export const saveSettings = (settings: UserSettings): void => {
  if (typeof localStorage === 'undefined') return;
  const clean = sanitizeSettings(settings);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean));
  backupBestEffort(SETTINGS_KEY, clean);
};

// ── Seals ─────────────────────────────────────────────────
export const getSeals = (): Seal[] => safeParse<Seal[]>(SEALS_KEY, []).filter(s => s && s.name !== '测试印');

export const saveSeal = (seal: Seal): void => {
  if (typeof localStorage === 'undefined') return;
  const seals = getSeals();
  const idx = seals.findIndex(s => s.id === seal.id);
  if (idx >= 0) seals[idx] = seal;
  else seals.push(seal);
  localStorage.setItem(SEALS_KEY, JSON.stringify(seals));
  backupBestEffort(SEALS_KEY, seals);
};

export const deleteSeal = (id: string): void => {
  if (typeof localStorage === 'undefined') return;
  const seals = getSeals().filter(s => s.id !== id);
  localStorage.setItem(SEALS_KEY, JSON.stringify(seals));
  backupBestEffort(SEALS_KEY, seals);

  // If the deleted seal was the default, clean up settings (Item 16)
  const settings = getSettings();
  if (settings.defaultSealId === id) {
    settings.defaultSealId = seals.length > 0 ? seals[0].id : undefined;
    saveSettings(settings);
  }
};

export const setDefaultSeal = (id: string): void => {
  const settings = getSettings();
  settings.defaultSealId = id;
  saveSettings(settings);
};

// ── Collections ───────────────────────────────────────────
export const getCollections = (): string[] => {
  const poems = getPoems();
  const collections = new Set<string>();
  poems.forEach(p => {
    if (p.collectionName && p.collectionName.trim()) {
      collections.add(p.collectionName.trim());
    }
  });
  return Array.from(collections).sort((a, b) => a.localeCompare(b, 'zh-CN'));
};

export const renameCollection = async (oldName: string, newName: string): Promise<{ ok: boolean; error?: string }> => {
  if (typeof localStorage === 'undefined') return { ok: false, error: '存储环境不可用' };
  const poems = getPoems();
  let updated = false;
  poems.forEach(p => {
    if (p.collectionName === oldName) {
      p.collectionName = newName;
      updated = true;
    }
  });
  if (updated) {
    try {
      await replacePrimaryPoems(poems);
      localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
    } catch (error: unknown) {
      return { ok: false, error: errorMessage(error) };
    }
  }
  return { ok: true };
};

export const deleteCollection = async (name: string, deletePoems: boolean): Promise<{ ok: boolean; error?: string }> => {
  if (typeof localStorage === 'undefined') return { ok: false, error: '存储环境不可用' };
  let poems = getPoems();
  if (deletePoems) {
    poems = poems.filter(p => p.collectionName !== name);
  } else {
    poems.forEach(p => {
      if (p.collectionName === name) {
        delete p.collectionName;
      }
    });
  }
  try {
    await replacePrimaryPoems(poems);
    localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error) };
  }
};

// ── Custom Forms Storage ──────────────────────────────────
export const getCustomFormsFromStorage = (): PoemForm[] => {
  const forms = safeParse(CUSTOM_FORMS_KEY, []);
  return Array.isArray(forms) ? forms.map(validateCustomForm).filter((f): f is PoemForm => f !== null && f.name !== '测试自定体') : [];
};

export const saveCustomFormToStorage = (form: PoemForm): void => {
  if (typeof localStorage === 'undefined') return;
  const valid = validateCustomForm(form);
  if (!valid) throw new Error('自定体例无效：行数和转折行须为 1–200 的整数，每行字数须为正整数或递增范围。');
  const forms = getCustomFormsFromStorage();
  const idx = forms.findIndex(f => f.id === valid.id);
  if (idx >= 0) forms[idx] = valid;
  else forms.push(valid);
  localStorage.setItem(CUSTOM_FORMS_KEY, JSON.stringify(forms));
  backupBestEffort(CUSTOM_FORMS_KEY, forms);
};

export const deleteCustomFormFromStorage = (id: string): void => {
  if (typeof localStorage === 'undefined') return;
  const forms = getCustomFormsFromStorage().filter(f => f.id !== id);
  localStorage.setItem(CUSTOM_FORMS_KEY, JSON.stringify(forms));
  backupBestEffort(CUSTOM_FORMS_KEY, forms);
};

// ── Pouch Storage ─────────────────────────────────────────
export const getPouchItemsFromStorage = (): PouchItem[] => {
  const items = safeParse(POUCH_KEY, []);
  return Array.isArray(items) ? items.map(validatePouchItem).filter((i): i is PouchItem => i !== null) : [];
};

export const savePouchItemsToStorage = (items: PouchItem[]): void => {
  if (typeof localStorage === 'undefined') return;
  const valid = items.map(validatePouchItem).filter((i): i is PouchItem => i !== null);
  localStorage.setItem(POUCH_KEY, JSON.stringify(valid));
  backupBestEffort(POUCH_KEY, valid);
};

export const getDraftKey = (editId?: string | null): string => {
  return editId ? `${DRAFT_KEY}:${editId}` : DRAFT_KEY;
};

export const getDraft = (editId?: string | null): CreateDraft | null => {
  if (typeof localStorage === 'undefined') return null;
  const key = getDraftKey(editId);
  const parsed = safeParse<unknown>(key, null);
  return validateDraft(parsed);
};

export const saveDraft = async (editId: string | null, draft: CreateDraft): Promise<void> => {
  if (typeof localStorage === 'undefined') return;
  const key = getDraftKey(editId);
  const clean = validateDraft(draft);
  if (clean && Object.keys(clean).length) {
    localStorage.setItem(key, JSON.stringify(clean));
    await backupToDB(key, clean);
  } else {
    localStorage.removeItem(key);
  }
};

export const deleteDraft = async (editId: string | null): Promise<void> => {
  if (typeof localStorage === 'undefined') return;
  const key = getDraftKey(editId);
  localStorage.removeItem(key);
  await deleteFromDB(key);
};
