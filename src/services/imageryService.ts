// imageryService.ts —— 意象词表加载与搜索服务
const BASE = `${import.meta.env.BASE_URL || '/'}data/imagery/`;

export interface ImageryIndexEntry { w: string; c: string; f: number; t: string; }
export interface ImageryWord extends ImageryIndexEntry {
  r?: string[]; // related words
  s?: { s: string; a: string }[]; // sample lines
  m?: boolean; // mined
}

let _index: ImageryIndexEntry[] | null = null;
let _cache: Map<string, ImageryWord[]> = new Map(); // category -> words

export async function loadIndex(): Promise<ImageryIndexEntry[]> {
  if (_index) return _index;
  const res = await fetch(`${BASE}index.json`);
  if (!res.ok) throw new Error(`Failed to load imagery index: ${res.status}`);
  _index = await res.json();
  return _index!;
}

export async function loadCategory(cat: string): Promise<ImageryWord[]> {
  if (_cache.has(cat)) return _cache.get(cat)!;
  const res = await fetch(`${BASE}${cat}.json`);
  if (!res.ok) throw new Error(`Failed to load imagery category ${cat}: ${res.status}`);
  const words = await res.json();
  _cache.set(cat, words);
  return words;
}

export async function getFull(w: string): Promise<ImageryWord | null> {
  const idx = await loadIndex();
  const entry = idx.find(e => e.w === w);
  if (!entry) return null;
  const cat = await loadCategory(entry.c);
  return cat.find(e => e.w === w) ?? null;
}

export async function getCategories(): Promise<string[]> {
  const idx = await loadIndex();
  return [...new Set(idx.map(e => e.c))].sort();
}

export async function searchImagery(
  query: string,
  toneReq: 'P' | 'Z' | null = null,
  limit = 40
): Promise<ImageryIndexEntry[]> {
  const idx = await loadIndex();
  const q = query.toLowerCase().trim();
  return idx
    .filter(e => {
      if (q && !e.w.includes(q) && !e.c.includes(q)) return false;
      if (toneReq && (!e.t || e.t[e.t.length - 1] !== toneReq)) return false;
      return true;
    })
    .slice(0, limit);
}

export async function getFilteredImagery(
  filter: string | null,
  toneFilter: 'all' | 'P' | 'Z' | 'PZ' | 'ZP',
  query: string
): Promise<ImageryIndexEntry[]> {
  const effectiveTone: 'P' | 'Z' | null =
    toneFilter === 'all' || toneFilter === 'PZ' || toneFilter === 'ZP' ? null : toneFilter;
  let results = await searchImagery(query, effectiveTone, 100);
  if (filter) results = results.filter(e => e.c === filter);
  if (toneFilter === 'PZ') results = results.filter(e => e.t && e.t.startsWith('P') && e.t.endsWith('Z'));
  if (toneFilter === 'ZP') results = results.filter(e => e.t && e.t.startsWith('Z') && e.t.endsWith('P'));
  return results;
}
