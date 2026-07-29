// ============================================================
// 偶成 v5.0 — 韵字频率预计算脚本
// 扫描 poetry.json 统计每字出现频次，生成 charFreq.json
// 用于 getGroupChars 按诗词使用频率排序同部字
// ============================================================
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../public/data');
const poetryPath = path.join(dataDir, 'poetry.json');
const freqPath = path.join(dataDir, 'charFreq.json');
const sourceFreqPath = path.join(__dirname, '../src/data/charFreq.json');

console.log('═══ 韵字频率统计 ═══');
console.log('Loading poetry.json...');
const poetryData = JSON.parse(fs.readFileSync(poetryPath, 'utf8'));
console.log(`Loaded ${poetryData.length} poems.`);

// 统计每个汉字在诗词正文中的出现次数
const charFreq = {};
let totalChars = 0;

for (const poem of poetryData) {
  const text = (poem.content || '');
  for (const c of text) {
    // 只统计汉字（CJK Unified Ideographs）
    if (/^[\u4e00-\u9fff]$/.test(c)) {
      charFreq[c] = (charFreq[c] || 0) + 1;
      totalChars++;
    }
  }
}

// 按频率降序排列
const sorted = Object.entries(charFreq)
  .sort(([, a], [, b]) => b - a)
  .reduce((acc, [char, count]) => {
    acc[char] = count;
    return acc;
  }, {});

fs.writeFileSync(freqPath, JSON.stringify(sorted, null, 2));
fs.mkdirSync(path.dirname(sourceFreqPath), { recursive: true });
fs.writeFileSync(sourceFreqPath, JSON.stringify(sorted, null, 2));
console.log(`\n完成! charFreq.json: ${Object.keys(sorted).length} 个汉字, ${totalChars} 总字数`);
console.log(`Top 20: ${Object.entries(sorted).slice(0, 20).map(([c, n]) => `${c}(${n})`).join(' ')}`);
