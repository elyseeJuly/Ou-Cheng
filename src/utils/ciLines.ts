/**
 * 把一首词排成「一韵一行」的赏读行：每行到韵脚（或句末标点）为止，通常两三句。
 * - 谱例原文（无标点、一句一行）：按谱的 rhymeGroups 判断韵位，句间补「，」，韵脚补「。」，
 *   并按 stanzas 分阕。
 * - 有标点的文本：在 。！？； 处断行，空行或「|」视为分阕。
 * 一行超过 4 句时从中间再断一次，避免过长。
 */
export interface CiLineHints {
  rhymeGroups?: (string | null)[];
  stanzaSizes?: number[];
}

const END = /[。！？；]/;

function splitLong(clauses: string[]): string[][] {
  if (clauses.length <= 4) return [clauses];
  const mid = Math.ceil(clauses.length / 2);
  return [...splitLong(clauses.slice(0, mid)), ...splitLong(clauses.slice(mid))];
}

const bare = (line: string) => line.replace(/[，。、；！？,.!?：:]/g, '').length;

/** 相邻两行都很短（如「桐江好，烟漠漠。」「波似染，山如削。」）时并成一行，免得一行只有寥寥几字 */
function mergeShort(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev !== undefined && bare(prev) <= 7 && bare(line) <= 7 && bare(prev) + bare(line) <= 14) out[out.length - 1] = prev + line;
    else out.push(line);
  }
  return out;
}

export function formatCiLines(content: string, hints: CiLineHints = {}): string[][] {
  return formatRaw(content, hints).map(mergeShort);
}

function formatRaw(content: string, hints: CiLineHints): string[][] {
  const text = (content || '').replace(/\r/g, '').trim();
  if (!text) return [];
  const hasPunct = /[，。、；！？,.!?]/.test(text);

  if (!hasPunct) {
    const clauses = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const rhymes = hints.rhymeGroups;
    const sizes = hints.stanzaSizes && hints.stanzaSizes.reduce((a, b) => a + b, 0) === clauses.length
      ? hints.stanzaSizes : [clauses.length];
    const usable = rhymes && rhymes.length === clauses.length;
    const stanzas: string[][] = [];
    let at = 0;
    for (const size of sizes) {
      const part = clauses.slice(at, at + size);
      const lines: string[] = [];
      let buf: string[] = [];
      part.forEach((clause, i) => {
        const idx = at + i;
        const isRhyme = usable ? rhymes![idx] != null : (i % 2 === 1);
        const last = i === part.length - 1;
        buf.push(clause);
        if (isRhyme || last) {
          for (const group of splitLong(buf)) {
            lines.push(group.map((c, k) => c + (k === group.length - 1 ? '。' : '，')).join(''));
          }
          buf = [];
        }
      });
      stanzas.push(lines);
      at += size;
    }
    return stanzas;
  }

  const blocks = text.split(/\n\s*\n|\|/).map(b => b.replace(/\n+/g, '')).filter(Boolean);
  return blocks.map(block => {
    const lines: string[] = [];
    let cur = '';
    for (const ch of Array.from(block)) {
      cur += ch;
      if (END.test(ch)) { lines.push(cur); cur = ''; }
    }
    if (cur.trim()) lines.push(cur);
    return lines.flatMap(line => {
      const clauses = line.match(/[^，、,]+[，、,]?/g) || [line];
      if (clauses.length <= 4) return [line];
      return splitLong(clauses).map(g => g.join(''));
    });
  });
}
