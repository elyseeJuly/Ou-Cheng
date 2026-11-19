// ============================================================
// 十四行诗校验
//
// 英文（莎士比亚式 / 彼特拉克式）：
//   · 韵脚：取末词的「末元音组 + 词尾辅音」作韵基，按拼写规则归一后比较；
//     彼特拉克式后六行接受 CDECDE / CDCDCD / CDDCEE / CDEDCE 等常见变式，取最吻合者。
//   · 音节：启发式音节计数，五步抑扬格约 10 音节（阴性韵尾 11），偏离较多给提示。
// 汉语现代十四行：
//   · 韵脚：取行末字（跳过「的了着」等轻声虚词）的中华新韵韵部；
//     在常见韵式里自动挑最吻合的一种，只作参考提示，不判错。
//   · 行长：8–16 字之外给提示（冯至、卞之琳等多在 10–13 字）。
// 拼写推断读音必然有例外，所以英文韵脚判「不押」时用 warn（提示）而非 error。
// ============================================================
import { CharResult, CharStatus, LineResult, MeterCheckResult, SonnetType } from '../types';
import { getRhymeGroups } from './rhymeData';

// ── 英文：音节与韵基 ─────────────────────────────────────────

const lastWord = (line: string): string => {
  const words = line.toLowerCase().replace(/[’']/g, "'").match(/[a-z][a-z']*/g) || [];
  return words[words.length - 1] || '';
};

/** 启发式音节数：元音组计数，去掉词尾不发音的 e / ed / es，补回 -le / -ism 等 */
export function countSyllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return 0;
  // 诗中常见缩写：dimm'd、o'er、ne'er、e'en、th'
  if (/^(o'er|ne'er|e'er|e'en|th'|t')$/.test(w)) return 1;
  w = w.replace(/'d$/, 'd').replace(/'/g, '');
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, m => m[0]);
  w = w.replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g) || [];
  let count = groups.length;
  if (/ism$/.test(w)) count += 1;
  return Math.max(1, count);
}

