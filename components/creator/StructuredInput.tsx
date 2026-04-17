import React, { useRef, useEffect } from 'react';
import { TONE_LABELS } from './MeterGrid';
import { MeterCheckResult } from '../../types';

interface StructuredInputProps {
  patterns: string[][];
  lines: string[];
  meterResult?: MeterCheckResult | null;
  onChange: (lines: string[]) => void;
  inputMode: 'split' | 'interleaved';
}

const StructuredInput: React.FC<StructuredInputProps> = ({ patterns, lines, meterResult, onChange, inputMode }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Stable ref for onChange to prevent effect dependency loop
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Expand lines array if it's shorter than patterns (ignoring empty separators)
  useEffect(() => {
    if (lines.length < patterns.length) {
      const newLines = [...lines];
      while (newLines.length < patterns.length) {
        newLines.push('');
      }
      onChangeRef.current(newLines);
    }
  }, [patterns, lines.length]);

  const handleInputChange = (val: string, ri: number) => {
    const newLines = [...lines];
    newLines[ri] = val;
    onChange(newLines);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, ri: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Move focus to next valid row
      for (let i = ri + 1; i < patterns.length; i++) {
        if (patterns[i].length > 0 && inputRefs.current[i]) {
          inputRefs.current[i]?.focus();
          break;
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      for (let i = ri - 1; i >= 0; i--) {
        if (patterns[i].length > 0 && inputRefs.current[i]) {
          inputRefs.current[i]?.focus();
          break;
        }
      }
    } else if (e.key === 'Backspace') {
       if (lines[ri] === '') {
          e.preventDefault();
          for (let i = ri - 1; i >= 0; i--) {
             if (patterns[i].length > 0 && inputRefs.current[i]) {
               inputRefs.current[i]?.focus();
               break;
             }
          }
       }
    }
  };

  return (
    <div className={`structured-input ${inputMode}`} style={{
      background: 'rgba(247,241,227,0.3)', padding: '20px', borderRadius: '8px', border: '1px solid #ebd9c8'
    }}>
      {patterns.map((row, ri) => {
        if (row.length === 0) {
          return (
            <div key={`sep-${ri}`} style={{
              height: '1px', background: 'rgba(178,34,34,0.15)',
              margin: '24px 0', position: 'relative',
            }}>
              <span style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(247,241,227,0.9)', padding: '0 8px',
                fontSize: '11px', color: 'rgba(178,34,34,0.6)', letterSpacing: '2px',
              }}>
                · 换阕 ·
              </span>
            </div>
          );
        }

        const isLastInStanza = (ri === patterns.length - 1) || (patterns[ri + 1].length === 0);
        const endsWithRhyme = row[row.length - 1] === 'R' || row[row.length - 1] === 'r';
        const punc = (endsWithRhyme || isLastInStanza) ? '。' : '，';
        
        const currentLine = lines[ri] || '';

        return (
          <div key={ri} className="structured-row" style={{
            display: 'flex', flexDirection: 'column', marginBottom: '16px',
          }}>
            {/* Interleaved Meter Dots */}
            {inputMode === 'interleaved' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', paddingLeft: '28px' }}>
                {row.map((tone, ci) => {
                  const info = TONE_LABELS[tone] || TONE_LABELS['X'];
                  const charStatus = meterResult?.lines?.[ri]?.chars?.[ci]?.status || 'neutral';
                  
                  let bgColor = info.bg;
                  let color = info.color;
                  let borderColor = `${info.color}22`;
                  let additionalTooltip = meterResult?.lines?.[ri]?.chars?.[ci]?.tooltip || '';

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
                      title={`${info.desc}${additionalTooltip ? '\n' + additionalTooltip : ''}`}
                      style={{
                        width: '22px', height: '14px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: bgColor, color: color,
                        fontSize: '10px', borderRadius: '3px',
                        border: `1px solid ${borderColor}`,
                        fontFamily: 'var(--font-kaiti)',
                      }}
                    >
                      {info.char}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Input Line */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#ccc', width: '20px', textAlign: 'right', marginRight: '8px' }}>
                {ri + 1}
              </span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  ref={el => inputRefs.current[ri] = el}
                  className="structured-line-input"
                  type="text"
                  maxLength={row.length}
                  value={currentLine}
                  onChange={(e) => handleInputChange(e.target.value, ri)}
                  onKeyDown={(e) => handleKeyDown(e, ri)}
                  placeholder={'○'.repeat(row.length)}
                  style={{
                    fontFamily: 'var(--font-kaiti)',
                    fontSize: '20px',
                    letterSpacing: '10px',
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed rgba(178,34,34,0.3)',
                    outline: 'none',
                    width: `${row.length * 30 + 10}px`,
                    color: '#222',
                    transition: 'border-bottom 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid rgba(178,34,34,0.8)'}
                  onBlur={(e) => e.target.style.borderBottom = '1px dashed rgba(178,34,34,0.3)'}
                />
                {/* Character Count Validation Feedback */}
                <div style={{
                  position: 'absolute', right: '12px', bottom: '-16px',
                  fontSize: '10px', color: currentLine.length === row.length ? '#1a6b3a' : '#b8860b',
                  fontFamily: 'monospace'
                }}>
                  {currentLine.length}/{row.length}
                </div>
              </div>
              
              {/* Punctuation Mark */}
              <span style={{
                fontFamily: 'var(--font-kaiti)',
                fontSize: '22px',
                color: '#888',
                marginLeft: '4px',
              }}>
                {punc}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StructuredInput;
