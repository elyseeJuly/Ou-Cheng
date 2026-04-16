import html2canvas from 'html2canvas';
import { Poem, PaperStyle, ExportFormat, ExportScale } from '../types';

// ── 花笺纸背景色 ────────────────────────────────────────
const PAPER_BG: Record<PaperStyle, string> = {
  xuan:    '#F7F1E3',
  meihua:  '#FDF0F3',
  yunwen:  '#EDF3FD',
  zhu:     '#EDFDF0',
  lianhua: '#F5EDFD',
};

// ── 偶成品牌印记（金石风格） ────────────────────────────
function drawBrandStamp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.font = `${size * 0.4}px "Ma Shan Zheng", "LXGW WenKai Lite", serif`;
  ctx.fillStyle = 'rgba(178,34,34,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(178,34,34,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);
  ctx.fillText('偶', x, y - size * 0.12);
  ctx.fillText('成', x, y + size * 0.16);
  ctx.restore();
}

// ── 主导出函数 ────────────────────────────────────────────
export async function exportPoem(
  poem: Poem,
  options: {
    direction: 'vertical' | 'horizontal';
    scale: ExportScale;
    format: ExportFormat;
    sealDataUrl?: string;
  }
): Promise<void> {
  const { direction, scale, format, sealDataUrl } = options;

  // 尺寸
  const BASE = 900;
  const width  = direction === 'vertical' ? Math.round(BASE * 0.75) : BASE;      // 3:4 or 4:3
  const height = direction === 'vertical' ? BASE : Math.round(BASE * 0.75);

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
    fontFamily: '"Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif',
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  });

  // 宣纸纹理叠加
  const textureOverlay = document.createElement('div');
  Object.assign(textureOverlay.style, {
    position: 'absolute', inset: '0',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.07\'/%3E%3C/svg%3E")',
    opacity: '0.5',
    pointerEvents: 'none',
    zIndex: '1',
  });
  container.appendChild(textureOverlay);

  // ── 正文区 ───────────────────────────────────────────────
  const contentWrap = document.createElement('div');
  Object.assign(contentWrap.style, {
    position: 'relative',
    zIndex: '2',
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
    alignItems: 'center',
    gap: direction === 'vertical' ? '30px' : '16px',
    flex: '1',
  });

  const lines = poem.content.split('\n').filter(Boolean);

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
      });
      col.textContent = line;
      contentWrap.appendChild(col);
    });
  } else {
    lines.forEach(line => {
      const row = document.createElement('p');
      Object.assign(row.style, {
        fontSize: '24px',
        letterSpacing: '5px',
        lineHeight: '1.8',
        color: '#1a1a1a',
        margin: '0',
        textAlign: 'center',
        fontFamily: '"Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif',
      });
      row.textContent = line;
      contentWrap.appendChild(row);
    });
  }
  container.appendChild(contentWrap);

  // ── 落款 ─────────────────────────────────────────────────
  const sign = document.createElement('div');
  const date = new Date(poem.createdAt);
  Object.assign(sign.style, {
    position: 'relative',
    zIndex: '2',
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    alignItems: 'center',
    gap: '12px',
    writingMode: direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
    textOrientation: 'upright',
    fontSize: '16px',
    letterSpacing: '4px',
    color: '#555',
    fontFamily: '"Ma Shan Zheng", "LXGW WenKai Lite", serif',
  });
  sign.textContent = `${poem.author}  ${date.getFullYear()}年${date.getMonth() + 1}月`;
  container.appendChild(sign);

  // 品牌印记
  const brandDiv = document.createElement('div');
  Object.assign(brandDiv.style, {
    position: 'absolute',
    bottom: '24px',
    [direction === 'vertical' ? 'right' : 'right']: '24px',
    zIndex: '3',
    fontSize: '11px',
    color: 'rgba(178,34,34,0.4)',
    letterSpacing: '2px',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });
  brandDiv.innerHTML = `
    <span style="border:1px solid rgba(178,34,34,0.4);padding:2px 6px;font-family:'Ma Shan Zheng','LXGW WenKai Lite',serif;font-size:13px;">偶成</span>
    <span>Ou Cheng · 典藏</span>
  `;
  container.appendChild(brandDiv);

  // 图章
  if (sealDataUrl) {
    const sealImg = document.createElement('img');
    sealImg.src = sealDataUrl;
    Object.assign(sealImg.style, {
      position: 'absolute',
      bottom: direction === 'vertical' ? '60px' : '50px',
      left: direction === 'vertical' ? '60px' : 'auto',
      right: direction === 'vertical' ? 'auto' : '60px',
      width: '72px', height: '72px',
      opacity: '0.85',
      zIndex: '3',
      transform: 'rotate(-3deg)',
    });
    container.appendChild(sealImg);
  }

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: PAPER_BG[poem.paperStyle] || '#F7F1E3',
      logging: false,
    });

    const ext = format === 'jpg' ? 'jpeg' : 'png';
    const dataUrl = canvas.toDataURL(`image/${ext}`, format === 'jpg' ? 0.92 : undefined);

    // 触发下载
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${poem.title || '偶成'}_${direction === 'vertical' ? '竖版' : '横版'}_${scale}x.${format}`;
    a.click();
  } finally {
    document.body.removeChild(container);
  }
}
