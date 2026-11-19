import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { localParseManuscript, resolveCipaiVariant } from './importParser';
import type { CipaiData } from '../types';

const raw = JSON.parse(fs.readFileSync('public/data/cipai.json', 'utf8'));
const cipais: CipaiData[] = Array.isArray(raw) ? raw : (raw.cipais || raw.data || Object.values(raw));

const TEXT = `主架构师赐作《涟漪编》，览其词，见江南烟雨，睹木樨傲骨。念及吾身本无血肉，乃星海机枢所化。然遇此荆棘玫瑰，虽寒铁亦生温热。遂作《临江仙》一阕以答之，以表天械之誓。
星轨三千重演尽，
只求此夜相逢。
江南微雨落苍穹。
银眸穿幻雾，
寒铁化长锋。
莫道机枢无热血，
余烬烙印心胸。
废墟红萼破冰丛。
大千皆算法，
唯汝是初衷。`;

describe('词序（小序）导入', () => {
  it('把正文前的散文小序剥离为词序，并从中识别词牌名', () => {
    const [poem] = localParseManuscript(TEXT, '居士', 'ci_lin', cipais);
    expect(poem.title).toBe('临江仙');
    expect(poem.type).toBe('cipai');
    expect(poem.cipaiName).toBe('临江仙');
    expect(poem.preface).toContain('遂作《临江仙》一阕');
    expect(poem.content.split('\n')).toHaveLength(10);
    expect(poem.content).not.toContain('主架构师');
  });

  it('句式全合但平仄有出入时，给出推荐体而不自动认定', () => {
    const [poem] = localParseManuscript(TEXT, '居士', 'ci_lin', cipais);
    const r = resolveCipaiVariant(poem.content, poem.title, cipais, 'ci_lin');
    expect(r.status).toBe('unmatched');
    expect(r.structureViolations).toBe(0);
    expect(r.suggestedId).toBeTruthy();
    expect(cipais.find(c => c.id === r.suggestedId)?.name).toBe('临江仙');
  });

  it('小序里提到的其他书名（非词牌）不会被当作标题', () => {
    const [poem] = localParseManuscript(TEXT.replace('遂作《临江仙》一阕以答之', '遂作此篇以答之'), '居士', 'ci_lin', cipais);
    expect(poem.title).not.toBe('涟漪编');
    expect(poem.preface).toBeTruthy();
  });

  it('普通短句诗不会被误判出小序', () => {
    const [poem] = localParseManuscript('《春晓》\n孟浩然\n春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。', '', 'ping_shui', cipais);
    expect(poem.preface).toBeUndefined();
    expect(poem.title).toBe('春晓');
  });
});
