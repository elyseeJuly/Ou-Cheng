/**
 * 画布（印章、海报）绘制前先把要用到的字体真正加载进来。
 * document.fonts.ready 只等「已经开始加载」的字体；从未在页面上用过的字体（例如马善政楷）
 * 不会被加载，canvas 就会悄悄退回系统字体。iOS 离线包里字体是本地文件，这里一般几十毫秒内完成。
 */
export const CANVAS_FONT_FAMILIES = ['Ma Shan Zheng', 'LXGW WenKai Lite', 'Noto Serif SC'] as const;

const uniqueChars = (text: string, limit = 400): string =>
  Array.from(new Set(Array.from(text.replace(/\s+/g, '')))).slice(0, limit).join('');

export async function ensureCanvasFonts(
  sample: string,
  families: readonly string[] = CANVAS_FONT_FAMILIES,
  timeoutMs = 3000,
): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function') return;
  const text = uniqueChars(`${sample}偶成`) || '偶成';
  const loads = families.flatMap(family => ['16px', 'bold 16px'].map(spec =>
    document.fonts.load(`${spec} "${family}"`, text).catch(() => [] as FontFace[]),
  ));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>(resolve => { timer = setTimeout(resolve, timeoutMs); });
  try {
    await Promise.race([Promise.all(loads).then(() => undefined), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
