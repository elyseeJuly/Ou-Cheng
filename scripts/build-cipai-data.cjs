const fs = require('fs');
// 体名用汉字序数（格二、格十一），界面不出现阿拉伯数字
const toCnNumeral = n => {
  const d = '〇一二三四五六七八九';
  if (n < 10) return d[n];
  if (n < 20) return '十' + (n % 10 ? d[n % 10] : '');
  return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : '');
};
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'cipai', 'couyun-snapshot.json');
const outputPath = path.join(root, 'public', 'data', 'cipai.json');

const digits = { 零: 0, 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function chineseNumber(value) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  if (value === '十') return 10;
  if (value.includes('十')) {
    const [before, after] = value.split('十');
    return (before ? digits[before] : 1) * 10 + (after ? digits[after] : 0);
  }
  return digits[value] || 0;
}

function splitParts(value) {
  const parts = [];
  const matcher = /([中平仄]+)(?:换|換)?(?:平|仄)?(韵|韻|叶|疊|叠|句|读|讀)/gu;
  for (const match of value.matchAll(matcher)) {
    const marker = match[2];
    const tones = Array.from(match[1]).map(tone => tone === '中' ? 'X' : tone === '平' ? 'P' : 'Z');
    const isRhyme = !/[句读讀]/u.test(marker);
    parts.push({ tones, isRhyme });
  }
  return parts;
}

function splitStanzas(patterns, tuneType, description) {
  const count = /四[叠疊]/u.test(tuneType) ? 4 : /三[叠疊]/u.test(tuneType) ? 3 : /双调|雙調/u.test(tuneType) ? 2 : 1;
  if (count === 1) return [patterns];
  const normalized = description.replace(/[，、/]/g, '');
  const explicit = [];
  for (const label of ['前段', '后段', '後段', '第一段', '第二段', '第三段', '第四段']) {
    const match = normalized.match(new RegExp(`${label}([一二三四五六七八九十两兩\\d]+)句`));
    if (match) explicit.push(chineseNumber(match[1]));
  }
  if (explicit.length === count && explicit.reduce((sum, value) => sum + value, 0) === patterns.length) {
    let cursor = 0;
    return explicit.map(size => patterns.slice(cursor, cursor += size));
  }
  const each = normalized.match(/前后段各([一二三四五六七八九十两兩\d]+)句/u);
  if (count === 2 && each && chineseNumber(each[1]) * 2 === patterns.length) {
    const size = chineseNumber(each[1]);
    return [patterns.slice(0, size), patterns.slice(size)];
  }
  if (patterns.length % count === 0) {
    const size = patterns.length / count;
    return Array.from({ length: count }, (_, index) => patterns.slice(index * size, (index + 1) * size));
  }
  return [patterns];
}

function sourceClauses(form) {
  return (form.ci_sep || []).flatMap(group => group.split(/　+/u)).map(line => line.trim()).filter(Boolean);
}

function lineRhymeGroups(form, patterns) {
  const byPosition = new Map();
  Object.entries(form.yun_classify || {}).forEach(([group, positions]) => {
    positions.forEach(position => byPosition.set(Math.abs(position), group));
  });
  let cursor = 0;
  return patterns.map(pattern => {
    cursor += Array.from(pattern).length;
    return pattern.endsWith('R') ? (byPosition.get(cursor - 1) ?? null) : null;
  });
}

function build() {
  if (!fs.existsSync(sourcePath)) throw new Error(`缺少词谱快照：${sourcePath}`);
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const variants = [];
  const rejected = [];

  source.entries.forEach(entry => entry.forms.forEach((form, formIndex) => {
    const clauses = sourceClauses(form);
    const rawParts = (form.ge_lyu_sep || []).flatMap(splitParts);
    const parsed = rawParts.map((item, index) => {
      const length = Array.from(clauses[index] || '').length;
      const tones = item.tones.slice(0, length);
      const rhymeTone = item.isRhyme ? tones[tones.length - 1] : null;
      if (item.isRhyme && tones.length) tones[tones.length - 1] = 'R';
      return { pattern: tones.join(''), rhymeTone };
    });
    const patterns = parsed.map(item => item.pattern);
    const charCount = Array.from(form.ge_lyu_str || '').length;
    const patternCount = patterns.reduce((sum, pattern) => sum + Array.from(pattern).length, 0);
    const textCount = clauses.reduce((sum, line) => sum + Array.from(line).length, 0);
    if (!patterns.length || rawParts.length !== clauses.length || rawParts.some((part, index) => part.tones.length < Array.from(clauses[index] || '').length) || patternCount !== charCount || textCount !== charCount) {
      rejected.push({ name: entry.names[0], formIndex, patterns: patterns.length, clauses: clauses.length, patternCount, textCount, charCount });
      return;
    }
    const stanzas = splitStanzas(patterns, entry.tuneType, form.description || '');
    variants.push({
      id: `qdc_${String(entry.idx).padStart(3, '0')}_${String(formIndex + 1).padStart(2, '0')}`,
      name: entry.names[0],
      aliases: entry.names.slice(1),
      charCount,
      category: charCount <= 58 ? 'xiao_ling' : charCount <= 90 ? 'zhong_diao' : 'chang_diao',
      upperPattern: stanzas[0],
      ...(stanzas.length > 1 ? { lowerPattern: stanzas.slice(1).flat(), stanzas } : {}),
      rhymeGroups: lineRhymeGroups(form, patterns),
      rhymeTones: parsed.map(item => item.rhymeTone),
      stanzaCount: stanzas.length,
      representative: form.author || '佚名',
      variantLabel: formIndex === 0 ? '正体' : `格${toCnNumeral(formIndex + 1)}`,
      isVariant: formIndex > 0,
      sourceAuthor: form.author || '佚名',
      sourceIncipit: clauses.join('').slice(0, 12),
      sourceText: clauses.join('\n'),
      sourceBook: '《钦定词谱》结构化谱式',
      sourceRef: `couyun ${source.upstream.commit.slice(0, 12)} / cipai_${entry.idx}`,
      description: form.description || '',
    });
  }));

  const names = new Set(variants.map(item => item.name));
  if (names.size < 800 || variants.length < 2200) {
    throw new Error(`词谱解析数量异常：${names.size} 调 / ${variants.length} 体；拒绝 ${rejected.length} 体`);
  }
  const required = new Map([
    ['菩萨蛮', { count: 44, lines: 8 }],
    ['如梦令', { count: 33, lines: 7 }],
    ['水调歌头', { count: 95, lines: 19 }],
    ['忆江南', { count: 27, lines: 5 }],
  ]);
  required.forEach((expected, name) => {
    const item = variants.find(variant => variant.name === name && variant.charCount === expected.count);
    const lines = item ? item.upperPattern.length + (item.lowerPattern?.length || 0) : 0;
    if (!item || lines !== expected.lines) throw new Error(`${name} 基准谱式异常：${item?.charCount || 0} 字 / ${lines} 句`);
  });
  fs.writeFileSync(outputPath, `${JSON.stringify(variants, null, 2)}\n`);
  console.log(`已生成 ${path.relative(root, outputPath)}：${names.size} 调 / ${variants.length} 体；拒绝 ${rejected.length} 个结构不自洽体`);
}

build();
