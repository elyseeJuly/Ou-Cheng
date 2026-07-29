import React, { useMemo } from 'react';
import { CharResult, CharStatus, LineResult } from '../../types';

interface RhymeHighlighterProps {
  lineResults: LineResult[];
  isVertical?: boolean;
  fontSize?: number;
}

const STATUS_COLORS: Record<CharStatus, { color: string; bg: string; underline?: string }> = {
  ok:      { color: 'var(--meter-ping)',  bg: 'transparent' },
  warn:    { color: 'var(--meter-warn)',  bg: 'transparent', underline: '2px solid var(--meter-warn)' },
  error:   { color: 'var(--meter-error)', bg: 'transparent', underline: '2px solid var(--meter-error)' },
  neutral: { color: 'var(--ink-nong)',    bg: 'transparent' },
  rhyme:   { color: 'var(--meter-rhyme)', bg: 'transparent' },
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
                fontSize: '10px', color: 'var(--meter-error)', letterSpacing: '1px', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-serif)',
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
              fontSize: '10px', color: 'var(--meter-error)',
              border: '1px solid rgba(166,58,43,0.4)',
              borderRadius: '3px', padding: '0 4px',
              marginRight: '8px', verticalAlign: 'middle',
              fontFamily: 'var(--font-serif)',
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
          <span style={{ color: s.color, fontFamily: 'var(--font-kai)' }}>{label}</span>
        </div>
      );
    })}
  </div>
);
