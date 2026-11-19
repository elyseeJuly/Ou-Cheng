import { describe, expect, it } from 'vitest';
import cipaiData from '../../public/data/cipai.json';

type CipaiRecord = (typeof cipaiData)[number];

const findCanonical = (name: string, charCount: number) => cipaiData.find(
  item => item.name === name && item.charCount === charCount && item.variantLabel === '正体'
) as CipaiRecord | undefined;

describe('generated cipai data', () => {
  it('keeps every emitted form structurally self-consistent', () => {
    expect(new Set(cipaiData.map(item => item.name)).size).toBeGreaterThanOrEqual(810);
    expect(cipaiData.length).toBeGreaterThanOrEqual(2270);
    for (const item of cipaiData) {
      const patterns = item.stanzas?.flat() || [...item.upperPattern, ...(item.lowerPattern || [])];
      const sourceLines = item.sourceText.split('\n');
      expect(patterns).toHaveLength(sourceLines.length);
      expect(patterns.reduce((sum, pattern) => sum + Array.from(pattern).length, 0)).toBe(item.charCount);
      expect(sourceLines.reduce((sum, line) => sum + Array.from(line).length, 0)).toBe(item.charCount);
    }
  });

  it('preserves canonical structures that the old parser truncated', () => {
    const pusa = findCanonical('菩萨蛮', 44);
    expect(pusa?.aliases).toContain('重叠金');
    expect(pusa?.stanzas?.map(stanza => stanza.length)).toEqual([4, 4]);
    expect(pusa?.sourceText.split('\n')).toHaveLength(8);
    expect(pusa?.upperPattern[0]).toBe('XPXZPPR');

    const rumeng = findCanonical('如梦令', 33);
    expect(rumeng?.sourceText.split('\n')).toHaveLength(7);
    expect(rumeng?.sourceText).toContain('如梦\n如梦');

    const shuidiao = findCanonical('水调歌头', 95);
    expect(shuidiao?.stanzas?.map(stanza => stanza.length)).toEqual([9, 10]);
    expect(shuidiao?.sourceText.startsWith('九金增宋重')).toBe(true);
    expect(shuidiao?.sourceText.startsWith('毛滂')).toBe(false);
  });
});
