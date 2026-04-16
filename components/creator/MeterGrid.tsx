import React from 'react';
import { CipaiData, MeterCheckResult } from '../../types';

interface MeterGridProps {
  cipai?: CipaiData;
  poemType?: string; // for jinti
  manualPatterns?: string[][]; // override
  meterResult?: MeterCheckResult | null;
}

export const TONE_LABELS: Record<string, { char: string; color: string; bg: string; desc: string }> = {
  P: { char: '平', color: '#1a6b3a', bg: 'rgba(45,90,61,0.08)', desc: '平声' },
  Z: { char: '仄', color: '#7a3a00', bg: 'rgba(122,58,0,0.08)', desc: '仄声' },
  R: { char: '韵', color: '#6b3fa0', bg: 'rgba(107,63,160,0.12)', desc: '韵脚' },
  X: { char: '可', color: '#aaa',     bg: 'transparent',          desc: '可平可仄' },
  r: { char: '叶', color: '#9b59b6', bg: 'rgba(155,89,182,0.08)', desc: '可韵可不韵' },
};

// 近体诗固定格律模板（显示用）
export const JINTI_DISPLAY: Record<string, { name: string; patterns: string[][] }> = {
  jueju_5:  {
    name: '五言绝句',
    patterns: [
      ['Z','Z','P','P','Z'],
      ['P','P','Z','Z','R'],
      ['P','P','P','Z','Z'],
      ['Z','Z','Z','P','R'],
    ],
  },
  jueju_7: {
    name: '七言绝句',
    patterns: [
      ['Z','Z','P','P','Z','Z','R'],
      ['P','P','Z','Z','Z','P','R'],
      ['P','P','Z','Z','P','P','Z'],
      ['Z','Z','P','P','Z','Z','R'],
    ],
  },
  lvshi_5: {
    name: '五言律诗',
    patterns: [
      ['Z','Z','P','P','Z'],
      ['P','P','Z','Z','R'],
      ['P','P','P','Z','Z'],
      ['Z','Z','Z','P','R'],
      ['Z','Z','P','P','Z'],
      ['P','P','Z','Z','R'],
      ['P','P','P','Z','Z'],
      ['Z','Z','Z','P','R'],
    ],
  },
  lvshi_7: {
    name: '七言律诗',
    patterns: [
      ['P','P','Z','Z','Z','P','R'],
      ['Z','Z','P','P','Z','Z','R'],
      ['Z','Z','P','P','P','Z','Z'],
      ['P','P','Z','Z','Z','P','R'],
      ['P','P','Z','Z','P','P','Z'],
      ['Z','Z','P','P','Z','Z','R'],
      ['Z','Z','P','P','P','Z','Z'],
      ['P','P','Z','Z','Z','P','R'],
    ],
  },
};

const MeterGrid: React.FC<MeterGridProps> = ({ cipai, poemType, manualPatterns, meterResult }) => {
  let patterns: string[][] = [];
  let name = '';

  if (manualPatterns) {
    patterns = manualPatterns;
    name = '自定义格律';
  } else if (cipai) {
    name = `《${cipai.name}》格律点阵`;
    const upper = cipai.upperPattern.map(s => s.split(''));
    const lower = cipai.lowerPattern?.map(s => s.split('')) || [];
    patterns = [...upper, ...(lower.length ? [[], ...lower] : [])]; // 空行分隔上下阕
  } else if (poemType && JINTI_DISPLAY[poemType]) {
    name = JINTI_DISPLAY[poemType].name;
    patterns = JINTI_DISPLAY[poemType].patterns;
  }

  if (patterns.length === 0) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px', color: '#999', letterSpacing: '3px',
        fontFamily: 'monospace', marginBottom: '10px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>· 格律点阵 · {name} ·</span>
        {cipai && (
          <span style={{ fontSize: '11px', color: '#bbb' }}>
            {cipai.charCount}字 · {cipai.representative && `代表：${cipai.representative}`}
          </span>
        )}
      </div>

      <div style={{
        background: 'rgba(247,241,227,0.6)',
        border: '1px solid rgba(26,26,26,0.06)',
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
      }}>
        {patterns.map((row, ri) => (
          row.length === 0
            ? (
              // 上下阕分隔
              <div key={`sep-${ri}`} style={{
                height: '1px', background: 'rgba(178,34,34,0.15)',
                margin: '10px 0',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(247,241,227,0.9)',
                  padding: '0 8px',
                  fontSize: '10px', color: 'rgba(178,34,34,0.6)',
                  letterSpacing: '2px',
                }}>· 换阕 ·</span>
              </div>
            )
            : (
              <div key={ri} style={{ display: 'flex', gap: '4px', marginBottom: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#ccc', width: '16px', textAlign: 'right', marginRight: '4px' }}>
                  {ri + 1}
                </span>
                {row.map((tone, ci) => {
                  const info = TONE_LABELS[tone] || TONE_LABELS['X'];
                  const charStatus = meterResult?.lines?.[ri]?.chars?.[ci]?.status || 'neutral';
                  
                  let bgColor = info.bg;
                  let color = info.color;
                  let borderColor = `${info.color}22`;
                  let tooltip = meterResult?.lines?.[ri]?.chars?.[ci]?.tooltip || '';

                  if (charStatus === 'ok' || charStatus === 'rhyme') {
                    bgColor = '#1a6b3a'; color = 'white'; borderColor = '#1a6b3a';
                  } else if (charStatus === 'warn') {
                    bgColor = '#b8860b'; color = 'white'; borderColor = '#b8860b';
                  } else if (charStatus === 'error') {
                    bgColor = '#b22222'; color = 'white'; borderColor = '#b22222';
                  }

                  return (
                    <span
                      key={ci}
                      title={`${info.desc}${tooltip ? '\n' + tooltip : ''}`}
                      style={{
                        width: '26px', height: '26px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: bgColor,
                        color: color,
                        fontSize: '13px',
                        borderRadius: '4px',
                        border: `1px solid ${borderColor}`,
                        fontFamily: 'var(--font-kaiti)',
                        cursor: 'help',
                        flexShrink: 0,
                      }}
                    >
                      {info.char}
                    </span>
                  );
                })}
              </div>
            )
        ))}

        {/* 图例 */}
        <div style={{
          display: 'flex', gap: '12px', marginTop: '12px',
          paddingTop: '10px', borderTop: '1px solid rgba(26,26,26,0.05)',
          flexWrap: 'wrap',
        }}>
          {Object.entries(TONE_LABELS).map(([k, v]) => (
            <span key={k} style={{ fontSize: '11px', color: v.color, letterSpacing: '1px' }}>
              {v.char}={v.desc}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeterGrid;
