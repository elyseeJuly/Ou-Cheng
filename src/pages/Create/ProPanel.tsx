import React from 'react';
import { useCreate, RHYME_BOOKS, JINTI_TYPES } from './CreateContext';
import MeterGrid from '../../components/creator/MeterGrid';
import CipaiSelector from '../../components/creator/CipaiSelector';
import StructuredInput from '../../components/creator/StructuredInput';
import { MeterLegend } from '../../components/creator/RhymeHighlighter';

const ProPanel: React.FC = () => {
  const {
    title,
    setTitle,
    author,
    setAuthor,
    proTab,
    setProTab,
    proLines,
    setProLines,
    proInputMode,
    setProInputMode,
    rhymeBook,
    setRhymeBook,
    poemType,
    setPoemType,
    jintiStart,
    setJintiStart,
    jintiRhyme,
    setJintiRhyme,
    derivedPoemType,
    meterResult,
    selectedCipai,
    setSelectedCipai,
    currentPatterns,
    showHeartNote,
    setShowHeartNote,
    heartNote,
    setHeartNote,
    settings,
  } = useCreate();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
      {/* 基本信息 */}
      <div style={{ display: 'flex', gap: '16px' }}>
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

      {/* 近体诗 / 词牌 切换 */}
      <div style={{ display: 'flex', background: '#f0ede8', borderRadius: '20px', padding: '3px', gap: '4px' }}>
        {(['jinti', 'cipai'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setProTab(t); setProLines([]); }}
            style={{
              flex: 1, 
              padding: '7px 0', 
              borderRadius: '16px', 
              border: 'none',
              background: proTab === t ? '#1a1a1a' : 'transparent',
              color: proTab === t ? '#fff' : '#888',
              cursor: 'pointer', 
              transition: 'all 0.2s',
              fontFamily: 'var(--font-kaiti)', 
              fontSize: '15px', 
              letterSpacing: '2px',
            }}
          >
            {t === 'jinti' ? '近体诗' : '词牌大观'}
          </button>
        ))}
      </div>

      {/* 韵书与排版模式层 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        {/* 韵书切换 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#999', letterSpacing: '2px', fontFamily: 'monospace' }}>韵书：</span>
          {RHYME_BOOKS.map(rb => (
            <button
              key={rb.value}
              onClick={() => setRhymeBook(rb.value)}
              style={{
                padding: '4px 12px', 
                borderRadius: '14px', 
                border: 'none',
                background: rhymeBook === rb.value ? '#1a1a1a' : '#f0ede8',
                color: rhymeBook === rb.value ? '#fff' : '#888',
                cursor: 'pointer', 
                fontSize: '13px', 
                transition: 'all 0.2s',
                fontFamily: 'var(--font-kaiti)',
              }}
            >
              {rb.label}
            </button>
          ))}
        </div>

        {/* 录入排版开关 */}
        <div style={{ display: 'flex', background: '#f0ede8', borderRadius: '14px', padding: '2px', gap: '2px' }}>
          {(['interleaved', 'split'] as const).map(t => (
            <button
              key={t}
              onClick={() => setProInputMode(t)}
              style={{
                padding: '4px 10px', 
                borderRadius: '12px', 
                border: 'none',
                background: proInputMode === t ? 'var(--cinnabar-red)' : 'transparent',
                color: proInputMode === t ? '#fff' : '#888',
                cursor: 'pointer', 
                transition: 'all 0.2s',
                fontFamily: 'var(--font-kaiti)', 
                fontSize: '12px',
              }}
            >
              {t === 'split' ? '分栏模式' : '极简穿插'}
            </button>
          ))}
        </div>
      </div>

      {/* 近体诗选择 */}
      {proTab === 'jinti' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {JINTI_TYPES.map(jt => (
              <button
                key={jt.value}
                onClick={() => { setPoemType(jt.value); setProLines([]); }}
                style={{
                  padding: '8px 12px', 
                  border: poemType === jt.value ? '1px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                  borderRadius: '8px', 
                  background: poemType === jt.value ? 'rgba(178,34,34,0.06)' : 'white',
                  color: poemType === jt.value ? 'var(--cinnabar-red)' : '#666',
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  textAlign: 'left',
                }}
              >
                <div style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px' }}>{jt.label}</div>
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{jt.chars}</div>
              </button>
            ))}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            margin: '8px 0 12px 0', 
            alignItems: 'center', 
            background: 'rgba(247,241,227,0.5)', 
            padding: '8px 12px', 
            borderRadius: '8px', 
            border: '1px solid rgba(26,26,26,0.05)' 
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>起调：</span>
              {(['ze', 'ping'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setJintiStart(s); setProLines([]); }}
                  style={{
                    padding: '3px 10px', 
                    borderRadius: '10px', 
                    border: 'none',
                    background: jintiStart === s ? 'var(--cinnabar-red)' : '#f0ede8',
                    color: jintiStart === s ? '#fff' : '#888',
                    cursor: 'pointer', 
                    fontSize: '11px', 
                    fontFamily: 'var(--font-kaiti)'
                  }}
                >
                  {s === 'ze' ? '仄起' : '平起'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>首句：</span>
              {(['no', 'yes'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { setJintiRhyme(r); setProLines([]); }}
                  style={{
                    padding: '3px 10px', 
                    borderRadius: '10px', 
                    border: 'none',
                    background: jintiRhyme === r ? 'var(--cinnabar-red)' : '#f0ede8',
                    color: jintiRhyme === r ? '#fff' : '#888',
                    cursor: 'pointer', 
                    fontSize: '11px', 
                    fontFamily: 'var(--font-kaiti)'
                  }}
                >
                  {r === 'yes' ? '入韵' : '不入韵'}
                </button>
              ))}
            </div>
          </div>

          {proInputMode === 'split' && <MeterGrid poemType={derivedPoemType} meterResult={meterResult} />}
        </div>
      )}

      {/* 词牌选择 */}
      {proTab === 'cipai' && (
        <div>
          <CipaiSelector value={selectedCipai?.name} onChange={c => { setSelectedCipai(c); setProLines([]); }} />
          {proInputMode === 'split' && selectedCipai && <MeterGrid cipai={selectedCipai} meterResult={meterResult} />}
        </div>
      )}

      {/* 结构化录入组件 */}
      <div style={{ flex: 1, position: 'relative', marginTop: '8px' }}>
        <StructuredInput
          patterns={currentPatterns}
          lines={proLines}
          onChange={setProLines}
          inputMode={proInputMode}
          meterResult={meterResult}
        />
        
        {/* 格律结果摘要 */}
        {meterResult && (
          <div style={{
            marginTop: '8px', 
            padding: '8px 12px',
            background: meterResult.isValid
              ? 'rgba(45,90,61,0.08)'
              : meterResult.violationCount > 3
                ? 'rgba(178,34,34,0.08)'
                : 'rgba(184,134,11,0.08)',
            borderRadius: '6px', 
            fontSize: '13px',
            color: meterResult.isValid ? '#2d5a3d' : meterResult.violationCount > 3 ? '#b22222' : '#b8860b',
            fontFamily: 'var(--font-kaiti)',
            borderLeft: `3px solid ${meterResult.isValid ? '#2d5a3d' : meterResult.violationCount > 3 ? '#b22222' : '#b8860b'}`,
          }}>
            {meterResult.summary}
          </div>
        )}
        {meterResult && meterResult.lines.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <MeterLegend />
          </div>
        )}
      </div>

      {/* 挥毫心声 */}
      <div>
        <button 
          onClick={() => setShowHeartNote(!showHeartNote)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#999', 
            fontSize: '13px', 
            fontFamily: 'monospace', 
            letterSpacing: '2px', 
            padding: 0 
          }}
        >
          {showHeartNote ? '▲' : '▼'} 挥毫心声
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
              border: '1px solid #eee', 
              borderRadius: '6px', 
              padding: '10px', 
              resize: 'vertical', 
              fontFamily: 'var(--font-kaiti)', 
              fontSize: '15px', 
              background: 'rgba(247,241,227,0.4)', 
              color: '#555' 
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default ProPanel;
