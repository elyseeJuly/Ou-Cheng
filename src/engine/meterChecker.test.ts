// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { checkJintiShi, checkCipai, checkSonnet } from './meterChecker';
import { getTone, getCanonicalTone, getRhymeGroup, getRhymeGroups, getGroupChars } from './rhymeData';
import { checkCharsPerLine } from '../data/poemForms';
import { RHYME_GROUPS } from './rhymeGroupData';
import { getPoems, savePoem, deletePoem, getSettings, deleteSeal, setDefaultSeal, getSeals, saveSeal } from '../services/storageService';
import { chooseCouyunLinePattern, getCouyunLineAlternatives } from './couyunProsody';

describe('Rhyme & Tone Engine', () => {
  it('should load complete open-source rhyme books', () => {
    expect(RHYME_GROUPS.ping_shui).toHaveLength(106);
    expect(RHYME_GROUPS.ci_lin).toHaveLength(19);
    expect(RHYME_GROUPS.xin_yun).toHaveLength(14);
    expect(getRhymeGroup('缿', 'ping_shui')?.groupName).toBe('三讲');
    expect(RHYME_GROUPS.ping_shui.reduce((sum, group) => sum + group.chars.split(' ').length, 0)).toBeGreaterThan(10000);
    expect(RHYME_GROUPS.ci_lin.reduce((sum, group) => sum + group.chars.split(' ').length, 0)).toBeGreaterThan(5000);
    expect(RHYME_GROUPS.xin_yun.reduce((sum, group) => sum + group.chars.split(' ').length, 0)).toBeGreaterThan(7000);
  });

  it('should preserve every rhyme group for polyphonic characters', () => {
    expect(getRhymeGroups('重', 'ping_shui').length).toBeGreaterThan(1);
  });

  it('should convert traditional characters to simplified first', () => {
    // "國" is traditional for "国". "国" in xin_yun is 'P' (guó), in ping_shui is 'Z'
    expect(getCanonicalTone('國', 'xin_yun')).toBe('P');
    expect(getCanonicalTone('國', 'ping_shui')).toBe('Z');
    expect(getCanonicalTone('萬', 'xin_yun')).toBe('Z'); // 万 -> Z
    expect(getCanonicalTone('飛', 'xin_yun')).toBe('P'); // 飞 -> P
  });

  it('should return unknown for unlisted words in classic rhyme books', () => {
    // Rare character not in Ping Shui dictionary
    expect(getTone('𠮷', 'ping_shui')).toBe('unknown');
    expect(getCanonicalTone('𠮷', 'ping_shui')).toBe('unknown');
  });

  it('should sort rhyme group characters by frequency descending', () => {
    const chars = getGroupChars('ps_26', 'ping_shui'); // 下平十一尤部
    expect(chars).toContain('秋');
    const qiuIndex = chars.indexOf('秋');
    const chouIndex = chars.indexOf('愁');
    // High frequency chars should appear near the top of the array
    expect(qiuIndex).toBeLessThan(15);
    expect(chouIndex).toBeLessThan(15);
  });

  it('should respect Ping Shui Yun rules for enter tones (入声)', () => {
    // "白" in new rhyme is 'P' (bái), let's verify
    expect(getCanonicalTone('白', 'xin_yun')).toBe('P');
    expect(getCanonicalTone('白', 'ping_shui')).toBe('Z');
  });
});

