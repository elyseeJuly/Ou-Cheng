const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8'));
const packageVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const xcodeProject = fs.readFileSync(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');

if (html.includes('/oucheng-app/') || /(?:src|href)="\/assets\//.test(html)) {
  throw new Error('iOS build contains web-only absolute asset paths.');
}
if (!html.includes('src="./assets/') || !html.includes('href="./assets/')) {
  throw new Error('iOS build assets are not relative to the Capacitor web root.');
}
if (manifest.start_url !== './' || manifest.scope !== './') {
  throw new Error(`iOS manifest scope mismatch: ${manifest.start_url} / ${manifest.scope}`);
}

const assetPaths = [...html.matchAll(/(?:src|href)="\.\/([^"?#]+)["?#]/g)].map(match => match[1]);
for (const assetPath of assetPaths) {
  if (!fs.existsSync(path.join(dist, assetPath))) {
    throw new Error(`Missing iOS build asset: ${assetPath}`);
  }
}

const marketingVersions = [...xcodeProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map(match => match[1]);
if (!marketingVersions.length || marketingVersions.some(version => version !== packageVersion)) {
  throw new Error(`iOS marketing version mismatch: package ${packageVersion}, Xcode ${marketingVersions.join(', ') || 'missing'}`);
}

console.log('Capacitor iOS relative-path verification passed.');
