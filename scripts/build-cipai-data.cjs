const fs = require('fs');
const path = require('path');
const https = require('https');
const OpenCC = require('opencc-js');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'data/cipai/kanripo');
const outputPath = path.join(root, 'public/data/cipai.json');
const upstreamCommit = '27cad1682661123100cb73820f773ed6ecfdb808';
const converter = OpenCC.Converter({ from: 'hk', to: 'cn' });

const chineseNumber = value => {
  const digits = { 零: 0, 一: 1, 二: 2, 兩: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (/^十/.test(value)) return 10 + (digits[value[1]] || 0);
  if (value.includes('十')) return (digits[value[0]] || 0) * 10 + (digits[value[2]] || 0);
  return digits[value] || Number(value) || 0;
};

function download(url, target) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'oucheng-cipai-builder' } }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, target).then(resolve, reject);
      }
      if (response.statusCode !== 200) return reject(new Error(`${url}: HTTP ${response.statusCode}`));
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => { fs.writeFileSync(target, Buffer.concat(chunks)); resolve(); });
    }).on('error', reject);
  });
}

async function ensureSources() {
  fs.mkdirSync(sourceDir, { recursive: true });
  for (let index = 1; index <= 40; index++) {
    const file = `KR4j0086_${String(index).padStart(3, '0')}.txt`;
    const target = path.join(sourceDir, file);
    if (!fs.existsSync(target)) {
      await download(`https://raw.githubusercontent.com/kanripo/KR4j0086/${upstreamCommit}/${file}`, target);
    }
  }
}

function buildToneMap() {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'data/rhyme/Cilin_Rhyme.json'), 'utf8'));
  const map = new Map();
  Object.values(source).forEach(tones => Object.entries(tones).forEach(([tone, chars]) => {
    const value = tone.includes('平') ? 'P' : 'Z';
    chars.forEach(char => {
      const values = map.get(char) || new Set();
      values.add(value);
      map.set(char, values);
    });
  }));
  return map;
}

function cleanText(value) {
  return converter(value
    .replace(/<pb:[^>]+>/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[\s¶　]/g, '')
    .replace(/[，。！？；、,.!?;：:“”‘’《》〈〉]/g, ''));
}

function splitStanzas(patterns, meta) {
  if (!/雙調|双调/.test(meta)) return [patterns, []];
  const firstCount = meta.match(/前(?:段|片)([一二兩三四五六七八九十\d]+)句/);
  const count = firstCount ? chineseNumber(firstCount[1]) : Math.floor(patterns.length / 2);
  return [patterns.slice(0, count), patterns.slice(count)];
}

function parseSources() {
  const toneMap = buildToneMap();
  const variants = [];
  let currentName = '';
  let variantIndex = 0;

  for (let volume = 1; volume <= 40; volume++) {
    const file = `KR4j0086_${String(volume).padStart(3, '0')}.txt`;
    const lines = fs.readFileSync(path.join(sourceDir, file), 'utf8').split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const normalized = lines[index].replace(/<pb:[^>]+>/g, '').replace(/¶/g, '').trim();
      const match = normalized.match(/^(又一體|又一体|[\p{Script=Han}]{2,20})\(([^)]*(?:單調|雙調|三疊|四疊|单调|双调)[^)]*)\)\s*(.*)$/u);
      if (!match) continue;
      const [, heading, meta, authorRaw = '佚名'] = match;
      if (!/^又一[體体]$/.test(heading)) {
        currentName = converter(heading);
        variantIndex = 0;
      } else if (!currentName) continue;
      variantIndex += 1;

      const body = [];
      for (let cursor = index + 1; cursor < lines.length; cursor++) {
        const candidate = lines[cursor].replace(/<pb:[^>]+>/g, '').replace(/¶/g, '');
        const trimmedCandidate = candidate.trim();
        if ((trimmedCandidate.startsWith('(') || trimmedCandidate.startsWith('（'))
          && !/^\((韻|韵|叶|句|讀|读)\//u.test(trimmedCandidate)) break;
        const nextHeader = candidate.trim().match(/^(又一體|又一体|[\p{Script=Han}]{2,20})\([^)]*(?:單調|雙調|三疊|四疊|单调|双调)/u);
        if (nextHeader) break;
        body.push(candidate);
      }
      const joined = body.join('')
        .replace(/\((韻|韵|叶|句|讀|读)\/[^)]*\)/g, '$1')
        .replace(/\([^)]*\/(韻|韵|叶|句|讀|读)\)/g, '$1')
        .replace(/\((韻|韵|叶|句|讀|读)\)/g, '$1')
        .replace(/\([^)]*\)/g, '');
      const parts = [...joined.matchAll(/(.+?)(韻|韵|叶|句|讀|读)/gu)];
      if (!parts.length) continue;
      const sourceLines = parts.map(part => cleanText(part[1])).filter(Boolean);
      if (!sourceLines.length) continue;
      const patterns = sourceLines.map((line, lineIndex) => {
        const chars = Array.from(line).map(char => {
          const tones = toneMap.get(char) || toneMap.get(converter(char));
          return !tones || tones.size !== 1 ? 'X' : [...tones][0];
        });
        if (/[韻韵叶]/u.test(parts[lineIndex]?.[2] || '') && chars.length) chars[chars.length - 1] = 'R';
        return chars.join('');
      });
      const [upperPattern, lowerPattern] = splitStanzas(patterns, converter(meta));
      const charCount = sourceLines.reduce((sum, line) => sum + Array.from(line).length, 0);
      const sourceAuthor = converter(authorRaw.replace(/\([^)]*\)/g, '').replace(/[^\p{Script=Han}·]/gu, '')) || '佚名';
      variants.push({
        id: `qdc_${String(volume).padStart(2, '0')}_${String(variants.length + 1).padStart(4, '0')}`,
        name: currentName,
        aliases: [],
        charCount,
        category: charCount <= 58 ? 'xiao_ling' : charCount <= 90 ? 'zhong_diao' : 'chang_diao',
        upperPattern,
        ...(lowerPattern.length ? { lowerPattern } : {}),
        representative: sourceAuthor,
        variantLabel: variantIndex === 1 ? '正体' : `又一体 ${variantIndex - 1}`,
        isVariant: variantIndex > 1,
        sourceAuthor,
        sourceIncipit: sourceLines.join('').slice(0, 12),
        sourceText: sourceLines.join('\n'),
        sourceBook: '《御定词谱》（四库全书本）',
        sourceRef: `Kanripo KR4j0086 卷${volume}`,
        description: converter(meta),
      });
    }
  }
  return variants;
}

(async () => {
  await ensureSources();
  const variants = parseSources();
  const names = new Set(variants.map(item => item.name));
  if (names.size < 750 || variants.length < 2000) {
    throw new Error(`词谱解析数量异常：${names.size} 调 / ${variants.length} 体`);
  }
  fs.writeFileSync(outputPath, `${JSON.stringify(variants, null, 2)}\n`);
  console.log(`已生成 ${path.relative(root, outputPath)}：${names.size} 调 / ${variants.length} 体`);
})();
