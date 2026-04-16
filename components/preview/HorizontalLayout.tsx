import React from 'react';
import { HorizontalSubMode } from '../../types';

interface HorizontalLayoutProps {
  title: string;
  author: string;
  content: string;
  createdAt: number;
  subMode?: HorizontalSubMode;
  sealDataUrl?: string;
  fontSize?: number;
}

const HorizontalLayout: React.FC<HorizontalLayoutProps> = ({
  title, author, content, createdAt, subMode = 'modern', sealDataUrl, fontSize = 22,
}) => {
  const lines = content.split('\n').filter(Boolean);
  const date = new Date(createdAt);
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月`;

  if (subMode === 'letter') {
    // 传统书信式：右上角落款，顶天立地
    return (
      <div style={{ padding: '50px 70px', position: 'relative', minHeight: '360px' }}>
        {/* 右上角落款 */}
        <div style={{
          position: 'absolute', top: '40px', right: '60px',
          textAlign: 'right',
          color: '#555',
        }}>
          <div style={{ fontSize: `${fontSize - 4}px`, letterSpacing: '3px', marginBottom: '4px' }}>{author}</div>
          <div style={{ fontSize: `${fontSize - 8}px`, letterSpacing: '2px', color: '#999' }}>{dateStr}</div>
          {sealDataUrl && (
            <img src={sealDataUrl} alt="印章"
              style={{ width: '44px', height: '44px', marginTop: '8px', transform: 'rotate(3deg)', opacity: 0.85 }}
            />
          )}
        </div>

        {/* 标题 */}
        <h2 style={{
          fontSize: `${fontSize + 6}px`,
          letterSpacing: '8px',
          color: '#1a1a1a',
          marginBottom: '30px',
          marginTop: '60px',
          textAlign: 'center',
        }}>
          {title || '无题'}
        </h2>

        {/* 正文：顶天立地 */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{
              fontSize: `${fontSize}px`,
              letterSpacing: '5px',
              color: '#1a1a1a',
              lineHeight: 1.9,
              margin: 0,
              textAlign: 'justify',
            }}>
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // 现代横排
  return (
    <div style={{ padding: '50px 70px', minHeight: '360px' }}>
      {/* 标题 */}
      <h2 style={{
        fontSize: `${fontSize + 8}px`,
        letterSpacing: '8px',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: '8px',
      }}>
        {title || '无题'}
      </h2>

      {/* 作者 */}
      <p style={{
        textAlign: 'center',
        fontSize: `${fontSize - 4}px`,
        color: '#b22222',
        letterSpacing: '4px',
        marginBottom: '32px',
      }}>
        {author}
      </p>

      {/* 分隔线 */}
      <div style={{ width: '60px', height: '1px', background: 'rgba(178,34,34,0.3)', margin: '0 auto 32px' }} />

      {/* 正文 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {lines.map((line, i) => (
          <p key={i} style={{
            fontSize: `${fontSize}px`,
            letterSpacing: '5px',
            color: '#1a1a1a',
            lineHeight: 1.9,
            margin: 0,
            textAlign: 'center',
          }}>
            {line}
          </p>
        ))}
      </div>

      {/* 落款 */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        gap: '12px', marginTop: '36px',
      }}>
        {sealDataUrl && (
          <img src={sealDataUrl} alt="印章"
            style={{ width: '44px', height: '44px', transform: 'rotate(-3deg)', opacity: 0.85 }}
          />
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: `${fontSize - 4}px`, letterSpacing: '3px', color: '#555' }}>{author}</div>
          <div style={{ fontSize: `${fontSize - 8}px`, letterSpacing: '2px', color: '#999' }}>{dateStr}</div>
        </div>
      </div>
    </div>
  );
};

export default HorizontalLayout;
