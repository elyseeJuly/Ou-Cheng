import React from 'react';
import { useCreate, SONNET_TYPES } from './CreateContext';

const FreePanel: React.FC = () => {
  const {
    title,
    setTitle,
    author,
    setAuthor,
    content,
    setContent,
    sonnetType,
    setSonnetType,
    sonnetLineCount,
    showHeartNote,
    setShowHeartNote,
    heartNote,
    setHeartNote,
    settings,
  } = useCreate();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
      {/* 基本信息 */}
      <div className="input-group">
        <label>标题（留空则自动截取首句）</label>
        <input 
          className="borderless-input" 
          placeholder="无题" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
        />
      </div>
      <div className="input-group">
        <label>笔名</label>
        <input 
          className="borderless-input" 
          placeholder={settings.defaultPenName} 
          value={author} 
          onChange={e => setAuthor(e.target.value)} 
        />
      </div>

      {/* 十四行诗体例 */}
      <div>
        <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'monospace' }}>
          · 十四行诗体例（可选）·
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          {SONNET_TYPES.map(st => (
            <button
              key={st.value}
              onClick={() => setSonnetType(st.value)}
              style={{
                padding: '6px 14px', 
                borderRadius: '20px',
                border: sonnetType === st.value ? '1px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                background: sonnetType === st.value ? 'rgba(178,34,34,0.06)' : 'white',
                color: sonnetType === st.value ? 'var(--cinnabar-red)' : '#888',
                cursor: 'pointer', 
                fontSize: '13px',
                fontFamily: 'var(--font-kaiti)', 
                transition: 'all 0.2s',
              }}
            >
              {st.label}
              <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '1px' }}>{st.sub}</div>
            </button>
          ))}
        </div>
        {/* 十四行实时行数 */}
        {sonnetType !== 'none' && (
          <div style={{
            marginTop: '8px', 
            fontSize: '12px', 
            color: sonnetLineCount === 14 ? '#2d5a3d' : '#b8860b',
            fontFamily: 'monospace', 
            letterSpacing: '1px',
          }}>
            {sonnetLineCount}/14 行
            {sonnetLineCount === 9 && (
              <span style={{ marginLeft: '12px', color: 'var(--cinnabar-red)', fontFamily: 'var(--font-kaiti)' }}>
                ← 第九行 · Volta 转折点
              </span>
            )}
          </div>
        )}
      </div>

      {/* 正文输入 */}
      <textarea
        className="giant-textarea"
        placeholder={sonnetType !== 'none' ? '在此输入十四行诗（每行一句）...' : '在此输入诗词内容...'}
        value={content}
        onChange={e => setContent(e.target.value)}
        style={{ flexGrow: 1, minHeight: '200px' }}
      />

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
            placeholder="记录灵感来源或挥毫感想..."
            value={heartNote}
            onChange={e => setHeartNote(e.target.value)}
            style={{
              display: 'block', 
              width: '100%', 
              marginTop: '8px',
              minHeight: '80px', 
              border: '1px solid #eee',
              borderRadius: '6px', 
              padding: '10px', 
              resize: 'vertical',
              fontFamily: 'var(--font-kaiti)', 
              fontSize: '15px',
              background: 'rgba(247,241,227,0.4)', 
              color: '#555',
              lineHeight: 1.8,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FreePanel;
