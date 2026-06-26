import React, { useEffect, useRef } from 'react';
import { Seal, SealStyle } from '../../types';

interface SealGeneratorProps {
  penName: string;
  style: SealStyle;
  size?: number;
  onGenerated?: (dataUrl: string) => void;
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
      // 阳文圆形朱文：白底红边红字
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx + jitter(), cy + jitter(), r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b22222';
      ctx.lineWidth = size * 0.05;
      ctx.stroke();
      // 文字
      ctx.fillStyle = '#b22222';
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
      ctx.fillStyle = '#b22222';
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
      // 九叠篆方形：白底红字，叠纹边框
      const p = size * 0.07;
      ctx.fillStyle = '#fff8f0';
      ctx.fillRect(p, p, size - p * 2, size - p * 2);
      // 叠纹边框（简化：多层矩形描边）
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(178,34,34,${0.4 - i * 0.12})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(p + i * 3, p + i * 3, size - p * 2 - i * 6, size - p * 2 - i * 6);
      }
      // 横格纹（九叠特征）
      ctx.strokeStyle = 'rgba(178,34,34,0.1)';
      ctx.lineWidth = 0.5;
      for (let y = p * 2; y < size - p * 2; y += size * 0.12) {
        ctx.beginPath(); ctx.moveTo(p, y); ctx.lineTo(size - p, y); ctx.stroke();
      }
      // 字
      ctx.fillStyle = '#b22222';
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
      ctx.fillStyle = '#8b0000';
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
      ctx.strokeStyle = '#b22222';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.roundRect(pad2, pad2, size - pad2 * 2, size - pad2 * 2, radius);
      ctx.stroke();
      // 做旧纹理：随机噪点
      for (let i = 0; i < 60; i++) {
        const nx = Math.random() * size, ny = Math.random() * size;
        ctx.fillStyle = `rgba(150,100,60,${Math.random() * 0.08})`;
        ctx.fillRect(nx, ny, 1, 1);
      }
      // 字
      ctx.fillStyle = '#922b21';
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

  return canvas.toDataURL('image/png');
}

// ── React 预览组件 ────────────────────────────────────────
const SealGenerator: React.FC<SealGeneratorProps> = ({ penName, style, size = 120, onGenerated }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store onGenerated in ref to avoid triggering the effect on every render
  const onGeneratedRef = useRef(onGenerated);
  useEffect(() => { onGeneratedRef.current = onGenerated; }, [onGenerated]);

  useEffect(() => {
    const dataUrl = generateSealDataUrl(penName, style, size);
    if (canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current!.getContext('2d')!;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0);
      };
      img.src = dataUrl;
    }
    onGeneratedRef.current?.(dataUrl);
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
