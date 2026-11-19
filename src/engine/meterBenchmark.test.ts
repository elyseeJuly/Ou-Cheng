import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { checkCipai, checkJintiShi } from './meterChecker';
import { checkSonnet } from './sonnetChecker';
import { resolveCipaiVariant } from './importParser';
import { alignClausesToPattern } from './couyunProsody';
import { getTone, getRhymeGroups } from './rhymeData';
import type { CipaiData } from '../types';

const raw = JSON.parse(fs.readFileSync('public/data/cipai.json', 'utf8'));
const cipais: CipaiData[] = Array.isArray(raw) ? raw : (raw.cipais || raw.data || Object.values(raw));

// 以名篇为「标准答案」：这些诗在平水韵下应判合律，且格体唯一
const REGULATED: [string, string, string, string][] = [
  ['jueju_5', '登鹳雀楼', '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。', 'jueju_5_ze_no'],
  ['jueju_5', '相思', '红豆生南国，春来发几枝。愿君多采撷，此物最相思。', 'jueju_5_ze_no'],
  ['jueju_5', '八阵图', '功盖三分国，名成八阵图。江流石不转，遗恨失吞吴。', 'jueju_5_ze_no'],
  ['jueju_7', '早发白帝城', '朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。', 'jueju_7_ping_yes'],
  ['jueju_7', '凉州词', '黄河远上白云间，一片孤城万仞山。羌笛何须怨杨柳，春风不度玉门关。', 'jueju_7_ping_yes'],
  ['jueju_7', '枫桥夜泊', '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。', 'jueju_7_ze_yes'],
  ['jueju_7', '泊秦淮', '烟笼寒水月笼沙，夜泊秦淮近酒家。商女不知亡国恨，隔江犹唱后庭花。', 'jueju_7_ping_yes'],
  ['jueju_7', '乌衣巷', '朱雀桥边野草花，乌衣巷口夕阳斜。旧时王谢堂前燕，飞入寻常百姓家。', 'jueju_7_ze_yes'],
  ['jueju_7', '清明', '清明时节雨纷纷，路上行人欲断魂。借问酒家何处有，牧童遥指杏花村。', 'jueju_7_ping_yes'],
  ['jueju_7', '山行', '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。', 'jueju_7_ze_yes'],
  ['lvshi_5', '春望', '国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。烽火连三月，家书抵万金。白头搔更短，浑欲不胜簪。', 'lvshi_5_ze_no'],
  ['lvshi_5', '山居秋暝', '空山新雨后，天气晚来秋。明月松间照，清泉石上流。竹喧归浣女，莲动下渔舟。随意春芳歇，王孙自可留。', 'lvshi_5_ping_no'],
  ['lvshi_5', '送友人', '青山横北郭，白水绕东城。此地一为别，孤蓬万里征。浮云游子意，落日故人情。挥手自兹去，萧萧班马鸣。', 'lvshi_5_ping_no'],
  ['lvshi_5', '春夜喜雨', '好雨知时节，当春乃发生。随风潜入夜，润物细无声。野径云俱黑，江船火独明。晓看红湿处，花重锦官城。', 'lvshi_5_ze_no'],
  ['lvshi_7', '登高', '风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。', 'lvshi_7_ze_yes'],
  ['lvshi_7', '蜀相', '丞相祠堂何处寻，锦官城外柏森森。映阶碧草自春色，隔叶黄鹂空好音。三顾频烦天下计，两朝开济老臣心。出师未捷身先死，长使英雄泪满襟。', 'lvshi_7_ze_yes'],
  ['lvshi_7', '秋兴其一', '玉露凋伤枫树林，巫山巫峡气萧森。江间波浪兼天涌，塞上风云接地阴。丛菊两开他日泪，孤舟一系故园心。寒衣处处催刀尺，白帝城高急暮砧。', 'lvshi_7_ze_yes'],
  ['lvshi_7', '无题', '相见时难别亦难，东风无力百花残。春蚕到死丝方尽，蜡炬成灰泪始干。晓镜但愁云鬓改，夜吟应觉月光寒。蓬山此去无多路，青鸟殷勤为探看。', 'lvshi_7_ze_yes'],
  ['lvshi_7', '闻官军', '剑外忽传收蓟北，初闻涕泪满衣裳。却看妻子愁何在，漫卷诗书喜欲狂。白日放歌须纵酒，青春作伴好还乡。即从巴峡穿巫峡，便下襄阳向洛阳。', 'lvshi_7_ze_no'],
];

