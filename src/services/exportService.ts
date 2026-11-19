import { ensureCanvasFonts } from '../utils/fontReady';
import { stripJudou } from '../utils/punctuation';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Poem, PaperStyle, ExportFormat, ExportScale } from '../types';
import { elegantDate } from '../utils/elegantDate';
import { chunkPreface } from '../utils/prefaceColumns';

// ── 花笺纸背景色（同步 PaperBackground 降饱和色） ──────
const PAPER_BG: Record<PaperStyle, string> = {
  xuan:    '#F7F1E3',
  meihua:  '#F8EEE9',
  yunwen:  '#EFF1EF',
  zhu:     '#F0F2E6',
  lianhua: '#F3EFF0',
};

const MAX_PIXELS_WEB = 40_000_000;
const MAX_PIXELS_IOS = 20_000_000;

// ── 主导出函数 ────────────────────────────────────────────
export async function exportPoem(
  poem: Poem,
  options: {
    direction: 'vertical' | 'horizontal';
    scale: ExportScale;
    format: ExportFormat;
    sealDataUrl?: string;
    template?: 'plain' | 'wusilan';
    stripPunct?: boolean;
    /** 导语 / 词序：小字低二格排在正文之前 */
    showPreface?: boolean;
    /** 题目：置于导语与正文之前 */
    showTitle?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const { direction, scale, format, sealDataUrl, template = 'plain', stripPunct = false, showPreface = false, showTitle = false } = options;
  const isEnglish = poem.type === 'sonnet' && ((poem.content.match(/[A-Za-z]/g) || []).length / Math.max(poem.content.replace(/\s/g, '').length, 1)) > 0.5;
  const contentFont = isEnglish
    ? 'Georgia, "Times New Roman", serif'
    : '"Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif';

  let lines = poem.content.split('\n').filter(Boolean);
  if (stripPunct) {
    lines = lines.map(stripJudou);
  }

  // 长文自适应尺寸：不再把所有内容硬塞进固定 3:4 / 4:3 画布。
  const BASE = 900;
  const longestLine = Math.max(1, ...lines.map(line => Array.from(line).length));
  const isWusilan = template === 'wusilan';
  const titleText = showTitle ? (poem.title || '').trim() : '';
  const titleCount = titleText ? 1 : 0;   // 题目占一栏（行）
  // 乌丝栏：画幅按界格整数倍计算，每一行字恰好落在一格里（折行也对齐格线）
  const COL = 52;           // 竖栏宽 / 横栏高
  const FRAME = 50;         // 版框内沿距画布边
  const PAD = 34;           // 天头地脚留白
  const CHAR_V = 34;        // 竖排每字占高（28px + 6px 字距）
  // 导语：小字（17px）低二格。竖排按栏高折栏，横排按行宽折行；乌丝栏下每栏/行恰占一格。
  const prefaceText = showPreface ? (poem.heartNote || '').trim() : '';
  const PF_FONT = 17;
  const PF_CHAR_V = PF_FONT + 4;           // 竖排小字每字占高
  const PF_CHAR_H = PF_FONT + 2;           // 横排小字每字占宽
  let prefaceLines: string[] = [];

  let width: number;
  let height: number;
  if (isWusilan && direction === 'vertical') {
    height = Math.max(BASE, FRAME * 2 + PAD * 2 + Math.max(longestLine, Array.from(titleText).length) * CHAR_V);
    const perCol = Math.max(1, Math.floor((height - FRAME * 2 - PAD * 2) / CHAR_V));
    const textCols = lines.reduce((n, l) => n + Math.ceil(Array.from(l).length / perCol), 0);
    if (prefaceText) prefaceLines = chunkPreface(prefaceText, Math.floor((height - FRAME * 2 - PAD * 2) / PF_CHAR_V) - 3);
    const cols = Math.max(textCols + prefaceLines.length + titleCount + 4, Math.ceil((BASE * 0.75 - FRAME * 2) / COL));
    width = FRAME * 2 + cols * COL;
  } else if (isWusilan) {
    width = BASE;
    const charsPerRow = isEnglish ? 64 : Math.floor((BASE - FRAME * 2 - 80) / 29);
    const textRows = lines.reduce((n, l) => n + Math.ceil(Array.from(l).length / charsPerRow), 0);
    if (prefaceText) prefaceLines = chunkPreface(prefaceText, Math.floor((BASE - FRAME * 2 - 80) / PF_CHAR_H) - 2);
    const rows = Math.max(textRows + prefaceLines.length + titleCount + 4, Math.ceil((BASE * 0.75 - FRAME * 2) / COL));
    height = FRAME * 2 + rows * COL;
  } else {
    if (prefaceText) {
      prefaceLines = direction === 'vertical'
        ? chunkPreface(prefaceText, Math.max(10, Math.floor(longestLine * 34 / PF_CHAR_V) - 2))
        : chunkPreface(prefaceText, 34);
    }
    const pfW = direction === 'vertical' && prefaceLines.length ? prefaceLines.length * 30 + 70 : 0;
    const pfH = direction !== 'vertical' && prefaceLines.length ? prefaceLines.length * 33 + 70 : 0;
    width = direction === 'vertical'
      ? Math.max(Math.round(BASE * 0.75), 200 + lines.length * 82 + pfW + titleCount * 90)
      : BASE;
    height = direction === 'vertical'
      ? Math.max(BASE, 180 + Math.max(longestLine, Array.from(titleText).length + 1) * 42)
      : Math.max(Math.round(BASE * 0.75), 260 + lines.length * (isEnglish ? 36 : 60) + pfH + titleCount * 80);
  }

  // 像素上限与动态降级
  const isNative = Capacitor.isNativePlatform();
  const maxPixels = isNative ? MAX_PIXELS_IOS : MAX_PIXELS_WEB;
  let effectiveScale = scale;
  if (width * effectiveScale * height * effectiveScale > maxPixels) {
    effectiveScale = Math.max(1, Math.floor(Math.sqrt(maxPixels / (width * height)))) as ExportScale;
  }

  // ── 离屏容器 ────────────────────────────────────────────
  const container = document.createElement('div');
  container.id = 'oucheng-export-container';
  Object.assign(container.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: PAPER_BG[poem.paperStyle] || '#F7F1E3',
    fontFamily: contentFont,
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  });

  // 乌丝栏用绝对定位网格：需要一层 relative 舞台作为定位基准（克隆文档里外层会被改为 static）
  const stage = document.createElement('div');
  if (isWusilan) {
    container.style.padding = '0';
    Object.assign(stage.style, { position: 'relative', width: `${width}px`, height: `${height}px`, flex: '0 0 auto' });
    container.appendChild(stage);
  }
  const host = isWusilan ? stage : container;

  // ── 宣纸噪点平铺（html2canvas 高保真导出支持） ────────────────────────
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const nCtx = noiseCanvas.getContext('2d')!;
  const imgData = nCtx.createImageData(128, 128);
  const d = imgData.data;
  const opacity = poem.paperStyle === 'xuan' ? 0.115 : 0.095;
  for (let i = 0; i < d.length; i += 4) {
    const val = Math.floor(Math.random() * 40) + 180;
    d[i] = val;
    d[i+1] = val;
    d[i+2] = val;
    d[i+3] = Math.floor(Math.random() * 255 * opacity);
  }
  nCtx.putImageData(imgData, 0, 0);
  const noiseUrl = noiseCanvas.toDataURL();

  const textureOverlay = document.createElement('div');
  Object.assign(textureOverlay.style, {
    position: 'absolute',
    inset: '0',
    backgroundImage: `url(${noiseUrl})`,
    backgroundRepeat: 'repeat',
    opacity: '0.95',
    pointerEvents: 'none',
    zIndex: '1',
    mixBlendMode: 'multiply',
  });
  host.appendChild(textureOverlay);

  // ── 正文区 ───────────────────────────────────────────────
  const contentWrap = document.createElement('div');
  Object.assign(contentWrap.style, isWusilan ? {
    // 网格版心：正好贴住版框内沿，竖排自右起、横排自上起
    position: 'absolute',
    zIndex: '2',
    top: `${FRAME + (direction === 'vertical' ? PAD : 0)}px`,
    bottom: `${FRAME + (direction === 'vertical' ? PAD : 0)}px`,
    left: `${FRAME + (direction === 'vertical' ? 0 : 40)}px`,
    width: `${width - 2 * FRAME - (direction === 'vertical' ? 0 : 80)}px`,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
    alignItems: direction === 'vertical' ? 'flex-start' : 'center',
    gap: '0',
    paddingRight: direction === 'vertical' ? `${COL}px` : '0',
    paddingTop: direction === 'vertical' ? '0' : `${COL}px`,
  } : {
    position: 'relative',
    zIndex: '2',
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
    alignItems: 'center',
    gap: direction === 'vertical' ? '30px' : '16px',
    flex: '1',
  });

  // ── 题目 ──────────────────────────────────────────────
  if (titleText) {
    const t = document.createElement('div');
    const TITLE_FAMILY = '"Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif';
    Object.assign(t.style, direction === 'vertical' ? {
      writingMode: 'vertical-rl', textOrientation: 'upright', whiteSpace: 'nowrap', flex: '0 0 auto',
      fontSize: isWusilan ? '30px' : '34px', letterSpacing: '8px', color: '#1a1a1a', fontFamily: TITLE_FAMILY,
      lineHeight: isWusilan ? `${COL}px` : '1.6', alignSelf: 'flex-start',
      ...(isWusilan ? { width: `${COL}px` } : { marginLeft: '6px' }),
    } : {
      whiteSpace: 'nowrap', flex: '0 0 auto', textAlign: 'center', width: '100%',
      fontSize: isWusilan ? '28px' : '32px', letterSpacing: '6px', color: '#1a1a1a', fontFamily: TITLE_FAMILY,
      ...(isWusilan ? { height: `${COL}px`, lineHeight: `${COL}px` } : { lineHeight: '1.5', marginBottom: '8px' }),
    });
    t.textContent = titleText;
    contentWrap.appendChild(t);
  }

  // ── 导语 ──────────────────────────────────────────────
  const PF_COLOR = 'rgba(30,28,25,0.72)';
  const PF_FAMILY = '"LXGW WenKai Lite", "Ma Shan Zheng", "Noto Serif SC", serif';
  const makeTag = (pos: Partial<CSSStyleDeclaration>) => {
    const tag = document.createElement('div');
    Object.assign(tag.style, {
      position: 'absolute', width: '20px', height: '20px', lineHeight: '12px', padding: '0 0 8px', boxSizing: 'border-box', textAlign: 'center',
      fontSize: '12px', color: '#FBF6EC', background: 'rgba(176,57,42,0.86)', borderRadius: '2px',
      writingMode: 'horizontal-tb', letterSpacing: '0', fontFamily: PF_FAMILY,
    }, pos);
    tag.textContent = '序';
    return tag;
  };
  if (prefaceLines.length) {
    if (isWusilan) {
      // 网格内：每栏/行占一格，低二格，序区淡朱底
      prefaceLines.forEach(text => {
        const el = document.createElement('div');
        Object.assign(el.style, direction === 'vertical' ? {
          writingMode: 'vertical-rl', textOrientation: 'upright', width: `${COL}px`, height: '100%',
          lineHeight: `${COL}px`, fontSize: `${PF_FONT}px`, letterSpacing: '4px', paddingTop: `${PF_FONT * 2 + 8}px`,
          boxSizing: 'border-box', color: PF_COLOR, fontFamily: PF_FAMILY, background: 'rgba(176,57,42,0.035)', flex: '0 0 auto',
        } : {
          height: `${COL}px`, lineHeight: `${COL}px`, fontSize: `${PF_FONT}px`, letterSpacing: '2px',
          paddingLeft: `${PF_CHAR_H * 2}px`, boxSizing: 'border-box', width: '100%', whiteSpace: 'nowrap',
          color: PF_COLOR, fontFamily: PF_FAMILY, background: 'rgba(176,57,42,0.035)', flex: '0 0 auto',
        });
        el.textContent = text;
        contentWrap.appendChild(el);
      });
    } else {
      // 素笺：细双线框 + 朱底「序」字签
      const box = document.createElement('div');
      Object.assign(box.style, {
        position: 'relative', flex: '0 0 auto', boxSizing: 'border-box',
        border: '1px solid rgba(120,86,52,0.40)', outline: '1px solid rgba(120,86,52,0.16)', outlineOffset: '-6px',
        background: 'rgba(176,57,42,0.028)', color: PF_COLOR, fontFamily: PF_FAMILY,
        display: 'flex', flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
        alignSelf: direction === 'vertical' ? 'flex-start' : 'center',
        padding: direction === 'vertical' ? '22px 16px 20px' : '22px 30px 20px',
        maxWidth: direction === 'vertical' ? 'none' : '700px', width: direction === 'vertical' ? 'auto' : '700px',
      });
      // 横排素笺：一段自然折行、首行缩进二字；竖排按栏折开
      (direction === 'vertical' ? prefaceLines : [prefaceText.replace(/\s+/g, '')]).forEach(text => {
        const el = document.createElement('div');
        Object.assign(el.style, direction === 'vertical' ? {
          writingMode: 'vertical-rl', textOrientation: 'upright', fontSize: `${PF_FONT}px`, letterSpacing: '4px',
          lineHeight: '30px', paddingTop: `${PF_FONT * 2 + 8}px`, whiteSpace: 'nowrap',
        } : {
          fontSize: `${PF_FONT}px`, letterSpacing: '2px', lineHeight: '33px', textIndent: `${PF_CHAR_H * 2}px`, textAlign: 'justify',
        });
        el.textContent = text;
        box.appendChild(el);
      });
      box.appendChild(makeTag(direction === 'vertical' ? { top: '-10px', right: '-10px' } : { top: '-10px', left: '-10px' }));
      contentWrap.appendChild(box);
    }
  }

  if (direction === 'vertical') {
    lines.forEach(line => {
      const col = document.createElement('div');
      Object.assign(col.style, {
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        fontSize: '28px',
        letterSpacing: '6px',
        lineHeight: isWusilan ? `${COL}px` : '1.8',
        color: '#1a1a1a',
        fontFamily: '"Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif',
        textAlign: 'left',
        width: 'auto',
        height: isWusilan ? '100%' : 'auto',
      });
      col.textContent = line;
      contentWrap.appendChild(col);
    });

  } else {
    lines.forEach(line => {
      const row = document.createElement('p');
      Object.assign(row.style, {
        fontSize: isEnglish ? '22px' : '24px',
        letterSpacing: isEnglish ? '0.2px' : '5px',
        lineHeight: isWusilan ? `${COL}px` : (isEnglish ? '1.55' : '1.8'),
        color: '#1a1a1a',
        margin: '0',
        textAlign: isEnglish ? 'left' : 'center',
        fontFamily: contentFont,
        width: isEnglish ? '100%' : 'auto',
        maxWidth: isEnglish ? '720px' : 'none',
      });
      row.textContent = line;
      contentWrap.appendChild(row);
    });
  }
  host.appendChild(contentWrap);

  // ── 乌丝栏：双线版框 + 界栏（竖栏自右起算，横栏自上起算） ──────────
  if (isWusilan) {
    const frameOuter = document.createElement('div');
    Object.assign(frameOuter.style, {
      position: 'absolute', inset: `${FRAME - 6}px`, zIndex: '1', pointerEvents: 'none',
      border: '2.5px solid rgba(166,58,43,0.75)',
    });
    host.appendChild(frameOuter);
    const frameInner = document.createElement('div');
    Object.assign(frameInner.style, {
      position: 'absolute', inset: `${FRAME - 1}px`, zIndex: '1', pointerEvents: 'none',
      border: '1px solid rgba(166,58,43,0.55)',
    });
    host.appendChild(frameInner);

    // 界栏逐条绘制（html2canvas 不支持 repeating-linear-gradient）
    const ruleColor = 'rgba(166,58,43,0.42)';
    if (direction === 'vertical') {
      for (let x = width - FRAME - COL; x > FRAME + 4; x -= COL) {
        const r = document.createElement('div');
        Object.assign(r.style, { position: 'absolute', zIndex: '1', pointerEvents: 'none', left: `${x}px`, top: `${FRAME}px`, width: '1px', height: `${height - FRAME * 2}px`, background: ruleColor });
        host.appendChild(r);
      }
    } else {
      for (let y = FRAME + COL; y < height - FRAME - 4; y += COL) {
        const r = document.createElement('div');
        Object.assign(r.style, { position: 'absolute', zIndex: '1', pointerEvents: 'none', top: `${y}px`, left: `${FRAME}px`, height: '1px', width: `${width - FRAME * 2}px`, background: ruleColor });
        host.appendChild(r);
      }
    }
  }

  // ── 落款与印章组合 ─────────────────────────
  const isVert = direction === 'vertical';
  const signContainer = document.createElement('div');
  Object.assign(signContainer.style, {
    display: 'flex',
    flexDirection: isVert ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: isWusilan && isVert ? 'flex-end' : 'center',
    gap: isVert ? '16px' : '20px',
    writingMode: isVert ? 'vertical-rl' : 'horizontal-tb',
    textOrientation: 'upright',
    position: 'relative',
    zIndex: '3',
    marginTop: isVert || isWusilan ? '0' : '40px',
    alignSelf: isVert ? (isWusilan ? 'flex-end' : 'auto') : 'flex-end',
    ...(isWusilan ? (isVert
      ? { width: `${COL}px` }
      : { height: `${COL}px`, marginTop: `${COL}px` }) : {}),
  });

  const signText = document.createElement('div');
  Object.assign(signText.style, {
    fontSize: '15px',
    letterSpacing: '4px',
    color: '#444',
    fontFamily: '"Ma Shan Zheng", "LXGW WenKai Lite", serif',
  });
  signText.textContent = `${poem.author}　${elegantDate(poem.createdAt)}`;
  signContainer.appendChild(signText);

  let sealImgElement: HTMLImageElement | null = null;
  if (sealDataUrl) {
    const sealImg = document.createElement('img');
    sealImg.src = sealDataUrl;
    Object.assign(sealImg.style, {
      width: '38px',
      height: '38px',
      opacity: '0.9',
      transform: 'rotate(-3deg)',
      margin: isVert ? '4px 0' : '0 4px',
    });
    signContainer.appendChild(sealImg);
    sealImgElement = sealImg;
  }

  const brandDiv = document.createElement('div');
  Object.assign(brandDiv.style, {
    fontSize: '11px',
    color: 'rgba(166,58,43,0.55)',
    fontFamily: '"Ma Shan Zheng", "LXGW WenKai Lite", serif',
    border: '1px solid rgba(166,58,43,0.45)',
    padding: '2px 5px',
    letterSpacing: '1px',
    margin: '0',
    whiteSpace: 'nowrap',
  });
  brandDiv.textContent = '偶成';
  signContainer.appendChild(brandDiv);

  // 乌丝栏里落款占一栏，跟正文同在网格中
  (isWusilan ? contentWrap : container).appendChild(signContainer);
  document.body.appendChild(container);

  try {
    // 依赖就绪等待：字体 & 印章
    if (!isEnglish) {
      await ensureCanvasFonts(`${poem.title}${poem.author}${lines.join('')}${showPreface ? poem.heartNote || '' : ''}`);
    }
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    if (sealImgElement && sealImgElement.decode) {
      await sealImgElement.decode().catch(() => {});
    }

    const canvas = await html2canvas(container, {
      scale: effectiveScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: PAPER_BG[poem.paperStyle] || '#F7F1E3',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const cloned = clonedDoc.getElementById('oucheng-export-container');
        if (cloned) {
          cloned.style.position = 'static';
          cloned.style.top = '0';
          cloned.style.left = '0';
        }
      },
    });

    const mimeType = `image/${format === 'jpg' ? 'jpeg' : 'png'}`;
    const quality = format === 'jpg' ? 0.92 : undefined;

    if (isNative) {
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const fileName = `oucheng_${poem.id}_${Date.now()}.${format}`;
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: poem.title || '偶成作品',
        url: savedFile.uri,
      });

      // 延迟 3 秒擦除 Cache 临时文件，避免 iOS 分享 sheet 打开/传输过程中文件被过早清空
      setTimeout(() => {
        Filesystem.deleteFile({
          path: fileName,
          directory: Directory.Cache,
        }).catch(() => {});
      }, 3000);
    } else {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, quality));
      if (!blob) throw new Error('Canvas to Blob conversion failed');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `偶成_${poem.title || '无题'}_${poem.author || '佚名'}.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Export poem failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Export error' };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
