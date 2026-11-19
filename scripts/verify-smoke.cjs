// ============================================================
// 偶成 (Ou Cheng) v1.0.0 — E2E Smoke 烟雾测试门禁
// ============================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting static smoke verification...');

const projectRoot = path.join(__dirname, '..');

// 1. Verify build output & assets existence
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  const indexHtml = path.join(distPath, 'index.html');
  assert(fs.existsSync(indexHtml), 'dist/index.html should exist after build');
  console.log('  ✓ Build artifacts validation passed');
} else {
  console.log('  ℹ dist directory not present yet, skipping dist check');
}

// 2. Verify static data integrity (poetry, cipai, charFreq)
const publicData = path.join(projectRoot, 'public', 'data');
const requiredData = ['poetry.json', 'cipai.json', 'charFreq.json', 'imagery.json'];

requiredData.forEach(file => {
  const fp = path.join(publicData, file);
  assert(fs.existsSync(fp), `Required data asset missing: ${file}`);
  const content = fs.readFileSync(fp, 'utf8');
  assert(content.length > 10, `Data asset ${file} is unexpectedly empty`);
  JSON.parse(content); // Validate valid JSON
});
console.log('  ✓ Static data JSON assets validation passed');

// 3. Verify core component exports & storage schema validator
const validatorPath = path.join(projectRoot, 'src', 'services', 'schemaValidator.ts');
assert(fs.existsSync(validatorPath), 'schemaValidator.ts should exist');
console.log('  ✓ Core schema validator file presence verified');

// 4. Verify release documentation
const requiredDocs = ['ARCHITECTURE.md', 'DOMAIN_RULES.md', 'DATA_SCHEMA.md', 'RELEASE_GATES.md'];
requiredDocs.forEach(doc => {
  const dp = path.join(projectRoot, 'docs', doc);
  assert(fs.existsSync(dp), `Required entry doc missing: ${doc}`);
});
console.log('  ✓ Architecture & AI entry documentation presence verified');

// 5. Guard the Context split against falling back to the broadcast-style aggregate hook.
const createConsumers = [
  'src/pages/Create/ModeToggle.tsx',
  'src/pages/Create/ActionBottomBar.tsx',
  'src/pages/Create/FreePanel.tsx',
  'src/pages/Create/ProPanel.tsx',
  'src/pages/Create/index.tsx',
  'src/components/creator/RhymeMirror.tsx',
];
createConsumers.forEach(file => {
  const source = fs.readFileSync(path.join(projectRoot, file), 'utf8');
  assert(!source.includes('useCreate('), `${file} must use granular Create contexts`);
});
console.log('  ✓ Granular Create Context boundary verified');

console.log('🎉 Static smoke verification passed.');
