import React from 'react';

interface VerticalLayoutProps {
  title: string;
  author: string;
  content: string;
  createdAt: number;
  sealDataUrl?: string;
  fontSize?: number;
}

const VerticalLayout: React.FC<VerticalLayoutProps> = ({
  title, author, content, createdAt, sealDataUrl, fontSize = 24,
}) => {
  const lines = content.split('\n').filter(Boolean);
  const date = new Date(createdAt);
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月`;

  // 段落分割（空行处理）
  const segments: string[][] = [];
  let cur: string[] = [];
  content.split('\n').forEach(line => {
    if (line.trim() === '') {
      if (cur.length > 0) { segments.push(cur); cur = []; }
    } else {
      cur.push(line);
    }
  });
  if (cur.length > 0) segments.push(cur);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      padding: '60px',
      minHeight: '400px',
      gap: '0',
      position: 'relative',
    }}>
      {/* 右侧：标题列 */}
      <div style={{
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        paddingRight: '12px',
        borderRight: '1px solid rgba(26,26,26,0.12)',
        marginRight: '24px',
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

      {/* 中部：正文列（每断落间空一列） */}
      <div style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        flex: 1,
        gap: '6px',
        alignItems: 'flex-start',
      }}>
        {segments.map((seg, si) => (
          <React.Fragment key={si}>
            {/* 断落间空列 */}
            {si > 0 && (
              <div style={{ width: `${fontSize * 1.8}px`, flexShrink: 0 }} />
            )}
            {seg.map((line, li) => (
              <div
                key={li}
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'upright',
                  fontSize: `${fontSize}px`,
                  lineHeight: 2.4,
                  letterSpacing: '5px',
                  color: '#1a1a1a',
                  flexShrink: 0,
                }}
              >
                {line}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* 左侧：落款列（最左一列，垂直居中） */}
      <div style={{
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginLeft: '24px',
        paddingLeft: '12px',
        borderLeft: '1px solid rgba(26,26,26,0.08)',
        minHeight: '200px',
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
