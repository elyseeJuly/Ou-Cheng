import { Poem, UserSettings } from '../types';

const POEMS_KEY = 'oucheng_poems';
const SETTINGS_KEY = 'oucheng_settings';

export const getPoems = (): Poem[] => {
  const stored = localStorage.getItem(POEMS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const savePoem = (poem: Poem): void => {
  const poems = getPoems();
  const existingIndex = poems.findIndex(p => p.id === poem.id);
  if (existingIndex >= 0) {
    poems[existingIndex] = poem;
  } else {
    poems.unshift(poem);
  }
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
};

export const deletePoem = (id: string): void => {
  const poems = getPoems().filter(p => p.id !== id);
  localStorage.setItem(POEMS_KEY, JSON.stringify(poems));
};

export const getSettings = (): UserSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : {
    penNames: ['居士', '散人'],
    defaultPenName: '居士',
    rhymeScheme: 'ci_lin_zheng_yun'
  };
};

export const saveSettings = (settings: UserSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
