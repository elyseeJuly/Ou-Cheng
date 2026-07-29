import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const APP_TITLE_PREFIX = '偶成 Ou Cheng';
export const APP_NAME = '偶成';
export const DESIGN_AUDIT_ROUTES = [
  { path: '/', name: 'home' },
  { path: '/works', name: 'works' },
  { path: '/classics', name: 'classics' },
  { path: '/settings', name: 'settings' },
  { path: '/cipai', name: 'cipai' },
];
export const DESIGN_AUDIT_BREAKPOINTS = [375, 768, 1440];

export async function assertOuchengPage(page, routePath, width) {
  const identity = await page.evaluate(() => ({
    title: document.title,
    applicationName:
      document.querySelector('meta[name="application-name"]')?.getAttribute('content') || '',
    rootPresent: Boolean(document.getElementById('root')),
  }));

  if (
    !identity.title.startsWith(APP_TITLE_PREFIX) ||
    identity.applicationName !== APP_NAME ||
    !identity.rootPresent
  ) {
    throw new Error(
      `页面身份校验失败 ${routePath}@${width}: ` +
        `title="${identity.title}", application-name="${identity.applicationName}", root=${identity.rootPresent}`,
    );
  }

  return identity;
}

export async function blockExternalRequests(page, baseUrl) {
  const expectedOrigin = new URL(baseUrl).origin;
  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin !== expectedOrigin) {
      await route.abort();
      return;
    }
    await route.continue();
  });
}

export function getSourceMetadata(projectRoot) {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

  let sourceCommit = 'unknown';
  let sourceDirty = null;
  try {
    sourceCommit = git('rev-parse', 'HEAD');
    sourceDirty = git('status', '--short').length > 0;
  } catch {
    // 审计脚本也允许在不含 Git 元数据的源码包中运行。
  }

  return {
    sourceCommit,
    sourceDirty,
    baseUrl: process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4173',
    generatedAt: new Date().toISOString(),
    projectRoot: path.basename(projectRoot),
  };
}
