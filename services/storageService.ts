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
};

export const deletePoem = (id: string): void => {
  if (typeof localStorage === 'undefined') return;
  const poems = getPoems().filter(p => p.id !== id);
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
};

export const getPoemById = (id: string): Poem | undefined =>
  getPoems().find(p => p.id === id);

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
};

export const deleteSeal = (id: string): void => {
  if (typeof localStorage === 'undefined') return;
  const seals = getSeals().filter(s => s.id !== id);
  localStorage.setItem(SEALS_KEY, JSON.stringify(seals));

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