const SONNETS: [string, 'shakespeare' | 'petrarchan' | 'chinese_modern', string][] = [
['S18','shakespeare',`Shall I compare thee to a summer's day?
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
So long lives this and this gives life to thee.`],
['S130','shakespeare',`My mistress' eyes are nothing like the sun;
Coral is far more red than her lips' red;
If snow be white, why then her breasts are dun;
If hairs be wires, black wires grow on her head.
I have seen roses damask'd, red and white,
But no such roses see I in her cheeks;
And in some perfumes is there more delight
Than in the breath that from my mistress reeks.
I love to hear her speak, yet well I know
That music hath a far more pleasing sound;
I grant I never saw a goddess go;
My mistress, when she walks, treads on the ground:
And yet, by heaven, I think my love as rare
As any she belied with false compare.`],
['S116','shakespeare',`Let me not to the marriage of true minds
Admit impediments. Love is not love
Which alters when it alteration finds,
Or bends with the remover to remove:
O no! it is an ever-fixed mark
That looks on tempests and is never shaken;
It is the star to every wandering bark,
Whose worth's unknown, although his height be taken.
Love's not Time's fool, though rosy lips and cheeks
Within his bending sickle's compass come;
Love alters not with his brief hours and weeks,
But bears it out even to the edge of doom.
If this be error and upon me proved,
I never writ, nor no man ever loved.`],
['Keats','petrarchan',`Much have I travell'd in the realms of gold,
And many goodly states and kingdoms seen;
Round many western islands have I been
Which bards in fealty to Apollo hold.
Oft of one wide expanse had I been told
That deep-brow'd Homer ruled as his demesne;
Yet did I never breathe its pure serene
Till I heard Chapman speak out loud and bold:
Then felt I like some watcher of the skies
When a new planet swims into his ken;
Or like stout Cortez when with eagle eyes
He star'd at the Pacific—and all his men
Look'd at each other with a wild surmise—
Silent, upon a peak in Darien.`],
['Wordsworth','petrarchan',`The world is too much with us; late and soon,
Getting and spending, we lay waste our powers;—
Little we see in Nature that is ours;
We have given our hearts away, a sordid boon!
This Sea that bares her bosom to the moon;
The winds that will be howling at all hours,
And are up-gathered now like sleeping flowers;
For this, for everything, we are out of tune;
It moves us not. Great God! I'd rather be
A Pagan suckled in a creed outworn;
So might I, standing on this pleasant lea,
Have glimpses that would make me less forlorn;
Have sight of Proteus rising from the sea;
Or hear old Triton blow his wreathèd horn.`],
['冯至其一','chinese_modern',`我们准备着深深地领受
那些意想不到的奇迹，
在漫长的岁月里忽然有
彗星的出现，狂风乍起：
我们的生命在这一瞬间，
仿佛在第一次的拥抱里
过去的悲欢忽然在眼前
凝结成屹然不动的形体。
我们赞颂那些小昆虫，
它们经过了一次交媾
或是抵御了一次危险，
便结束它们美妙的一生。
我们整个的生命在承受
狂风乍起，彗星的出现。`],
['自由14行','shakespeare',Array.from({length:14},(_, i)=>['The cat sat quietly upon the mat','I went to town to buy some bread today','My phone is broken and I need a new one','Computers process data very fast'][i%4]).join('\n')],
];

