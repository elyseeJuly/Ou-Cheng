// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  clausesToProLines,
  findBestCipaiVariant,
  getCipaiEditorPatterns,
  localParseManuscript,
  localDetectPoemType,
  normalizePoemClauses,
  resolveCipaiVariant,
} from './importParser';
import { getCanonicalTone } from './rhymeData';
import { CipaiData } from '../types';

describe('Import Parser & Classifiers', () => {
  it('matches the best historical cipai variant by name and structure', () => {
    const variants: CipaiData[] = [
      { id: 'a', name: '念奴娇', charCount: 8, category: 'xiao_ling', upperPattern: ['XXXX', 'XXXX'], variantLabel: '正体' },
      { id: 'b', name: '念奴娇', charCount: 9, category: 'xiao_ling', upperPattern: ['XXX', 'XXX', 'XXX'], variantLabel: '又一体 1', isVariant: true },
    ];
    expect(findBestCipaiVariant('江山画，风流人。千古情。', '念奴娇·怀古', variants)?.id).toBe('b');
  });

  it('uses tone rules to distinguish variants with the same line lengths', () => {
    const variants: CipaiData[] = [
      { id: 'ze', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['ZZ', 'ZZ'] },
      { id: 'ping', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['PP', 'PP'] },
    ];
    expect(findBestCipaiVariant('春风，江山。', '试调', variants, 'ci_lin')?.id).toBe('ping');
  });

  it('maps continuous imported clauses onto a two-stanza editor without shifting the lower stanza', () => {
    const cipai: CipaiData = {
      id: 'double', name: '试调', charCount: 8, category: 'xiao_ling',
      upperPattern: ['PP', 'ZZ'], lowerPattern: ['PZ', 'ZP'],
    };
    const patterns = getCipaiEditorPatterns(cipai);
    expect(clausesToProLines('春风，夜雨。江山，归舟。', patterns)).toEqual([
      '春风', '夜雨', '', '江山', '归舟',
    ]);
  });

  it('does not silently choose a tied cipai variant', () => {
    const variants: CipaiData[] = [
      { id: 'a', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['XX', 'XX'] },
      { id: 'b', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['XX', 'XX'] },
    ];
    const result = resolveCipaiVariant('春风，江山。', '试调', variants, 'ci_lin');
    expect(result.status).toBe('ambiguous');
    expect(result.variantId).toBeUndefined();
    expect(result.candidateIds).toEqual(['a', 'b']);
  });

  it('uses rhyme status to break otherwise equal cipai candidates', () => {
    const variants: CipaiData[] = [
      { id: 'unverified', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['XX', 'XR'] },
      { id: 'failed', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['XR', 'XR'] },
    ];
    expect(resolveCipaiVariant('春风，江山。', '试调', variants, 'ci_lin').variantId).toBe('unverified');
  });

  it('does not let an explicit cipai title override tone or rhyme failure', () => {
    const variants: CipaiData[] = [
      { id: 'bad', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['ZZ', 'ZZ'] },
    ];
    const result = resolveCipaiVariant('春风，江山。', '试调·春日', variants, 'ci_lin');
    expect(result.status).toBe('unmatched');
    expect(result.variantId).toBeUndefined();
    expect(result.candidateIds).toContain('bad');
  });

  it('prefers the longest explicit cipai name instead of a contained shorter name', () => {
    const variants: CipaiData[] = [
      { id: 'short', name: '木兰花', charCount: 4, category: 'xiao_ling', upperPattern: ['XX', 'XX'] },
      { id: 'long', name: '减字木兰花', charCount: 4, category: 'xiao_ling', upperPattern: ['XX', 'XX'] },
    ];
    expect(resolveCipaiVariant('春风，江山。', '减字木兰花·春日', variants).variantId).toBe('long');
  });

  it('counts CJK extension characters as one visible character', () => {
    expect(normalizePoemClauses('𠮷山，春风。')).toEqual(['𠮷山', '春风']);
    const variants: CipaiData[] = [
      { id: 'unicode', name: '试调', charCount: 4, category: 'xiao_ling', upperPattern: ['XX', 'XX'] },
    ];
    const result = resolveCipaiVariant('𠮷山，春风。', '试调', variants);
    expect(result.structureViolations).toBe(0);
    expect(result.toneViolations).toBe(0);
    expect(result.status).toBe('unmatched');
  });

  it('removes bracketed editorial comments during prosody normalization', () => {
    expect(normalizePoemClauses('白日（此处有注）依山尽，黄河入海流。')).toEqual(['白日依山尽', '黄河入海流']);
  });

  it('should split bulk text separated by double newlines into multiple poems', () => {
    const text = `《春晓》
孟浩然
春眠不觉晓，处处闻啼鸟。
夜来风雨声，花落知多少。

《送友人》
李白
青山横北郭，白水绕东城。
此地一为别，孤蓬万里征。
浮云游子意，落日故人情。
挥手自兹去，萧萧班马鸣。`;

    const result = localParseManuscript(text, '无名氏');
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('春晓');
    expect(result[0].author).toBe('孟浩然');
    expect(result[0].content).toContain('春眠不觉晓');
    // 《春晓》押仄韵，不应被平韵近体模板冒充“自动判定成功”。
    expect(result[0].type).toBe('free');

    expect(result[1].title).toBe('送友人');
    expect(result[1].author).toBe('李白');
    expect(result[1].type).toBe('lvshi_5');
  });

  it('should extract title without book brackets if it is short', () => {
    const text = `登鹳雀楼
王之涣
白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。`;

    const result = localParseManuscript(text, '无名氏');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('登鹳雀楼');
    expect(result[0].author).toBe('王之涣');
    expect(result[0].type).toBe('jueju_5');
  });

  it('does not swallow the first two lines of an authorless poem as title and author', () => {
    const result = localParseManuscript('春眠不觉晓\n处处闻啼鸟\n夜来风雨声\n花落知多少', '无名氏');
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe('无名氏');
    expect(normalizePoemClauses(result[0].content)).toHaveLength(4);
    expect(result[0].content).toContain('春眠不觉晓');
    expect(result[0].content).toContain('处处闻啼鸟');
  });

  it('keeps the first verse when a bracketed title has no author line', () => {
    const result = localParseManuscript('《无题》\n春眠不觉晓\n处处闻啼鸟\n夜来风雨声\n花落知多少', '无名氏');
    expect(result[0].title).toBe('无题');
    expect(result[0].author).toBe('无名氏');
    expect(normalizePoemClauses(result[0].content)).toHaveLength(4);
  });

  it('does not split one poem just because header and body contain blank lines', () => {
    const result = localParseManuscript('《登鹳雀楼》\n\n（王之涣）\n\n白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。', '无名氏');
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe('王之涣');
    expect(normalizePoemClauses(result[0].content)).toHaveLength(4);
  });

  it('should detect English Sonnet correctly', () => {
    const sonnetText = `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date:
Sometime too hot the eye of heaven shines,
And often is his gold complexion dimm'd;
And every fair from fair sometime declines,
By chance or nature's changing course untrimm'd;
But thy eternal summer shall not fade
Nor lose possession of that fair thou owest;
Nor shall Death brag thou wander'st in his shade,
When in eternal lines to time thou growest:
So long as men can breathe or eyes can see,
So long lives this and this gives life to thee.`;

    const typeResult = localDetectPoemType(sonnetText, 'Sonnet 18');
    expect(typeResult.type).toBe('sonnet');
    expect(typeResult.sonnetType).toBe('shakespeare');
  });

  it('should distinguish modern poetry from classical Cipai', () => {
    // Variable length lines, but modern wording and title. Without matching Cipai, should be 'free'
    const modernText = `今天阳光灿烂，
我走在宽阔的街头，
看着天空飘过的白云，
心情十分舒畅。`;

    const typeResult = localDetectPoemType(modernText, '阳光的日子');
    expect(typeResult.type).toBe('free'); // should be modern poetry, not cipai

    // With a Cipai name in the title, should be 'cipai'
    const ciText = `明月几时有？把酒问青天。`;
    const typeResultCi = localDetectPoemType(ciText, '水调歌头·明月几时有');
    expect(typeResultCi.type).toBe('cipai');
    expect(typeResultCi.cipaiName).toBe('水调歌头');
  });

  it('does not classify any uniform modern four-line text as regulated verse', () => {
    const modern = '今天阳光好\n我们去散步\n手机没电了\n晚上吃火锅';
    expect(localDetectPoemType(modern, '周末', 'xin_yun').type).toBe('free');
  });

  it('should prioritize a Cipai title over uniform line lengths', () => {
    const text = '山色入帘青\n江声随雨急\n客梦逐潮生\n孤舟向晚横';
    const result = localDetectPoemType(text, '卜算子·江行');
    expect(result).toEqual({ type: 'cipai', cipaiName: '卜算子' });
  });

  it('should recognize Cipai names present in the local data set', () => {
    const result = localDetectPoemType('夜雨敲窗久\n孤灯照客愁', '莺啼序·夜雨');
    expect(result).toEqual({ type: 'cipai', cipaiName: '莺啼序' });
  });

  it('uses the full loaded cipai index instead of only the common-name fallback', () => {
    const cipais: CipaiData[] = [{
      id: 'rare', name: '瑞云浓', aliases: ['醉思仙'], charCount: 4,
      category: 'xiao_ling', upperPattern: ['XX', 'XX'],
    }];
    expect(localDetectPoemType('春风，江山。', '瑞云浓·春日', 'ci_lin', cipais)).toEqual({
      type: 'cipai', cipaiName: '瑞云浓',
    });
    expect(localDetectPoemType('春风，江山。', '醉思仙·春日', 'ci_lin', cipais)).toEqual({
      type: 'cipai', cipaiName: '瑞云浓',
    });
  });

  it('does not treat a cipai name embedded in an ordinary title as an explicit declaration', () => {
    expect(localDetectPoemType('山色苍茫\n江流入海', '雨中忆江南旧事').type).toBe('free');
  });

  it('should auto-detect Jinti Shi variants with minimum violations', () => {
    // 登鹳雀楼: 白日依山尽 (Z Z P P Z), 黄河入海流 (P P Z Z R) -> 仄起首句不入韵 jueju_5_ze_no
    const text = '白日依山尽\n黄河入海流\n欲穷千里目\n更上一层楼';
    const typeResult = localDetectPoemType(text, '登鹳雀楼', 'xin_yun');
    expect(typeResult.type).toBe('jueju_5');
    expect(typeResult.jintiVariant).toBe('jueju_5_ze_no');
  });
});

