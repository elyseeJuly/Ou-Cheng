// scripts/build-imagery.cjs
// 用法: node scripts/build-imagery.cjs
// 输入: data/poetry.json, data/imagery-dict.json, data/char-tone.json
// 输出: public/data/imagery/{类目}.json + index.json
const fs = require('fs');
const path = require('path');

const poetryPath = path.join(__dirname, '../public/data/poetry.json');
const dictPath = path.join(__dirname, '../data/imagery-dict.json');
const tonePath = path.join(__dirname, '../data/char-tone.json');

if (!fs.existsSync(dictPath)) {
  console.error('错误: data/imagery-dict.json 不存在。请先按照 SPEC_20260709_IMAGERY_NIGHT_PIPELINE.md Part 1 的 prompt 生成词表。');
  process.exit(1);
}
if (!fs.existsSync(tonePath)) {
  console.error('错误: data/char-tone.json 不存在。请先运行 node scripts/extract-char-tone.cjs');
  process.exit(1);
}

const poetry = JSON.parse(fs.readFileSync(poetryPath, 'utf8'));
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8')); // [{w,c}]
const toneMap = JSON.parse(fs.readFileSync(tonePath, 'utf8'));

// ───────────────────── 配置 ─────────────────────
const MIN_FREQ_DICT = 3;        // 词典词最低频次（低于此 = AI 生造或过僻，剔除）
const MIN_FREQ_MINED = 15;      // 挖掘词最低频次
const PMI_THRESHOLD = 3.0;      // 点互信息阈值
const MAX_SAMPLES = 10;         // 每词例句数
const TOP_RELATED = 12;         // 每词关联意象数
const FAMOUS = new Set(['李白','杜甫','苏轼','王维','李商隐','杜牧','白居易','辛弃疾',
  '李清照','陆游','孟浩然','王昌龄','刘禹锡','柳永','晏殊','欧阳修','秦观','周邦彦',
  '姜夔','纳兰性德','温庭筠','韦应物','岑参','高适','王安石','黄庭坚','范仲淹','元好问']);
const STOP_CHARS = new Set('之乎者也而何以其于则乃且若所不无未莫勿非已此彼是的了在有'.split(''));
const STOP_WORDS = new Set(['不知','不见','不得','何处','何时','无人','今日','明日',
  '此时','只有','惟有','唯有','自有','应有','犹有','安得','争得','那得','如此','从此',
  '一时','一日','十年','千里','万里','不可','未必','可怜','所以',
  '君子','归来','我心','上帝','相公','天下','几时','归去','别来','多情',
  '昨夜','一声','思量','中心','神仙','流水','相逢','当时','四海','千金',
  '相见','当初','薄言','夙夜','知道','那堪','别后','离人','与子','等闲',
  '饮酒','分明','上下','何处','几回','多少','谁家','谁言','谁道','更为',
  '更待','更看','更无','更有','如何','如今','若何','若为','未肯','未必',
  '未有','未曾','莫道','莫怪','莫向','莫教','自是','自昔','自古','但见',
  '但闻','但使','但得','欲问','欲寄','欲说','欲把','却话','却是','却忆',
  '只今','只道','总是','总为','为谁','为问','与君','与我','向谁','在何',
  '何处','何人','何日','何年','何如','何似','已自','已是','已经','犹自',
  '犹是','犹有','犹能','可怜','可堪','可奈','几度','几回','几时','几许',
  '征夫','公子','洞房','天道','昊天','四牡','王事','之子','维其']);

// ───────────────────── 语料准备 ─────────────────────
// 每首诗 → { author, title, lines: [纯汉字句] }
const corpus = poetry.map(p => {
  const raw = p.paragraphs ? (Array.isArray(p.paragraphs) ? p.paragraphs.join('') : p.paragraphs) : (p.content || '');
  return {
    author: p.author || '', title: p.title || '',
    lines: raw.split(/[，。、；：？！\s]/).filter(x => x.length >= 2),
  };
}).filter(p => p.lines.length > 0);

const allLines = [];  // { text, author, title, poemIdx }
corpus.forEach((p, pi) => p.lines.forEach(text =>
  allLines.push({ text, author: p.author, title: p.title, poemIdx: pi })));
console.log(`语料: ${corpus.length} 首, ${allLines.length} 句`);

// ───────────────────── 级一 + 级二共用: 频次统计 ─────────────────────
const charFreq = new Map(), bigramFreq = new Map();
let totalChars = 0;
for (const { text } of allLines) {
  for (let i = 0; i < text.length; i++) {
    charFreq.set(text[i], (charFreq.get(text[i]) || 0) + 1); totalChars++;
    if (i < text.length - 1) {
      const bg = text.slice(i, i + 2);
      bigramFreq.set(bg, (bigramFreq.get(bg) || 0) + 1);
    }
  }
}

// ───────────────────── 级一: 词典匹配 ─────────────────────
const wordFreq = w => w.length === 1 ? (charFreq.get(w) || 0) : (bigramFreq.get(w) || 0);
const entries = new Map(); // w -> {w, c, freq, mined}
for (const { w, c } of dict) {
  const f = wordFreq(w);
  if (f >= MIN_FREQ_DICT) entries.set(w, { w, c, freq: f, mined: false });
}
console.log(`级一词典命中: ${entries.size}/${dict.length}`);

