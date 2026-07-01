import { Poem, UserSettings, Seal } from '../types';

const POEMS_KEY = 'oucheng_poems_v4';
const SETTINGS_KEY = 'oucheng_settings_v4';
const SEALS_KEY = 'oucheng_seals_v4';

// ── Environment-Safe Safe Parse Helper ────────────────────
const safeParse = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error(`LocalStorage key ${key} is corrupted. Backing up and resetting.`, e);
    try {
      localStorage.setItem(`${key}_corrupt_${Date.now()}`, stored);
    } catch (_) {}
    return fallback;
  }
};

// ── IndexedDB Mirror Setup ──────────────────────────────
const dbPromise = new Promise<IDBDatabase | null>((resolve) => {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    resolve(null);
    return;
  }
  const request = window.indexedDB.open('oucheng_vault', 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('backup_store')) {
      db.createObjectStore('backup_store');
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => resolve(null);
});

const backupToDB = async (key: string, value: any): Promise<void> => {
  try {
    const db = await dbPromise;
    if (!db) return;
    const tx = db.transaction('backup_store', 'readwrite');
    const store = tx.objectStore('backup_store');
    store.put(JSON.parse(JSON.stringify(value)), key); // clone to avoid structured clone issues with proxy
  } catch (e) {
    console.warn('IndexedDB backup failed:', e);
  }
};

const getFromDB = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await dbPromise;
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
      const tx = db.transaction('backup_store', 'readonly');
      const store = tx.objectStore('backup_store');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

export const rehydrateStorage = async (): Promise<void> => {
  if (typeof localStorage === 'undefined') return;
  const keys = [POEMS_KEY, SETTINGS_KEY, SEALS_KEY];
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
      const backup = await getFromDB<any>(key);
      if (backup) {
        localStorage.setItem(key, JSON.stringify(backup));
        console.log(`Successfully recovered ${key} from IndexedDB backup ${isCorrupted ? '(repaired corruption)' : ''}.`);
      }
    }
  }
};

// ── Legacy migration ──────────────────────────────────────
function migrateLegacy() {
  if (typeof localStorage === 'undefined') return;
  const old = localStorage.getItem('oucheng_poems');
  if (old && !localStorage.getItem(POEMS_KEY)) {
    localStorage.setItem(POEMS_KEY, old);
  }
}
migrateLegacy();

// ── Poems ─────────────────────────────────────────────────
export const getPoems = (): Poem[] => safeParse(POEMS_KEY, []);

export const savePoem = (poem: Poem): void => {
  if (typeof localStorage === 'undefined') return;
  const poems = getPoems();
  const idx = poems.findIndex(p => p.id === poem.id);
  if (idx >= 0) poems[idx] = poem;
  else poems.unshift(poem);
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
  backupToDB(POEMS_KEY, poems);
};

export const deletePoem = (id: string): void => {
  if (typeof localStorage === 'undefined') return;
  const poems = getPoems().filter(p => p.id !== id);
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
  backupToDB(POEMS_KEY, poems);
};

export const getPoemById = (id: string): Poem | undefined =>
  getPoems().find(p => p.id === id);

export const exportAllPoems = (): string => {
  const poems = getPoems();
  return JSON.stringify({ version: 'v5.0', timestamp: Date.now(), poems }, null, 2);
};

export const importPoems = (jsonStr: string): number => {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const data = JSON.parse(jsonStr);
    const newPoems: Poem[] = Array.isArray(data) ? data : (data.poems || []);
    if (!Array.isArray(newPoems)) return 0;
    
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
    
    // Sort by createdAt descending
    existing.sort((a, b) => b.createdAt - a.createdAt);
    localStorage.setItem(POEMS_KEY, JSON.stringify(existing));
    backupToDB(POEMS_KEY, existing);
    return addedCount;
  } catch (e) {
    console.error("Failed to import poems", e);
    return 0;
  }
};

// ── Settings ──────────────────────────────────────────────
const DEFAULT_SETTINGS: UserSettings = {
  penNames: ['偶成君', '居士', '散人'],
  defaultPenName: '偶成君',
  rhymeBook: 'ci_lin',
  defaultPaperStyle: 'xuan',
  defaultLayout: 'vertical',
};

export const getSettings = (): UserSettings => {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? { ...DEFAULT_SETTINGS, ...safeParse(SETTINGS_KEY, DEFAULT_SETTINGS) } : { ...DEFAULT_SETTINGS };
};

export const saveSettings = (settings: UserSettings): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  backupToDB(SETTINGS_KEY, settings);
};

// ── Seals ─────────────────────────────────────────────────
export const getSeals = (): Seal[] => safeParse(SEALS_KEY, []);

export const saveSeal = (seal: Seal): void => {
  if (typeof localStorage === 'undefined') return;
  const seals = getSeals();
  const idx = seals.findIndex(s => s.id === seal.id);
  if (idx >= 0) seals[idx] = seal;
  else seals.push(seal);
  localStorage.setItem(SEALS_KEY, JSON.stringify(seals));
  backupToDB(SEALS_KEY, seals);
};

export const deleteSeal = (id: string): void => {
  if (typeof localStorage === 'undefined') return;
  const seals = getSeals().filter(s => s.id !== id);
  localStorage.setItem(SEALS_KEY, JSON.stringify(seals));
  backupToDB(SEALS_KEY, seals);

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

export const renameCollection = (oldName: string, newName: string): void => {
  if (typeof localStorage === 'undefined') return;
  const poems = getPoems();
  let updated = false;
  poems.forEach(p => {
    if (p.collectionName === oldName) {
      p.collectionName = newName;
      updated = true;
    }
  });
  if (updated) {
    localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
    backupToDB(POEMS_KEY, poems);
  }
};

export const deleteCollection = (name: string, deletePoems: boolean): void => {
  if (typeof localStorage === 'undefined') return;
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
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
  backupToDB(POEMS_KEY, poems);
};
