import { describe, it, expect } from 'vitest';
import { getTone, getRhymeGroups } from './rhymeData';

describe('Rhyme Data Normalization & Ancient Tone Tests', () => {
  it('correctly maps traditional characters to their tone and rhyme groups', () => {
    // 風 -> 风 (平水韵 一东)
    expect(getTone('風', 'ping_shui')).toBe('P');
    const fengGroups = getRhymeGroups('風', 'ping_shui');
    expect(fengGroups.length).toBeGreaterThan(0);
    expect(fengGroups.some(g => g.groupName.includes('东'))).toBe(true);

    // 雲 -> 云 (平水韵 十二文)
    expect(getTone('雲', 'ping_shui')).toBe('P');
    const yunGroups = getRhymeGroups('雲', 'ping_shui');
    expect(yunGroups.length).toBeGreaterThan(0);
    expect(yunGroups.some(g => g.groupName.includes('文'))).toBe(true);

    // 髮 -> 发 (平水韵 入声六月)
    expect(getTone('髮', 'ping_shui')).toBe('Z');

    // 獨 -> 独 (平水韵 入声一屋)
    expect(getTone('獨', 'ping_shui')).toBe('Z');

    // 聲 -> 声 (平水韵 八庚)
    expect(getTone('聲', 'ping_shui')).toBe('P');

    // 給只在旧韵律专用映射中；通用搜索表未收录时也必须继续回退。
    expect(getTone('給', 'xin_yun')).toEqual(getTone('给', 'xin_yun'));
  });

  it('correctly classifies classical entering tone characters as Ze (Z) in Pingshui Yun', () => {
    const enteringChars = ['白', '国', '石', '竹', '菊', '学', '德', '达', '黑', '佛', '福', '绝'];
    enteringChars.forEach(char => {
      const tone = getTone(char, 'ping_shui');
      expect(tone).toBe('Z');
    });
  });

  it('handles multi-tone characters accurately', () => {
    // 中 (平水韵: 一东 P / 一送 Z)
    const zhongTone = getTone('中', 'ping_shui');
    expect(Array.isArray(zhongTone) ? zhongTone.includes('P') && zhongTone.includes('Z') : zhongTone === 'P' || zhongTone === 'Z').toBe(true);
  });
});
