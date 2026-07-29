/**
 * 偶成 App · 圆角(border-radius)实测脚本
 *
 * 方法:用 Playwright 在真实渲染页面上用 getComputedStyle 读取每个按钮/输入框/
 *       带边框卡片的"计算后" border-radius(已含 !important 覆盖与内联样式的最终生效值),
 *       dump 出实测值 + 元素上下文,再与 design-rules.json 规范对照。
 *
 * 为什么必须实测:index.css 1500+ 行有一整段 border-radius:1px/2px !important 的
 *       扁平化覆盖,会压过内联样式;静态读源码无法判断最终生效值。
 *
 * 规范值始终读取 docs/design/design-rules.json，避免脚本与规范漂移。
 *
 * 运行:先 `npm run dev -- --host 127.0.0.1 --port 4173`,再 `node scripts/radius-audit.mjs`
 * 输出: screenshots/radius-audit-report.json
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
const DESIGN_RULES_PATH = path.join(PROJECT_ROOT, 'docs', 'design', 'design-rules.json');
const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4173';
const CHANNEL = process.env.SCREENSHOT_CHANNEL || undefined;
const VIEWPORT_HEIGHT = 900;

const ROUTES = DESIGN_AUDIT_ROUTES;
const BREAKPOINTS = DESIGN_AUDIT_BREAKPOINTS;
const design = JSON.parse(fs.readFileSync(DESIGN_RULES_PATH, 'utf-8'));
const spec = {
  'button.primary': design.borderRadius.button.primary,
  'button.circular': design.borderRadius.button.circular,
  card: design.borderRadius.card,
  input: design.borderRadius.input,
};

const DISABLE_ANIMATION = `(() => {
  const css = '*,*::before,*::after{animation:none!important;transition:none!important}';
  const apply = () => {
    if (document.querySelector('style[data-no-anim]')) return;
    const t = document.head || document.documentElement; if (!t) return;
    const s = document.createElement('style'); s.setAttribute('data-no-anim',''); s.textContent = css; t.appendChild(s);
  };
  const sch = window.requestAnimationFrame || ((fn)=>window.setTimeout(fn,16));
  const tick = () => { apply(); if (!document.querySelector('style[data-no-anim]')) sch(tick); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  tick();
})();`;

async function dump(page) {
  return page.evaluate(() => {
    const rad = (el) => getComputedStyle(el).borderRadius;
    const txt = (el) => (el.innerText || el.value || el.placeholder || '').trim().slice(0, 14);
    const cls = (el) => (el.className && el.className.baseVal === undefined ? String(el.className) : '').split(' ')[0];
    const item = (el, kind) => ({ kind, cls: cls(el), text: txt(el), radius: rad(el) });

    const out = { buttons: [], inputs: [], cards: [] };
    document.querySelectorAll('button').forEach((b) => out.buttons.push(item(b, 'button')));
    document.querySelectorAll('input, textarea, select').forEach((i) => out.inputs.push(item(i, i.tagName.toLowerCase())));
    document.querySelectorAll('div, section, label').forEach((d) => {
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some((s) => cs['border' + s + 'Style'] !== 'none' && parseFloat(cs['border' + s + 'Width']) > 0);
      if (hasBorder && r.width > 60 && r.height > 40 && r.width < 1400) out.cards.push(item(d, 'card'));
    });
    out.cards = out.cards.slice(0, 12);
    return out;
  });
}

async function checkRequiredRadii(page, route, width) {
  const checks = [];
  if (route.path === '/works') {
    const cta = page.getByRole('button', { name: '开始创作', exact: true });
    if ((await cta.count()) !== 1) {
      throw new Error(`空状态开始创作按钮数量异常 ${route.path}@${width}`);
    }
    checks.push({
      component: 'works-empty-cta',
      actual: await cta.evaluate((el) => getComputedStyle(el).borderRadius),
      expected: design.borderRadius.button.primary,
    });
  }
  if (route.path === '/cipai') {
    const search = page.locator('.ink-search');
    if ((await search.count()) !== 1) {
      throw new Error(`词牌搜索框数量异常 ${route.path}@${width}`);
    }
    checks.push({
      component: 'cipai-search',
      actual: await search.evaluate((el) => getComputedStyle(el).borderRadius),
      expected: design.borderRadius.input,
    });
  }
  return checks.map((check) => ({
    ...check,
    passed: check.actual === check.expected,
  }));
}

(async () => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const launchOptions = { headless: true };
  if (CHANNEL) launchOptions.channel = CHANNEL;
  const browser = await chromium.launch(launchOptions);
  const all = [];
  const runErrors = [];
  const mismatches = [];
  for (const route of ROUTES) {
    for (const width of BREAKPOINTS) {
      const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
      const errs = [];
      page.on('pageerror', (e) => errs.push(String(e.message || e)));
      try {
        await blockExternalRequests(page, BASE_URL);
        await page.addInitScript(DISABLE_ANIMATION);
        await page.goto(`${BASE_URL}/#${route.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });
        await page.waitForLoadState('networkidle', { timeout: 1_000 }).catch(() => {});
        const identity = await assertOuchengPage(page, route.path, width);
        const loader = await page.$('.route-loading');
        if (loader) await page.waitForSelector('.route-loading', { state: 'detached', timeout: 20000 }).catch(() => {});
        if (errs.length) {
          const message = `${route.path}@${width}: ${errs.join('|')}`;
          runErrors.push(message);
          console.log(`[SKIP] ${message}`);
          await page.close();
          continue;
        }
        await page.waitForTimeout(400);
        const d = await dump(page);
        const checks = await checkRequiredRadii(page, route, width);
        mismatches.push(...checks.filter((check) => !check.passed).map((check) => ({
          route: route.path,
          width,
          ...check,
        })));
        all.push({ file: `${route.name}-${width}.png`, route: route.path, width, identity, checks, ...d });
      } catch (e) {
        runErrors.push(`${route.path}@${width}: ${e.message}`);
        console.log(`[ERR] ${route.path}@${width}: ${e.message}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  }
  await browser.close();
  const outPath = path.join(SCREENSHOTS_DIR, 'radius-audit-report.json');
  const report = {
    ...getSourceMetadata(PROJECT_ROOT),
    spec,
    routes: ROUTES.map((route) => route.path),
    breakpoints: BREAKPOINTS,
    pages: all,
    runErrors,
    mismatches,
    summary: {
      routesBreakpoints: ROUTES.length * BREAKPOINTS.length,
      pagesChecked: all.length,
      runErrors: runErrors.length,
      mismatches: mismatches.length,
      passed:
        all.length === ROUTES.length * BREAKPOINTS.length &&
        runErrors.length === 0 &&
        mismatches.length === 0,
    },
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');

  for (const page of all.filter((item) => item.checks.length > 0)) {
    for (const check of page.checks) {
      console.log(
        `[${check.passed ? 'OK' : 'ERR'}] ${page.route}@${page.width} ` +
          `${check.component}: ${check.actual} (expected ${check.expected})`,
      );
    }
  }
  console.log(
    `Radius audit: ${report.summary.pagesChecked}/${report.summary.routesBreakpoints} pages, ` +
      `${report.summary.mismatches} mismatches, ${report.summary.runErrors} errors`,
  );
  console.log(`Report -> ${outPath}`);
  if (!report.summary.passed) process.exitCode = 1;
})().catch((e) => { console.error('Fatal:', e); process.exit(1); });
