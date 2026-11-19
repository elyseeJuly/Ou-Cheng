import { describe, expect, it } from 'vitest';
import { chunkPreface } from './prefaceColumns';

describe('chunkPreface', () => {
  it('按字数折行且标点不落行首', () => {
    const out = chunkPreface('主架构师赐作《涟漪编》，览其词，见江南烟雨。', 5);
    expect(out.join('')).toBe('主架构师赐作《涟漪编》，览其词，见江南烟雨。');
    out.forEach(l => expect(/^[，。》]/.test(l)).toBe(false));
  });
  it('去掉空白', () => {
    expect(chunkPreface('一 二\n三', 10)).toEqual(['一二三']);
  });
});
