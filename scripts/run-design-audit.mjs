import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VITE_BIN = path.join(PROJECT_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const HOST = '127.0.0.1';

async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, HOST, resolve);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  await new Promise((resolve) => server.close(resolve));
  if (!port) throw new Error('无法分配本地设计审计端口');
  return port;
}

async function waitForPreview(baseUrl, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`预览服务器提前退出: ${child.exitCode}`);
    try {
      const response = await fetch(baseUrl);
      const html = await response.text();
      if (response.ok && html.includes('<title>偶成 Ou Cheng')) return;
    } catch {
      // 预览服务器仍在启动。
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('等待偶成生产预览超时');
}

async function runScript(script, env) {
  const child = spawn(process.execPath, [path.join(PROJECT_ROOT, 'scripts', script)], {
    cwd: PROJECT_ROOT,
    env,
    stdio: 'inherit',
  });
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (exitCode !== 0) throw new Error(`${script} 失败: exit ${exitCode}`);
}

const port = await reservePort();
const baseUrl = `http://${HOST}:${port}`;
const auditEnv = {
  ...process.env,
  SCREENSHOT_BASE_URL: baseUrl,
  SCREENSHOT_CHANNEL:
    process.env.SCREENSHOT_CHANNEL || (process.env.CI ? 'chrome' : ''),
};
const preview = spawn(
  process.execPath,
  [VITE_BIN, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
  {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: ['ignore', 'inherit', 'inherit'],
  },
);

try {
  await waitForPreview(baseUrl, preview);
  await runScript('screenshot-routes.mjs', auditEnv);
  await runScript('color-audit.mjs', auditEnv);
  await runScript('radius-audit.mjs', auditEnv);
} finally {
  if (preview.exitCode === null) {
    preview.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => preview.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]);
  }
}
