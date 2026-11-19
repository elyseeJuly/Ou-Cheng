import React, { useEffect, useRef } from 'react';
import { ensureCanvasFonts } from '../../utils/fontReady';
import { Seal, SealStyle } from '../../types';

interface SealGeneratorProps {
  penName: string;
  style: SealStyle;
  size?: number;
  onGenerated?: (dataUrl: string) => void;
}

// ── 印泥侵蚀：模拟印泥不均与纸面纤维 ────────────────────
export function applySealErosion(ctx: CanvasRenderingContext2D, size: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  // 1. 全域细小蚀点（印泥颗粒感）
  const dots = Math.floor(size * size * 0.006);
  for (let i = 0; i < dots; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.25 + Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 1.3 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // 2. 边缘重点侵蚀（钤印时边框受力不均，古印精髓）
  const edgeDots = Math.floor(size * 0.9);
  for (let i = 0; i < edgeDots; i++) {
    const onVertical = Math.random() > 0.5;
    const x = onVertical ? (Math.random() > 0.5 ? size * (0.04 + Math.random() * 0.08) : size * (0.88 + Math.random() * 0.08)) : Math.random() * size;
    const y = onVertical ? Math.random() * size : (Math.random() > 0.5 ? size * (0.04 + Math.random() * 0.08) : size * (0.88 + Math.random() * 0.08));
    ctx.fillStyle = `rgba(0,0,0,${0.35 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 2 + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // 3. 金石崩角与刀刻微瑕（模拟青田、寿山石金石感）
  const notches = Math.max(3, Math.floor(size * 0.04));
  for (let i = 0; i < notches; i++) {
    const isCorner = Math.random() > 0.35;
    let nx: number, ny: number;
    if (isCorner) {
      nx = Math.random() > 0.5 ? size * (0.05 + Math.random() * 0.03) : size * (0.95 - Math.random() * 0.03);
      ny = Math.random() > 0.5 ? size * (0.05 + Math.random() * 0.03) : size * (0.95 - Math.random() * 0.03);
    } else {
      const isH = Math.random() > 0.5;
      nx = isH ? Math.random() * size : (Math.random() > 0.5 ? size * 0.06 : size * 0.94);
      ny = isH ? (Math.random() > 0.5 ? size * 0.06 : size * 0.94) : Math.random() * size;
    }
    ctx.fillStyle = `rgba(0,0,0,${0.4 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(nx, ny, Math.random() * 3.5 + 1.2, Math.random() * 2.2 + 0.8, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── 生成篆书风格印章 ────────────────────────────────────
export function generateSealDataUrl(penName: string, style: SealStyle, size = 120): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.44;
  const chars = penName.slice(0, 2).split('');

  // 清空
  ctx.clearRect(0, 0, size, size);

  // 微抖动：仿古效果
  const jitter = () => (Math.random() - 0.5) * (size * 0.008);

  switch (style) {
    case 'yang_yuan': {
      // 阳文圆形朱文：只有朱色线条，底为透明（纸本色）
      ctx.strokeStyle = '#A63A2B';
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.arc(cx + jitter(), cy + jitter(), r, 0, Math.PI * 2);
      ctx.stroke();
      // 文字
      ctx.fillStyle = '#A63A2B';
      ctx.font = `bold ${size * 0.36}px "Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (chars.length === 1) {
        ctx.fillText(chars[0], cx, cy);
      } else {
        ctx.fillText(chars[0], cx, cy - size * 0.13);
        ctx.fillText(chars[1], cx, cy + size * 0.16);
      }
      break;
    }
    case 'yin_fang': {
      // 阴文方形白文：红底白字
      const pad = size * 0.06;
      ctx.fillStyle = '#A63A2B';
      ctx.beginPath();
      ctx.roundRect(pad + jitter(), pad + jitter(), size - pad * 2, size - pad * 2, 4);
      ctx.fill();
      // 内边框
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = size * 0.025;
      ctx.strokeRect(pad * 1.8, pad * 1.8, size - pad * 3.6, size - pad * 3.6);
      // 白字
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.38}px "Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (chars.length === 1) {
        ctx.fillText(chars[0], cx, cy);
      } else {
        ctx.fillText(chars[0], cx, cy - size * 0.14);
        ctx.fillText(chars[1], cx, cy + size * 0.17);
      }
      break;
    }
    case 'jiudie': {
      // 九叠篆方形：保留叠纹边框，不画底色（透明底）
      const p = size * 0.07;
      // 叠纹边框（简化：多层矩形描边）
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(166,58,43,${0.4 - i * 0.12})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(p + i * 3, p + i * 3, size - p * 2 - i * 6, size - p * 2 - i * 6);
      }
      // 横格纹（九叠特征）
      ctx.strokeStyle = 'rgba(166,58,43,0.1)';
      ctx.lineWidth = 0.5;
      for (let y = p * 2; y < size - p * 2; y += size * 0.12) {
        ctx.beginPath(); ctx.moveTo(p, y); ctx.lineTo(size - p, y); ctx.stroke();
      }
      // 字
      ctx.fillStyle = '#A63A2B';
      ctx.font = `bold ${size * 0.36}px "Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (chars.length === 1) {
        ctx.fillText(chars[0], cx, cy);
      } else {
        ctx.fillText(chars[0], cx, cy - size * 0.13);
        ctx.fillText(chars[1], cx, cy + size * 0.16);
      }
      break;
    }
    case 'niaochen': {
      // 鸟虫篆椭圆：深红底白字，椭圆形
      ctx.fillStyle = '#8B2F23';
      ctx.beginPath();
      ctx.ellipse(cx + jitter(), cy + jitter(), r * 1.15, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      // 装饰性鸟虫纹
      ctx.strokeStyle = 'rgba(255,220,180,0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * r * 0.7, cy + Math.sin(angle) * r * 0.55, size * 0.04, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 白字
      ctx.fillStyle = '#fff8f0';
      ctx.font = `bold ${size * 0.34}px "Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (chars.length === 1) {
        ctx.fillText(chars[0], cx, cy);
      } else {
        ctx.fillText(chars[0], cx, cy - size * 0.12);
        ctx.fillText(chars[1], cx, cy + size * 0.15);
      }
      break;
    }
    case 'guyuan': {
      // 仿古圆角混合：怀旧纸黄底，朱砂红字，圆角方形
      const pad2 = size * 0.08;
      const radius = size * 0.18;
      ctx.fillStyle = '#f5ead0';
      ctx.beginPath();
      ctx.roundRect(pad2 + jitter(), pad2 + jitter(), size - pad2 * 2, size - pad2 * 2, radius);
      ctx.fill();
      ctx.strokeStyle = '#A63A2B';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.roundRect(pad2, pad2, size - pad2 * 2, size - pad2 * 2, radius);
      ctx.stroke();
      // 旧噪点被统一 erosion 取代
      // 字
      ctx.fillStyle = '#8B2F23';
      ctx.font = `bold ${size * 0.37}px "Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (chars.length === 1) {
        ctx.fillText(chars[0], cx, cy);
      } else {
        ctx.fillText(chars[0], cx, cy - size * 0.13);
        ctx.fillText(chars[1], cx, cy + size * 0.16);
      }
      break;
    }
  }

  // Apply erosion after drawing everything
  applySealErosion(ctx, size);

  return canvas.toDataURL('image/png');
}

// ── React 预览组件 ────────────────────────────────────────
const SealGenerator: React.FC<SealGeneratorProps> = ({ penName, style, size = 120, onGenerated }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store onGenerated in ref to avoid triggering the effect on every render
  const onGeneratedRef = useRef(onGenerated);
  useEffect(() => { onGeneratedRef.current = onGenerated; }, [onGenerated]);

  useEffect(() => {
    let cancelled = false;
    void ensureCanvasFonts(penName).then(() => {
      if (cancelled) return;
      const dataUrl = generateSealDataUrl(penName, style, size);
      if (canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          if (!canvasRef.current) return;
          const ctx = canvasRef.current.getContext('2d')!;
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
      }
      onGeneratedRef.current?.(dataUrl);
    });
    return () => { cancelled = true; };
  }, [penName, style, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'crisp-edges' }}
    />
  );
};

export default SealGenerator;

export const SEAL_STYLE_LABELS: Record<SealStyle, string> = {
  yang_yuan: '阳文圆形',
  yin_fang: '阴文方形',
  jiudie: '九叠篆',
  niaochen: '鸟虫篆',
  guyuan: '仿古圆角',
};