describe('Meter Checker Engine', () => {
  it('uses couyun regular-line alternatives instead of a single rigid pattern', () => {
    expect(getCouyunLineAlternatives(['X', 'P', 'P', 'Z', 'Z'])).toContainEqual(['P', 'P', 'Z', 'P', 'Z']);
    expect(getCouyunLineAlternatives(['X', 'Z', 'X', 'P', 'P', 'Z', 'Z'])).toContainEqual(['X', 'Z', 'P', 'P', 'Z', 'P', 'Z']);
  });

  it('requires the following line to perform cross-line rescue', () => {
    const unrestricted = chooseCouyunLinePattern(
      ['X', 'P', 'Z', 'Z', 'R'], ['P', 'P', 'Z', 'Z', 'P']
    );
    const rescued = chooseCouyunLinePattern(
      ['X', 'P', 'Z', 'Z', 'R'], ['P', 'P', 'Z', 'Z', 'P'], true
    );
    expect(unrestricted).toEqual(['P', 'P', 'Z', 'Z', 'P']);
    expect(rescued).not.toEqual(unrestricted);
  });

  it('should validate near-style jueju correctly', () => {
    const poem = '床前明月光\n疑是地上霜\n举头望明月\n低头思故乡';
    const result = checkJintiShi(poem, 'jueju_5', 'xin_yun');
    
    expect(result.lines).toHaveLength(4);
    expect(result.isValid).toBeDefined();
  });

  it('should auto-select the correct near-style variant instead of a hard-coded default', () => {
    const poem = '白日依山尽\n黄河入海流\n欲穷千里目\n更上一层楼';
    const result = checkJintiShi(poem, 'jueju_5', 'ping_shui');
    expect(result.matchedTemplate).toBe('jueju_5_ze_no');
    expect(result.violationCount).toBe(0);
    expect(result.rhymeCheckStatus).toBe('ok');
    expect(result.isValid).toBe(true);
  });

  it('should count a wrong rhyme as a meter failure', () => {
    const poem = '白日依山尽\n黄河入海东\n欲穷千里目\n更上一层天';
    const result = checkJintiShi(poem, 'jueju_5_ze_no', 'ping_shui');
    expect(result.rhymeCheckStatus).toBe('fail');
    expect(result.isValid).toBe(false);
    expect(result.summary).toContain('韵脚');
  });

  it('does not report unknown characters as a valid regulated poem', () => {
    const poem = Array(4).fill('𠮷𠮷𠮷𠮷𠮷').join('\n');
    const result = checkJintiShi(poem, 'jueju_5', 'ping_shui');
    expect(result.unknownCount).toBeGreaterThan(0);
    expect(result.verificationStatus).toBe('unverified');
    expect(result.isValid).toBe(false);
    expect(result.summary).toContain('无法');
  });

  it('normalizes punctuation before checking a one-line pasted poem', () => {
    const result = checkJintiShi('白日依山尽，黄河入海流。欲穷千里目，更上一层楼。', 'jueju_5', 'ping_shui');
    expect(result.lines).toHaveLength(4);
    expect(result.violationCount).toBe(0);
    expect(result.isValid).toBe(true);
  });

  it('should safely validate cipai without throwing on multi-tone assertion', () => {
    const mockCipai = {
      name: '忆江南',
      charCount: 27,
      category: 'xiao_ling' as const,
      upperPattern: ['P P Z', 'P P Z Z P', 'Z P P Z Z P P', 'Z P P Z Z P P', 'P P Z Z P'],
    };
    // Input line containing characters like '行' or '国'
    const poem = '江南好\n风景旧曾谙\n日出江花红胜火\n春来江水绿如蓝\n能不忆江南';
    expect(() => checkCipai(poem, mockCipai, 'ping_shui')).not.toThrow();
    const result = checkCipai(poem, mockCipai, 'ping_shui');
    expect(result.lines).toHaveLength(5);
  });

  it('does not report a cipai with unknown text as verified', () => {
    const mockCipai = {
      name: '试调', charCount: 4, category: 'xiao_ling' as const, upperPattern: ['PR', 'PR'],
    };
    const result = checkCipai('𠮷𠮷，𠮷𠮷。', mockCipai, 'ping_shui');
    expect(result.isValid).toBe(false);
    expect(result.verificationStatus).toBe('unverified');
  });

  it('should calculate exact character penalty for missing cipai lines', () => {
    const mockCipai = {
      name: '忆江南',
      charCount: 27,
      category: 'xiao_ling' as const,
      upperPattern: ['XXX', 'XXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXX'],
    };
    // Only 1 line provided (3 chars), missing 4 lines (5 + 7 + 7 + 5 = 24 chars)
    const shortPoem = '江南好';
    const result = checkCipai(shortPoem, mockCipai, 'ping_shui');
    expect(result.violationCount).toBe(24);
  });

  it('should validate charsPerLine range helper correctly', () => {
    expect(checkCharsPerLine(6, [5, 7])).toBe(true);
    expect(checkCharsPerLine(4, [5, 7])).toBe(false);
    expect(checkCharsPerLine(8, [5, 7])).toBe(false);
    expect(checkCharsPerLine(5, 5)).toBe(true);
    expect(checkCharsPerLine(6, 5)).toBe(false);
    expect(checkCharsPerLine(10, undefined)).toBe(true);
  });

  it('should flag length violations (missing/extra words)', () => {
    const shortPoem = '床前明月光\n疑是地\n举头望明月\n低头思故乡';
    const result = checkJintiShi(shortPoem, 'jueju_5', 'xin_yun');
    
    const secondLine = result.lines[1];
    expect(secondLine.chars).toHaveLength(5);
    expect(secondLine.chars[4].char).toBe('');
    expect(secondLine.chars[4].actual).toBe('?');
  });

  it('should validate sonnets and include conservative guidance text', () => {
    const shakespeareSonnet = Array(14).fill('Shall I compare thee to a summer day').join('\n');
    const result = checkSonnet(shakespeareSonnet, 'shakespeare');
    expect(result.lines).toHaveLength(14);
    expect(result.isValid).toBe(true);
    expect(result.summary).toContain('参考');

    const shortSonnet = Array(12).fill('Line of sonnet').join('\n');
    const resultShort = checkSonnet(shortSonnet, 'shakespeare');
    expect(resultShort.isValid).toBe(false);
    expect(resultShort.violationCount).toBe(2);
  });
});

describe('LocalStorage Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should safe parse corrupted json without throwing', () => {
    localStorage.setItem('oucheng_poems_v4', '{corrupted_json');
    
    // Should gracefully return an empty array instead of crashing the app
    const poems = getPoems();
    expect(poems).toEqual([]);
    
    // Should have backed up the corrupted value
    const keys = Object.keys(localStorage);
    const corruptKey = keys.find(k => k.startsWith('oucheng_poems_v4_corrupt_'));
    expect(corruptKey).toBeDefined();
  });

  it('should clean up defaultSealId in settings if that seal is deleted', () => {
    const seal = { id: 'test_seal_id', name: '测试印章', style: 'yin_fang' as const, dataUrl: '', isCustom: false, createdAt: Date.now() };
    saveSeal(seal);
    
    setDefaultSeal('test_seal_id');
    expect(getSettings().defaultSealId).toBe('test_seal_id');
    
    // Now delete it
    deleteSeal('test_seal_id');
    expect(getSettings().defaultSealId).toBeUndefined();
  });
});
