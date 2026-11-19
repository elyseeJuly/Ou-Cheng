import React, { useState, useEffect, useRef } from 'react';
import { getRhymeGroups, getGroupChars } from '../../engine/rhymeData';
import { RHYME_GROUPS } from '../../engine/rhymeGroupData';
import type { RhymeBook } from '../../types';
import { useCreateCaret } from '../../pages/Create/CreateContext';

interface Props {
  anchorChar: string | null;   // 全诗第一个已填的韵脚字
  usedRhymes: string[];        // 本诗已用韵字（打淡防重韵）
  rhymeBook: RhymeBook;
  visible: boolean;            // 焦点是否在韵位
  onPick: (char: string) => void;
  onHide: () => void;
}

const BOOK_LABEL: Record<RhymeBook, string> = {
  ping_shui: '平水韵', ci_lin: '词林正韵', xin_yun: '中华新韵',
};

const RhymeMirror: React.FC<Props> = ({ anchorChar, usedRhymes, rhymeBook, visible, onPick, onHide }) => {
  const { manualRhymeGroupId: manualGroupId, setManualRhymeGroupId: setManualGroupId } = useCreateCaret();
  const [showSelector, setShowSelector] = useState(false);
  const mirrorRef = useRef<HTMLElement | null>(null);

  const multiGroups = anchorChar ? getRhymeGroups(anchorChar, rhymeBook) : [];
  const autoGroup = multiGroups.length === 1 ? multiGroups[0] : null;
  const activeGroupId = manualGroupId || autoGroup?.groupId || null;
  const activeGroupName = manualGroupId
    ? RHYME_GROUPS[rhymeBook].find(g => g.id === manualGroupId)?.name || ''
    : autoGroup?.groupName || '';

  const chars = activeGroupId
    ? getGroupChars(activeGroupId, rhymeBook).slice(0, 60)
    : [];

  const allGroups = RHYME_GROUPS[rhymeBook];

  // iOS Safari 键盘遮挡修正：监听 visualViewport 变化调整 bottom
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      if (!mirrorRef.current) return;
      const vh = window.visualViewport!;
      const keyboardHeight = window.innerHeight - vh.height;
      if (keyboardHeight > 0) {
        mirrorRef.current.style.bottom = `${keyboardHeight + 8}px`;
      } else {
        mirrorRef.current.style.bottom = '';
      }
    };
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const handleTitleClick = () => {
    setShowSelector(prev => !prev);
  };

  const handleSelectGroup = (groupId: string) => {
    setManualGroupId(groupId);
    setShowSelector(false);
  };

  const handleResetGroup = () => {
    setManualGroupId(null);
    setShowSelector(false);
  };

  return (
    <aside ref={mirrorRef} className={`rhyme-mirror ${visible ? 'show' : ''}`} aria-hidden={!visible}>
      <header className="rhyme-mirror-head">
        <span
          className="rhyme-mirror-title"
          onClick={handleTitleClick}
          title="点击选韵部（限韵创作）"
          style={{ cursor: 'pointer' }}
        >
          {activeGroupId
            ? `${BOOK_LABEL[rhymeBook]} · ${activeGroupName}`
            : BOOK_LABEL[rhymeBook]}
        </span>
        <button className="rhyme-mirror-hide" onClick={onHide}>隐</button>
      </header>

      {/* 多韵部字候选提醒 */}
      {multiGroups.length > 1 && !manualGroupId && (
        <div className="rhyme-multi-hint" style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(212, 160, 23, 0.12)', borderBottom: '1px solid rgba(212, 160, 23, 0.2)' }}>
          <span style={{ opacity: 0.85 }}>『{anchorChar}』兼多韵部:</span>
          {multiGroups.map(g => (
            <button
              key={g.groupId}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(212, 160, 23, 0.4)',
                background: 'rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
              onClick={() => setManualGroupId(g.groupId)}
            >
              {g.groupName}
            </button>
          ))}
        </div>
      )}

      {/* 韵部选择器 */}
      {showSelector && (
        <div className="rhyme-mirror-selector">
          <button className="rhyme-selector-reset" onClick={handleResetGroup}>
            恢复自动定韵
          </button>
          <div className="rhyme-selector-grid">
            {allGroups.map(g => (
              <button
                key={g.id}
                className={`rhyme-selector-item ${g.id === activeGroupId ? 'active' : ''}`}
                onClick={() => handleSelectGroup(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeGroupId ? (
        <div className="rhyme-mirror-grid">
          {chars.map(c => (
            <button key={c}
              className={`rhyme-char ${usedRhymes.includes(c) ? 'used' : ''}`}
              onMouseDown={e => e.preventDefault()}  /* preventDefault 保住格子焦点 */
              onClick={() => onPick(c)}
            >{c}</button>
          ))}
        </div>
      ) : (
        <p className="rhyme-mirror-empty">落下第一韵，即现同部之字</p>
      )}
    </aside>
  );
};
export default RhymeMirror;
