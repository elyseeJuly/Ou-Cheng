import React, { useState, useRef } from 'react';
import { ClassicPoem, ImageryItem } from '../../types';

interface ClassicReaderProps {
  poems: ClassicPoem[];
  imageryItems?: ImageryItem[];
  onImageryClick?: (word: string) => void;
}

const ClassicReader: React.FC<ClassicReaderProps> = ({ poems, imageryItems, onImageryClick }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<'up' | 'down'>('up');
  const containerRef = useRef<HTMLDivElement>(null);

  const poem = poems[currentIdx];

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
    <div className="classic-reader-shell"
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
        <div className="classic-book-spine" style={{
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
        <div className="classic-book-seam" style={{
          position: 'absolute', right: '18px', top: 0, bottom: 0, width: '2px',
          borderRight: '1px dashed rgba(178,34,34,0.2)',
        }} />

        {/* 朝代 + 体裁标签 */}
        <div className="classic-book-tags" style={{
          position: 'absolute', top: '20px', right: '30px',
          display: 'flex', gap: '6px',
        }}>
          {poem.dynasty && (
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-serif)',
              color: '#999', letterSpacing: '1px',
              border: '1px solid #ddd', padding: '1px 6px', borderRadius: '3px',
            }}>{poem.dynasty}</span>
          )}
          {poem.genre && (
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-serif)',
              color: 'var(--accent-seal)', letterSpacing: '1px',
              border: '1px solid rgba(178,34,34,0.3)', padding: '1px 6px', borderRadius: '3px',
            }}>{poem.genre}</span>
          )}
        </div>

        {/* 诗题 */}
        <h2 className="classic-book-title" style={{
          textAlign: 'center',
          fontFamily: 'var(--font-kai)',
          fontSize: '26px',
          color: '#1a1a1a',
          letterSpacing: '6px',
          marginBottom: '8px',
        }}>
          {poem.title}
        </h2>

        {/* 作者 */}
        <p className="classic-book-author" style={{
          textAlign: 'center',
          fontFamily: 'var(--font-kai)',
          fontSize: '14px',
          color: '#b22222',
          letterSpacing: '4px',
          marginBottom: '36px',
        }}>
          {poem.dynasty ? `[${poem.dynasty}]` : ''} {poem.author}
        </p>

        {/* 横分隔线 */}
        <div className="classic-book-divider" style={{
          width: '60px', height: '1px',
          background: 'rgba(178,34,34,0.3)',
          margin: '0 auto 36px',
        }} />

        {/* 正文 */}
        <div className="classic-book-content" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}>
          {lines.map((line, i) => (
            <p className="classic-book-line" key={i} style={{
              fontFamily: 'var(--font-kai)',
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

        {/* 意象标签 */}
        {imageryItems && poem && (
          <div className="classic-imagery-tags" style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
            marginTop: '36px',
            borderTop: '1px dashed rgba(178,34,34,0.15)', paddingTop: '20px'
          }}>
            {imageryItems
              .filter(item => poem.content?.includes(item.word) || poem.title?.includes(item.word))
              .map((item, i) => (
                <button
                  key={i}
                  onClick={() => onImageryClick?.(item.word)}
                  style={{
                    background: 'rgba(178,34,34,0.06)', border: '1px solid rgba(178,34,34,0.15)',
                    color: 'var(--accent-active)', padding: '4px 14px', borderRadius: '16px',
                    fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-kai)',
                    transition: 'all 0.2s', letterSpacing: '2px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-active)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(178,34,34,0.06)'; e.currentTarget.style.color = 'var(--accent-active)'; }}
                >
                  {item.word}
                </button>
              ))}
          </div>
        )}

        {/* 页码 */}
        <div className="classic-page-number" style={{
          position: 'absolute', bottom: '24px', left: 0, right: 0,
          textAlign: 'center',
          fontSize: '12px', color: '#bbb',
          fontFamily: 'var(--font-serif)', letterSpacing: '2px',
        }}>
          {currentIdx + 1} / {poems.length}
        </div>

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
