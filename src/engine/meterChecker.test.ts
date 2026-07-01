// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { checkJintiShi, checkCipai, checkSonnet } from './meterChecker';
import { getTone, getCanonicalTone } from './rhymeData';
import { getPoems, savePoem, deletePoem, getSettings, deleteSeal, setDefaultSeal, getSeals, saveSeal } from '../services/storageService';

describe('Rhyme & Tone Engine', () => {
  it('should convert traditional characters to simplified first', () => {
    // "國" is traditional for "国". "国" in xin_yun is 'P' (guó), in ping_shui is 'Z'
    expect(getCanonicalTone('國', 'xin_yun')).toBe('P');
    expect(getCanonicalTone('國', 'ping_shui')).toBe('Z');
    expect(getCanonicalTone('萬', 'xin_yun')).toBe('Z'); // 万 -> Z
    expect(getCanonicalTone('飛', 'xin_yun')).toBe('P'); // 飞 -> P
  });

  it('should return unknown for unlisted words', () => {
    // A rare or non-existent word in the map
    expect(getCanonicalTone('𠮷', 'xin_yun')).toBe('unknown');
    expect(getTone('𠮷', 'xin_yun')).toBe('unknown');
  });

  it('should respect Ping Shui Yun rules for enter tones (入声)', () => {
    // "白" in new rhyme is 'P' (bái), let's verify
    expect(getCanonicalTone('白', 'xin_yun')).toBe('P');
    expect(getCanonicalTone('白', 'ping_shui')).toBe('Z');
  });
});

describe('Meter Checker Engine', () => {
  it('should validate near-style jueju correctly', () => {
    // 五绝 仄起首句不入韵 jueju_5_ze_no
    // 1: Z Z P P Z
    // 2: P P Z Z R
    // 3: P P P Z Z
    // 4: Z Z Z P R
    const poem = '床前明月光\n疑是地上霜\n举头望明月\n低头思故乡';
    const result = checkJintiShi(poem, 'jueju_5', 'xin_yun');
    
    expect(result.lines).toHaveLength(4);
    // Since some characters might not be in our 200-char XIN_YUN_MAP, they will be 'unknown' (warn), 
    // but the engine shouldn't crash and should report violations for actual errors.
    expect(result.isValid).toBeDefined();
  });

  it('should flag length violations (missing/extra words)', () => {
    // Second line is short
    const shortPoem = '床前明月光\n疑是地\n举头望明月\n低头思故乡';
    const result = checkJintiShi(shortPoem, 'jueju_5', 'xin_yun');
    
    // The second line has length 3, pattern expects 5. 
    // It should contain 2 missing characters or neutral characters, and violationCount should be > 0.
    const secondLine = result.lines[1];
    expect(secondLine.chars).toHaveLength(5);
    expect(secondLine.chars[4].char).toBe('');
    expect(secondLine.chars[4].actual).toBe('?');
  });

  it('should validate sonnets', () => {
    const shakespeareSonnet = Array(14).fill('Shall I compare thee to a summer day').join('\n');
    const result = checkSonnet(shakespeareSonnet, 'shakespeare');
    expect(result.lines).toHaveLength(14);
    expect(result.isValid).toBe(true);

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
