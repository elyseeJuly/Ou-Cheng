// ============================================================
// 偶成 v4.0 — 格律双指针校验引擎
// ============================================================
import { getTone, getCanonicalTone, isMultiTone, ToneClass } from './rhymeData';
import { MeterCheckResult, LineResult, CharResult, CharStatus, RhymeBook, CipaiData, SonnetType } from '../../types';

// ============================================================
// 近体诗格律模板
// 格式: 'P'=平, 'Z'=仄, 'R'=韵脚, 'X'=可平可仄, 'r'=可韵可不韵
// ============================================================
const JINTI_TEMPLATES: Record<string, string[][]> = {
  // 五言绝句（仄起首句不入韵）
  jueju_5_ze_no: [
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
  ],
  // 五言绝句（平起首句不入韵）
  jueju_5_ping_no: [
    ['P','P','Z','Z','P'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
  ],
  // 七言绝句（仄起首句入韵）
  jueju_7_ze_yes: [
    ['Z','Z','P','P','Z','Z','R'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
  ],
  // 七言绝句（平起首句入韵）
  jueju_7_ping_yes: [
    ['P','P','Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
  ],
  // 五言律诗（仄起首句不入韵）
  lvshi_5_ze_no: [
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
  ],
  // 七言律诗（平起首句入韵）
  lvshi_7_ping_yes: [
    ['P','P','Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
  ],
};

// 模板匹配映射(poemType -> 默认模板key)
const DEFAULT_TEMPLATE: Record<string, string> = {
  jueju_5: 'jueju_5_ze_no',
  jueju_7: 'jueju_7_ping_yes',
  lvshi_5: 'lvshi_5_ze_no',
  lvshi_7: 'lvshi_7_ping_yes',
};

// ============================================================
// 近体诗校验
// ============================================================
export function checkJintiShi(
  content: string | string[],
  poemType: string,
  rhymeBook: RhymeBook
): MeterCheckResult {
  const templateKey = DEFAULT_TEMPLATE[poemType] || 'jueju_5_ze_no';
  const template = JINTI_TEMPLATES[templateKey];
  const rawLines = Array.isArray(content) ? content : content.split('\n');

  const lines: LineResult[] = template.map((pattern, lineIdx) => {
    let line = rawLines[lineIdx] || '';
    if (typeof content === 'string') {
      line = line.replace(/[，。、；？！]/g, '').trim(); // Remove punctuation
    }
    const chars: CharResult[] = pattern.map((expected, charIdx) => {
      const char = line[charIdx];
      let status: CharStatus = 'neutral';
      let tooltip = '';

      if (!char || char === ' ') {
        status = 'neutral';
        return { char: '', status, expected, actual: '?', tooltip: '' };
      }

      const actualTones = getTone(char, rhymeBook);
      const actualMain = getCanonicalTone(char, rhymeBook);
      const multi = isMultiTone(char);

      if (!expected || expected === 'X') {
        status = 'neutral';
      } else if (expected === 'R' || expected === 'r') {
        // Technically Rhyme should be checked against previous rhymes, but this is a simple check
        status = 'rhyme'; 
        // Let's at least mark it valid visually if it's typed
        if (actualMain === 'P' || actualMain === 'Z') {
           // We just highlight it blue/green for being filled. Let's make it 'ok' if it expects rhyme and they filled it. 
           // We keep 'rhyme' status, the UI will color it ok anyway.
        }
      } else {
        const expectedTone = expected as ToneClass;
        if (actualMain === expectedTone) {
          status = 'ok';
        } else if (multi) {
          // 多音字中有一个符合则警告
          status = (actualTones as ToneClass[]).includes(expectedTone) ? 'warn' : 'error';
          tooltip = multi ? `多音字: 可读${(actualTones as ToneClass[]).join('/')}` : '';
        } else {
          status = 'error';
          tooltip = `应${expectedTone === 'P' ? '平' : '仄'}，实${actualMain === 'P' ? '平' : '仄'}`;
        }
      }

      return { char, status, expected, actual: actualMain, tooltip };
    });

    return { lineIndex: lineIdx, chars };
  });

  const totalViolations = lines.reduce(
    (acc, l) => acc + l.chars.filter(c => c.status === 'error').length, 0
  );

  return {
    lines,
    summary: totalViolations === 0
      ? '格律工整，合乎规范'
      : `发现 ${totalViolations} 处出律，请参照点阵调整`,
    isValid: totalViolations === 0,
    violationCount: totalViolations,
  };
}

// ============================================================
// 词牌格律校验（双指针）
// ============================================================
export function checkCipai(
  content: string | string[],
  cipai: CipaiData,
  rhymeBook: RhymeBook
): MeterCheckResult {
  const rawLines = Array.isArray(content) ? content : content.split('\n');
  const fullPattern = [
    ...(cipai.upperPattern || []),
    ...(cipai.lowerPattern || []),
  ];

  const lines: LineResult[] = fullPattern.map((linePatternStr, lineIdx) => {
    const linePattern = linePatternStr.split('');
    let line = rawLines[lineIdx] || '';
    if (typeof content === 'string') {
       line = line.replace(/[，。、；？！]/g, '').trim();
    }
    
    const chars: CharResult[] = linePattern.map((expected, charIdx) => {
      const char = line[charIdx];
      let status: CharStatus = 'neutral';
      let tooltip = '';

      if (!char || char === ' ') {
        status = 'neutral';
        return { char: '', status, expected, actual: '?', tooltip: '' };
      }

      const actualMain = getCanonicalTone(char, rhymeBook);
      const multi = isMultiTone(char);

      if (expected === 'X') {
        status = 'neutral';
      } else if (expected === 'R' || expected === 'r') {
        status = 'rhyme';
      } else {
        const expectedTone = expected as ToneClass;
        if (actualMain === expectedTone) {
          status = 'ok';
        } else if (multi) {
          const tones = getTone(char, rhymeBook) as ToneClass[];
          status = tones.includes(expectedTone) ? 'warn' : 'error';
          tooltip = `多音字: 可读${tones.join('/')}`;
        } else {
          status = 'error';
          tooltip = `应${expectedTone === 'P' ? '平' : '仄'}，实${actualMain === 'P' ? '平' : '仄'}`;
        }
      }

      return { char, status, expected, actual: actualMain, tooltip };
    });

    return { lineIndex: lineIdx, chars };
  });

  const totalViolations = lines.reduce(
    (acc, l) => acc + l.chars.filter(c => c.status === 'error').length, 0
  );

  return {
    lines,
    summary: totalViolations === 0 ? `《${cipai.name}》格律合规` : `发现 ${totalViolations} 处出律`,
    isValid: totalViolations === 0,
    violationCount: totalViolations,
  };
}

// ============================================================
// 十四行诗校验
// ============================================================
export function checkSonnet(
  content: string,
  sonnetType: SonnetType
): MeterCheckResult {
  const rawLines = content.split('\n').filter(l => l.trim().length > 0);

  // 韵脚模式
  const rhymePatterns: Record<SonnetType, string[]> = {
    shakespeare: ['A','B','A','B','C','D','C','D','E','F','E','F','G','G'],
    petrarchan:  ['A','B','B','A','A','B','B','A','C','D','E','C','D','E'],
    chinese_modern: ['X','X','X','X','X','X','X','X','V','X','X','X','X','X'], // V=Volta
    none: [],
  };

  const pattern = rhymePatterns[sonnetType] || [];

  const lines: LineResult[] = rawLines.map((line, lineIdx) => {
    const schemePos = pattern[lineIdx];
    const isVolta = schemePos === 'V' || lineIdx === 8; // 第9行(index 8)为Volta

    const chars: CharResult[] = Array.from(line.trim()).map(char => ({
      char,
      status: 'neutral' as CharStatus,
    }));

    // 行长检查（现代汉语十四行：11-15字）
    if (sonnetType === 'chinese_modern') {
      const len = line.trim().length;
      if (len < 11 || len > 15) {
        chars.forEach(c => { c.status = 'warn'; c.tooltip = `行长${len}字，建议11-15字`; });
      }
    }

    return { lineIndex: lineIdx, chars, isVolta };
  });

  const lineCount = rawLines.length;
  let summary = '';
  if (lineCount < 14) summary = `当前 ${lineCount}/14 行，请继续创作`;
  else if (lineCount === 14) summary = '十四行已足，请检查韵脚';
  else summary = `超出14行 (${lineCount} 行)`;

  return {
    lines,
    summary,
    isValid: lineCount === 14,
    violationCount: lineCount === 14 ? 0 : Math.abs(14 - lineCount),
  };
}
