// ============================================================
// 偶成 v4.0 — 格律双指针校验引擎（精细纠错版）
// ============================================================
import { getTone, getCanonicalTone, isMultiTone, getRhymeGroups, ToneClass } from './rhymeData';
import { MeterCheckResult, LineResult, CharResult, CharStatus, RhymeBook, CipaiData, SonnetType } from '../types';

// ============================================================
// 近体诗格律模板（平仄起、首韵支持）
// 格式: 'P'=平, 'Z'=仄, 'R'=韵脚, 'X'=可平可仄, 'r'=可韵可不韵
// ============================================================
export const JINTI_TEMPLATES: Record<string, string[][]> = {
  // 五言绝句 (仄起首句不入韵)
  jueju_5_ze_no: [
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
  ],
  // 五言绝句 (仄起首句入韵)
  jueju_5_ze_yes: [
    ['Z','Z','Z','P','R'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
  ],
  // 五言绝句 (平起首句不入韵)
  jueju_5_ping_no: [
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
  ],
  // 五言绝句 (平起首句入韵)
  jueju_5_ping_yes: [
    ['P','P','Z','Z','R'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
  ],

  // 七言绝句 (仄起首句不入韵)
  jueju_7_ze_no: [
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
  ],
  // 七言绝句 (仄起首句入韵)
  jueju_7_ze_yes: [
    ['Z','Z','P','P','Z','Z','R'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
  ],
  // 七言绝句 (平起首句不入韵)
  jueju_7_ping_no: [
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
  ],
  // 七言绝句 (平起首句入韵)
  jueju_7_ping_yes: [
    ['P','P','Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
  ],

  // 五言律诗 (仄起首句不入韵)
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
  // 五言律诗 (仄起首句入韵)
  lvshi_5_ze_yes: [
    ['Z','Z','Z','P','R'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
  ],
  // 五言律诗 (平起首句不入韵)
  lvshi_5_ping_no: [
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
  ],
  // 五言律诗 (平起首句入韵)
  lvshi_5_ping_yes: [
    ['P','P','Z','Z','R'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
    ['P','P','P','Z','Z'],
    ['Z','Z','Z','P','R'],
    ['Z','Z','P','P','Z'],
    ['P','P','Z','Z','R'],
  ],

  // 七言律诗 (仄起首句不入韵)
  lvshi_7_ze_no: [
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
  ],
  // 七言律诗 (仄起首句入韵)
  lvshi_7_ze_yes: [
    ['Z','Z','P','P','Z','Z','R'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
  ],
  // 七言律诗 (平起首句不入韵)
  lvshi_7_ping_no: [
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
    ['P','P','Z','Z','P','P','Z'],
    ['Z','Z','P','P','Z','Z','R'],
    ['Z','Z','P','P','P','Z','Z'],
    ['P','P','Z','Z','Z','P','R'],
  ],
  // 七言律诗 (平起首句入韵)
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
  jueju_7: 'jueju_7_ze_yes', // Match the default visual grid 仄起首句入韵
  lvshi_5: 'lvshi_5_ze_no',
  lvshi_7: 'lvshi_7_ping_yes',
};

// ============================================================
// 韵部比对：离线韵书校验韵脚是否押韵
// 两个韵脚字查同一韵部即押韵
// ============================================================
function checkRhymeGroups(
  template: string[][],
  lines: string[],
  rhymeBook: RhymeBook,
  manualGroupId?: string | null
): 'ok' | 'fail' | 'unverified' {
  const rhymeChars: string[] = [];
  template.forEach((pattern, lineIdx) => {
    const lastIdx = pattern.length - 1;
    if (pattern[lastIdx] === 'R' || pattern[lastIdx] === 'r') {
      const line = (lines[lineIdx] || '').replace(/[，。、；？！]/g, '').trim();
      const ch = Array.from(line)[lastIdx];
      if (ch && ch.trim()) rhymeChars.push(ch);
    }
  });

  // 如果手动限定了韵部（彩蛋：限韵创作）
  if (manualGroupId) {
    if (rhymeChars.length === 0) return 'unverified';
    const allInGroup = rhymeChars.every(c =>
      getRhymeGroups(c, rhymeBook).some(group => group.groupId === manualGroupId)
    );
    return allInGroup ? 'ok' : 'fail';
  }

  if (rhymeChars.length < 2) return 'unverified';

  const groupSets = rhymeChars.map(c => new Set(getRhymeGroups(c, rhymeBook).map(group => group.groupId)));
  if (groupSets.some(groups => groups.size === 0)) return 'unverified';

  const sharedGroup = [...groupSets[0]].some(groupId =>
    groupSets.slice(1).every(groups => groups.has(groupId))
  );
  return sharedGroup ? 'ok' : 'fail';
}

// ============================================================
// 近体诗校验
// ============================================================
export function checkJintiShi(
  content: string | string[],
  poemType: string,
  rhymeBook: RhymeBook,
  manualGroupId?: string | null
): MeterCheckResult {
  const templateKey = JINTI_TEMPLATES[poemType] ? poemType : (DEFAULT_TEMPLATE[poemType] || 'jueju_5_ze_no');
  const template = JINTI_TEMPLATES[templateKey];
  const rawLines = (Array.isArray(content) ? content : content.split('\n')).filter(l => l.trim().length > 0);

  const lines: LineResult[] = template.map((pattern, lineIdx) => {
    let line = rawLines[lineIdx] || '';
    line = line.replace(/[，。、；？！]/g, '').trim(); // Remove punctuation
    const lineChars = Array.from(line);

    const chars: CharResult[] = pattern.map((expected, charIdx) => {
      const char = lineChars[charIdx];
      let status: CharStatus = 'neutral';
      let tooltip = '';

      if (!char || char === ' ') {
        // Missing character treated as error/violation
        return { char: '', status: 'error', expected, actual: '?', tooltip: '此处缺字' };
      }

      const actualTones = getTone(char, rhymeBook);
      const actualMain = getCanonicalTone(char, rhymeBook);
      const multi = Array.isArray(actualTones);

      if (actualMain === 'unknown') {
        status = 'warn';
        tooltip = '此字未收录于该韵书，平仄待考';
      } else if (!expected || expected === 'X') {
        status = 'neutral';
      } else if (expected === 'R' || expected === 'r') {
        status = 'rhyme';
      } else {
        const expectedTone = expected as ToneClass;
        if (actualMain === expectedTone) {
          status = 'ok';
        } else if (multi) {
          status = (actualTones as ToneClass[]).includes(expectedTone) ? 'warn' : 'error';
          tooltip = `多音字: 可读${(actualTones as ToneClass[]).join('/')}`;
        } else {
          status = 'error';
          tooltip = `应${expectedTone === 'P' ? '平' : '仄'}，实${actualMain === 'P' ? '平' : '仄'}`;
        }
      }

      return { char, status, expected, actual: actualMain, tooltip };
    });

    // Add extra characters in the line as errors
    if (lineChars.length > pattern.length) {
      for (let ci = pattern.length; ci < lineChars.length; ci++) {
        chars.push({
          char: lineChars[ci],
          status: 'error',
          expected: '?',
          actual: getCanonicalTone(lineChars[ci], rhymeBook),
          tooltip: '多余字',
        });
      }
    }

    return { lineIndex: lineIdx, chars };
  });

  // Append extra lines if any
  if (rawLines.length > template.length) {
    for (let li = template.length; li < rawLines.length; li++) {
      const line = rawLines[li] || '';
      const cleanLine = line.replace(/[，。、；？！]/g, '').trim();
      const chars: CharResult[] = Array.from(cleanLine).map(char => ({
        char,
        status: 'error',
        expected: '?',
        actual: getCanonicalTone(char, rhymeBook),
        tooltip: '多余行',
      }));
      lines.push({ lineIndex: li, chars });
    }
  }

  const totalViolations = lines.reduce(
    (acc, l) => acc + l.chars.filter(c => c.status === 'error').length, 0
  );

  // 模板映射已经为缺失字生成 error，不能再次叠加缺行惩罚。
  const violationCount = totalViolations;

  return {
    lines,
    summary: violationCount === 0
      ? '格律工整，合乎规范'
      : `发现 ${violationCount} 处出律，请参照点阵调整`,
    isValid: violationCount === 0,
    violationCount,
    rhymeCheckStatus: checkRhymeGroups(template, rawLines, rhymeBook, manualGroupId),
  };
}

// ============================================================
// 词牌格律校验（双指针）
// ============================================================
export function checkCipai(
  content: string | string[],
  cipai: CipaiData,
  rhymeBook: RhymeBook,
  manualGroupId?: string | null
): MeterCheckResult {
  const rawLines = (Array.isArray(content) ? content : content.split('\n')).filter(l => l.trim().length > 0);
  const fullPattern = [
    ...(cipai.upperPattern || []),
    ...(cipai.lowerPattern || []),
  ];

  const lines: LineResult[] = fullPattern.map((linePatternStr, lineIdx) => {
    const linePattern = Array.from(linePatternStr);
    let line = rawLines[lineIdx] || '';
    line = line.replace(/[，。、；？！]/g, '').trim();
    const lineChars = Array.from(line);
    
    const chars: CharResult[] = linePattern.map((expected, charIdx) => {
      const char = lineChars[charIdx];
      let status: CharStatus = 'neutral';
      let tooltip = '';

      if (!char || char === ' ') {
        return { char: '', status: 'error', expected, actual: '?', tooltip: '此处缺字' };
      }

      const actualTones = getTone(char, rhymeBook);
      const actualMain = getCanonicalTone(char, rhymeBook);
      const multi = Array.isArray(actualTones);

      if (actualMain === 'unknown') {
        status = 'warn';
        tooltip = '此字未收录于该韵书，平仄待考';
      } else if (expected === 'X') {
        status = 'neutral';
      } else if (expected === 'R' || expected === 'r') {
        status = 'rhyme';
      } else {
        const expectedTone = expected as ToneClass;
        if (actualMain === expectedTone) {
          status = 'ok';
        } else if (multi) {
          const tones = actualTones as ToneClass[];
          status = tones.includes(expectedTone) ? 'warn' : 'error';
          tooltip = `多音字: 可读${tones.join('/')}`;
        } else {
          status = 'error';
          tooltip = `应${expectedTone === 'P' ? '平' : '仄'}，实${actualMain === 'P' ? '平' : '仄'}`;
        }
      }

      return { char, status, expected, actual: actualMain, tooltip };
    });

    // Add extra characters in the line as errors
    if (lineChars.length > linePattern.length) {
      for (let ci = linePattern.length; ci < lineChars.length; ci++) {
        chars.push({
          char: lineChars[ci],
          status: 'error',
          expected: '?',
          actual: getCanonicalTone(lineChars[ci], rhymeBook),
          tooltip: '多余字',
        });
      }
    }

    return { lineIndex: lineIdx, chars };
  });

  // Append extra lines if any
  if (rawLines.length > fullPattern.length) {
    for (let li = fullPattern.length; li < rawLines.length; li++) {
      const line = rawLines[li] || '';
      const cleanLine = line.replace(/[，。、；？！]/g, '').trim();
      const chars: CharResult[] = Array.from(cleanLine).map(char => ({
        char,
        status: 'error',
        expected: '?',
        actual: getCanonicalTone(char, rhymeBook),
        tooltip: '多余行',
      }));
      lines.push({ lineIndex: li, chars });
    }
  }

  const totalViolations = lines.reduce(
    (acc, l) => acc + l.chars.filter(c => c.status === 'error').length, 0
  );

  // fullPattern.map 已把缺失句的每个字位标成 error，直接汇总即可精确计数。
  const violationCount = totalViolations;

  return {
    lines,
    summary: violationCount === 0 ? `《${cipai.name}》格律合规` : `发现 ${violationCount} 处出律`,
    isValid: violationCount === 0,
    violationCount,
    rhymeCheckStatus: checkRhymeGroups(fullPattern.map(s => Array.from(s)), rawLines, rhymeBook, manualGroupId),
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
  else if (lineCount === 14) {
    summary = (sonnetType === 'shakespeare' || sonnetType === 'petrarchan')
      ? '十四行字数已足（韵式仅作创作参考提示，暂不自动校验）'
      : '十四行已足，请检查韵脚';
  }
  else summary = `超出14行 (${lineCount} 行)`;

  const violationCount = lineCount === 14 ? 0 : Math.abs(14 - lineCount);

  return {
    lines,
    summary,
    isValid: lineCount === 14,
    violationCount,
  };
}