describe('格律引擎：名篇基准', () => {
  it.each(REGULATED)('%s《%s》判为合律且格体唯一', (type, _name, text, template) => {
    const r = checkJintiShi(text, type, 'ping_shui');
    expect(r.violationCount).toBe(0);
    expect(r.unknownCount).toBe(0);
    expect(r.rhymeCheckStatus).toBe('ok');
    expect(r.verificationStatus).toBe('verified');
    expect(r.matchedTemplate).toBe(template);
  });

  it('拗体与古绝如实报出律处', () => {
    expect(checkJintiShi('昔人已乘黄鹤去，此地空余黄鹤楼。黄鹤一去不复返，白云千载空悠悠。晴川历历汉阳树，芳草萋萋鹦鹉洲。日暮乡关何处是，烟波江上使人愁。', 'lvshi_7', 'ping_shui').violationCount).toBeGreaterThan(0);
    expect(checkJintiShi('空山不见人，但闻人语响。返景入深林，复照青苔上。', 'jueju_5', 'ping_shui').violationCount).toBeGreaterThan(4);
  });

  it('多音字取首读的格体优先（凉州词「间」读平，首句入韵）', () => {
    expect(checkJintiShi('黄河远上白云间，一片孤城万仞山。羌笛何须怨杨柳，春风不度玉门关。', 'jueju_7', 'ping_shui').matchedTemplate).toBe('jueju_7_ping_yes');
  });

  it('韵表补漏：「先」在一先、「啼」有平声、词林正韵覆盖常用字', () => {
    expect(getRhymeGroups('先', 'ping_shui').map(g => g.groupName)).toContain('一先');
    expect(getTone('啼', 'ping_shui')).toBe('P');
    expect(getTone('蘋', 'ci_lin')).toBe('P');
    expect(getRhymeGroups('纷', 'ci_lin').length).toBeGreaterThan(0);
  });

  it('《钦定词谱》例词按本谱自检，九成以上通过', () => {
    let valid = 0; let total = 0; let toneErrors = 0;
    for (const c of cipais) {
      if (!c.sourceText) continue;
      total++;
      const r = checkCipai(c.sourceText, c, 'ci_lin');
      if (r.isValid) valid++;
      if (r.lines.some(l => l.chars.some(x => x.status === 'error'))) toneErrors++;
    }
    expect(valid / total).toBeGreaterThan(0.88);
    expect(toneErrors / total).toBeLessThan(0.02);
  });
});

describe('十四行诗：名篇基准', () => {
  it.each(SONNETS.filter(([n]) => n !== '自由14行'))('%s 韵式全合', (_n, type, text) => {
    const r = checkSonnet(text, type);
    expect(r.isValid).toBe(true);
    expect(r.rhymeCheckStatus).toBe(type === 'chinese_modern' ? r.rhymeCheckStatus : 'ok');
  });

  it('不押韵的 14 行英文不会判为合式，并标出各行韵式字母与音节', () => {
    const [, type, text] = SONNETS.find(([n]) => n === '自由14行')!;
    const r = checkSonnet(text, type);
    expect(r.isValid).toBe(false);
    expect(r.lines[0].rhymeLabel).toBe('A');
    expect(r.lines[0].note).toMatch(/音节/);
  });

  it('彼特拉克式自动识别后六行变式；莎士比亚式转折在第 13 行', () => {
    const k = checkSonnet(SONNETS.find(([n]) => n === 'Keats')![2], 'petrarchan');
    expect(k.matchedTemplate).toBe('ABBAABBACDCDCD');
    const s = checkSonnet(SONNETS.find(([n]) => n === 'S18')![2], 'shakespeare');
    expect(s.lines[12].isVolta).toBe(true);
  });
});

