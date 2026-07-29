// pouchStore.ts —— 拾字囊状态管理
import { create } from 'zustand';
import { EventBus } from '../utils/EventBus';


export interface PouchItem {
  word: string;          // 意象词
  category: string;      // 类目
  freq: number;          // 频率
  tone: string;          // 平仄
  timestamp: number;     // 添加时间
}

export type ToneFilterMode = 'auto' | 'P' | 'Z' | 'off';

export interface PouchState {
  items: PouchItem[];
  visible: boolean;
  query: string;
  filter: string | null; // 类目筛选
  toneFilter: ToneFilterMode; // 平仄筛选：auto=随格, P=平, Z=仄, off=不限

  addItem: (item: PouchItem) => void;
  removeItem: (word: string) => void;
  clear: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
  setFilter: (f: string | null) => void;
  setToneFilter: (t: ToneFilterMode) => void;
}

const MAX = 60;
const STORAGE_KEY = 'oucheng_pouch';

export const usePouch = create<PouchState>((set) => ({
  items: [],
  visible: false,
  query: '',
  filter: null,
  toneFilter: 'auto',

  addItem: (item) => set((state) => {
    if (state.items.find(i => i.word === item.word)) return state;
    return { items: [item, ...state.items].slice(0, MAX) };
  }),
  removeItem: (word) => set((state) => ({
    items: state.items.filter(i => i.word !== word),
  })),
  clear: () => set({ items: [] }),
  toggle: () => set((state) => ({ visible: !state.visible })),
  setQuery: (q) => set({ query: q }),
  setFilter: (f) => set({ filter: f }),
  setToneFilter: (t) => set({ toneFilter: t }),
}));

import { getPouchItemsFromStorage, savePouchItemsToStorage } from '../services/storageService';

// 从 storageService 恢复/持久化
try {
  const items = getPouchItemsFromStorage();
  if (items && items.length) {
    usePouch.setState({ items });
  }
} catch { /* ignore */ }

usePouch.subscribe((state) => {
  savePouchItemsToStorage(state.items);
});

// 兼容规范的原始 API（基于 zustand 封装）
export function getPouch(): PouchItem[] {
  return usePouch.getState().items;
}
export function addToPouch(item: Omit<PouchItem, 'timestamp'>) {
  const alreadyIn = usePouch.getState().items.some(i => i.word === item.word);
  usePouch.getState().addItem({ ...item, timestamp: Date.now() });
  if (!alreadyIn) {
    EventBus.emit('TRIGGER_BURST', { shapeType: 'saturn' });
  }
}
export function removeFromPouch(word: string) {
  usePouch.getState().removeItem(word);
  EventBus.emit('TRIGGER_BURST', { shapeType: 'dud' });
}
export function inPouch(word: string) {
  return usePouch.getState().items.some(i => i.word === word);
}
export function subscribePouch(fn: () => void) {
  return usePouch.subscribe(fn);
}