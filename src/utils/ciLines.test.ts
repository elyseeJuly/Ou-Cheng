import { describe, expect, it } from 'vitest';
import { formatCiLines } from './ciLines';

describe('formatCiLines', () => {
  it('groups unpunctuated source text by rhyme positions and stanzas', () => {
    const text = '暮雨初收\n长川静\n征帆夜落\n临岛屿\n蓼烟疏淡\n苇风萧索';
    const out = formatCiLines(text, { rhymeGroups: [null, null, '0', null, null, '0'], stanzaSizes: [3, 3] });
    expect(out).toEqual([['暮雨初收，长川静，征帆夜落。'], ['临岛屿，蓼烟疏淡，苇风萧索。']]);
  });
  it('breaks punctuated text at sentence ends', () => {
    const out = formatCiLines('明月几时有？\n把酒问青天。\n不知天上宫阙，\n今夕是何年。');
    expect(out).toEqual([['明月几时有？把酒问青天。', '不知天上宫阙，今夕是何年。']]);
  });
});

describe('formatCiLines merging', () => {
  it('joins two very short rhyme lines', () => {
    const out = formatCiLines('桐江好，烟漠漠。波似染，山如削。绕严陵滩畔，鹭飞鱼跃。');
    expect(out[0][0]).toBe('桐江好，烟漠漠。波似染，山如削。');
  });
});
