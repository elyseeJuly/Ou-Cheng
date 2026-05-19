import React, { useState, useEffect, useRef } from 'react';
import { ClassicPoem, MeterCheckResult } from '../../types';
import { checkJintiShi, checkCipai } from '../../src/engine/meterChecker';
import { getUpstreamIssueUrl, formatCorrectionJSON } from '../../services/contributionService';

interface ClassicReaderProps {
  poems: ClassicPoem[];
}

const ClassicReader: React.FC<ClassicReaderProps> = ({ poems }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<'up' | 'down'>('up');
  const containerRef = useRef<HTMLDivElement>(null);

  const [cipaiList, setCipaiList] = useState<any[]>([]);
  const [auditResult, setAuditResult] = useState<MeterCheckResult | null>(null);
  const [showContributionTip, setShowContributionTip] = useState(false);

  // Correction Form States
  const [correctedTitle, setCorrectedTitle] = useState('');
  const [correctedAuthor, setCorrectedAuthor] = useState('');
  const [correctedContent, setCorrectedContent] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');

  const poem = poems[currentIdx];

  // Load Cipai list for Ci heuristics
  useEffect(() => {
    fetch(`${(import.meta as any).env.BASE_URL || ''}data/cipai.json`)
      .then(r => r.json())
      .then(data => setCipaiList(data))
      .catch(() => {});
  }, []);

  // 自动探测并审计格律 (高度智能启发式：支持律绝与词牌)
  const performAudit = () => {
    if (!poem) return;
    const lines = poem.content?.split('\n').filter(Boolean) || [];
    const charCount = lines[0]?.replace(/[，。、；？！]/g, '').length || 0;
    const lineCount = lines.length;

    // 1. 律绝探测 (Genre 包含“诗”，或不包含“词/曲”的近体句式)
    let shiType = '';
    if (poem.genre?.includes('诗') || (!poem.genre && !poem.title.includes('·') && lineCount > 0)) {
      if (lineCount === 4 && charCount === 5) shiType = 'jueju_5';
      else if (lineCount === 4 && charCount === 7) shiType = 'jueju_7';
      else if (lineCount === 8 && charCount === 5) shiType = 'lvshi_5';
      else if (lineCount === 8 && charCount === 7) shiType = 'lvshi_7';
    }

    if (shiType) {
      try {
        const result = checkJintiShi(poem.content, shiType, 'ping_shui');
        setAuditResult(result);
        return;
      } catch (_) {}
    }

    // 2. 词牌探测 (Genre 包含“词”，或标题中含“·”，或无类型但含有已知词牌)
    if (poem.genre?.includes('词') || poem.title.includes('·') || (!poem.genre && lineCount > 0)) {
      const titleParts = poem.title.split(/[·\s]/);
      const possibleNames = [poem.title, ...titleParts];
      
      const matchedCipai = cipaiList.find(c => 
        possibleNames.some(name => name.includes(c.name) || c.name.includes(name))
      );

      if (matchedCipai) {
        try {
          const result = checkCipai(poem.content, matchedCipai, 'ci_lin');
          setAuditResult(result);
          return;
        } catch (_) {}
      }
    }

    // 3. 兜底无审计
    setAuditResult(null);
  };

  useEffect(() => {
    setAuditResult(null); // 翻页时重置
    setShowContributionTip(false);
  }, [currentIdx]);

  // Sync correction form states when correction dialog opens
  useEffect(() => {
    if (showContributionTip && poem) {
      setCorrectedTitle(poem.title);
      setCorrectedAuthor(poem.author || '佚名');
      setCorrectedContent(poem.content);
      setCorrectionNotes(auditResult?.summary || '');
    }
  }, [showContributionTip, poem, auditResult]);

  const goTo = (idx: number, dir: 'up' | 'down') => {
    if (isFlipping || idx < 0 || idx >= poems.length) return;
    setFlipDir(dir);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIdx(idx);
      setIsFlipping(false);
    }, 400);
  };

  // Touch swipe support
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) {
      if (dy > 0) goTo(currentIdx + 1, 'up');
      else goTo(currentIdx - 1, 'down');
    }
  };

  if (!poem) return null;

  const lines = poem.content?.split('\n').filter(Boolean) || [];

  return (
    <div
      style={{
        maxWidth: 520, margin: '0 auto', position: 'relative',
        userSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 线装古籍容器 */}
      <div
        ref={containerRef}
        className={`classic-reader-page ${isFlipping ? `flip-${flipDir}` : ''}`}
        style={{
          background: 'linear-gradient(135deg, #fdfcf8 0%, #f7f1e3 50%, #f0e8d5 100%)',
          borderRadius: '2px 8px 8px 2px',
          boxShadow: '-4px 0 8px rgba(0,0,0,0.08), 4px 0 20px rgba(0,0,0,0.12), inset -2px 0 4px rgba(0,0,0,0.04)',
          padding: '60px 70px 80px',
          minHeight: 480,
          position: 'relative',
          transition: 'opacity 0.4s, transform 0.4s',
          opacity: isFlipping ? 0 : 1,
          transform: isFlipping ? (flipDir === 'up' ? 'translateY(-12px)' : 'translateY(12px)') : 'none',
        }}
      >
        {/* 书脊线纹 */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '18px',
          background: 'linear-gradient(to right, #c8b89a, #d9c9b2)',
          borderRadius: '2px 0 0 2px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '6px',
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: '6px', height: '1px', background: 'rgba(150,120,80,0.5)' }} />
          ))}
        </div>

        {/* 右侧线缝装饰 */}
        <div style={{
          position: 'absolute', right: '18px', top: 0, bottom: 0, width: '2px',
          borderRight: '1px dashed rgba(178,34,34,0.2)',
        }} />

        {/* 朝代 + 体裁标签 */}
        <div style={{
          position: 'absolute', top: '20px', right: '30px',
          display: 'flex', gap: '6px',
        }}>
          {poem.dynasty && (
            <span style={{
              fontSize: '11px', fontFamily: 'monospace',
              color: '#999', letterSpacing: '1px',
              border: '1px solid #ddd', padding: '1px 6px', borderRadius: '3px',
            }}>{poem.dynasty}</span>
          )}
          {poem.genre && (
            <span style={{
              fontSize: '11px', fontFamily: 'monospace',
              color: 'var(--cinnabar-red)', letterSpacing: '1px',
              border: '1px solid rgba(178,34,34,0.3)', padding: '1px 6px', borderRadius: '3px',
            }}>{poem.genre}</span>
          )}
        </div>

        {/* 诗题 */}
        <h2 style={{
          textAlign: 'center',
          fontFamily: 'var(--font-kaiti)',
          fontSize: '26px',
          color: '#1a1a1a',
          letterSpacing: '6px',
          marginBottom: '8px',
        }}>
          {poem.title}
        </h2>

        {/* 作者 */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-kaiti)',
          fontSize: '14px',
          color: '#b22222',
          letterSpacing: '4px',
          marginBottom: '36px',
        }}>
          {poem.dynasty ? `[${poem.dynasty}]` : ''} {poem.author}
        </p>

        {/* 横分隔线 */}
        <div style={{
          width: '60px', height: '1px',
          background: 'rgba(178,34,34,0.3)',
          margin: '0 auto 36px',
        }} />

        {/* 正文 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-kaiti)',
              fontSize: '20px',
              color: '#1a1a1a',
              letterSpacing: '5px',
              lineHeight: '1.8',
              textAlign: 'center',
            }}>
              {line}
            </p>
          ))}
        </div>

        {/* 页码 */}
        <div style={{
          position: 'absolute', bottom: '24px', left: 0, right: 0,
          textAlign: 'center',
          fontSize: '12px', color: '#bbb',
          fontFamily: 'monospace', letterSpacing: '2px',
        }}>
          {currentIdx + 1} / {poems.length}
        </div>

        {/* AI 纠错悬浮按钮 */}
        <div style={{
          position: 'absolute', bottom: '20px', right: '30px',
          display: 'flex', gap: '8px', zIndex: 10,
        }}>
           {!auditResult ? (
             <button
               onClick={performAudit}
               style={{
                 background: 'rgba(178,34,34,0.05)', border: '1px solid rgba(178,34,34,0.2)',
                 color: 'var(--cinnabar-red)', padding: '4px 12px', borderRadius: '15px',
                 fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-kaiti)',
               }}
             >
               AI 审计
             </button>
           ) : (
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <span style={{
                 fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                 background: auditResult.isValid ? 'rgba(45,90,61,0.1)' : 'rgba(178,34,34,0.1)',
                 color: auditResult.isValid ? '#2d5a3d' : 'var(--cinnabar-red)',
                 fontFamily: 'monospace',
               }}>
                 {auditResult.isValid ? '✓ 格律严整' : `⚠ ${auditResult.violationCount}处疑误`}
               </span>
               {!auditResult.isValid && (
                 <button
                   onClick={() => setShowContributionTip(true)}
                   style={{
                     background: 'var(--cinnabar-red)', color: 'white', border: 'none',
                     padding: '2px 10px', borderRadius: '4px', fontSize: '11px',
                     cursor: 'pointer', boxShadow: '0 2px 4px rgba(178,34,34,0.2)',
                   }}
                 >
                   去纠错
                 </button>
               )}
             </div>
           )}
        </div>

        {/* 纠错弹窗 (高保真交互表单) */}
        {showContributionTip && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.98)',
            zIndex: 100, padding: '24px 32px', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-start', borderRadius: '8px', border: '2px solid var(--cinnabar-red)',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontFamily: 'var(--font-kaiti)', color: 'var(--cinnabar-red)', marginBottom: '12px', fontSize: '18px', textAlign: 'center' }}>
              · 经典纠错回馈社区 ·
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '2px' }}>标题</label>
                  <input
                    type="text"
                    value={correctedTitle}
                    onChange={e => setCorrectedTitle(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'var(--font-kaiti)', background: 'transparent' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '2px' }}>作者</label>
                  <input
                    type="text"
                    value={correctedAuthor}
                    onChange={e => setCorrectedAuthor(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'var(--font-kaiti)', background: 'transparent' }}
                  />
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '2px' }}>正文内容</label>
                <textarea
                  value={correctedContent}
                  onChange={e => setCorrectedContent(e.target.value)}
                  style={{ width: '100%', flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', resize: 'none', fontFamily: 'var(--font-kaiti)', fontSize: '15px', lineHeight: 1.6, background: 'transparent' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '2px' }}>纠错说明 / 考证参考</label>
                <input
                  type="text"
                  value={correctionNotes}
                  onChange={e => setCorrectionNotes(e.target.value)}
                  placeholder="如：据宋本《东坡乐府》此处应为某字"
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-kaiti)', background: 'transparent' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const json = formatCorrectionJSON({
                    original: poem,
                    corrected: { ...poem, title: correctedTitle, author: correctedAuthor, content: correctedContent },
                    notes: correctionNotes,
                    timestamp: Date.now()
                  });
                  navigator.clipboard.writeText(json);
                  alert('已复制高保真纠错 JSON 数据！正在为您打开上游 GitHub 纠错 Issue 页面...');
                  window.open(getUpstreamIssueUrl(correctedTitle), '_blank');
                }}
                style={{
                  flex: 2, background: 'var(--cinnabar-red)', color: 'white', border: 'none',
                  padding: '10px', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: 'var(--font-kaiti)', fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(178,34,34,0.2)',
                }}
              >
                生成 JSON 并回馈社区
              </button>
              <button
                onClick={() => setShowContributionTip(false)}
                style={{
                  flex: 1, background: 'none', border: '1px solid #ddd',
                  padding: '10px', borderRadius: '4px', cursor: 'pointer',
                  color: '#999', fontSize: '13px',
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 翻页控制 */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px',
      }}>
        <button
          onClick={() => goTo(currentIdx - 1, 'down')}
          disabled={currentIdx === 0}
          style={{
            background: 'none', border: '1px solid #ddd', borderRadius: '50%',
            width: '40px', height: '40px', cursor: currentIdx === 0 ? 'default' : 'pointer',
            color: currentIdx === 0 ? '#ddd' : '#888',
            fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >↑</button>
        <button
          onClick={() => goTo(currentIdx + 1, 'up')}
          disabled={currentIdx >= poems.length - 1}
          style={{
            background: 'none', border: '1px solid #ddd', borderRadius: '50%',
            width: '40px', height: '40px', cursor: currentIdx >= poems.length - 1 ? 'default' : 'pointer',
            color: currentIdx >= poems.length - 1 ? '#ddd' : '#888',
            fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >↓</button>
      </div>
    </div>
  );
};

export default ClassicReader;
