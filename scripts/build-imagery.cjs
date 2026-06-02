const fs = require('fs');
const path = require('path');

const SEED_WORDS = [
  "明月", "春风", "落花", "东风", "孤舟", "相思", "黄叶", "江水", "白鹭", "残阳",
  "古道", "芳草", "霜冷", "寒鸦", "烟雨", "离愁", "长亭", "梅花", "西楼", "斜阳",
  "长安", "洛阳", "江南", "塞外", "大漠", "孤城", "杨柳", "桃花", "菊花", "莲花",
  "梧桐", "芭蕉", "杜鹃", "鸿雁", "燕子", "蝴蝶", "鸳鸯", "画阁", "珠帘", "栏杆",
  "画舫", "琵琶", "羌笛", "瑶琴", "樽前", "浊酒", "清酒", "绿蚁", "青梅", "竹马",
  "故人", "知己", "天涯", "海角", "关山", "关河", "烽火", "铁马", "冰河", "楼兰",
  "玉关", "阳关", "渭城", "灞桥", "楚江", "湘江", "洞庭", "庐山", "泰山", "峨眉",
  "巫山", "沧海", "蓬莱", "瑶台", "广寒", "桂树", "丹桂", "玉兔", "婵娟", "银河",
  "北斗", "南山", "东篱", "西湖", "寒山", "枫桥", "姑苏", "金陵", "秦淮", "乌衣",
  "朱雀", "玉楼", "琼楼", "画堂", "茅庐", "柴门", "蓬门", "孤村", "荒村", "古木",
  "苍松", "翠柏", "修竹", "幽兰", "芳菲", "芳华", "青春", "白发", "红颜", "青丝",
  "皓首", "暮年", "垂髫", "少年", "英雄", "美人", "佳人", "倾国", "红豆", "丁香",
  "芙蓉", "菡萏", "水仙", "牡丹", "海棠", "杏花", "梨花", "李花", "杨花", "柳絮",
  "浮萍", "飞絮", "落红", "残红", "香尘", "晓风", "残月", "晓星", "晨星", "繁星",
  "流星", "彩霞", "朝霞", "晚霞", "暮云", "愁云", "愁思", "哀怨", "凄凉", "寂寥",
  "萧瑟", "萧条", "凄清", "孤寂", "清冷", "寒冷", "和煦", "严寒", "冰雪", "风雪",
  "风雨", "雷电", "霹雳", "狂风", "骤雨", "微风", "细雨", "和风", "暖风", "南风",
  "北风", "西风", "秋风", "春雨", "秋雨", "夜雨", "阵雨", "梅雨", "桂花", "屠苏"
];

const dataDir = path.join(__dirname, '../public/data');
const poetryPath = path.join(dataDir, 'poetry.json');
const imageryPath = path.join(dataDir, 'imagery.json');

console.log("Loading poetry.json...");
const poetryData = JSON.parse(fs.readFileSync(poetryPath, 'utf8'));

console.log(`Loaded ${poetryData.length} poems. Processing frequencies and co-occurrences...`);

// Mapping word -> { count, poems: [{id/title}], cooc: { word: count } }
const wordStats = {};

SEED_WORDS.forEach(word => {
  wordStats[word] = {
    count: 0,
    samplePoems: [],
    dynastyCounts: {},
    cooc: {}
  };
});

poetryData.forEach(poem => {
  const content = poem.content || '';
  const title = poem.title || '';
  const text = title + content;
  
  // Find words in this poem
  const wordsInPoem = [];
  SEED_WORDS.forEach(word => {
    if (text.includes(word)) {
      wordsInPoem.push(word);
    }
  });

  // Update stats
  wordsInPoem.forEach(word => {
    const stats = wordStats[word];
    stats.count++;
    
    // Sample poems (store up to 5)
    if (stats.samplePoems.length < 5) {
      stats.samplePoems.push(poem.title);
    }

    // Dynasty
    if (poem.dynasty) {
      stats.dynastyCounts[poem.dynasty] = (stats.dynastyCounts[poem.dynasty] || 0) + 1;
    }

    // Co-occurrence
    wordsInPoem.forEach(otherWord => {
      if (word !== otherWord) {
        stats.cooc[otherWord] = (stats.cooc[otherWord] || 0) + 1;
      }
    });
  });
});

console.log("Formatting results...");

const results = [];

Object.keys(wordStats).forEach(word => {
  const stats = wordStats[word];
  if (stats.count === 0) return;

  // Determine main dynasty
  let mainDynasty = '';
  let maxDynastyCount = 0;
  Object.entries(stats.dynastyCounts).forEach(([dyn, count]) => {
    if (count > maxDynastyCount) {
      maxDynastyCount = count;
      mainDynasty = dyn;
    }
  });

  // Convert dynasty strings to English short codes if needed, or keep as is.
  // The original imagery.json used 'tang', 'song'. We will just use the string we got,
  // since library filtering might use it, or we can map it.
  let mappedDynasty = 'tang';
  if (mainDynasty.includes('宋')) mappedDynasty = 'song';
  else if (mainDynasty.includes('唐')) mappedDynasty = 'tang';
  else if (mainDynasty.includes('元')) mappedDynasty = 'yuan';
  else if (mainDynasty.includes('明')) mappedDynasty = 'ming';
  else if (mainDynasty.includes('清')) mappedDynasty = 'qing';

  // Format co-occurrences
  const coocEntries = Object.entries(stats.cooc);
  coocEntries.sort((a, b) => b[1] - a[1]);
  
  // Take top 8 related words
  const topCooc = coocEntries.slice(0, 8);
  const maxCooc = topCooc.length > 0 ? topCooc[0][1] : 1;
  
  const relatedWords = topCooc.map(([rw, c]) => ({
    word: rw,
    strength: parseFloat((c / maxCooc).toFixed(2)) // normalize strength 0-1 based on max cooc
  }));

  results.push({
    word,
    frequency: stats.count,
    dynasty: mappedDynasty,
    samplePoems: stats.samplePoems,
    relatedWords
  });
});

// Sort by frequency descending
results.sort((a, b) => b.frequency - a.frequency);

fs.writeFileSync(imageryPath, JSON.stringify(results, null, 2));
console.log(`Generated imagery.json with ${results.length} imagery items.`);
