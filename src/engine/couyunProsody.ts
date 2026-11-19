/**
 * Text normalization and regulated-line patterns adapted from hulbji/couyun.
 * Upstream: https://github.com/hulbji/couyun
 * Pinned commit: 1744e87f850c2205bc231bfdd858256036c0e4db
 * Copyright (c) 2026 hulbji, MIT License.
 * See data/cipai/LICENSE.couyun and THIRD_PARTY_NOTICES.md.
 */

export type ProsodyTone = 'P' | 'Z' | 'X';

const LEFT_BRACKETS = new Set(Array.from('([{（【<'));
const RIGHT_BRACKETS = new Set(Array.from(')]}）】>'));
const CLAUSE_SEPARATOR = /[，。！？；、,.!?;：:\n\r]+/;

/** Remove editorial comments in brackets while preserving the poem outside them. */
export function removeProsodyComments(text: string): string {
  const result: string[] = [];
  let depth = 0;
  for (const char of Array.from(text)) {
    if (LEFT_BRACKETS.has(char)) {
      depth += 1;
      continue;
    }
    if (RIGHT_BRACKETS.has(char)) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) result.push(char);
  }
  return result.join('');
}

/** Normalize punctuation and whitespace into the clauses consumed by the meter engine. */
export function splitProsodyClauses(text: string): string[] {
  return removeProsodyComments(text)
    .split(CLAUSE_SEPARATOR)
    .map(clause => Array.from(clause).filter(char => !/\s/u.test(char)).join(''))
    .filter(Boolean);
}

// couyun uses 0=中、1=平、2=仄. The alternatives encode accepted regular
// sentences, including the documented 拗句 alternatives; order is significant.
const COUYUN_RULES: Record<number, string[]> = {
  1: ['11221', '21121', '11121'],
  2: ['01122', '11212'],
  3: ['02211'],
  4: ['02012', '02022'],
  5: ['0211221', '0221121', '0211121'],
  6: ['0201122', '0211212'],
  7: ['0102211'],
  8: ['0102012', '0102022'],
};

function decodePattern(pattern: string): ProsodyTone[] {
  return Array.from(pattern).map(value => value === '1' ? 'P' : value === '2' ? 'Z' : 'X');
}

/**
 * Return couyun's accepted line alternatives for the base template direction.
 * `R` is treated as a level-tone rhyme here; rhyme-group checking remains separate.
 */
export function getCouyunLineAlternatives(basePattern: string[]): ProsodyTone[][] {
  const length = basePattern.length;
  if (length !== 5 && length !== 7) return [basePattern.map(tone => tone === 'R' || tone === 'r' ? 'P' : tone as ProsodyTone)];

  const second = basePattern[1];
  const lastRaw = basePattern[length - 1];
  const last = lastRaw === 'R' || lastRaw === 'r' ? 'P' : lastRaw;
  const key = length === 5
    ? (second === 'P' ? (last === 'P' ? 1 : 2) : (last === 'P' ? 3 : 4))
    : (second === 'Z' ? (last === 'P' ? 5 : 6) : (last === 'P' ? 7 : 8));
  return (COUYUN_RULES[key] || []).map(decodePattern);
}

export function chooseCouyunLinePattern(
  basePattern: string[],
  actualTones: Array<'P' | 'Z' | 'unknown' | Array<'P' | 'Z'>>,
  requiresCoupletRescue = false
): ProsodyTone[] {
  const allAlternatives = getCouyunLineAlternatives(basePattern);
  // couyun restricts the following line to the final two alternatives when
  // the preceding “中仄中仄仄” line requests cross-line rescue.
  const alternatives = requiresCoupletRescue && allAlternatives.length > 1
    ? allAlternatives.slice(-2)
    : allAlternatives;
  const scored = alternatives.map((pattern, index) => ({
    pattern,
    index,
    errors: pattern.reduce((count, expected, charIndex) => {
      if (expected === 'X') return count;
      const actual = actualTones[charIndex];
      if (actual === 'unknown' || actual === undefined) return count;
      const matches = Array.isArray(actual) ? actual.includes(expected) : actual === expected;
      return count + (matches ? 0 : 1);
    }, 0),
  }));
  scored.sort((left, right) => left.errors - right.errors || left.index - right.index);
  return scored[0]?.pattern || alternatives[0] || [];
}

export function requiresCoupletRescue(pattern: ProsodyTone[]): boolean {
  const signature = pattern.join('');
  return signature === 'XZXZZ' || signature === 'XPXZXZZ';
}

/**
 * 把作者的句读对齐到词谱句读。
 * 词谱常把一个长句拆成「逗」（虞美人「故国不堪回首月明中」谱作 6+3），
 * 作者也常在谱上不断处加顿号（青玉案「更吹落、星如雨」谱作一句 6 字）。
 * 也有断句位置不同的（李清照「乍暖还寒时候，最难将息」谱作 4+6）。
 * 动态规划：作者连续 a 句与谱连续 b 句总字数相等即可对应（a、b ≤ 3），
 * 一一对应代价 0，其余代价 a+b-2，取代价最小的方案。无法对齐时返回 null，由调用方按原句报错。
 */
export function alignClausesToPattern(clauses: string[], patternLengths: number[]): string[] | null {
  return alignClausesWithCost(clauses, patternLengths)?.clauses ?? null;
}

/** 同上，另返回拆并代价（0 = 作者句读与谱完全一致），用于在多个变体间优先句读吻合者 */
export function alignClausesWithCost(clauses: string[], patternLengths: number[]): { clauses: string[]; cost: number } | null {
  const n = clauses.length;
  const m = patternLengths.length;
  if (n === m && clauses.every((clause, i) => Array.from(clause).length === patternLengths[i])) return { clauses, cost: 0 };
  const lens = clauses.map(clause => Array.from(clause).length);
  const INF = Number.POSITIVE_INFINITY;
  const cost: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(INF));
  const back: [number, number][][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill([-1, -1]));
  cost[0][0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (cost[i][j] === INF) continue;
      for (let a = 1; a <= 3 && i + a <= n; a++) {
        for (let b = 1; b <= 3 && j + b <= m; b++) {
          let sumA = 0; for (let k = i; k < i + a; k++) sumA += lens[k];
          let sumB = 0; for (let k = j; k < j + b; k++) sumB += patternLengths[k];
          if (sumA !== sumB) continue;
          const next = cost[i][j] + a + b - 2;
          if (next < cost[i + a][j + b]) { cost[i + a][j + b] = next; back[i + a][j + b] = [i, j]; }
        }
      }
    }
  }
  if (cost[n][m] === INF) return null;
  const out: string[] = [];
  let i = n; let j = m;
  const segments: { from: [number, number]; to: [number, number] }[] = [];
  while (i > 0 || j > 0) {
    const [pi, pj] = back[i][j];
    segments.unshift({ from: [pi, pj], to: [i, j] });
    i = pi; j = pj;
  }
  segments.forEach(({ from: [i0, j0], to: [i1, j1] }) => {
    const text = Array.from(clauses.slice(i0, i1).join(''));
    let cursor = 0;
    for (let k = j0; k < j1; k++) {
      out.push(text.slice(cursor, cursor + patternLengths[k]).join(''));
      cursor += patternLengths[k];
    }
  });
  return { clauses: out, cost: cost[n][m] };
}
