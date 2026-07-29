import React, { useState, useEffect, useRef } from 'react';
import RhymeMirror from './RhymeMirror';
import ForagePouch from './ForagePouch';
import type { RhymeBook } from '../../types';

interface SidePanelProps {
  visible: boolean;
  onHide: () => void;
  // 韵镜 props
  anchorChar: string | null;
  usedRhymes: string[];
  rhymeBook: RhymeBook;
  onRhymePos: boolean;          // 当前焦点是否在韵位
  onRhymePick: (char: string) => void;
  // 拾字囊 props
  toneReq: 'P' | 'Z' | null;
  onWordPick: (word: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  visible, onHide,
  anchorChar, usedRhymes, rhymeBook, onRhymePos, onRhymePick,
  toneReq, onWordPick,
}) => {
  const [tab, setTab] = useState<'rhyme' | 'pouch'>('pouch');
  const [pinned, setPinned] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);

  // 自动切到「韵」签：当焦点在韵位且用户未手动锁定「囊」签时
  useEffect(() => {
    if (!pinned && onRhymePos) setTab('rhyme');
  }, [onRhymePos, pinned]);

  // 当面板从隐藏切为显示时，默认显示拾字囊（除非韵位焦点已自动切）
  useEffect(() => {
    if (visible && !pinned && !onRhymePos) setTab('pouch');
  }, [visible, pinned, onRhymePos]);

  // 移动端/iOS Safari 键盘遮挡修正：监听 visualViewport 变化动态调整 bottom 位移
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      if (!panelRef.current) return;
      const vh = window.visualViewport!;
      const keyboardHeight = window.innerHeight - vh.height;
      if (keyboardHeight > 0 && window.innerWidth <= 900) {
        panelRef.current.style.bottom = `${keyboardHeight}px`;
      } else {
        panelRef.current.style.bottom = '';
      }
    };
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return (
    <aside ref={panelRef} className={`side-panel ${visible ? 'show' : ''}`}>
      <header className="side-panel-head">
        <div className="opt-group" style={{ margin: 0 }}>
          <button
            className={`opt-item ${tab === 'rhyme' ? 'active' : ''}`}
            onClick={() => { setTab('rhyme'); setPinned(true); }}
          >韵</button>
          <button
            className={`opt-item ${tab === 'pouch' ? 'active' : ''}`}
            onClick={() => { setTab('pouch'); setPinned(true); }}
          >囊</button>
        </div>
        <button className="side-panel-hide" onClick={onHide}>隐</button>
      </header>

      {tab === 'rhyme' && (
        <div className="side-panel-body">
          <RhymeMirror
            anchorChar={anchorChar}
            usedRhymes={usedRhymes}
            rhymeBook={rhymeBook}
            visible={true}
            onPick={onRhymePick}
            onHide={() => { setTab('pouch'); }}
          />
        </div>
      )}

      {tab === 'pouch' && (
        <div className="side-panel-body">
          <ForagePouch toneReq={toneReq} onPick={onWordPick} />
        </div>
      )}
    </aside>
  );
};

export default SidePanel;