export function lineSyllables(line: string): number {
  return (line.match(/[A-Za-z][A-Za-z'’]*/g) || []).reduce((sum, word) => sum + countSyllables(word), 0);
}

const VOWEL_CLASSES: [RegExp, string][] = [
  [/^(?:ay|ai|ey|ei|eigh|a_e|ae_end|ay_end|ey_end)$/, 'A'],
  [/^(?:ee|ea|ie|e_e|e_end|ee_end|ea_end|ie_e|ei_e|ee_e)$/, 'E'],
  [/^(?:igh|i_e|y_end|ie_end|uy|ye_end|ye|ie_e_short)$/, 'I'],
  [/^(?:oa|o_e|ow_end|oe_end|o_end|oe)$/, 'O'],
  [/^(?:oo|u_e|ew|ue_end|ew_end|oo_end|ou_e|ui)$/, 'U'],
  [/^(?:ou|ow)$/, 'AU'],
  [/^(?:oi|oy|oy_end)$/, 'OI'],
];

/**
 * 韵基：最后一个元音组到词尾，按拼写归一：
 * - 去掉复数 / 第三人称 s、过去式 'd / ed（dimm'd → dimm）
 * - 词尾不发音 e 并入元音类（fade、shade → A:d）
 * - igh、ay、ee 等合并为同一元音类；-ower / -our 同读
 */
export function rhymeKey(word: string): string {
  let w = word.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z']/g, '');
  if (!w) return '';
  w = w.replace(/'d$/, 'd').replace(/'s$/, '').replace(/'/g, '');
  if (w.length > 3 && /[^s]s$/.test(w) && !/(?:us|is|ss)$/.test(w)) w = w.slice(0, -1);
  if (w.length > 4 && /[^e]ed$/.test(w)) w = w.slice(0, -2);
  if (/(?:igh|ite|yte|ight)$/.test(w)) return w.endsWith('igh') ? 'I:' : 'I:t';
  if (/(?:ower|our)$/.test(w) && !/(?:lower|mower|grower|thrower|sower)$/.test(w)) return 'AU:r';
  if (/(?:ire|yre|ier)$/.test(w)) return 'I:r';
  if (/(?:^|[^a-z])?eye$|^aye$/.test(w)) return 'I:';
  // 词尾 w 属元音（know、flow、new）
  const m = w.match(/([aeiouy]+w?)([^aeiouyw]*)(e?)$/);
  if (!m) return w;
  let [, vowel, coda] = m;
  const silentE = m[3];
  if (silentE && coda && vowel.length <= 2) vowel = `${vowel}_e`;
  else if (!coda && !silentE) vowel = `${vowel}_end`;
  else if (!coda && silentE) vowel = `${vowel}e_end`.replace(/ee_end$/, 'ee_end');
  if (vowel === 'y_end' && w.length > 2 && !/[aeiou]y$/.test(w)) vowel = countSyllables(w) > 1 ? 'e_end' : 'y_end';
  // 多音节词尾 e（「be」以外的 e_end 少见）按长 E
  const cls = VOWEL_CLASSES.find(([re]) => re.test(vowel))?.[1] || vowel.replace(/_.*$/, '');
  const normCoda = coda.replace(/ck$/, 'k').replace(/ph/g, 'f').replace(/(.)\1/g, '$1').replace(/^s(?=n$)/, '');
  return `${cls}:${normCoda}`;
}

/** 近韵（slant rhyme）：只看元音最后一个字母与词尾辅音（red / head、ken / Darien） */
function looseKeys(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, '').replace(/(?<=[^s])s$/, '').replace(/e$/, '');
  const m = w.match(/([aeiouy]+)([^aeiouy]+)$/);
  if (!m) return [];
  const group = m[1];
  return [...new Set([`${group[0]}${m[2]}`, `${group[group.length - 1]}${m[2]}`])];
}

export function englishRhymes(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true; // 同词重复也算「押」，但会在结论里提示
  const ka = rhymeKey(a);
  const kb = rhymeKey(b);
  if (ka === kb) return true;
  // 长元音类相同、只差复数 s / z 音（skies / surmise）
  const [va, ca] = ka.split(':');
  const [vb, cb] = kb.split(':');
  if (va === vb && /^[AEIOU]{1,2}$/.test(va) && ca.replace(/s$/, '') === cb.replace(/s$/, '')) return true;
  // 眼韵 / 近韵：词尾三个字母相同（love / move），或末元音字母与词尾辅音相同（red / head）
  if (a.length >= 3 && b.length >= 3 && a.slice(-3) === b.slice(-3)) return true;
  const la = looseKeys(a);
  return looseKeys(b).some(key => la.includes(key));
}

// ── 汉语：行末字的新韵韵部 ───────────────────────────────────

const LIGHT_PARTICLES = new Set(Array.from('的了着吧呢啊呀吗么哪哟嘛'));

function chineseRhymeChar(line: string): { char: string; index: number } | null {
  const chars = Array.from(line);
  for (let i = chars.length - 1; i >= 0; i--) {
    const c = chars[i];
    if (!/[\u3400-\u9fff]/.test(c)) continue;
    // 句末轻声虚词前若还有字，取前一字（「富韵」）
    if (LIGHT_PARTICLES.has(c) && i > 0 && /[\u3400-\u9fff]/.test(chars[i - 1])) return { char: chars[i - 1], index: i - 1 };
    return { char: c, index: i };
  }
  return null;
}

function chineseRhymes(a: string, b: string): boolean {
  const ga = new Set(getRhymeGroups(a, 'xin_yun').map(g => g.groupId));
  return getRhymeGroups(b, 'xin_yun').some(g => ga.has(g.groupId));
}

// ── 韵式 ────────────────────────────────────────────────────

const SCHEMES: Record<Exclude<SonnetType, 'none'>, { label: string; letters: string }[]> = {
  shakespeare: [{ label: '莎士比亚式', letters: 'ABABCDCDEFEFGG' }],
  petrarchan: [
    { label: '彼特拉克式（CDECDE）', letters: 'ABBAABBACDECDE' },
    { label: '彼特拉克式（CDCDCD）', letters: 'ABBAABBACDCDCD' },
    { label: '彼特拉克式（CDDCEE）', letters: 'ABBAABBACDDCEE' },
    { label: '彼特拉克式（CDEDCE）', letters: 'ABBAABBACDEDCE' },
  ],
  chinese_modern: [
    { label: '彼特拉克式', letters: 'ABBAABBACDECDE' },
    { label: '彼特拉克式', letters: 'ABBAABBACDCDCD' },
    { label: '变体彼特拉克式', letters: 'ABBACDDCEFGEFG' },
    { label: '莎士比亚式', letters: 'ABABCDCDEFEFGG' },
    { label: '交韵', letters: 'ABABCDCDEFEGFG' },
  ],
};

interface SchemeScore { label: string; letters: string; satisfied: number; total: number; failedLines: Set<number> }

/** 按韵式统计：同一字母的每一行都须与该组第一行押韵 */
function scoreScheme(letters: string, ends: string[], rhymes: (a: string, b: string) => boolean): Omit<SchemeScore, 'label'> {
  const anchor = new Map<string, number>();
  let satisfied = 0;
  let total = 0;
  const failedLines = new Set<number>();
  Array.from(letters).forEach((letter, i) => {
    if (i >= ends.length) return;
    if (!anchor.has(letter)) { anchor.set(letter, i); return; }
    total += 1;
    const j = anchor.get(letter)!;
    if (ends[i] && ends[j] && rhymes(ends[i], ends[j])) satisfied += 1;
    else failedLines.add(i);
  });
  return { letters, satisfied, total, failedLines };
}

// ── 主函数 ──────────────────────────────────────────────────

export function checkSonnet(content: string, sonnetType: SonnetType): MeterCheckResult {
  const rawLines = content.split('\n').map(line => line.trimEnd()).filter(line => line.trim().length > 0);
  const lineCount = rawLines.length;
  const isEnglish = sonnetType === 'shakespeare' || sonnetType === 'petrarchan';
  const lines: LineResult[] = rawLines.map((line, lineIndex) => ({
    lineIndex,
    chars: Array.from(line.trim()).map(char => ({ char, status: 'neutral' as CharStatus })),
  }));

  if (sonnetType === 'none') {
    return { lines, summary: `共 ${lineCount} 行`, isValid: true, violationCount: 0 };
  }

  // 每行韵脚
  const ends: string[] = [];
  const endSpans: { start: number; end: number }[] = [];
  rawLines.forEach((line, i) => {
    const trimmed = line.trim();
    if (isEnglish) {
      const word = lastWord(trimmed);
      ends.push(word);
      const chars = Array.from(trimmed.toLowerCase().replace(/[’]/g, "'"));
      let end = chars.length - 1;
      while (end >= 0 && !/[a-z']/.test(chars[end])) end--;
      let start = end;
      while (start > 0 && /[a-z']/.test(chars[start - 1])) start--;
      endSpans[i] = { start, end };
    } else {
      const hit = chineseRhymeChar(trimmed);
      ends.push(hit?.char || '');
      endSpans[i] = hit ? { start: hit.index, end: hit.index } : { start: -1, end: -1 };
    }
  });

  const rhymes = isEnglish ? englishRhymes : chineseRhymes;
  const candidates = SCHEMES[sonnetType];
  const best: SchemeScore = candidates
    .map(scheme => ({ label: scheme.label, ...scoreScheme(scheme.letters, ends, rhymes) }))
    .sort((a, b) => b.satisfied - a.satisfied || a.failedLines.size - b.failedLines.size)[0];

  // 标注：韵脚字着色，不押的给提示；英文另查音节
  const voltaLine = sonnetType === 'shakespeare' ? 12 : 8;
  let meterWarnings = 0;
  lines.forEach((line, i) => {
    line.isVolta = i === voltaLine;
    line.rhymeLabel = best.letters[i];
    const span = endSpans[i];
    if (span && span.start >= 0) {
      const failed = best.failedLines.has(i);
      for (let k = span.start; k <= span.end; k++) {
        const c: CharResult | undefined = line.chars[k];
        if (!c) continue;
        c.status = failed ? 'warn' : 'rhyme';
        c.tooltip = failed
          ? `按${best.label}，此行应与第 ${best.letters.indexOf(best.letters[i]) + 1} 行押韵`
          : `韵脚 ${best.letters[i]}`;
      }
    }
    if (isEnglish) {
      const syllables = lineSyllables(rawLines[i]);
      line.note = `${syllables} 音节`;
      if (syllables < 9 || syllables > 12) {
        meterWarnings += 1;
        line.chars.forEach(c => {
          if (c.status === 'neutral') { c.status = 'warn'; c.tooltip = `约 ${syllables} 音节；五步抑扬格一般为 10（阴性韵尾 11）`; }
        });
      }
    } else {
      const len = Array.from(rawLines[i].replace(/[\s，。、；：？！,.;:?!“”‘’「」『』（）()—…-]/g, '')).length;
      line.note = `${len} 字`;
      if (len < 8 || len > 16) {
        meterWarnings += 1;
        line.chars.forEach(c => {
          if (c.status === 'neutral') { c.status = 'warn'; c.tooltip = `${len} 字；现代汉语十四行多在 10–13 字`; }
        });
      }
    }
  });

  const missingLines = Math.abs(14 - lineCount);
  const rhymeMisses = lineCount >= 14 ? best.failedLines.size : 0;
  const head = lineCount < 14 ? `当前 ${lineCount}/14 行` : lineCount > 14 ? `超出 14 行（${lineCount} 行）` : '十四行已足';
  const rhymePart = lineCount >= 14
    ? `；${best.label}韵式 ${best.satisfied}/${best.total} 处押韵`
    : '';
  const meterPart = meterWarnings ? `；${meterWarnings} 行${isEnglish ? '音节数' : '行长'}偏离常规` : '';
  const caveat = isEnglish && lineCount >= 14 ? '（韵脚与音节按拼写推断，仅供参考）' : '';

  return {
    lines,
    summary: `${head}${rhymePart}${meterPart}${caveat}`,
    // 汉语十四行韵式宽松，只要求 14 行；英文还要求韵式全合
    isValid: lineCount === 14 && (sonnetType === 'chinese_modern' || rhymeMisses === 0),
    violationCount: missingLines + (sonnetType === 'chinese_modern' ? 0 : rhymeMisses),
    rhymeCheckStatus: lineCount >= 14 ? (best.failedLines.size === 0 ? 'ok' : 'fail') : 'unverified',
    matchedTemplate: best.letters,
  };
}
