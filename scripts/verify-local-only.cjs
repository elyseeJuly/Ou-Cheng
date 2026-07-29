const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  path.join(root, 'src'),
  path.join(root, 'vite.config.ts'),
  path.join(root, 'index.html'),
  path.join(root, 'README.md'),
  path.join(root, 'package.json'),
];
const forbidden = [
  /AIzaSy[A-Za-z0-9_\-]{35}/, // Hardcoded Google API keys
  /sk-[A-Za-z0-9]{32,}/, // Hardcoded OpenAI API keys or similar secrets
];

const files = [];
const collect = target => {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    files.push(target);
    return;
  }
  for (const name of fs.readdirSync(target)) {
    const child = path.join(target, name);
    const childStat = fs.statSync(child);
    if (childStat.isDirectory()) collect(child);
    else if (/\.(ts|tsx|js|jsx|json|md|html)$/.test(name) && !/\.test\./.test(name)) files.push(child);
  }
};

targets.forEach(collect);
const violations = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(content)) violations.push(`${path.relative(root, file)}: ${pattern}`);
  }
}

if (violations.length) {
  console.error(`Local-only boundary failed:\n${violations.join('\n')}`);
  process.exit(1);
}
console.log(`Local-only boundary passed (${files.length} product files scanned).`);
