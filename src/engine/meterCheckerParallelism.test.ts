import { describe, it, expect } from 'vitest';
import { checkJintiShi, checkCoupletParallelism } from './meterChecker';

describe('Lvshi couplet tone-alignment analysis', () => {
  it('recognizes opposing tones in Du Fu Deng Gao without claiming semantic parallelism', () => {
    // 杜甫《登高》
    const content = [
      '风急天高猿啸哀',
      '渚清沙白鸟飞回',
      '无边落木萧萧下', // 颔联 出句
      '不尽长江滚滚来', // 颔联 对句
      '万里悲秋常作客', // 颈联 出句
      '百年多病独登台', // 颈联 对句
      '艰难苦恨繁霜鬓',
      '潦倒新停浊酒杯'
    ];

    const result = checkJintiShi(content, 'lvshi_7_ze_no', 'ping_shui');
    expect(result.parallelism).toBeDefined();
    expect(result.parallelism?.hanLian?.isToneAligned).toBe(true);
    expect(result.parallelism?.jingLian?.isToneAligned).toBe(true);
    expect(result.parallelism?.hanLian?.summary).toContain('人工核对');
    expect(result.parallelism?.hanLian?.duplicateChars).toHaveLength(0);
    expect(result.parallelism?.jingLian?.duplicateChars).toHaveLength(0);
  });

  it('detects duplicate characters in couplet as antithesis issue', () => {
    const lineA = [
      { char: '长', status: 'ok' as const, actual: 'P' },
      { char: '风', status: 'ok' as const, actual: 'P' },
      { char: '万里', status: 'ok' as const, actual: 'Z' },
      { char: '客', status: 'ok' as const, actual: 'Z' },
      { char: '来', status: 'ok' as const, actual: 'P' }
    ];
    const lineB = [
      { char: '长', status: 'error' as const, actual: 'P' }, // 同位重字
      { char: '月', status: 'ok' as const, actual: 'Z' },
      { char: '千', status: 'ok' as const, actual: 'P' },
      { char: '家', status: 'ok' as const, actual: 'P' },
      { char: '稀', status: 'rhyme' as const, actual: 'P' }
    ];

    const analysis = checkCoupletParallelism(lineA, lineB);
    expect(analysis).toBeDefined();
    expect(analysis?.duplicateChars).toContain('长');
    expect(analysis?.isToneAligned).toBe(false);
    expect(analysis?.summary).toContain('同位重字');
    expect(analysis?.summary).not.toContain('大忌');
  });

  it('does not turn matching tone positions into an automatic parallelism result', () => {
    const make = (chars: string, tone: 'P' | 'Z') => Array.from(chars).map(char => ({ char, status: 'ok' as const, actual: tone }));
    const analysis = checkCoupletParallelism(make('春江花月夜', 'P'), make('秋岭暮云深', 'P'));
    expect(analysis?.isToneAligned).toBe(false);
    expect(analysis?.summary).toContain('未由本算法分析');
  });

  it('marks a couplet unverified when either line contains unknown tones', () => {
    const lineA = Array.from('春江花月夜').map(char => ({ char, status: 'ok' as const, actual: 'P' }));
    const lineB = Array.from('秋岭暮云深').map((char, index) => ({
      char, status: index === 2 ? 'warn' as const : 'ok' as const, actual: index === 2 ? 'unknown' : 'Z',
    }));
    const analysis = checkCoupletParallelism(lineA, lineB);
    expect(analysis?.verificationStatus).toBe('unverified');
    expect(analysis?.isToneAligned).toBe(false);
    expect(analysis?.unknownPositions).toContain(3);
  });

  it('tolerates non-lvshi poems without attaching parallelism result', () => {
    const juejuContent = [
      '床前明月光',
      '疑是地上霜',
      '举头望明月',
      '低头思故乡'
    ];
    const result = checkJintiShi(juejuContent, 'jueju_5_ping_yes', 'ping_shui');
    expect(result.parallelism).toBeUndefined();
  });
});
