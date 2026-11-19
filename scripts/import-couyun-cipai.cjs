const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..');
const checkout = path.resolve(process.argv[2] || '');
const dataRoot = path.join(checkout, 'couyun', 'ci_pu');
const indexPath = path.join(dataRoot, 'ci_index.json');
const listDir = path.join(dataRoot, 'ci_list');
const originDir = path.join(dataRoot, 'ci_origin');
const outputPath = path.join(root, 'data', 'cipai', 'couyun-snapshot.json');

if (!process.argv[2] || !fs.existsSync(indexPath)) {
  throw new Error('用法：node scripts/import-couyun-cipai.cjs /path/to/couyun-checkout');
}

const commit = childProcess.execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

function readVariantMetadata(idx, expectedCount) {
  const originPath = path.join(originDir, `cipai_${idx}.txt`);
  if (!fs.existsSync(originPath)) return Array.from({ length: expectedCount }, () => ({}));
  const blocks = fs.readFileSync(originPath, 'utf8')
    .split(/\r?\n\s*\r?\n+/)
    .map(block => block.trim())
    .filter(Boolean);
  return Array.from({ length: expectedCount }, (_, formIndex) => {
    const lines = (blocks[formIndex] || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return { description: lines[1] || '', author: lines[2] || '佚名' };
  });
}

const entries = index.map(item => {
  const formsPath = path.join(listDir, `cipai_${item.idx}.json`);
  if (!fs.existsSync(formsPath)) throw new Error(`缺少钦定词谱结构：${formsPath}`);
  const forms = JSON.parse(fs.readFileSync(formsPath, 'utf8'));
  const metadata = readVariantMetadata(item.idx, forms.length);
  return {
    idx: item.idx,
    names: item.names,
    namesTrad: item.names_trad,
    tuneType: item.type?.[0] || '',
    forms: forms.map((form, formIndex) => ({ ...form, ...metadata[formIndex] })),
  };
});

const snapshot = {
  upstream: {
    repository: 'https://github.com/hulbji/couyun',
    commit,
    license: 'MIT',
    corpus: '钦定词谱结构化数据',
  },
  entries,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshot)}\n`);
const formCount = entries.reduce((sum, entry) => sum + entry.forms.length, 0);
console.log(`已导入 ${entries.length} 调 / ${formCount} 体：${path.relative(root, outputPath)}`);
