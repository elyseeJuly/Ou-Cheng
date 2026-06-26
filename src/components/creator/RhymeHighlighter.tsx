import React, { useMemo } from 'react';
import { CharResult, CharStatus, LineResult } from '../../types';

interface RhymeHighlighterProps {
  lineResults: LineResult[];
  isVertical?: boolean;
  fontSize?: number;
}

const STATUS_COLORS: Record<CharStatus, { color: string; bg: string; underline?: string }> = {
  ok:      { color: '#2d5a3d',        bg: 'transparent' },
  warn:    { color: '#b8860b',        bg: 'rgba(255,200,50,0.15)', underline: '1px solid #b8860b' },
  error:   { color: '#b22222',        bg: 'rgba(178,34,34,0.12)', underline: '2px solid #b22222' },
  neutral: { color: 'var(--ink-black)', bg: 'transparent' },
  rhyme:   { color: '#6b3fa0',        bg: 'rgba(107,63,160,0.1)', underline: '1px dashed #6b3fa0' },
};

const CharSpan: React.FC<{ result: CharResult; fontSize: number }> = ({ result, fontSize }) => {
  const style = STATUS_COLORS[result.status];
  return (
    <span
      title={result.tooltip || undefined}
      style={{
        color: style.color,
        background: style.bg,
        borderBottom: style.underline,
        fontSize: `${fontSize}px`,
        fontFamily: 'inherit',
        letterSpacing: '2px',
        cursor: result.tooltip ? 'help' : 'default',
        transition: 'background 0.2s',
        display: 'inline-block',
        lineHeight: 2.2,
        padding: '0 1px',
      }}
    >
      {result.char}
    </span>
  );
};

const RhymeHighlighter: React.FC<RhymeHighlighterProps> = ({
  lineResults, isVertical = false, fontSize = 20,
}) => {
  if (!lineResults || lineResults.length === 0) return null;

  if (isVertical) {
    return (
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '12px', alignItems: 'flex-start' }}>
        {lineResults.map((line, li) => (
          <div
            key={li}
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Volta 标注（十四行诗第9行） */}
            {line.isVolta && (
              <div style={{
                position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                fontSize: '10px', color: '#b22222', letterSpacing: '1px', whiteSpace: 'nowrap',
                fontFamily: 'monospace',
              }}>
                ▼ Volta
              </div>
            )}
            {line.chars.map((c, ci) => (
              <CharSpan key={ci} result={c} fontSize={fontSize} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lineResults.map((line, li) => (
        <div key={li} style={{ position: 'relative', lineHeight: 2.2 }}>
          {line.isVolta && (
            <div style={{
              display: 'inline-block',
              fontSize: '10px', color: '#b22222',
              border: '1px solid rgba(178,34,34,0.4)',
              borderRadius: '3px', padding: '0 4px',
              marginRight: '8px', verticalAlign: 'middle',
              fontFamily: 'monospace',
            }}>
              Volta ↓
            </div>
          )}
          {line.chars.map((c, ci) => (
            <CharSpan key={ci} result={c} fontSize={fontSize} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default RhymeHighlighter;

// ── 颜色图例 ─────────────────────────────────────────────
export const MeterLegend: React.FC = () => (
  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
    {([
      { status: 'ok' as CharStatus, label: '合律' },
      { status: 'warn' as CharStatus, label: '可通押/多音' },
      { status: 'error' as CharStatus, label: '出律' },
      { status: 'rhyme' as CharStatus, label: '韵脚' },
    ]).map(({ status, label }) => {
      const s = STATUS_COLORS[status];
      return (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '16px', height: '16px', borderRadius: '3px',
            background: s.bg || 'transparent',
            border: `1px solid ${s.color}`,
            display: 'inline-block',
          }} />
          <span style={{ color: s.color, fontFamily: 'var(--font-kaiti)' }}>{label}</span>
        </div>
      );
    })}
  </div>
);
