// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { localParseManuscript, localDetectPoemType } from './importParser';
import { getCanonicalTone } from './rhymeData';

describe('Import Parser & Classifiers', () => {
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
    expect(result[0].type).toBe('jueju_5');

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
});
