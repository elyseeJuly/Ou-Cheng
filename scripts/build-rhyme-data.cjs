const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'data/rhyme');
const outputPath = path.join(root, 'src/engine/rhymeGroupData.ts');

const readJson = name => JSON.parse(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
const unique = chars => [...new Set(chars.filter(char => typeof char === 'string' && char.length > 0))];
const pad = value => String(value).padStart(2, '0');

const pingShuiSource = readJson('Pingshui_Rhyme.json');
const ciLinSource = readJson('Cilin_Rhyme.json');
const xinYunSource = readJson('Xinyun_Rhyme.json');

// 上游提交 ff0e9c1 缺“上声三讲”；据《平水韵》原典补齐。
const pingShuiSections = Object.entries(pingShuiSource).map(([section, sourceGroups]) => {
  const groups = { ...sourceGroups };
  if (section === '上声部' && !groups['三讲']) {
    const entries = Object.entries(groups);
    entries.splice(2, 0, ['三讲', ['讲', '港', '棒', '蚌', '项', '缿', '玤', '傋', '耩']]);
    return [section, entries];
  }
  return [section, Object.entries(groups)];
});

const pingShuiGroups = pingShuiSections.flatMap(([, groups]) => groups).map(([name, chars], index) => ({
  id: `ps_${pad(index + 1)}`,
  name: name.replace(/^入声/, ''),
  chars: unique(chars).join(' '),
}));

const ciLinGroups = Object.entries(ciLinSource).map(([name, tones], index) => ({
  id: `cl_${pad(index + 1)}`,
  name,
  chars: unique(Object.values(tones).flat()).join(' '),
}));

const xinYunGroups = Object.entries(xinYunSource).map(([name, tones], index) => ({
  id: `xy_${pad(index + 1)}`,
  name,
  chars: unique(Object.values(tones).flat()).join(' '),
}));

const buildCharToToneMap = entries => {
  const map = {};
  entries.forEach(([toneName, chars]) => {
    const tone = /平/.test(toneName) ? 'P' : 'Z';
    unique(chars).forEach(char => {
      const tones = map[char] ?? (map[char] = []);
      if (!tones.includes(tone)) tones.push(tone);
    });
  });
  return map;
};

const charToTones = {
  ping_shui: buildCharToToneMap(
    pingShuiSections.flatMap(([section, groups]) =>
      groups.map(([, chars]) => [section, chars])
    )
  ),
  ci_lin: buildCharToToneMap(
    Object.values(ciLinSource).flatMap(tones => Object.entries(tones))
  ),
  xin_yun: buildCharToToneMap(
    Object.values(xinYunSource).flatMap(tones => Object.entries(tones))
  ),
};
const toneChars = Object.fromEntries(Object.entries(charToTones).map(([book, map]) => [book, {
  P: Object.entries(map).filter(([, tones]) => tones.includes('P')).map(([char]) => char).join(' '),
  Z: Object.entries(map).filter(([, tones]) => tones.includes('Z')).map(([char]) => char).join(' '),
}]));

const expectedCounts = { ping_shui: 106, ci_lin: 19, xin_yun: 14 };
const books = { ping_shui: pingShuiGroups, ci_lin: ciLinGroups, xin_yun: xinYunGroups };
for (const [book, groups] of Object.entries(books)) {
  if (groups.length !== expectedCounts[book]) {
    throw new Error(`${book} 韵部数量异常：期望 ${expectedCounts[book]}，实际 ${groups.length}`);
  }
  for (const group of groups) {
    if (!group.chars) throw new Error(`${book}/${group.name} 没有韵字`);
  }
}

const serialize = value => JSON.stringify(value, null, 2)
  .replace(/"id":/g, 'id:')
  .replace(/"name":/g, 'name:')
  .replace(/"chars":/g, 'chars:');

const output = `// 此文件由 scripts/build-rhyme-data.cjs 自动生成，请勿手工编辑。\n` +
`// 来源：charlesix59/chinese_word_rhyme@ff0e9c13fb037c43e0eaa5dc929c0fe4fa2ffb18（MIT）\n` +
`// “上声三讲”依据维基文库《平水韵》补齐（CC BY-SA 4.0）。\n\n` +
`import { RhymeBook } from '../types';\n\n` +
`export interface RhymeGroupEntry {\n  id: string;\n  name: string;\n  chars: string;\n}\n\n` +
`const PING_SHUI_GROUPS: RhymeGroupEntry[] = ${serialize(pingShuiGroups)};\n\n` +
`const CI_LIN_GROUPS: RhymeGroupEntry[] = ${serialize(ciLinGroups)};\n\n` +
`const XIN_YUN_GROUPS: RhymeGroupEntry[] = ${serialize(xinYunGroups)};\n\n` +
`export const RHYME_GROUPS: Record<RhymeBook, RhymeGroupEntry[]> = {\n` +
`  ping_shui: PING_SHUI_GROUPS,\n  ci_lin: CI_LIN_GROUPS,\n  xin_yun: XIN_YUN_GROUPS,\n};\n\n` +
`export type CharToRhymeMap = Record<string, string[]>;\n\n` +
`function buildCharToGroupMap(groups: RhymeGroupEntry[]): CharToRhymeMap {\n` +
`  const map: CharToRhymeMap = {};\n` +
`  groups.forEach(group => {\n` +
`    group.chars.split(' ').filter(Boolean).forEach(char => {\n` +
`      const ids = map[char] ?? (map[char] = []);\n` +
`      if (!ids.includes(group.id)) ids.push(group.id);\n` +
`    });\n` +
`  });\n` +
`  return map;\n` +
`}\n\n` +
`export const CHAR_TO_GROUPS: Record<RhymeBook, CharToRhymeMap> = {\n` +
`  ping_shui: buildCharToGroupMap(PING_SHUI_GROUPS),\n` +
`  ci_lin: buildCharToGroupMap(CI_LIN_GROUPS),\n` +
`  xin_yun: buildCharToGroupMap(XIN_YUN_GROUPS),\n};\n\n` +
`const RHYME_TONE_CHARS: Record<RhymeBook, Record<'P' | 'Z', string>> = ${serialize(toneChars)};\n\n` +
`function buildCharToToneMap(tones: Record<'P' | 'Z', string>): Record<string, Array<'P' | 'Z'>> {\n` +
`  const map: Record<string, Array<'P' | 'Z'>> = {};\n` +
`  (['P', 'Z'] as const).forEach(tone => {\n` +
`    tones[tone].split(' ').filter(Boolean).forEach(char => {\n` +
`      const values = map[char] ?? (map[char] = []);\n` +
`      if (!values.includes(tone)) values.push(tone);\n` +
`    });\n` +
`  });\n` +
`  return map;\n` +
`}\n\n` +
`export const CHAR_TO_TONES: Record<RhymeBook, Record<string, Array<'P' | 'Z'>>> = {\n` +
`  ping_shui: buildCharToToneMap(RHYME_TONE_CHARS.ping_shui),\n` +
`  ci_lin: buildCharToToneMap(RHYME_TONE_CHARS.ci_lin),\n` +
`  xin_yun: buildCharToToneMap(RHYME_TONE_CHARS.xin_yun),\n` +
`};\n`;

fs.writeFileSync(outputPath, output);

const stats = Object.fromEntries(Object.entries(books).map(([book, groups]) => [book, {
  groups: groups.length,
  entries: groups.reduce((sum, group) => sum + group.chars.split(' ').length, 0),
}]));
console.log(`已生成 ${path.relative(root, outputPath)}`);
console.log(JSON.stringify(stats, null, 2));