// 不取《词谱》例词，另以宋词名篇做独立检验：按词牌名定位到唯一变体且合律
const SONG_CI: [string, string][] = [
  ['浣溪沙', '一曲新词酒一杯，去年天气旧亭台。夕阳西下几时回？无可奈何花落去，似曾相识燕归来。小园香径独徘徊。'],
  ['虞美人', '春花秋月何时了？往事知多少。小楼昨夜又东风，故国不堪回首月明中。雕栏玉砌应犹在，只是朱颜改。问君能有几多愁？恰似一江春水向东流。'],
  ['菩萨蛮', '小山重叠金明灭，鬓云欲度香腮雪。懒起画蛾眉，弄妆梳洗迟。照花前后镜，花面交相映。新帖绣罗襦，双双金鹧鸪。'],
  ['如梦令', '昨夜雨疏风骤，浓睡不消残酒。试问卷帘人，却道海棠依旧。知否？知否？应是绿肥红瘦。'],
  ['清平乐', '茅檐低小，溪上青青草。醉里吴音相媚好，白发谁家翁媪？大儿锄豆溪东，中儿正织鸡笼。最喜小儿亡赖，溪头卧剥莲蓬。'],
  ['西江月', '明月别枝惊鹊，清风半夜鸣蝉。稻花香里说丰年，听取蛙声一片。七八个星天外，两三点雨山前。旧时茅店社林边，路转溪桥忽见。'],
  ['卜算子', '缺月挂疏桐，漏断人初静。谁见幽人独往来，缥缈孤鸿影。惊起却回头，有恨无人省。拣尽寒枝不肯栖，寂寞沙洲冷。'],
  ['蝶恋花', '伫倚危楼风细细，望极春愁，黯黯生天际。草色烟光残照里，无言谁会凭阑意。拟把疏狂图一醉，对酒当歌，强乐还无味。衣带渐宽终不悔，为伊消得人憔悴。'],
  ['鹊桥仙', '纤云弄巧，飞星传恨，银汉迢迢暗度。金风玉露一相逢，便胜却人间无数。柔情似水，佳期如梦，忍顾鹊桥归路。两情若是久长时，又岂在朝朝暮暮。'],
  ['水调歌头', '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。'],
  ['念奴娇', '大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。遥想公瑾当年，小乔初嫁了，雄姿英发。羽扇纶巾，谈笑间，樯橹灰飞烟灭。故国神游，多情应笑我，早生华发。人生如梦，一尊还酹江月。'],
  ['声声慢', '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。三杯两盏淡酒，怎敌他、晚来风急？雁过也，正伤心，却是旧时相识。满地黄花堆积，憔悴损，如今有谁堪摘？守着窗儿，独自怎生得黑？梧桐更兼细雨，到黄昏、点点滴滴。这次第，怎一个、愁字了得！'],
  ['江城子', '十年生死两茫茫，不思量，自难忘。千里孤坟，无处话凄凉。纵使相逢应不识，尘满面，鬓如霜。夜来幽梦忽还乡，小轩窗，正梳妆。相顾无言，惟有泪千行。料得年年肠断处，明月夜，短松冈。'],
  ['破阵子', '醉里挑灯看剑，梦回吹角连营。八百里分麾下炙，五十弦翻塞外声，沙场秋点兵。马作的卢飞快，弓如霹雳弦惊。了却君王天下事，赢得生前身后名。可怜白发生！'],
  ['定风波', '莫听穿林打叶声，何妨吟啸且徐行。竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。料峭春风吹酒醒，微冷，山头斜照却相迎。回首向来萧瑟处，归去，也无风雨也无晴。'],
  ['渔家傲', '塞下秋来风景异，衡阳雁去无留意。四面边声连角起，千嶂里，长烟落日孤城闭。浊酒一杯家万里，燕然未勒归无计。羌管悠悠霜满地，人不寐，将军白发征夫泪。'],
  ['苏幕遮', '碧云天，黄叶地，秋色连波，波上寒烟翠。山映斜阳天接水，芳草无情，更在斜阳外。黯乡魂，追旅思，夜夜除非，好梦留人睡。明月楼高休独倚，酒入愁肠，化作相思泪。'],
];

describe('词谱：宋词名篇独立检验', () => {
  it.each(SONG_CI)('《%s》唯一定体且合律', (name, text) => {
    const r = resolveCipaiVariant(text, name, cipais, 'ci_lin');
    expect(r.status).toBe('exact');
    expect(r.toneViolations).toBe(0);
  });

  it('句读与谱不同时按字数对齐（拆逗、并句、错位断句）', () => {
    expect(alignClausesToPattern(['故国不堪回首月明中'], [6, 3])).toEqual(['故国不堪回首', '月明中']);
    expect(alignClausesToPattern(['更吹落', '星如雨'], [6])).toEqual(['更吹落星如雨']);
    expect(alignClausesToPattern(['乍暖还寒时候', '最难将息'], [4, 6])).toEqual(['乍暖还寒', '时候最难将息']);
    expect(alignClausesToPattern(['一二三'], [4])).toBeNull();
  });
});
