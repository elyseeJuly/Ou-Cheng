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
  emoji: string;
  svgPattern?: string;
}> = {
  xuan: {
    bg: '#F7F1E3',
    label: '宣纸',
    emoji: '📜',
  },
  meihua: {
    bg: '#FDF0F3',
    label: '梅花笺',
    emoji: '🌸',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='30' cy='30' r='8' fill='none' stroke='%23f9c9d4' stroke-width='0.8'/%3E%3Ccircle cx='30' cy='22' r='3' fill='%23f9c9d4' opacity='0.4'/%3E%3Ccircle cx='38' cy='28' r='3' fill='%23f9c9d4' opacity='0.4'/%3E%3Ccircle cx='35' cy='37' r='3' fill='%23f9c9d4' opacity='0.4'/%3E%3Ccircle cx='25' cy='37' r='3' fill='%23f9c9d4' opacity='0.4'/%3E%3Ccircle cx='22' cy='28' r='3' fill='%23f9c9d4' opacity='0.4'/%3E%3Ccircle cx='90' cy='80' r='7' fill='none' stroke='%23f9c9d4' stroke-width='0.8'/%3E%3Ccircle cx='90' cy='73' r='3' fill='%23f9c9d4' opacity='0.3'/%3E%3Ccircle cx='97' cy='79' r='3' fill='%23f9c9d4' opacity='0.3'/%3E%3Ccircle cx='94' cy='87' r='3' fill='%23f9c9d4' opacity='0.3'/%3E%3Ccircle cx='84' cy='87' r='3' fill='%23f9c9d4' opacity='0.3'/%3E%3Ccircle cx='83' cy='79' r='3' fill='%23f9c9d4' opacity='0.3'/%3E%3C/svg%3E")`,
  },
  yunwen: {
    bg: '#EDF3FD',
    label: '云纹笺',
    emoji: '☁️',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='80'%3E%3Cpath d='M10 50 Q30 20 50 50 Q70 80 90 50 Q110 20 130 50 Q150 80 160 50' fill='none' stroke='%23c5d9f5' stroke-width='1.2' opacity='0.5'/%3E%3Cpath d='M0 30 Q20 5 40 30 Q60 55 80 30 Q100 5 120 30 Q140 55 160 30' fill='none' stroke='%23c5d9f5' stroke-width='0.8' opacity='0.35'/%3E%3C/svg%3E")`,
  },
  zhu: {
    bg: '#EDFDF0',
    label: '竹纹笺',
    emoji: '🎋',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='180'%3E%3Cline x1='30' y1='0' x2='30' y2='180' stroke='%23b8e6c0' stroke-width='1.5' opacity='0.5'/%3E%3Cellipse cx='30' cy='45' rx='8' ry='3' fill='none' stroke='%23b8e6c0' stroke-width='1' opacity='0.4'/%3E%3Cellipse cx='30' cy='90' rx='8' ry='3' fill='none' stroke='%23b8e6c0' stroke-width='1' opacity='0.4'/%3E%3Cellipse cx='30' cy='135' rx='8' ry='3' fill='none' stroke='%23b8e6c0' stroke-width='1' opacity='0.4'/%3E%3Cline x1='30' y1='45' x2='50' y2='35' stroke='%23b8e6c0' stroke-width='1' opacity='0.35'/%3E%3Cline x1='30' y1='90' x2='10' y2='78' stroke='%23b8e6c0' stroke-width='1' opacity='0.35'/%3E%3C/svg%3E")`,
  },
  lianhua: {
    bg: '#F5EDFD',
    label: '莲花笺',
    emoji: '🪷',
    svgPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cellipse cx='60' cy='60' rx='15' ry='20' fill='none' stroke='%23d4b8f0' stroke-width='0.8' opacity='0.5'/%3E%3Cellipse cx='60' cy='60' rx='25' ry='12' fill='none' stroke='%23d4b8f0' stroke-width='0.8' opacity='0.4' transform='rotate(45 60 60)'/%3E%3Cellipse cx='60' cy='60' rx='25' ry='12' fill='none' stroke='%23d4b8f0' stroke-width='0.8' opacity='0.4' transform='rotate(-45 60 60)'/%3E%3Ccircle cx='60' cy='60' r='4' fill='%23d4b8f0' opacity='0.3'/%3E%3C/svg%3E")`,
  },
};

const PaperBackground: React.FC<PaperBackgroundProps> = ({ style, children, className }) => {
  const cfg = PAPER_CONFIG[style];

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        backgroundColor: cfg.bg,
        backgroundImage: cfg.svgPattern
          ? `${cfg.svgPattern}, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E")`,
        backgroundBlendMode: 'multiply',
        minHeight: '100%',
      }}
    >
      {/* 老化效果：四角阴影 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(120,80,30,0.06) 100%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default PaperBackground;

// ── 选择器组件 ─────────────────────────────────────────────
export const PaperStyleSelector: React.FC<{
  value: PaperStyle;
  onChange: (s: PaperStyle) => void;
}> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {(Object.entries(PAPER_CONFIG) as [PaperStyle, typeof PAPER_CONFIG[PaperStyle]][]).map(([key, cfg]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        title={cfg.label}
        style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          border: value === key ? '2px solid var(--cinnabar-red)' : '2px solid transparent',
          background: cfg.bg,
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          transition: 'border 0.2s, transform 0.15s',
          transform: value === key ? 'scale(1.15)' : 'scale(1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {cfg.emoji}
      </button>
    ))}
  </div>
);
