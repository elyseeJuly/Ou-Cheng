import React, { useRef, useEffect } from 'react';
import { MeterCheckResult } from '../../types';
import VerseRow from './VerseRow';

interface StructuredInputProps {
  patterns: string[][];
  lines: string[];
  meterResult?: MeterCheckResult | null;
  onChange: (lines: string[]) => void;
  onRhymeFocus?: (onRhyme: boolean, anchorRow: number) => void; // 韵镜联动
  onCellFocus?: (toneReq: 'P' | 'Z' | null) => void; // 拾字囊平仄联动
  onCaretCell?: (rowIndex: number, colIndex: number) => void; // 当前光标位置
}

type CharState = 'ok' | 'warn' | 'error' | 'neutral' | 'rhyme' | 'pending';

const StructuredInput: React.FC<StructuredInputProps> = ({
  patterns, lines, meterResult, onChange, onRhymeFocus, onCellFocus, onCaretCell,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => {
    if (lines.length < patterns.length) {
      const nl = [...lines];
      while (nl.length < patterns.length) nl.push('');
      onChangeRef.current(nl);
    }
  }, [patterns, lines.length]);

  const setLine = (val: string, ri: number) => {
    const nl = [...lines]; nl[ri] = val; onChange(nl);
  };

  const focusRow = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < patterns.length; i += dir) {
      if (patterns[i].length > 0) { inputRefs.current[i]?.focus(); return; }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, ri: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); focusRow(ri, 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusRow(ri, -1); }
    else if (e.key === 'Backspace' && (lines[ri] || '') === '') { e.preventDefault(); focusRow(ri, -1); }
  };

  return (
    <div className="structured-input">
      {patterns.map((row, ri) => {
        if (row.length === 0) {
          return <div key={`sep-${ri}`} className="verse-sep"><span>换阕</span></div>;
        }
        const actualLineIndex = patterns.slice(0, ri).filter(r => r.length > 0).length;
        const isLast = ri === patterns.length - 1 || patterns[ri + 1]?.length === 0;
        const endsRhyme = /[Rr]/.test(row[row.length - 1]);
        const punc = (endsRhyme || isLast) ? '。' : '，';
        const value = lines[ri] || '';

        const rawLine = meterResult?.lines?.[actualLineIndex];
        const charStates: CharState[] = row.map((_, ci) => {
          return (rawLine?.chars?.[ci]?.status as CharState) || 'neutral';
        });

        return (
          <VerseRow
            key={ri}
            pattern={row.join('')}
            value={value}
            charStates={charStates}
            punctuation={punc}
            inputRef={el => { inputRefs.current[ri] = el; }}
            onChange={val => setLine(val, ri)}
            onKeyDown={e => handleKeyDown(e, ri)}
            onCaretOnRhyme={isOnRhyme => onRhymeFocus?.(isOnRhyme, ri)}
            onCellFocus={onCellFocus}
            onCaretCell={colIndex => onCaretCell?.(ri, colIndex)}
          />
        );
      })}

      {/* 符号提示图例，以淡墨小字放在输入区底部 */}
      {patterns.some(row => row.length > 0) && (
        <div style={{
          marginTop: '16px',
          fontSize: 'var(--text-micro)',
          color: 'var(--ink-dan)',
          letterSpacing: '2px',
          textAlign: 'center',
          fontFamily: 'var(--font-serif)',
          userSelect: 'none'
        }}>
          ○平 ●仄 ◎韵 ◐可平可仄
        </div>
      )}
    </div>
  );
};

export default StructuredInput;
