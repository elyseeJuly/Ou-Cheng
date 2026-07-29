// ============================================================
// 偶成 (Ou Cheng) v0.5.1 — 运行时 Schema 校验层
// ============================================================

import { Poem, UserSettings, Seal, OuchengBackupV2, CreateDraft, PoemType, SonnetType, RhymeBook, LayoutMode, PaperStyle, FontStyle } from '../types';
import { PoemForm } from '../data/poemForms';
import { PouchItem } from '../stores/pouchStore';

export function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function validatePoem(data: unknown): Poem | null {
  if (!isObject(data)) return null;

  const { id, title, author, content, heartNote, type, layout, paperStyle, rhymeBook, createdAt } = data;

  if (typeof id !== 'string' || !id.trim()) return null;
  if (typeof title !== 'string') return null;
  if (typeof author !== 'string') return null;
  if (typeof content !== 'string') return null;
  if (typeof heartNote !== 'string') return null;
  if (typeof createdAt !== 'number' || isNaN(createdAt)) return null;

  const validTypes = ['free', 'jueju_5', 'jueju_7', 'lvshi_5', 'lvshi_7', 'cipai', 'sonnet'];
  if (typeof type !== 'string' || !validTypes.includes(type)) return null;

  const validLayouts = ['vertical', 'horizontal'];
  if (typeof layout !== 'string' || !validLayouts.includes(layout)) return null;

  const validPapers = ['xuan', 'meihua', 'yunwen', 'zhu', 'lianhua'];
  if (typeof paperStyle !== 'string' || !validPapers.includes(paperStyle)) return null;

  const validRhymeBooks = ['ci_lin', 'ping_shui', 'xin_yun'];
  if (typeof rhymeBook !== 'string' || !validRhymeBooks.includes(rhymeBook)) return null;

  const hasAny = (keys: string[]) => keys.some(key => data[key] !== undefined);

  // 判别联合：各变体只允许自己的领域字段，拒绝非法组合。
  if (type === 'cipai') {
    if (typeof data.cipaiName !== 'string' || !data.cipaiName.trim()) return null;
    if (typeof data.cipaiVariantId !== 'string' || !data.cipaiVariantId.trim()) return null;
    if (hasAny(['sonnetType', 'jintiVariant', 'formId', 'formName'])) return null;
  } else if (type === 'sonnet') {
    const validSonnets = ['shakespeare', 'petrarchan', 'chinese_modern'];
    if (typeof data.sonnetType !== 'string' || !validSonnets.includes(data.sonnetType)) return null;
    if (hasAny(['cipaiName', 'cipaiVariantId', 'jintiVariant'])) return null;
  } else if (['jueju_5', 'jueju_7', 'lvshi_5', 'lvshi_7'].includes(type)) {
    if (data.jintiVariant !== undefined && typeof data.jintiVariant !== 'string') return null;
    if (hasAny(['cipaiName', 'cipaiVariantId', 'sonnetType', 'formId', 'formName'])) return null;
  } else if (hasAny(['cipaiName', 'cipaiVariantId', 'sonnetType', 'jintiVariant'])) {
    return null;
  } else {
    if (data.formId !== undefined && typeof data.formId !== 'string') return null;
    if (data.formName !== undefined && typeof data.formName !== 'string') return null;
  }

  // 校验其他可选字段的类型
  if (data.updatedAt !== undefined && (typeof data.updatedAt !== 'number' || isNaN(data.updatedAt))) return null;
  if (data.favorite !== undefined && typeof data.favorite !== 'boolean') return null;
  if (data.draft !== undefined && typeof data.draft !== 'boolean') return null;
  if (data.fontStyle !== undefined) {
    const validFonts = ['lxgw_wenkai', 'noto_serif', 'ma_shan_zheng', 'none'];
    if (typeof data.fontStyle !== 'string' || !validFonts.includes(data.fontStyle)) return null;
  }
  if (data.sealId !== undefined && typeof data.sealId !== 'string') return null;
  if (data.collectionName !== undefined && typeof data.collectionName !== 'string') return null;
  if (data.aiComment !== undefined && typeof data.aiComment !== 'string') return null;

  return data as unknown as Poem;
}

export function validateUserSettings(data: unknown): UserSettings | null {
  if (!isObject(data)) return null;
  if (!Array.isArray(data.penNames) || data.penNames.some(name => typeof name !== 'string')) return null;
  if (typeof data.defaultPenName !== 'string') return null;
  if (!['ci_lin', 'ping_shui', 'xin_yun'].includes(String(data.rhymeBook))) return null;
  if (!['xuan', 'meihua', 'yunwen', 'zhu', 'lianhua'].includes(String(data.defaultPaperStyle))) return null;
  if (!['vertical', 'horizontal'].includes(String(data.defaultLayout))) return null;

  if (data.apiKey !== undefined && typeof data.apiKey !== 'string') return null;
  if (data.apiBaseUrl !== undefined && typeof data.apiBaseUrl !== 'string') return null;
  if (data.apiModel !== undefined && typeof data.apiModel !== 'string') return null;

  return data as unknown as UserSettings;
}

