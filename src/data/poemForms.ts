export interface PoemForm {
  id: string;
  name: string;              // 乐府·短歌行体
  builtin: boolean;
  lineCount?: number;        // 不填 = 不限行数
  charsPerLine?: number | [number, number];  // 不填 = 不限字数
  rhymeScheme?: string;      // 'ABAB CDCD EFEF GG' | 'AABA'（柔性提示）
  voltaAt?: number;          // 转折行提示
  guide?: string;            // 一句话体例说明
}

// 解析用户输入的每行字数：空 / 5 / 5-7
export const parseChars = (s: string): PoemForm['charsPerLine'] => {
  if (!s.trim()) return undefined;
  const m = s.match(/^(\d+)\s*[-~]\s*(\d+)$/);
  return m ? [+m[1], +m[2]] : (parseInt(s) || undefined);
};

export const formatChars = (c?: PoemForm['charsPerLine']): string => {
  if (c == null) return '';
  if (Array.isArray(c)) return `${c[0]}-${c[1]}`;
  return String(c);
};

export function checkCharsPerLine(actualLength: number, rule?: PoemForm['charsPerLine']): boolean {
  if (rule == null) return true;
  if (Array.isArray(rule)) return actualLength >= rule[0] && actualLength <= rule[1];
  return actualLength === rule;
}

export const BUILTIN_FORMS: PoemForm[] = [
  { id: 'free', name: '无拘', builtin: true, guide: '' },
  { id: 'gujue5', name: '古绝', builtin: true, lineCount: 4, charsPerLine: 5,
    guide: '五言四句 · 不拘平仄 · 意到即止' },
  { id: 'gujue7', name: '七言古绝', builtin: true, lineCount: 4, charsPerLine: 7,
    guide: '七言四句 · 不拘平仄' },
  { id: 'yuefu4', name: '乐府·四言', builtin: true, charsPerLine: 4,
    guide: '诗经体 · 四字一句 · 重章叠咏' },
  { id: 'yuefu_za', name: '乐府·杂言', builtin: true,
    guide: '歌行体 · 长短错落 · 随情而歌' },
  { id: 'sonnet_shak', name: '莎翁体十四行', builtin: true, lineCount: 14,
    rhymeScheme: 'ABAB CDCD EFEF GG', voltaAt: 9,
    guide: '十四行 · 四四四二分节 · 尾对句作结（韵式为创作提示）' },
  { id: 'sonnet_petr', name: '彼特拉克体', builtin: true, lineCount: 14,
    rhymeScheme: 'ABBAABBA CDECDE', voltaAt: 9,
    guide: '十四行 · 前八后六 · 第九行转折（韵式为创作提示）' },
  { id: 'sonnet_cn', name: '汉语十四行', builtin: true, lineCount: 14,
    guide: '十四行 · 韵式自定 · 以顿代步' },
];

import { getCustomFormsFromStorage, saveCustomFormToStorage, deleteCustomFormFromStorage } from '../services/storageService';

export function getCustomForms(): PoemForm[] {
  return getCustomFormsFromStorage();
}
export function saveCustomForm(f: Omit<PoemForm, 'id' | 'builtin'>): PoemForm {
  const nf: PoemForm = { ...f, id: `custom_${Date.now()}`, builtin: false };
  saveCustomFormToStorage(nf);
  return nf;
}
export function deleteCustomForm(id: string) {
  deleteCustomFormFromStorage(id);
}
export function getAllForms(): PoemForm[] { return [...BUILTIN_FORMS, ...getCustomForms()]; }
export function getForm(id: string): PoemForm {
  return getAllForms().find(f => f.id === id) ?? BUILTIN_FORMS[0];
}

// 旧 sonnetType 迁移映射
export const SONNET_FORM_MAP: Record<string, string> = {
  'shakespeare': 'sonnet_shak',
  'petrarchan': 'sonnet_petr',
  'chinese_modern': 'sonnet_cn',
  'none': 'free',
};