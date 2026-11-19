// ============================================================
// 偶成 (Ou Cheng) v1.0.0 — 运行时 Schema 校验层
// ============================================================

import { Poem, UserSettings, Seal, OuchengBackupV2, CreateDraft, PoemType, SonnetType, RhymeBook, LayoutMode, PaperStyle, FontStyle } from '../types';
import { PoemForm } from '../data/poemForms';
import { PouchItem } from '../stores/pouchStore';

// Built-in forms use at most 14 lines; custom long forms retain room without unbounded DOM allocation.
export const MAX_CUSTOM_FORM_LINES = 200;
export const isValidFormLineCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_CUSTOM_FORM_LINES;
const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;

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
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) return null;

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
  if (data.updatedAt !== undefined && (typeof data.updatedAt !== 'number' || !Number.isFinite(data.updatedAt))) return null;
  if (data.favorite !== undefined && typeof data.favorite !== 'boolean') return null;
  if (data.draft !== undefined && typeof data.draft !== 'boolean') return null;
  if (data.fontStyle !== undefined) {
    const validFonts = ['lxgw_wenkai', 'noto_serif', 'ma_shan_zheng', 'none'];
    if (typeof data.fontStyle !== 'string' || !validFonts.includes(data.fontStyle)) return null;
  }
  if (data.sealId !== undefined && typeof data.sealId !== 'string') return null;
  if (data.collectionName !== undefined && typeof data.collectionName !== 'string') return null;
  if (data.aiComment !== undefined && typeof data.aiComment !== 'string') return null; // Option B

  return data as unknown as Poem;
}

export function validateUserSettings(data: unknown): UserSettings | null {
  if (!isObject(data)) return null;
  if (!Array.isArray(data.penNames) || data.penNames.some(name => typeof name !== 'string')) return null;
  if (typeof data.defaultPenName !== 'string') return null;
  if (!['ci_lin', 'ping_shui', 'xin_yun'].includes(String(data.rhymeBook))) return null;
  if (!['xuan', 'meihua', 'yunwen', 'zhu', 'lianhua'].includes(String(data.defaultPaperStyle))) return null;
  if (!['vertical', 'horizontal'].includes(String(data.defaultLayout))) return null;
  if (data.defaultSealId !== undefined && typeof data.defaultSealId !== 'string') return null;
  if (data.globalFont !== undefined && !['lxgw_wenkai', 'noto_serif', 'ma_shan_zheng', 'none'].includes(String(data.globalFont))) return null;
  if (data.theme !== undefined && !['day', 'night', 'auto'].includes(String(data.theme))) return null;
  for (const key of ['rhymeHintEnabled', 'hapticsEnabled', 'beatTickHapticsEnabled']) {
    if (data[key] !== undefined && typeof data[key] !== 'boolean') return null;
  }
  // Option B：开源版保留自带 API Key 的 AI 点评
  for (const key of ['apiKey', 'apiBaseUrl', 'apiModel']) {
    if (data[key] !== undefined && typeof data[key] !== 'string') return null;
  }

  return data as unknown as UserSettings;
}

export function validateCustomForm(data: unknown): PoemForm | null {
  if (!isObject(data)) return null;
  if (typeof data.id !== 'string' || !data.id) return null;
  if (typeof data.name !== 'string' || !data.name.trim()) return null;
  // This collection stores user forms only; a built-in flag would make import silently skip the entry.
  if (data.builtin !== undefined && data.builtin !== false) return null;
  if (data.lineCount !== undefined && !isValidFormLineCount(data.lineCount)) return null;
  if (data.voltaAt !== undefined && !isValidFormLineCount(data.voltaAt)) return null;
  if (typeof data.lineCount === 'number' && typeof data.voltaAt === 'number' && data.voltaAt > data.lineCount) return null;
  if (data.charsPerLine !== undefined) {
    const rule = data.charsPerLine;
    if (Array.isArray(rule)) {
      if (rule.length !== 2 || !rule.every(isPositiveInteger) || rule[0] > rule[1]) return null;
    } else if (!isPositiveInteger(rule)) return null;
  }
  if (data.rhymeScheme !== undefined && typeof data.rhymeScheme !== 'string') return null;
  if (data.guide !== undefined && typeof data.guide !== 'string') return null;

  return { ...data, builtin: data.builtin ?? false } as unknown as PoemForm;
}