describe('Upgraded Tone Checker Engine (pinyin-pro)', () => {
  it('should lookup tones for all characters using pinyin-pro', () => {
    // Character "的" is not in the original 200-char map. It should be resolved by pinyin-pro as 'Z' (de4)
    expect(getCanonicalTone('的', 'xin_yun')).toBe('Z');

    // "之" -> 'P' (zhi1)
    expect(getCanonicalTone('之', 'xin_yun')).toBe('P');
    
    // "我" -> 'Z' (wo3)
    expect(getCanonicalTone('我', 'xin_yun')).toBe('Z');
  });

  it('should resolve classical entering tones correctly in ping_shui', () => {
    // "国" (guó) in modern is 2nd tone (平), but in Pingshui Yun it is an entering tone (仄)
    expect(getCanonicalTone('国', 'xin_yun')).toBe('P');
    expect(getCanonicalTone('国', 'ping_shui')).toBe('Z');

    // "出" (chū) in modern is 1st tone (平), in Pingshui Yun it is entering tone (仄)
    expect(getCanonicalTone('出', 'xin_yun')).toBe('P');
    expect(getCanonicalTone('出', 'ping_shui')).toBe('Z');

    // "石" (shí) in modern is 2nd tone (平), in Pingshui Yun it is entering tone (仄)
    expect(getCanonicalTone('石', 'xin_yun')).toBe('P');
    expect(getCanonicalTone('石', 'ping_shui')).toBe('Z');
  });

  it('should prefer authoritative classical rhyme-book tones over modern pinyin', () => {
    expect(getCanonicalTone('缺', 'ci_lin')).toBe('Z');
    expect(getCanonicalTone('缺', 'ping_shui')).toBe('Z');
  });
});
