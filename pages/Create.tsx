import React, { useState, useEffect, useCallback } from 'react';
import { Poem, PoemType, SonnetType, RhymeBook, PaperStyle, LayoutMode, FontStyle, CipaiData, MeterCheckResult } from '../types';
import { checkJintiShi, checkCipai, checkSonnet } from '../src/engine/meterChecker';
import { savePoem, getSettings } from '../services/storageService';
import { useNavigate } from 'react-router-dom';
import PoemPreview from '../components/preview/PoemPreview';
import CipaiSelector from '../components/creator/CipaiSelector';
import MeterGrid, { JINTI_DISPLAY } from '../components/creator/MeterGrid';
import StructuredInput from '../components/creator/StructuredInput';
import { MeterLegend } from '../components/creator/RhymeHighlighter';
import { PaperStyleSelector } from '../components/preview/PaperBackground';

// ── Mock AI 点评（高质量文言库） ─────────────────────────
const MOCK_COMMENTS = [
  '起笔清雅，意境悠远，然"月"字处平仄微滞，可酌改"霜"字以顺音律。',
  '此作情韵兼胜，颔联对仗工整，尾句余味悠长，颇得唐人神髓。',
  '入题直截，不假雕琢，自有天然之趣；唯第三句音节稍促，宜舒缓之。',
  '炼字见功，"孤""寒"二字相辅，境界自出，建议收笔再添一转折，使意更丰。',
  '节奏流畅，意象清骨，略嫌笔力稍薄，若增一实景衬托，则虚实相生矣。',
  '词气雍容，格调沉稳，用典得当，不显堆砌；末句"归"字一字千钧，可留。',
  '意脉连贯，行气一气呵成，然音韵尚需磨砺，韵脚处宜再斟酌。',
];

function getMockComment(): string {
  return MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
}

const SONNET_TYPES: { value: SonnetType; label: string; sub: string }[] = [
  { value: 'none', label: '无', sub: '自由形式' },
  { value: 'shakespeare', label: '莎士比亚', sub: 'ABAB·CDCD·EFEF·GG' },
  { value: 'petrarchan', label: '彼特拉克', sub: 'ABBA·ABBA + CDE' },
  { value: 'chinese_modern', label: '现代汉语', sub: '11–15字·第9行Volta' },
];

const JINTI_TYPES: { value: PoemType; label: string; chars: string }[] = [
  { value: 'jueju_5', label: '五言绝句', chars: '4句×5字' },
  { value: 'jueju_7', label: '七言绝句', chars: '4句×7字' },
  { value: 'lvshi_5', label: '五言律诗', chars: '8句×5字' },
  { value: 'lvshi_7', label: '七言律诗', chars: '8句×7字' },
];

const RHYME_BOOKS: { value: RhymeBook; label: string }[] = [
  { value: 'ci_lin', label: '词林正韵' },
  { value: 'ping_shui', label: '平水韵' },
  { value: 'xin_yun', label: '中华新韵' },
];

