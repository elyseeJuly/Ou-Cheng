const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/manifest.webmanifest'), 'utf8'));
const wrangler = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));

if (html.includes('/oucheng-app/')) {
  throw new Error('Cloudflare build still contains the obsolete GitHub Pages base path.');
}

const assetPaths = [
  ...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+\.(?:js|css))"/g),
].map(match => match[1]).filter(assetPath => !/^https?:\/\//.test(assetPath));

if (assetPaths.length === 0 || assetPaths.some(assetPath => !assetPath.startsWith('/assets/'))) {
  throw new Error(`Cloudflare assets must be rooted at /assets/: ${assetPaths.join(', ')}`);
}

if (manifest.start_url !== '/' || manifest.scope !== '/') {
  throw new Error(`Cloudflare manifest scope mismatch: ${manifest.start_url} / ${manifest.scope}`);
}

if (wrangler.build?.command !== 'npm run build') {
  throw new Error('Wrangler must build the Vite application before direct deployment.');
}

if (wrangler.assets?.directory !== './dist' || wrangler.assets?.not_found_handling !== 'single-page-application') {
  throw new Error('Wrangler static assets must serve ./dist with SPA fallback.');
}

for (const relativePath of ['data/cipai.json', ...manifest.icons.map(icon => icon.src)]) {
  if (!fs.existsSync(path.join(root, 'dist', relativePath))) {
    throw new Error(`Missing Cloudflare asset: ${relativePath}`);
  }
}

console.log('Cloudflare Workers root-path verification passed.');