// ───────────────────── 级二: Bigram + PMI 挖掘 ─────────────────────
const pmi = (bg, f) => {
  const pa = (charFreq.get(bg[0]) || 1) / totalChars;
  const pb = (charFreq.get(bg[1]) || 1) / totalChars;
  return Math.log2((f / totalChars) / (pa * pb));
};
// 用词典字建"字→类目"投票表，给挖掘词自动归类
const charCat = new Map();
for (const { w, c } of dict) for (const ch of w) {
  if (!charCat.has(ch)) charCat.set(ch, new Map());
  const m = charCat.get(ch); m.set(c, (m.get(c) || 0) + 1);
}
const guessCat = bg => {
  const votes = new Map();
  for (const ch of bg) charCat.get(ch)?.forEach((n, c) => votes.set(c, (votes.get(c) || 0) + n));
  if (!votes.size) return null;
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

let minedCount = 0;
for (const [bg, f] of bigramFreq) {
  if (f < MIN_FREQ_MINED || entries.has(bg) || STOP_WORDS.has(bg)) continue;
  if (STOP_CHARS.has(bg[0]) || STOP_CHARS.has(bg[1])) continue;
  if (!/^[\u4e00-\u9fff]+$/.test(bg)) continue; // 跳过含非汉字的组合
  if (pmi(bg, f) < PMI_THRESHOLD) continue;
  const c = guessCat(bg);
  if (!c) continue;               // 两字都不在词典字集内的，宁缺毋滥
  entries.set(bg, { w: bg, c, freq: f, mined: true });
  minedCount++;
}
console.log(`级二挖掘新增: ${minedCount}, 总计: ${entries.size}`);

// ───────────────────── 级三: 例句 + 共现 + 平仄 ─────────────────────
const words = [...entries.values()];
const wordSet = new Set(words.map(e => e.w));
// 单遍扫描: 每句命中哪些词
const hitLines = new Map();   // w -> [lineIdx]
const poemWords = new Map();  // poemIdx -> Set<w>
allLines.forEach((line, li) => {
  const found = new Set();
  for (let i = 0; i < line.text.length; i++) {
    if (wordSet.has(line.text[i])) found.add(line.text[i]);
    const bg = line.text.slice(i, i + 2);
    if (bg.length === 2 && wordSet.has(bg)) found.add(bg);
  }
  for (const w of found) {
    if (!hitLines.has(w)) hitLines.set(w, []);
    hitLines.get(w).push(li);
    if (!poemWords.has(line.poemIdx)) poemWords.set(line.poemIdx, new Set());
    poemWords.get(line.poemIdx).add(w);
  }
});
// 共现（诗级窗口）
const cooc = new Map();       // w -> Map<w2, count>
for (const ws of poemWords.values()) {
  const arr = [...ws];
  for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
    for (const [a, b] of [[arr[i], arr[j]], [arr[j], arr[i]]]) {
      if (!cooc.has(a)) cooc.set(a, new Map());
      cooc.get(a).set(b, (cooc.get(a).get(b) || 0) + 1);
    }
  }
}
// 组装
const output = words.map(e => {
  const lis = hitLines.get(e.w) || [];
  const samples = lis.map(li => allLines[li])
    .sort((a, b) => (FAMOUS.has(b.author) ? 1 : 0) - (FAMOUS.has(a.author) ? 1 : 0)
      || a.text.length - b.text.length)   // 名家优先，短句优先（更隽永）
    .filter((l, i, arr) => arr.findIndex(x => x.text === l.text) === i)  // 去重句
    .slice(0, MAX_SAMPLES)
    .map(l => ({ s: l.text, a: l.author }));
  const related = [...(cooc.get(e.w) || new Map()).entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, TOP_RELATED).map(([w]) => w);
  const tone = [...e.w].map(ch => toneMap[ch] || 'X').join('');
  return { w: e.w, c: e.c, f: e.freq, t: tone, r: related, s: samples, m: e.mined };
});

// ───────────────────── 分片输出 ─────────────────────
const outDir = path.join(__dirname, '../public/data/imagery');
fs.mkdirSync(outDir, { recursive: true });
const byCat = {};
for (const o of output) (byCat[o.c] ||= []).push(o);
const index = [];
for (const [c, arr] of Object.entries(byCat)) {
  arr.sort((a, b) => b.f - a.f);
  fs.writeFileSync(path.join(outDir, `${c}.json`), JSON.stringify(arr));
  index.push({ c, n: arr.length });
  console.log(`  ${c}: ${arr.length} 词`);
}
// 轻量索引: 词→类目+平仄+频次，供拾字囊搜索/筛选，不含例句
fs.writeFileSync(path.join(outDir, 'index.json'),
  JSON.stringify(output.map(({ w, c, f, t }) => ({ w, c, f, t }))));
console.log(`完成: ${output.length} 词`);

// 打印挖掘词前 200 个供人工审查
const minedWords = output.filter(o => o.m).sort((a, b) => b.f - a.f).slice(0, 200);
console.log(`\n── 挖掘词前 200（请人工审查，将混入的功能性组合补进 STOP_WORDS）──`);
minedWords.forEach((o, i) => {
  console.log(`  ${i + 1}. ${o.w} (${o.c}, 频次:${o.f})`);
});