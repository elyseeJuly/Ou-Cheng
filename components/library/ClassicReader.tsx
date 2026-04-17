import React, { useState, useEffect, useRef } from 'react';
import { ClassicPoem, MeterCheckResult } from '../../types';
import { checkJintiShi } from '../../src/engine/meterChecker';
import { getUpstreamIssueUrl, formatCorrectionJSON } from '../../services/contributionService';

interface ClassicReaderProps {
  poems: ClassicPoem[];
}

const ClassicReader: React.FC<ClassicReaderProps> = ({ poems }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<'up' | 'down'>('up');
  const containerRef = useRef<HTMLDivElement>(null);

  const [auditResult, setAuditResult] = useState<MeterCheckResult | null>(null);
  const [showContributionTip, setShowContributionTip] = useState(false);
  const poem = poems[currentIdx];

  // 自动探测并审计格律 (简单启发式)
  const performAudit = () => {
    if (!poem) return;
    const lines = poem.content?.split('\n').filter(Boolean) || [];
    const charCount = lines[0]?.replace(/[，。、；？！]/g, '').length || 0;
    const lineCount = lines.length;

    let type = '';
    if (poem.genre?.includes('诗')) {
      if (lineCount === 4 && charCount === 5) type = 'jueju_5';
      else if (lineCount === 4 && charCount === 7) type = 'jueju_7';
      else if (lineCount === 8 && charCount === 5) type = 'lvshi_5';
      else if (lineCount === 8 && charCount === 7) type = 'lvshi_7';
    }

    if (type) {
      const result = checkJintiShi(poem.content, type, 'ping_shui');
      setAuditResult(result);
    } else {
      setAuditResult(null);
    }
  };

  useEffect(() => {
    setAuditResult(null); // 翻页时重置
    setShowContributionTip(false);
  }, [currentIdx]);

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

        {/* 纠错弹窗 (简单 Tip) */}
        {showContributionTip && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.96)',
            zIndex: 100, padding: '40px', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', borderRadius: '8px', border: '2px solid var(--cinnabar-red)',
          }}>
             <h3 style={{ fontFamily: 'var(--font-kaiti)', color: 'var(--cinnabar-red)', marginBottom: '16px' }}>回馈开源社区</h3>
             <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
               经 AI 格律审计，此篇作品在数字录入过程中可能存在偏差。由于数据源自 <strong>chinese-poetry</strong> 开源项目，建议您将纠错信息回传至上游。
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    const json = formatCorrectionJSON({
                      original: poem,
                      corrected: poem, // 演示目的，实际应支持用户手动修改
                      notes: auditResult?.summary || '',
                      timestamp: Date.now()
                    });
                    navigator.clipboard.writeText(json);
                    alert('已复制纠错 JSON 格式数据！正在跳转 GitHub Issue 页面...');
                    window.open(getUpstreamIssueUrl(poem.title), '_blank');
                  }}
                  style={{
                    background: '#1a1a1a', color: 'white', border: 'none',
                    padding: '10px', borderRadius: '4px', cursor: 'pointer',
                    fontFamily: 'var(--font-kaiti)', fontSize: '14px',
                  }}
                >
                  复制 JSON 并跳转 GitHub 纠错
                </button>
                <button
                  onClick={() => setShowContributionTip(false)}
                  style={{
                    background: 'none', border: '1px solid #ddd',
                    padding: '8px', borderRadius: '4px', cursor: 'pointer',
                    color: '#999', fontSize: '12px',
                  }}
                >
                  暂不纠错
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
