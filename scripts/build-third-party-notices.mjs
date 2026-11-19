// Regenerate the complete license texts shipped with the app after dependencies change.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const sections = [];
const visited = new Set();

function packageDirectory(name, from) {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    if (dir === path.dirname(dir)) throw new Error(`Missing dependency: ${name}`);
  }
}

function includePackage(name, from = root) {
  const directory = packageDirectory(name, from);
  if (visited.has(directory)) return;
  visited.add(directory);
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const licenses = fs.readdirSync(directory)
    .filter(filename => /^(license|licence|copying)([.\-_]|$)/i.test(filename))
    .filter(filename => fs.statSync(path.join(directory, filename)).isFile());
  if (!licenses.length) throw new Error(`Missing license text: ${pkg.name}@${pkg.version}`);
  sections.push(`${pkg.name} ${pkg.version} (${pkg.license || 'see license below'})\n\n${licenses.map(filename => fs.readFileSync(path.join(directory, filename), 'utf8').trim()).join('\n\n')}`);
  for (const dependency of Object.keys(pkg.dependencies || {}).sort()) includePackage(dependency, directory);
}

for (const name of Object.keys(project.dependencies).sort()) includePackage(name);
// OpenCC is used by the data build; workbox-window supplies the PWA update runtime.
includePackage('opencc-js');
includePackage('workbox-window');

const localLicenses = [
  ['couyun', 'data/cipai/LICENSE.couyun'],
  ['chinese_word_rhyme', 'data/rhyme/LICENSE.chinese_word_rhyme'],
  ['chinese-poetry', 'docs/data/licenses/chinese-poetry-MIT.txt'],
  ['Werneror/Poetry', 'docs/data/licenses/Werneror-Poetry-MIT.txt'],
  ['open-chinese/poetry-collection', 'docs/data/licenses/open-chinese-poetry-collection-MIT.txt'],
  ['LXGW WenKai (imagery cloud font)', 'src/assets/fonts/LXGWWenKai-OFL.txt'],
  ['Noto Serif SC (bundled in iOS)', 'public/licenses/NotoSerifSC-OFL.txt'],
  ['Ma Shan Zheng (bundled in iOS)', 'public/licenses/MaShanZheng-OFL.txt'],
  ['LXGW WenKai Lite (bundled in iOS)', 'public/licenses/LXGWWenKaiLite-OFL.txt'],
];
for (const [name, filename] of localLicenses) {
  sections.push(`${name}\nSource: ${filename}\n\n${fs.readFileSync(path.join(root, filename), 'utf8').trim()}`);
}

const content = `偶成 ${project.version} — Third-party licenses\n\nThis file includes complete license and copyright notices for the declared runtime dependencies, data sources and fonts. Some dependencies are used only by the native or web distribution.\n\n${sections.join('\n\n' + '='.repeat(72) + '\n\n')}\n`;
// Keep the app's lazy raw import and the publicly hostable copy byte-for-byte identical.
for (const filename of ['src/assets/licenses/THIRD_PARTY_LICENSES.txt', 'public/licenses/THIRD_PARTY_LICENSES.txt']) {
  const output = path.join(root, filename);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content);
}
console.log(`Bundled ${sections.length} third-party license sections.`);
