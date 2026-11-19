import { stripJudou } from '../../utils/punctuation';
import { isLatinText } from '../../utils/script';
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
  /** 导语 / 词序 / 创作心声 */
  preface?: string;
  /** 无句读：与竖排一致去掉句读符号 */
  stripPunct?: boolean;
}

const HorizontalLayout: React.FC<HorizontalLayoutProps> = ({
  title, author, content, createdAt, subMode = 'modern', sealDataUrl, fontSize = 22, preface, stripPunct = false,
}) => {
  const lines = content.split('\n').filter(Boolean).map(line => (stripPunct ? stripJudou(line) : line));
  // 西文：取消汉字式字距，正文左齐、折行悬挂缩进
  const latin = isLatinText(`${title}\n${content}`);
  const bodySpacing = latin ? '0.01em' : '5px';
  const titleSpacing = latin ? '0.03em' : '8px';
  const bodySize = latin ? fontSize - 3 : fontSize;
  const latinLine: React.CSSProperties = latin ? { textAlign: 'left', paddingLeft: '1.2em', textIndent: '-1.2em', hyphens: 'auto' } : {};
  const date = new Date(createdAt);
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月`;
  const prefaceText = (preface || '').trim();
  const prefaceBlock = prefaceText ? (
    <aside aria-label="导语" style={{ margin: '0 0 24px', padding: '10px 14px', border: '1px solid rgba(176,57,42,0.35)', fontSize: '15px', lineHeight: 1.9, color: '#5a4a42' }}>
      {prefaceText.split(/\n+/).map((para, i) => <p key={i} style={{ margin: 0, textIndent: '2em' }}>{para}</p>)}
    </aside>
  ) : null;

  if (subMode === 'letter') {
    // 传统书信式：右上角落款，顶天立地
    return (
      <div className={`horizontal-layout is-letter${latin ? ' is-latin' : ''}`} style={{ padding: '50px 70px', position: 'relative', minHeight: '360px' }}>
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
          letterSpacing: titleSpacing, textWrap: 'balance',
          color: '#1a1a1a',
          marginBottom: '30px',
          marginTop: '60px',
          textAlign: 'center',
        }}>
          {title || '无题'}
        </h2>

        {prefaceBlock}

        {/* 正文：顶天立地 */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{
              fontSize: `${bodySize}px`,
              letterSpacing: bodySpacing,
              color: '#1a1a1a',
              lineHeight: 1.9,
              margin: 0,
              textAlign: 'justify',
              ...latinLine,
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
    <div className={`horizontal-layout${latin ? ' is-latin' : ''}`} style={{ padding: '50px 70px', minHeight: '360px' }}>
      {/* 标题 */}
      <h2 style={{
        fontSize: `${fontSize + 8}px`,
        letterSpacing: titleSpacing, textWrap: 'balance',
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

      {prefaceBlock}

      {/* 分隔线 */}
      <div style={{ width: '60px', height: '1px', background: 'rgba(178,34,34,0.3)', margin: '0 auto 32px' }} />

      {/* 正文 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: latin ? '6px' : '16px', alignItems: latin ? 'stretch' : 'center', ...(latin ? { width: 'fit-content', maxWidth: '100%', margin: '0 auto' } : {}) }}>
        {lines.map((line, i) => (
          <p key={i} style={{
            fontSize: `${bodySize}px`,
            letterSpacing: bodySpacing,
            color: '#1a1a1a',
            lineHeight: 1.9,
            margin: 0,
            textAlign: 'center',
            ...latinLine,
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
