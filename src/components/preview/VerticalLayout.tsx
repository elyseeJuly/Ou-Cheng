import React from 'react';
import { elegantDate } from '../../utils/elegantDate';
import { stripJudou } from '../../utils/punctuation';

interface VerticalLayoutProps {
  title: string;
  author: string;
  content: string;
  createdAt: number;
  sealDataUrl?: string;
  fontSize?: number;
  template?: 'plain' | 'wusilan';
  stripPunct?: boolean;
}

const VerticalLayout: React.FC<VerticalLayoutProps> = ({
  title, author, content, createdAt, sealDataUrl, fontSize = 24, template = 'plain', stripPunct = false,
}) => {
  const dateStr = elegantDate(createdAt);
  const isWusilan = template === 'wusilan';
  const COL = 52;

  // 处理无句读
  const rawLines = content.split('\n');
  const cleanedLines = stripPunct
    ? rawLines.map(stripJudou)
    : rawLines;

  // 段落分割（空行处理）
  const segments: string[][] = [];
  let cur: string[] = [];
  cleanedLines.forEach(line => {
    if (line.trim() === '') {
      if (cur.length > 0) { segments.push(cur); cur = []; }
    } else {
      cur.push(line);
    }
  });
  if (cur.length > 0) segments.push(cur);

  return (
    <div className={`vertical-layout ${isWusilan ? 'is-wusilan' : ''}`} style={{
      display: 'flex',
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      padding: isWusilan ? '60px 72px' : '60px',
      minHeight: '400px',
      gap: '0',
      position: 'relative',
    }}>
      {/* 乌丝栏：框栏 + 界栏 */}
      {isWusilan && (
        <>
          {/* 外边框 */}
          <div className="vertical-frame-outer" style={{
            position: 'absolute', inset: '24px', pointerEvents: 'none', zIndex: 1,
            border: '2px solid rgba(166,58,43,0.75)',
          }} />
          {/* 内边框 */}
          <div className="vertical-frame-inner" style={{
            position: 'absolute', inset: '29px', pointerEvents: 'none', zIndex: 1,
            border: '1px solid rgba(166,58,43,0.55)',
          }} />
          {/* 界栏红线 */}
          <div className="vertical-grid" style={{
            position: 'absolute', inset: '30px 48px', pointerEvents: 'none', zIndex: 1,
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0 ${COL - 1}px, rgba(166,58,43,0.3) ${COL - 1}px ${COL}px)`,
            backgroundPosition: 'right 32px top 0',
          }} />
        </>
      )}

      {/* 右侧：标题列 */}
      <div className="vertical-title" style={{
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        paddingRight: isWusilan ? '24px' : '12px',
        borderRight: isWusilan ? 'none' : '1px solid rgba(26,26,26,0.12)',
        marginRight: isWusilan ? '12px' : '24px',
        position: 'relative',
        zIndex: 2,
      }}>
        <span style={{
          fontSize: `${fontSize + 4}px`,
          letterSpacing: '8px',
          color: '#1a1a1a',
          fontWeight: 'bold',
        }}>
          {title || '无题'}
        </span>
      </div>

      {/* 中部：正文列 */}
      <div className="vertical-body" style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        flex: 1,
        gap: isWusilan ? '0' : '6px',
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 2,
        paddingRight: isWusilan ? `${COL}px` : '0',
      }}>
        {segments.map((seg, si) => (
          <React.Fragment key={si}>
            {si > 0 && (
              <div style={{ width: isWusilan ? `${COL}px` : `${fontSize * 1.8}px`, flexShrink: 0 }} />
            )}
            {seg.map((line, li) => (
              <div className="vertical-column"
                key={li}
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'upright',
                  fontSize: isWusilan ? '26px' : `${fontSize}px`,
                  lineHeight: isWusilan ? `${COL}px` : 2.4,
                  letterSpacing: isWusilan ? '6px' : '5px',
                  color: '#1a1a1a',
                  flexShrink: 0,
                  width: isWusilan ? `${COL}px` : 'auto',
                  textAlign: isWusilan ? 'center' : 'left',
                }}
              >
                {line}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* 左侧：落款列 */}
      <div className="vertical-signature" style={{
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginLeft: isWusilan ? '12px' : '24px',
        paddingLeft: isWusilan ? '24px' : '12px',
        borderLeft: isWusilan ? 'none' : '1px solid rgba(26,26,26,0.08)',
        minHeight: '200px',
        position: 'relative',
        zIndex: 2,
      }}>
        <span style={{
          fontSize: `${fontSize - 4}px`,
          letterSpacing: '4px',
          color: '#555',
        }}>
          {author}
        </span>
        <span style={{
          fontSize: `${fontSize - 8}px`,
          letterSpacing: '3px',
          color: '#999',
        }}>
          {dateStr}
        </span>

        {/* 图章 */}
        {sealDataUrl && (
          <img
            src={sealDataUrl}
            alt="印章"
            style={{
              width: '56px',
              height: '56px',
              marginTop: '12px',
              transform: 'rotate(-3deg)',
              opacity: 0.88,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VerticalLayout;
