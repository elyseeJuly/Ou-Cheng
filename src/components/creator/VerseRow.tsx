import React, { useRef, useState, useEffect } from 'react';

type CharState = 'ok' | 'warn' | 'error' | 'neutral' | 'rhyme' | 'pending';

const PATTERN_SYMBOL: Record<string, string> = {
  P: '○', Z: '●', R: '◎', r: '◎', X: '◐',
};

interface VerseRowProps {
  pattern: string;              // "XZPPXZPR"
  value: string;
  charStates: CharState[];      // 来自 meterChecker，与 value 对齐
  punctuation: string;          // ，。
  inputRef: (el: HTMLInputElement | null) => void;   // 沿用现有的行级焦点管理
  onChange: (v: string) => void;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onCaretOnRhyme: (isOnRhyme: boolean) => void;      // 通知韵镜显隐
  onCellFocus?: (toneReq: 'P' | 'Z' | null) => void; // 通知拾字囊当前字格平仄
  onCaretCell?: (colIndex: number) => void;           // 通知父级当前光标列
}

const VerseRow: React.FC<VerseRowProps> = ({
  pattern, value, charStates, punctuation, inputRef, onChange, onKeyDown, onCaretOnRhyme, onCellFocus, onCaretCell,
}) => {
  const composing = useRef(false);
  const [committedLen, setCommittedLen] = useState([...value].length);
  const ghostRef = useRef<HTMLInputElement | null>(null);
  const [caretPos, setCaretPos] = useState([...value].length);
  const [overflowed, setOverflowed] = useState(false);
  const patternChars = [...pattern];
  const valueChars = [...value];

  const lastValRef = useRef(value);

  // 同步 value 到 committedLen，仅在聚焦时依据 DOM 选区同步光标，或失焦/外部重置时处理光标
  useEffect(() => {
    if (!composing.current) {
      setCommittedLen([...value].length);
      if (ghostRef.current && document.activeElement === ghostRef.current) {
        syncCaret(ghostRef.current);
      } else if (value === '' || Math.abs([...value].length - [...lastValRef.current].length) > 1) {
        setCaretPos([...value].length);
      }
      lastValRef.current = value;
    }
  }, [value]);

  const syncCaret = (el: HTMLInputElement) => {
    const codeUnitPos = el.selectionStart ?? el.value.length;
    const pos = Math.min([...el.value.slice(0, codeUnitPos)].length, patternChars.length);
    setCaretPos(pos);
    onCaretCell?.(pos);
    onCaretOnRhyme(/[Rr]/.test(patternChars[Math.min(pos, patternChars.length - 1)] ?? ''));
    // 当前字格平仄需求：P/Z 直接传出，R/r/X 传 null（韵位由韵镜负责）
    const reqChar = patternChars[Math.min(pos, patternChars.length - 1)];
    onCellFocus?.(reqChar === 'P' ? 'P' : reqChar === 'Z' ? 'Z' : null);
  };

  const setRef = (el: HTMLInputElement | null) => {
    ghostRef.current = el;
    inputRef(el);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    syncCaret(e.currentTarget);
    // 移动端键盘遮挡处理：聚焦行滚动到视野中央
    if (e.currentTarget && typeof e.currentTarget.scrollIntoView === 'function') {
      setTimeout(() => {
        e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <div className="verse-row">
      {/* 符号行：传统校律符号，替代原彩色标签 */}
      <div className="verse-symbols">
        {patternChars.map((p, i) => (
          <span key={i} className={`p-symbol ${
            /[Rr]/.test(p) && charStates[i] === 'rhyme' && valueChars[i] ? 'rhyme-hit' : ''
          }`}>{PATTERN_SYMBOL[p] ?? '○'}</span>
        ))}
      </div>

      <div className="verse-cells">
        {patternChars.map((_, i) => {
          const ch = valueChars[i];
          const state = charStates[i] ?? 'neutral';
          const showCaret = !composing.current && i === caretPos && caretPos < patternChars.length;
          return (
            <div key={i} className={`verse-cell ${ch ? 'filled' : ''} state-${state} ${showCaret ? 'has-caret' : ''}`}>
              {ch && (
                <span
                  key={`${i}-${ch}`}
                  className="verse-char"
                >{ch}</span>
              )}
              {/* 自绘光标：caret-color: transparent 的补偿 */}
              {showCaret && (
                <span className="verse-caret" />
              )}
            </div>
          );
        })}
        <span className="verse-punct">{punctuation}</span>

        {/* 透明输入层：接收焦点与 IME，自身不可见 */}
        <input
          ref={setRef}
          className="verse-input-ghost"
          value={value}
          maxLength={patternChars.length * 2}
          aria-label={`格律输入，限 ${patternChars.length} 字`}
          aria-describedby={overflowed ? 'verse-overflow-warning' : undefined}
          onChange={e => {
            setOverflowed([...e.target.value].length > patternChars.length);
            const normalized = [...e.target.value].slice(0, patternChars.length).join('');
            onChange(normalized);
            if (!composing.current) {
              setCommittedLen([...normalized].length);
              syncCaret(e.target);
            }
          }}
          onCompositionStart={() => { composing.current = true; setCaretPos(-1); }}
          onCompositionEnd={e => {
            composing.current = false;
            const target = e.target as HTMLInputElement;
            setOverflowed([...target.value].length > patternChars.length);
            const normalized = [...target.value].slice(0, patternChars.length).join('');
            setCommittedLen([...normalized].length);
            onChange(normalized);
            syncCaret(target);
          }}
          onKeyDown={onKeyDown}
          onKeyUp={e => syncCaret(e.currentTarget)}
          onFocus={handleFocus}
          onBlur={() => { onCaretOnRhyme(false); setCaretPos(-1); }}
          autoComplete="off" autoCorrect="off" spellCheck={false}
        />
      </div>
      {overflowed && <span id="verse-overflow-warning" className="verse-overflow-warning" role="alert">超出格数的文字未写入</span>}
    </div>
  );
};
export default VerseRow;
