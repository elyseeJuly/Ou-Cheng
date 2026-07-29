export type ThemePref = 'day' | 'night' | 'auto';
const KEY = 'oucheng_theme';

function resolve(pref: ThemePref): 'day' | 'night' {
  if (pref !== 'auto') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}

export function applyTheme(pref: ThemePref, animate = false) {
  const t = resolve(pref);
  const html = document.documentElement;
  if (animate) {
    html.classList.add('theme-transitioning');
    setTimeout(() => html.classList.remove('theme-transitioning'), 450);
  }
  html.dataset.theme = t;
  localStorage.setItem(KEY, pref);
  // PWA 状态栏同步，防 iOS 穿帮
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', t === 'night' ? '#18212B' : '#F4EDDD');
}

export function getThemePref(): ThemePref {
  return (localStorage.getItem(KEY) as ThemePref) || 'day';
}

export function initTheme() {
  applyTheme(getThemePref());
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (getThemePref() === 'auto') applyTheme('auto');
    });
}