/**
 * 偶成 App · 路由 × 断点 自动截图脚本
 *
 * 前置条件:
 *   1) 安装浏览器:  npx playwright install chromium
 *   2) 启动 dev server:  npm run dev -- --host 127.0.0.1 --port 4173
 *
 * 运行:
 *   node scripts/screenshot-routes.mjs
 *   (可选) SCREENSHOT_BASE_URL=http://127.0.0.1:4173 SCREENSHOT_CHANNEL=chrome node scripts/screenshot-routes.mjs
 *
 * 输出:
 *   screenshots/{name}-{width}.png       每张截图
 *   screenshots/screenshot-manifest.json 记录路由/断点/状态/错误
 *
 * 设计要点:
 *   - 用项目自身的 Suspense fallback 容器 `.route-loading` 作为"离开 loading 态"信号,
 *     确保截到的是已渲染内容而非加载占位。
 *   - 通过 addInitScript 在每次导航前注入 CSS,关闭 animation / transition / scroll-behavior,
 *     避免截到过渡中间帧。
 *   - 任意路由访问失败或渲染报错都会被标注进 manifest 并跳过,不会中断整体执行。
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import {
  assertOuchengPage,
  blockExternalRequests,
  DESIGN_AUDIT_BREAKPOINTS,
  DESIGN_AUDIT_ROUTES,
  getSourceMetadata,
} from './design-audit-common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'screenshots');

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4173';
const CHANNEL = process.env.SCREENSHOT_CHANNEL || undefined; // 例如 'chrome' 可改用系统 Chrome
const VIEWPORT_HEIGHT = 900;
const FULL_PAGE = false;

// 除初始路由外，再覆盖本轮实际改动涉及的弹窗、夜读嵌套日间预览、
// 词牌详情和经典阅读状态，避免只对空白初始页截图。
const SCENARIOS = [
  ...DESIGN_AUDIT_ROUTES,
  {
    path: '/',
    name: 'import-modal',
    setup: async (page) => {
      const trigger = page.getByRole('button', { name: '导入文稿', exact: true });
      if ((await trigger.count()) !== 1) throw new Error('导入文稿入口数量异常');
      await trigger.click();
      await page.getByRole('dialog', { name: '导入文稿', exact: true }).waitFor({ state: 'visible' });
    },
  },
  {
    path: '/',
    name: 'night-preview',
    setup: async (page) => {
      const toggle = page.locator('button.theme-toggle:visible');
      if ((await toggle.count()) !== 1) throw new Error('可见夜读切换按钮数量异常');
      await toggle.click();
      const previewFab = page.locator('button.preview-fab:visible');
      if ((await previewFab.count()) === 1) await previewFab.click();
      const canvas = page.locator('[data-theme="day"].preview-canvas');
      if ((await canvas.count()) !== 1) throw new Error('嵌套日间预览画布数量异常');
      const tokens = await canvas.evaluate((el) => {
        const styles = getComputedStyle(el);
        return {
          border: styles.getPropertyValue('--border').trim(),
          borderStrong: styles.getPropertyValue('--border-strong').trim(),
          borderSoft: styles.getPropertyValue('--border-soft').trim(),
        };
      });
      if (
        tokens.border !== '#E3DED7' ||
        tokens.borderStrong !== '#D7D2C8' ||
        tokens.borderSoft !== '#EDE8E0'
      ) {
        throw new Error(`嵌套日间预览边框 token 泄漏: ${JSON.stringify(tokens)}`);
      }
    },
  },
  {
    path: '/cipai',
    name: 'cipai-detail',
    setup: async (page) => {
      await page.waitForSelector('.cipai-slip', { state: 'visible' });
      const cards = page.locator('.cipai-slip');
      const count = await cards.count();
      if (count < 1) throw new Error('无可用词牌卡片');
      await cards.first().click();
      await page.locator('.cipai-detail-page').waitFor({ state: 'visible' });
    },
  },
  {
    path: '/classics',
    name: 'classic-reader',
    setup: async (page) => {
      const trigger = page.getByRole('button', { name: '经典赏读', exact: true });
      if ((await trigger.count()) !== 1) throw new Error('经典赏读入口数量异常');
      await trigger.click();
      await page.locator('.classic-reader-page').waitFor({ state: 'visible' });
    },
  },
];
const BREAKPOINTS = DESIGN_AUDIT_BREAKPOINTS;

// 截图前关闭动画/过渡效果,避免截到中间帧。
// addInitScript 在每次导航前执行;通过轮询 + DOMContentLoaded 双兜底,确保无论文档解析到哪一阶段都能注入;
// 幂等 guard 防止重复注入,且全程不触碰 React 管理的节点(只注入到 head / documentElement)。
const DISABLE_ANIMATION = `(() => {
  const css = '*,*::before,*::after{animation:none!important;animation-duration:0s!important;animation-delay:0s!important;transition:none!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important}';
  const apply = () => {
    if (document.querySelector('style[data-screenshot-no-anim]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-screenshot-no-anim', '');
    s.textContent = css;
    const target = document.head || document.documentElement;
    if (target) target.appendChild(s);
  };
  const schedule = window.requestAnimationFrame || ((fn) => window.setTimeout(fn, 16));
  const tick = () => {
    apply();
    if (!document.querySelector('style[data-screenshot-no-anim]')) schedule(tick);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  }
  tick();
})();`;

/**
 * 对单个 (route, width) 组合截图。
 * 返回 manifest 条目;失败仅标注,不抛错中断循环。
 */
