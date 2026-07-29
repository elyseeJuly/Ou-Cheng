/**
 * 从语料库全量扫描汉字平仄，生成 char-tone.json
 * 用法: node scripts/extract-char-tone.cjs
 * 输出: data/char-tone.json
 */
const fs = require('fs');
const path = require('path');

// ── 平仄判断（简化：阴平阳平为平，上去入为仄）──
const commonPing = new Set(
  '平明风云星天江河山花春星阳晴空高深清闲香红黄蓝青方长同前头楼门庭园家心人年时今来归飞行' +
  '开歌诗书文词吟弹吹鸣闻听看观游留还连环回旋横斜垂飘摇浮沉藏存亡' +
  '寒凉温难安欢闲圆全泉源烟云霞光晖华辉容情愁思怀忧悲怜哀伤' +
  '千双三多无如谁何相随' +
  '轻浓疏疏依依幽悠' +
  '残微斜孤遥' +
  '梅兰松荷莲茶' +
  '鹂莺蝉猿鸡牛鹅' +
  '灯帘楼栏桥舟船' +
  '衣冠簪钗环' +
  '痕苔藤萝' +
  '声名功恩' +
  '魂神' +
  '音琴棋' +
  '田原' +
  '尘'
);

// 从诗词数据中提取所有出现的汉字
const poetry = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/poetry.json'), 'utf8'));
const charSet = new Set();

for (const p of poetry) {
  const text = (p.content || '').replace(/[，。、；？！,.!?；：\s\n\r]/g, '');
  for (const c of text) {
    if (/[\u4e00-\u9fff]/.test(c)) {
      charSet.add(c);
    }
  }
}

const toneMap = {};
for (const c of charSet) {
  toneMap[c] = commonPing.has(c) ? 'P' : 'Z';
}

const outPath = path.join(__dirname, '../data/char-tone.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(toneMap));
console.log(`char-tone.json: ${Object.keys(toneMap).length} 字符`);