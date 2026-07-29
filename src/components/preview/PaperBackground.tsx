import React from 'react';
import { PaperStyle } from '../../types';

interface PaperBackgroundProps {
  style: PaperStyle;
  children: React.ReactNode;
  className?: string;
}

// ── CSS 变量 & 纹理配置 ─────────────────────────────────
export const PAPER_CONFIG: Record<PaperStyle, {
  bg: string;
  label: string;
  svgPattern?: string;
}> = {
  xuan: {
    bg: '#F7F1E3',
    label: '宣纸',
  },
  meihua: {
    bg: '#F8EEE9',
    label: '梅花笺',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='30' cy='30' r='8' fill='none' stroke='%23D9B8AD' stroke-width='0.8'/%3E%3Ccircle cx='30' cy='22' r='3' fill='%23D9B8AD' opacity='0.4'/%3E%3Ccircle cx='38' cy='28' r='3' fill='%23D9B8AD' opacity='0.4'/%3E%3Ccircle cx='35' cy='37' r='3' fill='%23D9B8AD' opacity='0.4'/%3E%3Ccircle cx='25' cy='37' r='3' fill='%23D9B8AD' opacity='0.4'/%3E%3Ccircle cx='22' cy='28' r='3' fill='%23D9B8AD' opacity='0.4'/%3E%3Ccircle cx='90' cy='80' r='7' fill='none' stroke='%23D9B8AD' stroke-width='0.8'/%3E%3Ccircle cx='90' cy='73' r='3' fill='%23D9B8AD' opacity='0.3'/%3E%3Ccircle cx='97' cy='79' r='3' fill='%23D9B8AD' opacity='0.3'/%3E%3Ccircle cx='94' cy='87' r='3' fill='%23D9B8AD' opacity='0.3'/%3E%3Ccircle cx='84' cy='87' r='3' fill='%23D9B8AD' opacity='0.3'/%3E%3Ccircle cx='83' cy='79' r='3' fill='%23D9B8AD' opacity='0.3'/%3E%3C/svg%3E")`,
  },
  yunwen: {
    bg: '#EFF1EF',
    label: '云纹笺',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='80'%3E%3Cpath d='M10 50 Q30 20 50 50 Q70 80 90 50 Q110 20 130 50 Q150 80 160 50' fill='none' stroke='%23B9C4C6' stroke-width='1.2' opacity='0.5'/%3E%3Cpath d='M0 30 Q20 5 40 30 Q60 55 80 30 Q100 5 120 30 Q140 55 160 30' fill='none' stroke='%23B9C4C6' stroke-width='0.8' opacity='0.35'/%3E%3C/svg%3E")`,
  },
  zhu: {
    bg: '#F0F2E6',
    label: '竹纹笺',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='180'%3E%3Cline x1='30' y1='0' x2='30' y2='180' stroke='%23B5C2A3' stroke-width='1.5' opacity='0.5'/%3E%3Cellipse cx='30' cy='45' rx='8' ry='3' fill='none' stroke='%23B5C2A3' stroke-width='1' opacity='0.4'/%3E%3Cellipse cx='30' cy='90' rx='8' ry='3' fill='none' stroke='%23B5C2A3' stroke-width='1' opacity='0.4'/%3E%3Cellipse cx='30' cy='135' rx='8' ry='3' fill='none' stroke='%23B5C2A3' stroke-width='1' opacity='0.4'/%3E%3Cline x1='30' y1='45' x2='50' y2='35' stroke='%23B5C2A3' stroke-width='1' opacity='0.35'/%3E%3Cline x1='30' y1='90' x2='10' y2='78' stroke='%23B5C2A3' stroke-width='1' opacity='0.35'/%3E%3C/svg%3E")`,
  },
  lianhua: {
    bg: '#F3EFF0',
    label: '莲花笺',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cellipse cx='60' cy='60' rx='15' ry='20' fill='none' stroke='%23C7B4C0' stroke-width='0.8' opacity='0.5'/%3E%3Cellipse cx='60' cy='60' rx='25' ry='12' fill='none' stroke='%23C7B4C0' stroke-width='0.8' opacity='0.4' transform='rotate(45 60 60)'/%3E%3Cellipse cx='60' cy='60' rx='25' ry='12' fill='none' stroke='%23C7B4C0' stroke-width='0.8' opacity='0.4' transform='rotate(-45 60 60)'/%3E%3Ccircle cx='60' cy='60' r='4' fill='%23C7B4C0' opacity='0.3'/%3E%3C/svg%3E")`,
  },
};

const PaperBackground: React.FC<PaperBackgroundProps> = ({ style, children, className }) => {
  const cfg = PAPER_CONFIG[style];

  const noiseUrl = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const imgData = ctx.createImageData(128, 128);
    const data = imgData.data;
    const opacity = style === 'xuan' ? 0.09 : 0.075; // 提升宣纸颗粒明视度
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 40) + 180;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = Math.floor(Math.random() * 255 * opacity);
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }, [style]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        backgroundColor: cfg.bg,
        backgroundImage: cfg.svgPattern
          ? `${cfg.svgPattern}, url(${noiseUrl})`
          : `url(${noiseUrl})`,
        backgroundBlendMode: 'multiply',
        minHeight: '100%',
      }}
    >
      {/* 老化效果：四角阴影 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(120,80,30,0.08) 100%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default PaperBackground;

// ── 选择器组件：纸样切片，无 emoji ──────────────────────────
export const PaperStyleSelector: React.FC<{
  value: PaperStyle;
  onChange: (s: PaperStyle) => void;
}> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '10px' }}>
    {(Object.entries(PAPER_CONFIG) as [PaperStyle, typeof PAPER_CONFIG[PaperStyle]][]).map(([key, cfg]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        title={cfg.label}
        aria-label={cfg.label}
        style={{
          width: '30px', height: '30px', borderRadius: '50%', border: 'none',
          backgroundColor: cfg.bg,
          backgroundImage: cfg.svgPattern,
          backgroundSize: '60px',
          cursor: 'pointer',
          boxShadow: value === key
            ? '0 0 0 1.5px var(--paper-0), 0 0 0 3px var(--accent-active)'
            : 'inset 0 0 0 1px var(--ink-qing)',
          transition: 'box-shadow var(--dur-fast)',
        }}
      />
    ))}
  </div>
);