async function capture(browser, scenario, width) {
  const fileName = `${scenario.name}-${width}.png`;
  const filePath = path.join(SCREENSHOTS_DIR, fileName);
  const entry = {
    route: scenario.path,
    name: scenario.name,
    width,
    file: fileName,
    status: 'success',
    error: null,
  };

  const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));

  try {
    await blockExternalRequests(page, BASE_URL);
    await page.addInitScript(DISABLE_ANIMATION);
    await page.goto(`${BASE_URL}/#${scenario.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // 等待资源/懒加载安静下来
    await page.waitForLoadState('networkidle', { timeout: 1_000 }).catch(() => {});
    entry.identity = await assertOuchengPage(page, scenario.path, width);

    // 等待离开 loading 态:项目 Suspense fallback 容器 .route-loading 会被卸载(detached)
    const loader = await page.$('.route-loading');
    if (loader) {
      const detached = await page
        .waitForSelector('.route-loading', { state: 'detached', timeout: 20000 })
        .then(() => true)
        .catch(() => false);
      if (!detached) {
        entry.status = 'error';
        entry.error = 'Suspense 加载占位未消失(组件加载超时或渲染失败)';
        return entry;
      }
    }

    // 捕获未处理的运行时异常
    if (pageErrors.length > 0) {
      entry.status = 'error';
      entry.error = `页面运行时未捕获异常: ${pageErrors.join(' | ')}`;
      return entry;
    }
    if (scenario.setup) await scenario.setup(page);
    if (pageErrors.length > 0) {
      entry.status = 'error';
      entry.error = `场景交互后未捕获异常: ${pageErrors.join(' | ')}`;
      return entry;
    }

    // 额外稳定等待,确保 React 完成最终提交与布局
    await page.waitForTimeout(600);
    await page.screenshot({ path: filePath, fullPage: FULL_PAGE });
  } catch (e) {
    entry.status = 'error';
    entry.error = `导航/截图异常: ${e.message}`;
  } finally {
    await page.close().catch(() => {});
  }

  return entry;
}

(async () => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const launchOptions = { headless: true };
  if (CHANNEL) launchOptions.channel = CHANNEL;
  const browser = await chromium.launch(launchOptions);

  const results = [];
  for (const scenario of SCENARIOS) {
    for (const width of BREAKPOINTS) {
      const entry = await capture(browser, scenario, width);
      results.push(entry);
      const tag = entry.status === 'success' ? 'OK ' : 'ERR';
      console.log(
        `[${tag}] ${scenario.name} (${scenario.path}) @ ${width}px → ${entry.file}` +
          (entry.error ? ` :: ${entry.error}` : ''),
      );
    }
  }

  await browser.close();

  const summary = {
    total: results.length,
    success: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error').length,
  };

  const manifest = {
    ...getSourceMetadata(PROJECT_ROOT),
    viewportHeight: VIEWPORT_HEIGHT,
    fullPage: FULL_PAGE,
    scenarios: SCENARIOS.map(({ path: route, name }) => ({ route, name })),
    breakpoints: BREAKPOINTS,
    screenshots: results,
    summary,
  };

  const manifestPath = path.join(SCREENSHOTS_DIR, 'screenshot-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\nManifest → ${manifestPath}`);
  console.log(
    `Summary: ${summary.success} succeeded, ${summary.failed} failed, ${summary.total} total`,
  );
  if (summary.failed > 0 || summary.success !== summary.total) process.exitCode = 1;
})().catch((e) => {
  console.error('Fatal error in screenshot runner:', e);
  process.exit(1);
});