const Create: React.FC = () => {
  const navigate = useNavigate();
  const settings = getSettings();

  // ── 模式 ──────────────────────────────────────────────
  const [mode, setMode] = useState<'free' | 'pro'>('free');
  const [proTab, setProTab] = useState<'jinti' | 'cipai'>('jinti');
  const [proInputMode, setProInputMode] = useState<'split' | 'interleaved'>('interleaved');
  const [proLines, setProLines] = useState<string[]>([]);

  // ── 表单状态 ────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(settings.defaultPenName);
  const [content, setContent] = useState('');
  const [heartNote, setHeartNote] = useState('');
  const [poemType, setPoemType] = useState<PoemType>('jueju_5');
  const [sonnetType, setSonnetType] = useState<SonnetType>('none');
  const [selectedCipai, setSelectedCipai] = useState<CipaiData | null>(null);
  const [rhymeBook, setRhymeBook] = useState<RhymeBook>(settings.rhymeBook);
  const [layout, setLayout] = useState<LayoutMode>(settings.defaultLayout);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(settings.defaultPaperStyle);
  const [fontStyle, setFontStyle] = useState<FontStyle>('none');

  // ── 格律校验 ────────────────────────────────────────────
  const [meterResult, setMeterResult] = useState<MeterCheckResult | null>(null);

  // ── AI 点评 ─────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiComment, setAiComment] = useState('');
  const [showHeartNote, setShowHeartNote] = useState(false);

  const currentPatterns = React.useMemo(() => {
    let pts: string[][] = [];
    if (proTab === 'jinti' && JINTI_DISPLAY[poemType]) {
      pts = JINTI_DISPLAY[poemType].patterns;
    } else if (proTab === 'cipai' && selectedCipai) {
      const upper = selectedCipai.upperPattern.map(s => s.split(''));
      const lower = selectedCipai.lowerPattern?.map(s => s.split('')) || [];
      pts = [...upper, ...(lower.length ? [[], ...lower] : [])];
    }
    return pts;
  }, [proTab, poemType, selectedCipai]);

  const activeContent = React.useMemo(() => {
    if (mode === 'free') return content;
    return currentPatterns.map((row, ri) => {
      if (row.length === 0) return '';
      const isLastInStanza = (ri === currentPatterns.length - 1) || (currentPatterns[ri + 1]?.length === 0);
      const endsWithRhyme = row[row.length - 1] === 'R' || row[row.length - 1] === 'r';
      const punc = (endsWithRhyme || isLastInStanza) ? '。' : '，';
      return (proLines[ri] || '') + punc;
    }).filter(s => s !== '').join('\n');
  }, [mode, content, currentPatterns, proLines]);

  // 实时格律校验
  useEffect(() => {
    if (!activeContent.trim() || mode === 'free') {
      setMeterResult(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        let result: MeterCheckResult;
        if (proTab === 'jinti') {
          result = checkJintiShi(activeContent, poemType, rhymeBook);
        } else if (selectedCipai) {
          result = checkCipai(activeContent, selectedCipai, rhymeBook);
        } else return;
        setMeterResult(result);
      } catch (_) { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [activeContent, mode, proTab, poemType, selectedCipai, rhymeBook]);

  // 自由模式十四行实时状态
  const [sonnetLineCount, setSonnetLineCount] = useState(0);
  useEffect(() => {
    setSonnetLineCount(activeContent.split('\n').filter(l => l.trim()).length);
  }, [activeContent]);

  const handleAIReview = async () => {
    if (!activeContent.trim()) return;
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 900)); // 模拟网络
    setAiComment(getMockComment());
    setAiLoading(false);
  };

  const handleSave = () => {
    if (!activeContent.trim()) { alert('请先写下诗句'); return; }
    const autoTitle = title || activeContent.split('\n')[0].slice(0, 12).replace(/[，。]/g, '') || '无题';
    const poem: Poem = {
      id: Date.now().toString(),
      title: autoTitle,
      author: author || '佚名',
      content: activeContent,
      heartNote,
      type: mode === 'free'
        ? (sonnetType !== 'none' ? 'sonnet' : 'free')
        : (proTab === 'cipai' ? 'cipai' : poemType),
      sonnetType: sonnetType !== 'none' ? sonnetType : undefined,
      cipaiName: selectedCipai?.name,
      layout,
      paperStyle,
      fontStyle,
      rhymeBook,
      createdAt: Date.now(),
      aiComment,
    };
    savePoem(poem);
    navigate('/works');
  };

  // 预览用 poem 对象
  const previewPoem: Poem = {
    id: 'preview',
    title: title || '无题',
    author: author || '佚名',
    content: activeContent || '在此输入佳句...',
    heartNote,
    type: 'free',
    layout,
    paperStyle,
    fontStyle,
    rhymeBook,
    createdAt: Date.now(),
    aiComment,
  };

  return (
    <div className="editor-split">
      {/* ── 左侧编辑区 ────────────────────────────── */}
      <div className="editor-left">
        {/* 模式切换 */}
        <div className="mode-toggle">
          {(['free', 'pro'] as const).map(m => (
            <button
              key={m}
              className={`mode-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'free' ? '自由挥毫' : '专业格律'}
            </button>
          ))}
        </div>

        {/* ── 自由挥毫 ── */}
        {mode === 'free' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
            {/* 基本信息 */}
            <div className="input-group">
              <label>标题（留空则自动截取首句）</label>
              <input className="borderless-input" placeholder="无题" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label>笔名</label>
              <input className="borderless-input" placeholder={settings.defaultPenName} value={author} onChange={e => setAuthor(e.target.value)} />
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
                      padding: '6px 14px', borderRadius: '20px',
                      border: sonnetType === st.value ? '1px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                      background: sonnetType === st.value ? 'rgba(178,34,34,0.06)' : 'white',
                      color: sonnetType === st.value ? 'var(--cinnabar-red)' : '#888',
                      cursor: 'pointer', fontSize: '13px',
                      fontFamily: 'var(--font-kaiti)', transition: 'all 0.2s',
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
                  marginTop: '8px', fontSize: '12px', color: sonnetLineCount === 14 ? '#2d5a3d' : '#b8860b',
                  fontFamily: 'monospace', letterSpacing: '1px',
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '2px', padding: 0 }}
              >
                {showHeartNote ? '▲' : '▼'} 挥毫心声
              </button>
              {showHeartNote && (
                <textarea
                  placeholder="记录灵感来源或挥毫感想..."
                  value={heartNote}
                  onChange={e => setHeartNote(e.target.value)}
                  style={{
                    display: 'block', width: '100%', marginTop: '8px',
                    minHeight: '80px', border: '1px solid #eee',
                    borderRadius: '6px', padding: '10px', resize: 'vertical',
                    fontFamily: 'var(--font-kaiti)', fontSize: '15px',
                    background: 'rgba(247,241,227,0.4)', color: '#555',
                    lineHeight: 1.8,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* ── 专业格律 ── */}
        {mode === 'pro' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
            {/* 基本信息 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>标题</label>
                <input className="borderless-input" placeholder="无题" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>笔名</label>
                <input className="borderless-input" placeholder={settings.defaultPenName} value={author} onChange={e => setAuthor(e.target.value)} />
              </div>
            </div>

            {/* 近体诗 / 词牌 切换 */}
            <div style={{ display: 'flex', background: '#f0ede8', borderRadius: '20px', padding: '3px', gap: '4px' }}>
              {(['jinti', 'cipai'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setProTab(t); setProLines([]); }}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: '16px', border: 'none',
                    background: proTab === t ? '#1a1a1a' : 'transparent',
                    color: proTab === t ? '#fff' : '#888',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'var(--font-kaiti)', fontSize: '15px', letterSpacing: '2px',
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
                      padding: '4px 12px', borderRadius: '14px', border: 'none',
                      background: rhymeBook === rb.value ? '#1a1a1a' : '#f0ede8',
                      color: rhymeBook === rb.value ? '#fff' : '#888',
                      cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s',
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
                      padding: '4px 10px', borderRadius: '12px', border: 'none',
                      background: proInputMode === t ? 'var(--cinnabar-red)' : 'transparent',
                      color: proInputMode === t ? '#fff' : '#888',
                      cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: 'var(--font-kaiti)', fontSize: '12px',
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
                        padding: '8px 12px', border: poemType === jt.value ? '1px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                        borderRadius: '8px', background: poemType === jt.value ? 'rgba(178,34,34,0.06)' : 'white',
                        color: poemType === jt.value ? 'var(--cinnabar-red)' : '#666',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px' }}>{jt.label}</div>
                      <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{jt.chars}</div>
                    </button>
                  ))}
                </div>
                {proInputMode === 'split' && <MeterGrid poemType={poemType} meterResult={meterResult} />}
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
                  marginTop: '8px', padding: '8px 12px',
                  background: meterResult.isValid
                    ? 'rgba(45,90,61,0.08)'
                    : meterResult.violationCount > 3
                      ? 'rgba(178,34,34,0.08)'
                      : 'rgba(184,134,11,0.08)',
                  borderRadius: '6px', fontSize: '13px',
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
              <button onClick={() => setShowHeartNote(!showHeartNote)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '2px', padding: 0 }}>
                {showHeartNote ? '▲' : '▼'} 挥毫心声
              </button>
              {showHeartNote && (
                <textarea placeholder="记录灵感来源..." value={heartNote} onChange={e => setHeartNote(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: '8px', minHeight: '70px', border: '1px solid #eee', borderRadius: '6px', padding: '10px', resize: 'vertical', fontFamily: 'var(--font-kaiti)', fontSize: '15px', background: 'rgba(247,241,227,0.4)', color: '#555' }} />
              )}
            </div>
          </div>
        )}

        {/* ── AI 点评 & 操作栏 ── */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid #f0ede8', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="action-btn save-btn" onClick={handleSave}>保存墨迹</button>
            <button
              className="action-btn"
              onClick={handleAIReview}
              disabled={!activeContent.trim() || aiLoading}
              style={{
                background: '#2d5a3d', color: 'white', border: 'none',
                opacity: (!activeContent.trim() || aiLoading) ? 0.5 : 1,
              }}
            >
              {aiLoading ? '✦ 思量中...' : '✦ AI 点评'}
            </button>
            <button className="action-btn clear-btn" onClick={() => { setContent(''); setAiComment(''); setMeterResult(null); }}>清空</button>
          </div>
          {aiComment && (
            <div style={{
              padding: '14px 16px', background: 'linear-gradient(135deg, rgba(178,34,34,0.04), rgba(45,90,61,0.06))',
              borderRadius: '8px', borderLeft: '3px solid var(--cinnabar-red)',
              fontFamily: 'var(--font-kaiti)', fontSize: '15px',
              color: '#2d5a3d', fontStyle: 'italic', lineHeight: 1.9,
            }}>
              {aiComment}
            </div>
          )}
        </div>
      </div>

      {/* ── 右侧预览区 ────────────────────────────── */}
      <div className="editor-right">
        {/* 花笺纸选择 */}
        <div style={{ marginBottom: '12px' }}>
          <PaperStyleSelector value={paperStyle} onChange={setPaperStyle} />
        </div>
        <PoemPreview
          poem={{ ...previewPoem, layout, paperStyle, fontStyle }}
          onLayoutChange={setLayout}
          onPaperChange={setPaperStyle}
          onFontChange={setFontStyle}
        />
      </div>
    </div>
  );
};

export default Create;