export function validatePouchItem(data: unknown): PouchItem | null {
  if (!isObject(data)) return null;
  const word = typeof data.word === 'string' ? data.word : (typeof data.char === 'string' ? data.char : null);
  if (!word) return null;
  if (typeof data.category !== 'string' || typeof data.tone !== 'string') return null;
  if (typeof data.freq !== 'number' || !Number.isFinite(data.freq)) return null;
  if (typeof data.timestamp !== 'number' || !Number.isFinite(data.timestamp)) return null;

  return { ...data, word } as unknown as PouchItem;
}

export function validateSeal(data: unknown): Seal | null {
  if (!isObject(data)) return null;
  if (typeof data.id !== 'string' || !data.id) return null;
  if (typeof data.name !== 'string') return null;
  if (typeof data.dataUrl !== 'string' || !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/i.test(data.dataUrl)) return null;
  if (!['yang_yuan', 'yin_fang', 'jiudie', 'niaochen', 'guyuan'].includes(String(data.style))) return null;
  if (typeof data.isCustom !== 'boolean') return null;
  if (typeof data.createdAt !== 'number' || !Number.isFinite(data.createdAt)) return null;

  return data as unknown as Seal;
}

export function validateBackupV2(data: unknown): OuchengBackupV2 | null {
  if (!isObject(data)) return null;
  if (data.schemaVersion !== 2) return null;
  if (!Array.isArray(data.poems)) return null;
  if (typeof data.exportedAt !== 'number' || !Number.isFinite(data.exportedAt)) return null;
  const settings = validateUserSettings(data.settings);
  if (!settings) return null;
  if (!Array.isArray(data.seals) || !Array.isArray(data.customForms) || !Array.isArray(data.pouch)) return null;
  const poems = data.poems.map(validatePoem);
  const seals = data.seals.map(validateSeal);
  const customForms = data.customForms.map(validateCustomForm);
  const pouch = data.pouch.map(validatePouchItem);
  // A backup is indivisible: filtering bad entries would silently report a partial restore as success.
  if (poems.some(value => !value) || seals.some(value => !value) || customForms.some(value => !value) || pouch.some(value => !value)) return null;
  if (data.drafts !== undefined && !Array.isArray(data.drafts)) return null;
  const drafts: NonNullable<OuchengBackupV2['drafts']> = [];
  for (const item of data.drafts ?? []) {
    if (!isObject(item) || typeof item.key !== 'string') return null;
    const draft = validateDraft(item.data);
    if (!draft) return null;
    drafts.push({ key: item.key, data: draft });
  }

  return {
    schemaVersion: 2,
    exportedAt: data.exportedAt,
    poems: poems as Poem[],
    settings,
    seals: seals as Seal[],
    customForms: customForms as PoemForm[],
    pouch: pouch as PouchItem[],
    drafts,
  };
}

export function validateDraft(data: unknown): CreateDraft | null {
  if (!isObject(data)) return null;
  const stringKeys = ['title', 'author', 'content', 'heartNote', 'formId', 'selectedCipaiId', 'aiComment'];
  if (stringKeys.some(key => data[key] !== undefined && typeof data[key] !== 'string')) return null;
  for (const key of ['editId', 'manualRhymeGroupId']) {
    if (data[key] !== undefined && data[key] !== null && typeof data[key] !== 'string') return null;
  }
  if (data.proLines !== undefined && (!Array.isArray(data.proLines) || !data.proLines.every(line => typeof line === 'string'))) return null;
  const enumFields: Record<string, readonly string[]> = {
    mode: ['free', 'pro'], proTab: ['jinti', 'cipai'],
    poemType: ['free', 'jueju_5', 'jueju_7', 'lvshi_5', 'lvshi_7', 'cipai', 'sonnet'],
    jintiStart: ['ping', 'ze'], jintiRhyme: ['yes', 'no'],
    sonnetType: ['none', 'shakespeare', 'petrarchan', 'chinese_modern'],
    rhymeBook: ['ci_lin', 'ping_shui', 'xin_yun'], layout: ['vertical', 'horizontal'],
    paperStyle: ['xuan', 'meihua', 'yunwen', 'zhu', 'lianhua'],
    fontStyle: ['lxgw_wenkai', 'noto_serif', 'ma_shan_zheng', 'none'],
  };
  if (Object.entries(enumFields).some(([key, values]) => data[key] !== undefined && !values.includes(data[key] as string))) return null;
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
