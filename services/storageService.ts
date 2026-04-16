import { Poem, UserSettings, Seal } from '../types';

const POEMS_KEY = 'oucheng_poems_v4';
const SETTINGS_KEY = 'oucheng_settings_v4';
const SEALS_KEY = 'oucheng_seals_v4';

// ── Legacy migration ──────────────────────────────────────
function migrateLegacy() {
  const old = localStorage.getItem('oucheng_poems');
  if (old && !localStorage.getItem(POEMS_KEY)) {
    localStorage.setItem(POEMS_KEY, old);
  }
}
migrateLegacy();

// ── Poems ─────────────────────────────────────────────────
export const getPoems = (): Poem[] => {
  const stored = localStorage.getItem(POEMS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const savePoem = (poem: Poem): void => {
  const poems = getPoems();
  const idx = poems.findIndex(p => p.id === poem.id);
  if (idx >= 0) poems[idx] = poem;
  else poems.unshift(poem);
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
};

export const deletePoem = (id: string): void => {
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
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: UserSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// ── Seals ─────────────────────────────────────────────────
export const getSeals = (): Seal[] => {
  const stored = localStorage.getItem(SEALS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveSeal = (seal: Seal): void => {
  const seals = getSeals();
  const idx = seals.findIndex(s => s.id === seal.id);
  if (idx >= 0) seals[idx] = seal;
  else seals.push(seal);
  localStorage.setItem(SEALS_KEY, JSON.stringify(seals));
};

export const deleteSeal = (id: string): void => {
  const seals = getSeals().filter(s => s.id !== id);
  localStorage.setItem(SEALS_KEY, JSON.stringify(seals));
};

export const setDefaultSeal = (id: string): void => {
  const settings = getSettings();
  settings.defaultSealId = id;
  saveSettings(settings);
};
