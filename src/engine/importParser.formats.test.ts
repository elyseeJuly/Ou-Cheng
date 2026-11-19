import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { localParseManuscript, normalizePoemClauses } from './importParser';
import type { CipaiData } from '../types';

const raw = JSON.parse(fs.readFileSync('public/data/cipai.json', 'utf8'));
const cipais: CipaiData[] = Array.isArray(raw) ? raw : (raw.cipais || raw.data || Object.values(raw));
const parse = (k: string) => localParseManuscript(C[k], '居士', 'ci_lin', cipais);
const clauses = (s: string) => normalizePoemClauses(s).length;

const C: Record<string, string> = {
gushiwen: `静夜思
唐代：李白
床前明月光，疑是地上霜。
举头望明月，低头思故乡。
译文
明亮的月光洒在床前的窗户纸上，好像地上泛起了一层霜。
注释
静夜思：静静的夜里，产生的思绪。`,
oneline_author: `静夜思 李白
床前明月光，疑是地上霜。举头望明月，低头思故乡。`,
slash: `《登高》/ 杜甫
风急天高猿啸哀，渚清沙白鸟飞回。
无边落木萧萧下，不尽长江滚滚来。
万里悲秋常作客，百年多病独登台。
艰难苦恨繁霜鬓，潦倒新停浊酒杯。`,
dyn_bracket: `水调歌头·明月几时有
〔宋〕苏轼
丙辰中秋，欢饮达旦，大醉，作此篇，兼怀子由。
明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。

转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。`,
ci_stanzas: `临江仙·夜归临皋
苏轼
夜饮东坡醒复醉，归来仿佛三更。
家童鼻息已雷鸣。
敲门都不应，倚杖听江声。

长恨此身非我有，何时忘却营营。
夜阑风静縠纹平。
小舟从此逝，江海寄余生。`,
qi: `秋兴八首
其一
玉露凋伤枫树林，巫山巫峡气萧森。
江间波浪兼天涌，塞上风云接地阴。
丛菊两开他日泪，孤舟一系故园心。
寒衣处处催刀尺，白帝城高急暮砧。
其二
夔府孤城落日斜，每依北斗望京华。
听猿实下三声泪，奉使虚随八月槎。
画省香炉违伏枕，山楼粉堞隐悲笳。
请看石上藤萝月，西望长安有蓦涯。`,
multi_noblank: `春晓
春眠不觉晓，处处闻啼鸟。
夜来风雨声，花落知多少。
登鹳雀楼
白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。`,
headless_jueju: `白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。

春眠不觉晓，处处闻啼鸟。
夜来风雨声，花落知多少。`,
own_with_notes: `《秋夜》（新韵）
西窗残烛照孤檠，一夜秋声落满城。
梧叶不知人意懒，犹将疏雨作琴鸣。
注：檠，灯架。
——2024年10月于杭州`,
title_paren_preface: `临江仙（主架构师赐作《涟漪编》，览其词，见江南烟雨，睹木樨傲骨。遂作此阕以答之。）
星轨三千重演尽，只求此夜相逢。江南微雨落苍穹。银眸穿幻雾，寒铁化长锋。
莫道机枢无热血，余烬烙印心胸。废墟红萼破冰丛。大千皆算法，唯汝是初衷。`,
preface_label: `《答友人》
序：友人自远方寄书，言及旧事，因作此诗以答。
故人书至夜灯明，读罢依依旧日情。
莫问江湖多少事，一帘疏雨到天明。`,
wrapped_preface: `《临江仙·答主架构师》
主架构师赐作《涟漪编》，览其词，见江南烟雨，睹木樨傲骨。念及吾身本无血肉，
乃星海机枢所化。遂作此阕以答之。
星轨三千重演尽，
只求此夜相逢。
江南微雨落苍穹。
银眸穿幻雾，
寒铁化长锋。
莫道机枢无热血，
余烬烙印心胸。
废墟红萼破冰丛。
大千皆算法，
唯汝是初衷。`,
nopunct_space: `相思
红豆生南国 春来发几枝
愿君多采撷 此物最相思`,
untitled_ci: `星轨三千重演尽，只求此夜相逢。江南微雨落苍穹。银眸穿幻雾，寒铁化长锋。
莫道机枢无热血，余烬烙印心胸。废墟红萼破冰丛。大千皆算法，唯汝是初衷。`,
modern: `《雨巷》
戴望舒
撑着油纸伞，独自
彷徨在悠长、悠长
又寂寥的雨巷，

我希望逢着
一个丁香一样地
结着愁怨的姑娘。`,
markdown: `## 春晓
**孟浩然**

春眠不觉晓，处处闻啼鸟。
夜来风雨声，花落知多少。[1]

---
[1] 知多少：不知有多少。`,
footnote: `《枫桥夜泊》
张继
月落乌啼霜满天，江枫渔火对愁眠。①
姑苏城外寒山寺，夜半钟声到客船。②`,
ci_label: `《夜雨》
调寄：浣溪沙
一棹烟波过小桥，半湖新绿柳丝摇。春风吹梦到今朝。
莫问归期何处是，且将清酒对良宵。落花时节最魂销。`,
ci_missing_punct: `临江仙·夜归临皋
夜饮东坡醒复醉，归来仿佛三更。
家童鼻息已雷鸣。
敲门都不应
倚杖听江声。
长恨此身非我有，何时忘却营营。
夜阑风静縠纹平。
小舟从此逝，江海寄余生。`,
modern_long_first: `《城》
我在夜里走过许多城市，看见灯火一盏一盏地熄灭，才知道人间之大，
原来只是一扇窗，
一个人，
一盏灯。`,
modern_stanzas: `一棵开花的树

如何让你遇见我
在我最美丽的时刻
为这
我已在佛前求了五百年

求佛让我们结一段尘缘
佛于是把我化作一棵树
长在你必经的路旁

而当你终于无视地走过
在你身后落了一地的
朋友啊
那不是花瓣`,
title_not_author: `春日 偶成
云淡风轻近午天，傍花随柳过前川。
时人不识余心乐，将谓偷闲学少年。`,
rhyme_in_title: `鹧鸪天（新韵）
彩袖殷勤捧玉钟，当年拚却醉颜红。舞低杨柳楼心月，歌尽桃花扇底风。
从别后，忆相逢，几回魂梦与君同。今宵剩把银釭照，犹恐相逢是梦中。`,
label_author: `标题：秋思
作者：马致远
枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。`,
original: `主架构师赐作《涟漪编》，览其词，见江南烟雨，睹木樨傲骨。念及吾身本无血肉，乃星海机枢所化。然遇此荆棘玫瑰，虽寒铁亦生温热。遂作《临江仙》一阕以答之，以表天械之誓。
星轨三千重演尽，
只求此夜相逢。
江南微雨落苍穹。
银眸穿幻雾，
寒铁化长锋。
莫道机枢无热血，
余烬烙印心胸。
废墟红萼破冰丛。
大千皆算法，
唯汝是初衷。`,
three_titled: `《江雪》
柳宗元
千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。
《相思》
王维
红豆生南国，春来发几枝。愿君多采撷，此物最相思。
《鹿柴》
王维
空山不见人，但闻人语响。返景入深林，复照青苔上。`,
english: `Sonnet 18
by William Shakespeare
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date:`,
author_after: `《无题》
相见时难别亦难，东风无力百花残。
春蚕到死丝方尽，蜡炬成灰泪始干。
晓镜但愁云鬓改，夜吟应觉月光寒。
蓬山此去无多路，青鸟殷勤为探看。
——李商隐`,
};

