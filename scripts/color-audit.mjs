/**
 * 偶成 App · 色板 hex 一致性审计(实机取色版)
 *
 * 方法:用 Playwright 在真实渲染的页面上用 getComputedStyle 读取每个关键组件的
 *       background-color / color / border-color,按"组件语义应有的规定色集合"比对,
 *       而非全局最近色(后者会掩盖"用了错误规定色/文档外色")。
 *
 * 判定阈值(RGB 欧氏距离):
 *   <= 24   视为一致,跳过
 *   24~60   视为微小差异("难以通过肉眼确定"),跳过,留人工用 DevTools 确认
 *   > 60    视为"明显不一致/视觉突兀",输出
 *
 * 运行:先 `npm run dev -- --host 127.0.0.1 --port 4173`,再 `node scripts/color-audit.mjs`
 * 输出: screenshots/color-audit-report.json
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

const THRESHOLD_OBVIOUS = 60; // 明显不一致
const THRESHOLD_MINOR = 24; // 微小差异跳过

// ---- 文档色板收集 + key->value 映射 ----
const design = JSON.parse(fs.readFileSync(DESIGN_RULES_PATH, 'utf-8'));
const palette = [];
const KEYVAL = {};
const walk = (obj, prefix) => {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && /^(#|rgba?)/.test(v)) {
      palette.push({ key: `${prefix}.${k}`, value: v });
      KEYVAL[`${prefix}.${k}`] = v;
    } else if (v && typeof v === 'object') walk(v, `${prefix}.${k}`);
  }
};
walk(design.color, 'color');

// 每个组件类型"语义上应有的规定色集合"
const EXPECT = {
  pageBg: ['color.background.paper', 'color.background.paperAlt'],
  primaryBtn: ['color.primary.vermillion', 'color.primary.vermillionDeep'],
  inputBg: ['color.background.paper', 'color.background.paperAlt'],
  inputBorder: ['color.secondary.border', 'color.secondary.borderStrong'],
  cardBg: ['color.background.paper', 'color.background.paperAlt'],
  cardBorder: ['color.secondary.border', 'color.secondary.borderStrong'],
  navBg: ['color.background.bottomNav'],
  navText: [
    'color.background.paper',
    'color.background.paperAlt',
    'color.text.inkSoft',
    'color.text.bottomNavInactive',
  ],
  headingText: ['color.text.ink'],
  bodyText: ['color.text.ink', 'color.text.inkSoft'],
};

// ---- 颜色工具 ----
function parseColor(s) {
  if (!s) return null;
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  }
  const h = s.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) {
    let hex = h.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  return null;
}
const PAPER = [248, 244, 239];
function effectiveRGB(c) {
  const p = parseColor(c);
  if (!p) return null;
  const [r, g, b, a] = p;
  return [
    Math.round(r * a + PAPER[0] * (1 - a)),
    Math.round(g * a + PAPER[1] * (1 - a)),
    Math.round(b * a + PAPER[2] * (1 - a)),
  ];
}
function toHex([r, g, b]) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}
function dist(a, b) {
  return Math.round(Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2));
}

// 关闭动画,确保读到最终颜色
const DISABLE_ANIMATION = `(() => {
  const css = '*,*::before,*::after{animation:none!important;transition:none!important}';
  const apply = () => {
    if (document.querySelector('style[data-no-anim]')) return;
    const target = document.head || document.documentElement;
    if (!target) return;
    const s = document.createElement('style'); s.setAttribute('data-no-anim',''); s.textContent = css;
    target.appendChild(s);
  };
  const schedule = window.requestAnimationFrame || ((fn)=>window.setTimeout(fn,16));
  const tick = () => { apply(); if (!document.querySelector('style[data-no-anim]')) schedule(tick); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  tick();
})();`;

async function auditPage(page) {
  return page.evaluate(() => {
    // 只返回"实际渲染的边"的颜色:border-style 为 none/hidden 或宽度为 0 的边不渲染,
    // 其 border-color 会回落 currentColor(深墨),属不可见 dormant 值,不能当作边框色bug。
    const visibleBorderColor = (cs) => {
      for (const s of ['Top', 'Right', 'Bottom', 'Left']) {
        const st = cs['border' + s + 'Style'];
        const w = parseFloat(cs['border' + s + 'Width']);
        if (st !== 'none' && st !== 'hidden' && w > 0) return cs['border' + s + 'Color'];
      }
      return null; // 整元素无可见边框
    };
    const grab = (el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, border: visibleBorderColor(cs), radius: cs.borderRadius };
    };
    const out = {};
    out.bodyBg = getComputedStyle(document.body).backgroundColor;
    const root = document.getElementById('root');
    out.rootBg = root ? getComputedStyle(root).backgroundColor : null;
    out.buttons = [...document.querySelectorAll('button')].map((b) => ({
      text: (b.innerText || '').trim().slice(0, 16),
      ...grab(b),
    }));
    out.inputs = [...document.querySelectorAll('input, textarea, [contenteditable="true"]')].map((i) => ({
      tag: i.tagName,
      ...grab(i),
    }));
    const nav = [...document.querySelectorAll('*')].find((el) => {
      const cs = getComputedStyle(el);
      const bh = el.getBoundingClientRect().height;
      return cs.position === 'fixed' && (cs.bottom === '0px' || parseInt(cs.bottom) <= 2) && bh > 20 && bh < 200;
    });
    if (nav) {
      const cs = getComputedStyle(nav);
      out.nav = {
        bg: cs.backgroundColor,
        items: [...nav.children].slice(0, 8).map((c) => ({
          text: (c.innerText || '').trim().slice(0, 8),
          color: getComputedStyle(c).color,
        })),
      };
    }
    out.cards = [...document.querySelectorAll('div')]
      .filter((d) => {
        const cs = getComputedStyle(d);
        const r = d.getBoundingClientRect();
        return /1px/.test(cs.borderWidth || '') && r.width > 50 && r.height > 50 && r.width < 600;
      })
      .slice(0, 6)
      .map((d) => {
        const cs = getComputedStyle(d);
        return { border: visibleBorderColor(cs), bg: cs.backgroundColor };
      });
    const h = document.querySelector('h1, h2, h3');
    out.headingColor = h ? getComputedStyle(h).color : null;
    const p = [...document.querySelectorAll('p')].find(
      (el) => !el.matches('.form-guide') && parseFloat(getComputedStyle(el).opacity || '1') >= 0.6,
    );
    out.bodyTextColor = p ? getComputedStyle(p).color : null;
    return out;
  });
}

function probe(label, computedColor, expectKeys, routeName, width) {
  const eff = effectiveRGB(computedColor);
  if (!eff) return null;
  let bestKey = null;
  let bestVal = null;
  let bestD = 1e9;
  for (const k of expectKeys) {
    const v = KEYVAL[k];
    if (!v) continue;
    const c = effectiveRGB(v);
    if (!c) continue;
    const d = dist(c, eff);
    if (d < bestD) {
      bestD = d;
      bestKey = k;
      bestVal = v;
    }
  }
  if (process.env.DEBUG) {
    console.log(
      `  [probe] ${routeName}-${width} | ${label} | actual ${toHex(eff)} | expect ${expectKeys.join('/')} | nearest ${bestKey}=${bestVal} | d=${bestD}`,
    );
  }
  if (bestD <= THRESHOLD_OBVIOUS) return null; // 一致或微小,跳过
  return {
    file: `${routeName}-${width}.png`,
    component: label,
    specValue: bestVal,
    specKey: bestKey,
    expected: expectKeys.join('/'),
    actual: `${toHex(eff)} (raw ${computedColor})`,
    distance: bestD,
    reason: `实机色与期望规定色[${expectKeys.join('/')}]最近匹配 ${bestKey}=${bestVal} 的 RGB 距离为 ${bestD},超出明显不一致阈值(${THRESHOLD_OBVIOUS}),视觉上突兀`,
  };
}

(async () => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const launchOptions = { headless: true };
  if (CHANNEL) launchOptions.channel = CHANNEL;
  const browser = await chromium.launch(launchOptions);
  const findings = [];
  const runErrors = [];
  const identities = [];
  for (const route of ROUTES) {
    for (const width of BREAKPOINTS) {
      const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));
      try {
        await blockExternalRequests(page, BASE_URL);
        await page.addInitScript(DISABLE_ANIMATION);
        await page.goto(`${BASE_URL}/#${route.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });
        await page.waitForLoadState('networkidle', { timeout: 1_000 }).catch(() => {});
        identities.push({
          route: route.path,
          width,
          ...(await assertOuchengPage(page, route.path, width)),
        });
        const loader = await page.$('.route-loading');
        if (loader) {
          await page.waitForSelector('.route-loading', { state: 'detached', timeout: 20000 }).catch(() => {});
        }
        if (pageErrors.length > 0) {
          const message = `${route.path}@${width}: ${pageErrors.join('|')}`;
          runErrors.push(message);
          console.log(`[SKIP] ${message}`);
          await page.close();
          continue;
        }
        await page.waitForTimeout(500);
        const a = await auditPage(page);
        const bg = a.rootBg && a.rootBg !== 'transparent' ? a.rootBg : a.bodyBg;
        let f = probe('页面背景', bg, EXPECT.pageBg, route.name, width);
        if (f) findings.push(f);
        if (a.buttons && a.buttons.length) {
          let primary = null;
          let maxRed = -1;
          for (const b of a.buttons) {
            const c = effectiveRGB(b.bg);
            if (!c) continue;
            const redness = c[0] - Math.max(c[1], c[2]); // 红减其他通道,避免 paper 暖白被误判
            if (redness > maxRed) {
              maxRed = redness;
              primary = b;
            }
          }
          if (maxRed > 30) {
            f = probe(`主操作按钮("${primary.text}")`, primary.bg, EXPECT.primaryBtn, route.name, width);
            if (f) findings.push(f);
          }
        }
        if (a.inputs)
          for (const inp of a.inputs) {
            f = probe(`输入框(${inp.tag})背景`, inp.bg, EXPECT.inputBg, route.name, width);
            if (f) findings.push(f);
            f = probe(`输入框(${inp.tag})边框`, inp.border, EXPECT.inputBorder, route.name, width);
            if (f) findings.push(f);
          }
        if (a.cards)
          for (const card of a.cards) {
            f = probe('卡片边框', card.border, EXPECT.cardBorder, route.name, width);
            if (f) findings.push(f);
            f = probe('卡片背景', card.bg, EXPECT.cardBg, route.name, width);
            if (f) findings.push(f);
          }
        if (a.nav) {
          f = probe('底部导航背景', a.nav.bg, EXPECT.navBg, route.name, width);
          if (f) findings.push(f);
          for (const it of a.nav.items) {
            f = probe(`底部导航项("${it.text}")文字`, it.color, EXPECT.navText, route.name, width);
            if (f) findings.push(f);
          }
        }
        if (a.headingColor) {
          f = probe('标题文字', a.headingColor, EXPECT.headingText, route.name, width);
          if (f) findings.push(f);
        }
        if (a.bodyTextColor) {
          f = probe('正文文字', a.bodyTextColor, EXPECT.bodyText, route.name, width);
          if (f) findings.push(f);
        }
      } catch (e) {
        runErrors.push(`${route.path}@${width}: ${e.message}`);
        console.log(`[ERR] ${route.path}@${width}: ${e.message}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  }
  await browser.close();
  const report = {
    ...getSourceMetadata(PROJECT_ROOT),
    method:
      'Playwright getComputedStyle 实机取色(非目测),按组件语义应有的规定色集合比对。阈值:RGB 距离 > ' +
      THRESHOLD_OBVIOUS +
      ' 判明显不一致;<= ' +
      THRESHOLD_MINOR +
      ' 一致;' +
      THRESHOLD_MINOR +
      '~' +
      THRESHOLD_OBVIOUS +
      ' 微小差异跳过(留人工 DevTools 确认)',
    routes: ROUTES.map((r) => r.path),
    breakpoints: BREAKPOINTS,
    identities,
    runErrors,
    findings,
    summary: {
      routesBreakpoints: ROUTES.length * BREAKPOINTS.length,
      obviousMismatches: findings.length,
      runErrors: runErrors.length,
      passed: findings.length === 0 && runErrors.length === 0,
    },
  };
  const outPath = path.join(SCREENSHOTS_DIR, 'color-audit-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n明显不一致项: ${findings.length}`);
  for (const f of findings) {
    console.log(`${f.file} | ${f.component} | 文档:${f.specValue} | 实机:${f.actual} | d=${f.distance} | ${f.reason}`);
  }
  console.log(`\nReport -> ${outPath}`);
  if (!report.summary.passed) process.exitCode = 1;
})().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
