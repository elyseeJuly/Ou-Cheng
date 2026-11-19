// ============================================================
// 偶成 v4.0 — 格律双指针校验引擎（精细纠错版）
// ============================================================
import { getTone, getCanonicalTone, isMultiTone, getRhymeGroups, ToneClass } from './rhymeData';
import { MeterCheckResult, LineResult, CharResult, CharStatus, RhymeBook, CipaiData, SonnetType, CoupletParallelism, ParallelismResult } from '../types';
import { getCipaiPatterns } from './cipaiPatterns';
import { alignClausesToPattern, chooseCouyunLinePattern, requiresCoupletRescue, splitProsodyClauses } from './couyunProsody';

// ============================================================
// 近体诗格律模板（平仄起、首韵支持）
// 格式: 'P'=平, 'Z'=仄, 'R'=韵脚, 'X'=可平可仄, 'r'=可韵可不韵
// ============================================================
export const JINTI_TEMPLATES: Record<string, string[][]> = {
  // 五言绝句 (仄起首句不入韵)
  jueju_5_ze_no: [
    ['X','Z','P','P','Z'],
    ['X','P','Z','Z','R'],
    ['X','P','P','Z','Z'],
    ['X','Z','Z','P','R'],
  ],
  // 五言绝句 (仄起首句入韵)
  jueju_5_ze_yes: [
    ['X','Z','Z','P','R'],
    ['X','P','Z','Z','R'],
    ['X','P','P','Z','Z'],
    ['X','Z','Z','P','R'],
  ],
  // 五言绝句 (平起首句不入韵)
  jueju_5_ping_no: [
    ['X','P','P','Z','Z'],
    ['X','Z','Z','P','R'],
    ['X','Z','P','P','Z'],
    ['X','P','Z','Z','R'],
  ],
  // 五言绝句 (平起首句入韵)
  jueju_5_ping_yes: [
    ['X','P','Z','Z','R'],
    ['X','Z','Z','P','R'],
    ['X','Z','P','P','Z'],
    ['X','P','Z','Z','R'],
  ],

  // 七言绝句 (仄起首句不入韵)
  jueju_7_ze_no: [
    ['X','Z','X','P','P','Z','Z'],
    ['X','P','X','Z','Z','P','R'],
    ['X','P','X','Z','P','P','Z'],
    ['X','Z','X','P','Z','Z','R'],
  ],
  // 七言绝句 (仄起首句入韵)
  jueju_7_ze_yes: [
    ['X','Z','X','P','Z','Z','R'],
    ['X','P','X','Z','Z','P','R'],
    ['X','P','X','Z','P','P','Z'],
    ['X','Z','X','P','Z','Z','R'],
  ],
  // 七言绝句 (平起首句不入韵)
  jueju_7_ping_no: [
    ['X','P','X','Z','P','P','Z'],
    ['X','Z','X','P','Z','Z','R'],
    ['X','Z','X','P','P','Z','Z'],
    ['X','P','X','Z','Z','P','R'],
  ],
  // 七言绝句 (平起首句入韵)
  jueju_7_ping_yes: [
    ['X','P','X','Z','Z','P','R'],
    ['X','Z','X','P','Z','Z','R'],
    ['X','Z','X','P','P','Z','Z'],
    ['X','P','X','Z','Z','P','R'],
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

// 基础模板保留起式与粘对顺序；逐句的孤平、三平调和拗救候选由
// couyunProsody 的完整律句模式处理，不能把一三五位置简单地全部忽略。
Object.values(JINTI_TEMPLATES).forEach(template => template.forEach(pattern => {
  pattern[0] = 'X';
  if (pattern.length === 7) pattern[2] = 'X';
}));

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

/**
 * 宋词常见的邻部通押（王力《汉语诗律学》所列词韵通押）：
 * 第三、五部；第六、十一、十三部；第七、十四部；第十五、十六部；第十七、十八、十九部。
 * 这些属于词人常用的宽韵，判为押韵，但在结论里注明。
 */
const CI_LIN_CLUSTERS: string[][] = [
  ['cl_03', 'cl_05'],
  ['cl_06', 'cl_11', 'cl_13'],
  ['cl_07', 'cl_14'],
  ['cl_15', 'cl_16'],
  ['cl_17', 'cl_18', 'cl_19'],
];
const clusterOf = (groupId: string) => CI_LIN_CLUSTERS.findIndex(cluster => cluster.includes(groupId));

type RhymeVerdict = { status: 'ok' | 'fail' | 'unverified'; note?: string };

/** 一组字是否共处一韵（groupSets 为每字可属的韵部集合） */
function shareGroup(groupSets: Set<string>[]): boolean {
  return [...groupSets[0]].some(groupId => groupSets.slice(1).every(groups => groups.has(groupId)));
}

/** 词林正韵下各字是否同在一个通押组 */
function shareCiLinCluster(chars: string[]): boolean {
  const clusterSets = chars.map(char => new Set(getRhymeGroups(char, 'ci_lin').flatMap(group => {
    const cluster = clusterOf(group.groupId);
    return cluster >= 0 ? [`c${cluster}`, group.groupId] : [group.groupId];
  })));
  if (clusterSets.some(set => set.size === 0)) return false;
  return shareGroup(clusterSets);
}

function checkRhymeGroups(
  template: string[][],
  lines: string[],
  rhymeBook: RhymeBook,
  manualGroupId?: string | null,
  lineGroups?: (string | null)[],
  options: { firstLineNeighbor?: boolean; ciTongya?: boolean } = {}
): RhymeVerdict {
  const rhymeChars: { char: string; group: string; lineIdx: number }[] = [];
  template.forEach((pattern, lineIdx) => {
    const lastIdx = pattern.length - 1;
    if (pattern[lastIdx] === 'R' || pattern[lastIdx] === 'r') {
      const line = (lines[lineIdx] || '').replace(/[，。、；？！]/g, '').trim();
      const ch = Array.from(line)[lastIdx];
      if (ch && ch.trim()) rhymeChars.push({ char: ch, group: lineGroups?.[lineIdx] ?? 'default', lineIdx });
    }
  });

  // 如果手动限定了韵部（彩蛋：限韵创作）
  if (manualGroupId) {
    if (rhymeChars.length === 0) return { status: 'unverified' };
    const groups = rhymeChars.map(({ char }) => getRhymeGroups(char, rhymeBook));
    if (groups.some(items => items.length === 0)) return { status: 'unverified' };
    const allInGroup = groups.every(items => items.some(group => group.groupId === manualGroupId));
    return { status: allInGroup ? 'ok' : 'fail' };
  }

  const buckets = new Map<string, { char: string; lineIdx: number }[]>();
  rhymeChars.forEach(({ char, group, lineIdx }) => buckets.set(group, [...(buckets.get(group) || []), { char, lineIdx }]));
  let verifiedAny = false;
  let hasUnknown = false;
  const notes = new Set<string>();
  for (const items of buckets.values()) {
    if (items.length < 2) continue;
    const chars = items.map(item => item.char);
    const groupSets = chars.map(char => new Set(getRhymeGroups(char, rhymeBook).map(group => group.groupId)));
    if (groupSets.some(groups => groups.size === 0)) {
      hasUnknown = true;
      continue;
    }
    verifiedAny = true;
    if (shareGroup(groupSets)) continue;
    // 近体诗首句入韵可借邻韵（「孤雁出群」）：去掉首句后其余同韵，且首句字与之同属词林正韵一部
    if (options.firstLineNeighbor && items[0].lineIdx === 0 && items.length >= 3
      && shareGroup(groupSets.slice(1))
      && shareGroup(chars.map(char => new Set(getRhymeGroups(char, 'ci_lin').map(group => group.groupId))).filter(set => set.size > 0))) {
      notes.add('首句借邻韵');
      continue;
    }
    if (options.ciTongya && shareCiLinCluster(chars)) {
      notes.add('邻部通押');
      continue;
    }
    // 换韵词（减字木兰花、虞美人等）：上游谱式偶把上下片不同的换韵标成同一组号。
    // 同组字若被别组韵脚隔成几段，只要求每段各自押韵。
    if (lineGroups) {
      const runs: string[][] = [];
      let current: string[] = [];
      const groupKey = rhymeChars.find(item => item.lineIdx === items[0].lineIdx)?.group;
      rhymeChars.forEach(item => {
        if (item.group === groupKey) {
          current.push(item.char);
        } else if (current.length) {
          runs.push(current);
          current = [];
        }
      });
      if (current.length) runs.push(current);
      // 每段至少两个韵脚才算换韵，避免逐句交错时把孤字当作“自成一段”而放过
      if (runs.length > 1 && runs.every(run => run.length >= 2) && runs.every(run => shareGroup(run.map(char => new Set(getRhymeGroups(char, rhymeBook).map(group => group.groupId))))
        || (options.ciTongya && shareCiLinCluster(run)))) {
        notes.add('换韵');
        continue;
      }
    }
    return { status: 'fail' };
  }
  const note = notes.size ? [...notes].join('、') : undefined;
  return { status: hasUnknown ? 'unverified' : verifiedAny ? 'ok' : 'unverified', ...(note ? { note } : {}) };
}

/**
 * 多音字被迫取「次读」的次数：两个格体都零出律时，更自然的读法（多音字取首读）
 * 更可能是作者本意。例如「黄河远上白云间」，「间」取平声（首读）对应首句入韵，
 * 取去声才能凑成首句不入韵，前者应胜出而不是判为同分。
 */
export function multiToneStrain(result: MeterCheckResult): number {
  return result.lines.reduce((sum, line) => sum + line.chars.filter(char => char.status === 'warn' && char.actual !== 'unknown').length, 0);
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
  if (!JINTI_TEMPLATES[poemType] && DEFAULT_TEMPLATE[poemType]) {
    const candidates = Object.keys(JINTI_TEMPLATES)
      .filter(key => key.startsWith(`${poemType}_`))
      .map(key => checkJintiShi(content, key, rhymeBook, manualGroupId))
      .sort((left, right) => Number(right.isValid) - Number(left.isValid)
        || left.violationCount - right.violationCount
        || (left.unknownCount || 0) - (right.unknownCount || 0)
        || (left.rhymeCheckStatus === 'ok' ? -1 : 0) - (right.rhymeCheckStatus === 'ok' ? -1 : 0)
        || multiToneStrain(left) - multiToneStrain(right));
    const best = candidates[0];
    const second = candidates[1];
    if (best && second
      && best.isValid === second.isValid
      && best.violationCount === second.violationCount
      && (best.unknownCount || 0) === (second.unknownCount || 0)
      && best.rhymeCheckStatus === second.rhymeCheckStatus
      && multiToneStrain(best) === multiToneStrain(second)) {
      if ((best.unknownCount || 0) > 0 || best.verificationStatus === 'unverified') {
        return { ...best, verificationStatus: 'unverified', isValid: false };
      }
      return { ...best, verificationStatus: 'ambiguous', isValid: false, summary: '有多个格体得分相同，请人工选择起式与首句入韵方式' };
    }
    return best;
  }
  const templateKey = JINTI_TEMPLATES[poemType] ? poemType : (DEFAULT_TEMPLATE[poemType] || 'jueju_5_ze_no');
  const template = JINTI_TEMPLATES[templateKey];
  const rawLines = (Array.isArray(content) ? content.flatMap(splitProsodyClauses) : splitProsodyClauses(content));

  let nextLineNeedsRescue = false;
  const lines: LineResult[] = template.map((pattern, lineIdx) => {
    let line = rawLines[lineIdx] || '';
    line = line.replace(/[，。、；？！]/g, '').trim(); // Remove punctuation
    const lineChars = Array.from(line);
    const actualLineTones = lineChars.map(char => getTone(char, rhymeBook));
    const selectedPattern = chooseCouyunLinePattern(pattern, actualLineTones, nextLineNeedsRescue);
    nextLineNeedsRescue = requiresCoupletRescue(selectedPattern);

    const chars: CharResult[] = pattern.map((baseExpected, charIdx) => {
      const expected = baseExpected === 'R' || baseExpected === 'r'
        ? baseExpected
        : (selectedPattern[charIdx] || baseExpected);
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
        const acceptsPing = actualMain === 'P' || (multi && (actualTones as ToneClass[]).includes('P'));
        status = acceptsPing ? 'rhyme' : 'error';
        if (!acceptsPing) tooltip = '近体诗韵脚应为平声';
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
  const unknownCount = lines.reduce(
    (acc, line) => acc + line.chars.filter(char => char.actual === 'unknown').length, 0
  );

  // 模板映射已经为缺失字生成 error，不能再次叠加缺行惩罚。
  const rhymeVerdict = checkRhymeGroups(template, rawLines, rhymeBook, manualGroupId, undefined, { firstLineNeighbor: rhymeBook !== 'xin_yun' });
  const rhymeCheckStatus = rhymeVerdict.status;
  const violationCount = totalViolations + (rhymeCheckStatus === 'fail' ? 1 : 0);
  const requiredRhymeCount = template.filter(pattern => ['R', 'r'].includes(pattern[pattern.length - 1])).length;
  const rhymeVerified = requiredRhymeCount < 2 || rhymeCheckStatus === 'ok';
  const isValid = violationCount === 0 && unknownCount === 0 && rhymeVerified;
  let parallelism: ParallelismResult | undefined;
  if (poemType.startsWith('lvshi_') && lines.length >= 6) {
    const hanLian = checkCoupletParallelism(lines[2]?.chars, lines[3]?.chars);
    const jingLian = checkCoupletParallelism(lines[4]?.chars, lines[5]?.chars);
    if (hanLian || jingLian) {
      parallelism = { hanLian, jingLian };
    }
  }

  return {
    lines,
    summary: rhymeCheckStatus === 'fail'
      ? '平仄或字数已核对，但韵脚不在同一韵部'
      : unknownCount > 0 || !rhymeVerified
      ? `结构已核对，但有 ${unknownCount} 字或韵脚无法由所选韵书确认`
      : violationCount === 0
      ? `格律工整，合乎规范${rhymeVerdict.note ? `（${rhymeVerdict.note}）` : ''}`
      : `发现 ${violationCount} 处出律，请参照点阵调整`,
    isValid,
    violationCount,
    unknownCount,
    verificationStatus: isValid ? 'verified' : (unknownCount > 0 || !rhymeVerified ? 'unverified' : 'verified'),
    rhymeCheckStatus,
    matchedTemplate: templateKey,
    ...(parallelism ? { parallelism } : {}),
  };
}

/**
 * 律诗联句声律辅助分析：
 * 只分析平仄相对程度与同位重字；不分析词性、句法结构和语义，因此不能据此判定“对仗成立”。
 */
export function checkCoupletParallelism(
  lineAChars?: CharResult[],
  lineBChars?: CharResult[]
): CoupletParallelism | undefined {
  if (!lineAChars || !lineBChars || lineAChars.length === 0 || lineBChars.length === 0) {
    return undefined;
  }
  const len = Math.min(lineAChars.length, lineBChars.length);
  if (len < 4) return undefined;

  let opposingTones = 0;
  let keyPositionOpposing = 0;
  let keyPositionsTotal = 0;
  const duplicateChars: string[] = [];
  const unknownPositions: number[] = [];
  let knownTonePairs = 0;

  for (let i = 0; i < len; i++) {
    const charA = lineAChars[i]?.char;
    const charB = lineBChars[i]?.char;

    // 同字对仗检查
    if (charA && charB && charA === charB && !duplicateChars.includes(charA)) {
      duplicateChars.push(charA);
    }

    const toneA = lineAChars[i]?.actual;
    const toneB = lineBChars[i]?.actual;

    const tonesKnown = (toneA === 'P' || toneA === 'Z') && (toneB === 'P' || toneB === 'Z');
    if (!tonesKnown) {
      unknownPositions.push(i + 1);
      continue;
    }
    knownTonePairs++;

    const isOpposing = (toneA === 'P' && toneB === 'Z') || (toneA === 'Z' && toneB === 'P');
    if (isOpposing) {
      opposingTones++;
    }

    // 关键格律位：五言取第2, 4位；七言取第2, 4, 6位 (0-indexed: 1, 3, 5)
    if (i === 1 || i === 3 || (len >= 7 && i === 5)) {
      keyPositionsTotal++;
      if (isOpposing) {
        keyPositionOpposing++;
      }
    }
  }

  const opposingToneRate = knownTonePairs > 0 ? Math.round((opposingTones / knownTonePairs) * 100) / 100 : 0;
  const keyRate = keyPositionsTotal > 0 ? keyPositionOpposing / keyPositionsTotal : 0;
  const hasDuplicates = duplicateChars.length > 0;
  const verificationStatus = unknownPositions.length > 0 ? 'unverified' : 'verified';

  let score = Math.round(opposingToneRate * 70 + keyRate * 30);
  if (hasDuplicates) {
    score = Math.max(0, score - duplicateChars.length * 20);
  }

  let isToneAligned = false;
  let summary = '';

  if (verificationStatus === 'unverified') {
    summary = `第 ${unknownPositions.join('、')} 位平仄待考，暂不能确认联句声律对位`;
  } else if (hasDuplicates) {
    summary = `检测到同位重字「${duplicateChars.join('、')}」；仅作提示，仍需人工判断修辞需要`;
  } else if (keyRate === 1 && opposingToneRate >= 0.7) {
    isToneAligned = true;
    summary = '平仄对位较整齐；词性、句法和语义仍需人工核对';
  } else if (keyRate >= 0.66 && opposingToneRate >= 0.5) {
    isToneAligned = true;
    summary = '关键音步大致相对；这不是自动对仗结论';
  } else {
    summary = '平仄对位不足；词性、句法和语义未由本算法分析';
  }

  return {
    isToneAligned,
    verificationStatus,
    score,
    opposingToneRate,
    duplicateChars,
    unknownPositions,
    summary,
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
  const fullPattern = getCipaiPatterns(cipai);
  const splitLines = (Array.isArray(content) ? content.flatMap(splitProsodyClauses) : splitProsodyClauses(content));
  // 作者句读与词谱句读不一致（逗的拆合）时按字数对齐，避免整首错位
  const rawLines = alignClausesToPattern(splitLines, fullPattern.map(pattern => Array.from(pattern).length)) || splitLines;

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
        const requiredTone = cipai.rhymeTones?.[lineIdx];
        const acceptsTone = !requiredTone || actualMain === requiredTone
          || (multi && (actualTones as ToneClass[]).includes(requiredTone));
        status = acceptsTone ? 'rhyme' : 'error';
        if (!acceptsTone) tooltip = `韵脚应为${requiredTone === 'P' ? '平' : '仄'}声`;
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
  const unknownCount = lines.reduce(
    (acc, line) => acc + line.chars.filter(char => char.actual === 'unknown').length, 0
  );

  // fullPattern.map 已把缺失句的每个字位标成 error，直接汇总即可精确计数。
  const rhymeVerdict = checkRhymeGroups(
    fullPattern.map(pattern => Array.from(pattern)), rawLines, rhymeBook, manualGroupId, cipai.rhymeGroups,
    { ciTongya: rhymeBook !== 'xin_yun' }
  );
  const rhymeCheckStatus = rhymeVerdict.status;
  const violationCount = totalViolations + (rhymeCheckStatus === 'fail' ? 1 : 0);
  const requiredRhymeCount = fullPattern.filter(pattern => ['R', 'r'].includes(Array.from(pattern).at(-1) || '')).length;
  const rhymeVerified = requiredRhymeCount < 2 || rhymeCheckStatus === 'ok';
  const isValid = violationCount === 0 && unknownCount === 0 && rhymeVerified;

  return {
    lines,
    summary: rhymeCheckStatus === 'fail'
      ? `《${cipai.name}》平仄已核对，但韵脚不合谱定韵组`
      : unknownCount > 0 || !rhymeVerified
      ? `《${cipai.name}》结构已核对，但有 ${unknownCount} 字或韵脚待核`
      : violationCount === 0 ? `《${cipai.name}》格律合规${rhymeVerdict.note ? `（${rhymeVerdict.note}）` : ''}` : `发现 ${violationCount} 处出律`,
    isValid,
    violationCount,
    unknownCount,
    verificationStatus: isValid ? 'verified' : (unknownCount > 0 || !rhymeVerified ? 'unverified' : 'verified'),
    rhymeCheckStatus,
  };
}

// 十四行诗校验见 sonnetChecker.ts
export { checkSonnet } from './sonnetChecker';