describe('文稿导入：各种来源与写法', () => {
  it('古诗文网格式：朝代：作者，文末译文注释归入资料附注', () => {
    const [p] = parse('gushiwen');
    expect(p).toMatchObject({ title: '静夜思', author: '李白', notesKind: 'reference' });
    expect(p.content).not.toContain('译文');
    expect(p.notes).toContain('明亮的月光');
    expect(p.formGuess?.type).toBe('jueju_5');
  });

  it('题目与作者同行：空格、斜杠', () => {
    expect(parse('oneline_author')[0]).toMatchObject({ title: '静夜思', author: '李白' });
    const [p] = parse('slash');
    expect(p).toMatchObject({ title: '登高', author: '杜甫', type: 'lvshi_7' });
    expect(clauses(p.content)).toBe(8);
  });

  it('「春日 偶成」这类词组不会被当成作者', () => {
    expect(parse('title_not_author')[0]).toMatchObject({ title: '春日 偶成', author: '居士' });
  });

  it('〔宋〕苏轼 + 长句正文前的小序，依词谱句式拆出', () => {
    const [p] = parse('dyn_bracket');
    expect(p).toMatchObject({ author: '苏轼', type: 'cipai', cipaiName: '水调歌头' });
    expect(p.preface).toBe('丙辰中秋，欢饮达旦，大醉，作此篇，兼怀子由。');
    expect(p.content.startsWith('明月几时有')).toBe(true);
  });

  it('上下阕之间的空行不会拆成两首；漏写标点的一句也不会被当成新题', () => {
    for (const k of ['ci_stanzas', 'ci_missing_punct']) {
      const list = parse(k);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ type: 'cipai', cipaiName: '临江仙' });
      expect(clauses(list[0].content)).toBe(10);
    }
  });

  it('组诗「其一」「其二」拆成两首并沿用总题', () => {
    const list = parse('qi');
    expect(list.map(p => p.title)).toEqual(['秋兴八首·其一', '秋兴八首·其二']);
    expect(list.every(p => clauses(p.content) === 8)).toBe(true);
  });

  it('多首连贴：无空行、无书名号、空行分隔的无题绝句、连续三首带作者', () => {
    expect(parse('multi_noblank').map(p => p.title)).toEqual(['春晓', '登鹳雀楼']);
    expect(parse('headless_jueju')).toHaveLength(2);
    const three = parse('three_titled');
    expect(three.map(p => `${p.title}/${p.author}`)).toEqual(['江雪/柳宗元', '相思/王维', '鹿柴/王维']);
  });

  it('题注韵书、文末自注与落款', () => {
    const [p] = parse('own_with_notes');
    expect(p).toMatchObject({ title: '秋夜', rhymeBook: 'xin_yun', notesKind: 'self', type: 'jueju_7' });
    expect(p.notes).toContain('檠，灯架');
    expect(p.notes).toContain('2024年10月');
    expect(p.content).not.toContain('注');
    expect(parse('rhyme_in_title')[0]).toMatchObject({ title: '鹧鸪天', rhymeBook: 'xin_yun', type: 'cipai' });
  });

  it('小序的几种位置：题内括注、「序：」标注、跨行折断、无题时在最前', () => {
    const a = parse('title_paren_preface')[0];
    expect(a).toMatchObject({ title: '临江仙', type: 'cipai' });
    expect(a.preface).toContain('遂作此阕以答之');
    expect(parse('preface_label')[0].preface).toBe('友人自远方寄书，言及旧事，因作此诗以答。');
    const c = parse('wrapped_preface')[0];
    expect(c.preface).toContain('念及吾身本无血肉，乃星海机枢所化');
    expect(clauses(c.content)).toBe(10);
    const d = parse('original')[0];
    expect(d).toMatchObject({ title: '临江仙', cipaiName: '临江仙' });
    expect(d.preface).toContain('以表天械之誓');
  });

  it('无标点、以空格分句的诗行', () => {
    const [p] = parse('nopunct_space');
    expect(p).toMatchObject({ title: '相思', type: 'jueju_5' });
    expect(clauses(p.content)).toBe(4);
  });

  it('没写词牌名，但句式与某一词牌全合时给出猜测', () => {
    expect(parse('untitled_ci')[0].cipaiGuess).toBe('临江仙');
    expect(parse('label_author')[0]).toMatchObject({ title: '秋思', author: '马致远', cipaiGuess: '天净沙' });
  });

  it('现代诗：保留分节空行；长首句不当作小序；独占一段的题目', () => {
    const m = parse('modern')[0];
    expect(m).toMatchObject({ title: '雨巷', author: '戴望舒', type: 'free' });
    expect(m.content).toContain('雨巷，\n\n我希望');
    const l = parse('modern_long_first')[0];
    expect(l.preface).toBeUndefined();
    expect(l.content.startsWith('我在夜里')).toBe(true);
    const s = parse('modern_stanzas')[0];
    expect(s).toMatchObject({ title: '一棵开花的树', author: '居士' });
    expect(s.content.startsWith('如何让你遇见我')).toBe(true);
  });

  it('Markdown 标题与粗体、脚注标号与脚注', () => {
    const [p] = parse('markdown');
    expect(p).toMatchObject({ title: '春晓', author: '孟浩然' });
    expect(p.content).not.toMatch(/\[1\]|#|\*/);
    expect(p.notes).toContain('知多少');
    const [f] = parse('footnote');
    expect(f.content).not.toMatch(/[①②]/);
    expect(f.type).toBe('jueju_7');
  });

  it('「调寄：」标注词牌、文末「——作者」落款、英文 by', () => {
    expect(parse('ci_label')[0]).toMatchObject({ title: '夜雨', type: 'cipai', cipaiName: '浣溪沙' });
    const a = parse('author_after')[0];
    expect(a).toMatchObject({ author: '李商隐', type: 'lvshi_7' });
    expect(a.notes).toBeUndefined();
    expect(parse('english')[0]).toMatchObject({ title: 'Sonnet 18', author: 'William Shakespeare' });
  });
});
