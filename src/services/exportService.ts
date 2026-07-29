import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Poem, PaperStyle, ExportFormat, ExportScale } from '../types';
import { elegantDate } from '../utils/elegantDate';

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
  }
): Promise<{ success: boolean; error?: string }> {
  const { direction, scale, format, sealDataUrl, template = 'plain', stripPunct = false } = options;
  const isEnglish = poem.type === 'sonnet' && ((poem.content.match(/[A-Za-z]/g) || []).length / Math.max(poem.content.replace(/\s/g, '').length, 1)) > 0.5;
  const contentFont = isEnglish
    ? 'Georgia, "Times New Roman", serif'
    : '"Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif';

  let lines = poem.content.split('\n').filter(Boolean);
  if (stripPunct) {
    lines = lines.map(l => l.replace(/[，。、；？！,.!?]/g, ''));
  }

  // 长文自适应尺寸：不再把所有内容硬塞进固定 3:4 / 4:3 画布。
  const BASE = 900;
  const longestLine = Math.max(1, ...lines.map(line => Array.from(line).length));
  const width = direction === 'vertical'
    ? Math.max(Math.round(BASE * 0.75), 180 + lines.length * (template === 'wusilan' ? 52 : 58))
    : BASE;
  const height = direction === 'vertical'
    ? Math.max(BASE, 180 + longestLine * 42)
    : Math.max(Math.round(BASE * 0.75), 230 + lines.length * (isEnglish ? 36 : 48));

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
  container.appendChild(textureOverlay);

  // ── 正文区 ───────────────────────────────────────────────
  const contentWrap = document.createElement('div');
  const isWusilan = direction === 'vertical' && template === 'wusilan';
  const COL = 52;

  Object.assign(contentWrap.style, {
    position: 'relative',
    zIndex: '2',
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
    alignItems: 'center',
    gap: isWusilan ? '0' : (direction === 'vertical' ? '30px' : '16px'),
    flex: '1',
  });

  if (direction === 'vertical') {
    lines.forEach(line => {
      const col = document.createElement('div');
      Object.assign(col.style, {
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        fontSize: '28px',
        letterSpacing: '6px',
        lineHeight: '1.8',
        color: '#1a1a1a',
        fontFamily: '"Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif',
        textAlign: isWusilan ? 'center' : 'left',
        width: isWusilan ? `${COL}px` : 'auto',
      });
      col.textContent = line;
      contentWrap.appendChild(col);
    });

    if (isWusilan) {
      contentWrap.style.paddingRight = `${COL}px`;
    }
  } else {
    lines.forEach(line => {
      const row = document.createElement('p');
      Object.assign(row.style, {
        fontSize: isEnglish ? '22px' : '24px',
        letterSpacing: isEnglish ? '0.2px' : '5px',
        lineHeight: isEnglish ? '1.55' : '1.8',
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
  container.appendChild(contentWrap);

  // ── 乌丝栏：框栏 + 界栏 ──────────────────────────────────
  if (isWusilan) {
    const frameOuter = document.createElement('div');
    Object.assign(frameOuter.style, {
      position: 'absolute', inset: '44px', zIndex: '1', pointerEvents: 'none',
      border: '2.5px solid rgba(166,58,43,0.75)',
    });
    container.appendChild(frameOuter);
    const frameInner = document.createElement('div');
    Object.assign(frameInner.style, {
      position: 'absolute', inset: '49px', zIndex: '1', pointerEvents: 'none',
      border: '1px solid rgba(166,58,43,0.55)',
    });
    container.appendChild(frameInner);

    const rules = document.createElement('div');
    Object.assign(rules.style, {
      position: 'absolute', inset: '50px', zIndex: '1', pointerEvents: 'none',
      backgroundImage: `repeating-linear-gradient(90deg, transparent 0 ${COL - 1}px, rgba(166,58,43,0.45) ${COL - 1}px ${COL}px)`,
    });
    container.appendChild(rules);
  }

  // ── 落款与印章组合 ─────────────────────────
  const isVert = direction === 'vertical';
  const signContainer = document.createElement('div');
  Object.assign(signContainer.style, {
    display: 'flex',
    flexDirection: isVert ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isVert ? '16px' : '20px',
    writingMode: isVert ? 'vertical-rl' : 'horizontal-tb',
    textOrientation: 'upright',
    position: 'relative',
    zIndex: '3',
    marginTop: isVert ? '0' : '40px',
    alignSelf: isVert ? 'auto' : 'flex-end',
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

  container.appendChild(signContainer);
  document.body.appendChild(container);

  try {
    // 依赖就绪等待：字体 & 印章
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
