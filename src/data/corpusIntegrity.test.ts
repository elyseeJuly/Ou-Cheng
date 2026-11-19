import { describe, expect, it } from 'vitest';
import poetry from '../../public/data/poetry.json';
import { hasReadableCorpusText } from '../pages/Library';

describe('开源语料显示边界', () => {
  it('入库语料不含替换字符等缺字记录（构建时整篇剔除）', () => {
    expect(poetry.filter(poem => !hasReadableCorpusText(poem))).toEqual([]);
  });
  it('题目、作者、正文不含拉丁字母、数字与缺字符号', () => {
    const bad = poetry.filter(p => /[A-Za-z0-9\uFF21-\uFF3A\uFF41-\uFF5A\uFF10-\uFF19?□・/]/.test(`${p.title}${p.author}${p.content}`));
    expect(bad.map(p => p.title)).toEqual([]);
  });
  it('每个朝代与体裁标签都有篇目', () => {
    const era = (p: { category: string; dynasty: string }) => `${p.category}${p.dynasty}`;
    for (const ch of ['唐', '宋', '元', '明', '清', '汉']) expect(poetry.filter(p => era(p).includes(ch)).length).toBeGreaterThan(100);
    expect(poetry.filter(p => /魏|晋|南北朝/.test(era(p))).length).toBeGreaterThan(100);
    expect(poetry.filter(p => /赋|楚辞/.test(p.category)).length).toBeGreaterThan(50);
    expect(poetry.filter(p => p.category.includes('乐府')).length).toBeGreaterThan(50);
  });
});