export function validateCustomForm(data: unknown): PoemForm | null {
  if (!isObject(data)) return null;
  if (typeof data.id !== 'string' || !data.id) return null;
  if (typeof data.name !== 'string' || !data.name) return null;

  return data as unknown as PoemForm;
}

export function validatePouchItem(data: unknown): PouchItem | null {
  if (!isObject(data)) return null;
  const word = typeof data.word === 'string' ? data.word : (typeof data.char === 'string' ? data.char : null);
  if (!word) return null;

  return data as unknown as PouchItem;
}

export function validateSeal(data: unknown): Seal | null {
  if (!isObject(data)) return null;
  if (typeof data.id !== 'string' || !data.id) return null;
  if (typeof data.name !== 'string') return null;
  if (typeof data.dataUrl !== 'string') return null;

  return data as unknown as Seal;
}

export function validateBackupV2(data: unknown): OuchengBackupV2 | null {
  if (!isObject(data)) return null;
  if (data.schemaVersion !== 2 && data.version !== 'v5.0') return null;
  if (!Array.isArray(data.poems)) return null;

  const validPoems = data.poems.map(validatePoem).filter((p): p is Poem => p !== null);

  return {
    schemaVersion: 2,
    exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : Date.now(),
    poems: validPoems,
    settings: (validateUserSettings(data.settings) ?? {
      penNames: ['偶成作者'],
      defaultPenName: '偶成作者',
      rhymeBook: 'ci_lin',
      defaultPaperStyle: 'xuan',
      defaultLayout: 'vertical',
    }) as UserSettings,
    seals: Array.isArray(data.seals) ? data.seals.map(validateSeal).filter((s): s is Seal => s !== null) : [],
    customForms: Array.isArray(data.customForms) ? data.customForms.map(validateCustomForm).filter((f): f is PoemForm => f !== null) : [],
    pouch: Array.isArray(data.pouch) ? data.pouch.map(validatePouchItem).filter((p): p is PouchItem => p !== null) : [],
    drafts: Array.isArray(data.drafts)
      ? data.drafts.flatMap(item => {
          if (!isObject(item) || typeof item.key !== 'string') return [];
          const draft = validateDraft(item.data);
          return draft ? [{ key: item.key, data: draft }] : [];
        })
      : [],
  };
}

export function validateDraft(data: unknown): CreateDraft | null {
  if (!isObject(data)) return null;
  const clean: CreateDraft = {};
  const copyString = <K extends keyof CreateDraft>(key: K) => {
    const value = data[key];
    if (typeof value === 'string') Object.assign(clean, { [key]: value });
  };
  ['title', 'author', 'content', 'heartNote', 'formId', 'selectedCipaiId', 'aiComment'].forEach(key => copyString(key as keyof CreateDraft));
  if (data.editId === null || typeof data.editId === 'string') clean.editId = data.editId;
  if (data.manualRhymeGroupId === null || typeof data.manualRhymeGroupId === 'string') clean.manualRhymeGroupId = data.manualRhymeGroupId;
  if (data.mode === 'free' || data.mode === 'pro') clean.mode = data.mode;
  if (data.proTab === 'jinti' || data.proTab === 'cipai') clean.proTab = data.proTab;
  if (Array.isArray(data.proLines) && data.proLines.every(line => typeof line === 'string')) clean.proLines = data.proLines;
  const poemTypes: PoemType[] = ['free', 'jueju_5', 'jueju_7', 'lvshi_5', 'lvshi_7', 'cipai', 'sonnet'];
  if (poemTypes.includes(data.poemType as PoemType)) clean.poemType = data.poemType as PoemType;
  if (data.jintiStart === 'ping' || data.jintiStart === 'ze') clean.jintiStart = data.jintiStart;
  if (data.jintiRhyme === 'yes' || data.jintiRhyme === 'no') clean.jintiRhyme = data.jintiRhyme;
  const sonnetTypes: SonnetType[] = ['none', 'shakespeare', 'petrarchan', 'chinese_modern'];
  if (sonnetTypes.includes(data.sonnetType as SonnetType)) clean.sonnetType = data.sonnetType as SonnetType;
  const rhymeBooks: RhymeBook[] = ['ci_lin', 'ping_shui', 'xin_yun'];
  if (rhymeBooks.includes(data.rhymeBook as RhymeBook)) clean.rhymeBook = data.rhymeBook as RhymeBook;
  const layouts: LayoutMode[] = ['vertical', 'horizontal'];
  if (layouts.includes(data.layout as LayoutMode)) clean.layout = data.layout as LayoutMode;
  const papers: PaperStyle[] = ['xuan', 'meihua', 'yunwen', 'zhu', 'lianhua'];
  if (papers.includes(data.paperStyle as PaperStyle)) clean.paperStyle = data.paperStyle as PaperStyle;
  const fonts: FontStyle[] = ['lxgw_wenkai', 'noto_serif', 'ma_shan_zheng', 'none'];
  if (fonts.includes(data.fontStyle as FontStyle)) clean.fontStyle = data.fontStyle as FontStyle;
  return clean;
}
