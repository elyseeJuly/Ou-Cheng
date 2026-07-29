import React from 'react';
import { useCreateDocument, useCreateForm, useCreateCaret, useCreateWorkflow, RHYME_BOOKS, JINTI_TYPES } from './CreateContext';
import CipaiSelector from '../../components/creator/CipaiSelector';
import StructuredInput from '../../components/creator/StructuredInput';

const ProPanel: React.FC = () => {
  const {
    title,
    setTitle,
    author,
    setAuthor,
    proLines,
    setProLines,
    showHeartNote,
    setShowHeartNote,
    heartNote,
    setHeartNote,
  } = useCreateDocument();
  const {
    proTab,
    setProTab,
    rhymeBook,
    setRhymeBook,
    poemType,
    setPoemType,
    jintiStart,
    setJintiStart,
    jintiRhyme,
    setJintiRhyme,
    derivedPoemType,
    selectedCipai,
    currentPatterns,
  } = useCreateForm();
  const {
    onCaretOnRhyme,
    onCellFocus,
    onCaretCell,
  } = useCreateCaret();
  const { settings, meterResult } = useCreateWorkflow();

  return (
    <div className="fade-in pro-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
      {/* 近体诗 / 词牌 切换 - 改用 .opt-item */}
      <div className="opt-group" style={{ justifyContent: 'center' }}>
        {(['jinti', 'cipai'] as const).map(t => (
          <button
            key={t}
            onClick={() => setProTab(t)}
            className={`opt-item ${proTab === t ? 'active' : ''}`}
            style={{ fontSize: 'var(--text-title)' }}
          >
            {t === 'jinti' ? '近体诗' : '词牌大观'}
          </button>
        ))}
      </div>

      {/* 韵书三枚 - 改用 .opt-item */}
      <div className="opt-group" style={{ justifyContent: 'center', gap: 'var(--space-4)' }}>
        <span style={{ fontSize: 'var(--text-note)', color: 'var(--ink-dan)', letterSpacing: '2px', fontFamily: 'var(--font-serif)', alignSelf: 'center' }}>韵书：</span>
        {RHYME_BOOKS.map(rb => (
          <button
            key={rb.value}
            onClick={() => setRhymeBook(rb.value)}
            className={`opt-item ${rhymeBook === rb.value ? 'active' : ''}`}
            style={{ fontSize: 'var(--text-note)' }}
          >
            {rb.label}
          </button>
        ))}
      </div>

      {/* 近体诗选择 */}
      {proTab === 'jinti' && (
        <div>
          {/* 体裁四卡 - 改用左侧朱砂竖线选中，去掉红边框红字 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {JINTI_TYPES.map(jt => (
              <button
                key={jt.value}
                onClick={() => setPoemType(jt.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: 'var(--paper-1)',
                  boxShadow: 'var(--shadow-paper)',
                  color: poemType === jt.value ? 'var(--ink-jiao)' : 'var(--ink-zhong)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  paddingLeft: poemType === jt.value ? '9px' : '12px',
                  borderLeft: poemType === jt.value ? '3px solid var(--accent-active)' : '3px solid transparent',
                }}
              >
                <div style={{ fontFamily: 'var(--font-kai)', fontSize: '15px' }}>{jt.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-dan)', marginTop: '2px' }}>{jt.chars}</div>
              </button>
            ))}
          </div>

          {/* 起调/首句 - 改用 .opt-item 小号，无卡片框，裸排 */}
          <div style={{ display: 'flex', gap: '16px', margin: '8px 0 12px 0' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-dan)', fontFamily: 'var(--font-serif)' }}>起调：</span>
              <div className="opt-group">
                {(['ze', 'ping'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setJintiStart(s)}
                    className={`opt-item ${jintiStart === s ? 'active' : ''}`}
                    style={{ fontSize: '13px' }}
                  >
                    {s === 'ze' ? '仄起' : '平起'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-dan)', fontFamily: 'var(--font-serif)' }}>首句：</span>
              <div className="opt-group">
                {(['no', 'yes'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setJintiRhyme(r)}
                    className={`opt-item ${jintiRhyme === r ? 'active' : ''}`}
                    style={{ fontSize: '13px' }}
                  >
                    {r === 'yes' ? '入韵' : '不入韵'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 词牌选择 */}
      {proTab === 'cipai' && (
        <div>
          <CipaiSelector value={selectedCipai || undefined} />
        </div>
      )}

      {/* 结构化录入组件 */}
      <div style={{ flex: 1, position: 'relative', marginTop: '8px' }}>
        <StructuredInput
          patterns={currentPatterns}
          lines={proLines}
          onChange={setProLines}
          meterResult={meterResult}
          onRhymeFocus={onCaretOnRhyme}
          onCellFocus={onCellFocus}
          onCaretCell={onCaretCell}
        />

        {/* 格律结果摘要 */}
        {meterResult && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: meterResult.isValid
              ? 'rgba(90,114,71,0.1)'
              : meterResult.violationCount > 3
                ? 'rgba(166,58,43,0.1)'
                : 'rgba(156,122,46,0.1)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '13px',
            color: meterResult.isValid ? 'var(--meter-ping)' : meterResult.violationCount > 3 ? 'var(--meter-error)' : 'var(--meter-warn)',
            fontFamily: 'var(--font-kai)',
            borderLeft: `3px solid ${meterResult.isValid ? 'var(--meter-ping)' : meterResult.violationCount > 3 ? 'var(--meter-error)' : 'var(--meter-warn)'}`,
          }}>
            {meterResult.summary}
          </div>
        )}
      </div>

      {/* 标题 / 笔名 移到底部 */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        <div className="input-group" style={{ flex: 1 }}>
          <label>标题</label>
          <input
            className="borderless-input"
            placeholder="无题"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label>笔名</label>
          <input
            className="borderless-input"
            placeholder={settings.defaultPenName}
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />
        </div>
      </div>

      {/* 挥毫心声 - 换文字代替几何三角 */}
      <div>
        <button
          onClick={() => setShowHeartNote(!showHeartNote)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-dan)',
            fontSize: '13px',
            fontFamily: 'var(--font-serif)',
            letterSpacing: '2px',
            padding: 0
          }}
        >
          {showHeartNote ? '藏' : '展'} 挥毫心声
        </button>
        {showHeartNote && (
          <textarea
            placeholder="记录灵感来源..."
            value={heartNote}
            onChange={e => setHeartNote(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '8px',
              minHeight: '70px',
              border: '1px solid var(--ink-qing)',
              borderRadius: 'var(--radius-xs)',
              padding: '10px',
              resize: 'vertical',
              fontFamily: 'var(--font-kai)',
              fontSize: '15px',
              background: 'var(--paper-1)',
              color: 'var(--ink-zhong)'
            }}
          />
        )}
      </div>

    </div>
  );
};

export default React.memo(ProPanel);
