import React, { useState } from 'react';
import { Poem, LayoutMode, HorizontalSubMode, PaperStyle, FontStyle } from '../../types';
import PaperBackground, { PaperStyleSelector } from './PaperBackground';
import VerticalLayout from './VerticalLayout';
import HorizontalLayout from './HorizontalLayout';
import { getSeals, getSettings, saveSettings } from '../../services/storageService';
import { FONT_STYLES } from '../../constants';

interface PoemPreviewProps {
  poem: Poem;
  onLayoutChange?: (l: LayoutMode) => void;
  onPaperChange?: (p: PaperStyle) => void;
  onFontChange?: (f: FontStyle) => void;
  compact?: boolean; // for Works modal
}

const PoemPreview: React.FC<PoemPreviewProps> = ({
  poem, onLayoutChange, onPaperChange, onFontChange, compact = false,
}) => {
  const [hSubMode, setHSubMode] = useState<HorizontalSubMode>(poem.horizontalSubMode || 'modern');

  const seals = getSeals();
  const settings = getSettings();
  const activeSealId = poem.sealId || settings.defaultSealId;
  const sealDataUrl = seals.find(s => s.id === activeSealId)?.dataUrl;

  const aspectRatio = poem.layout === 'vertical' ? '3/4' : '4/3';

  const handleSetGlobalFont = () => {
    const s = getSettings();
    s.globalFont = poem.fontStyle || 'none';
    saveSettings(s);
    window.location.reload(); // Quick way to apply global font across app immediately
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      {/* 工具栏 */}
      {!compact && (
        <div style={{
          display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
          padding: '0 0 10px 0',
          borderBottom: '1px solid rgba(26,26,26,0.06)',
        }}>
          {/* 排版切换 */}
          <div style={{ display: 'flex', gap: '4px', background: '#f0ede8', borderRadius: '20px', padding: '3px' }}>
            {(['vertical', 'horizontal'] as LayoutMode[]).map(l => (
              <button
                key={l}
                onClick={() => onLayoutChange?.(l)}
                style={{
                  padding: '4px 14px', borderRadius: '16px', border: 'none',
                  background: poem.layout === l ? '#1a1a1a' : 'transparent',
                  color: poem.layout === l ? '#fff' : '#888',
                  fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-kaiti)', letterSpacing: '1px',
                }}
              >
                {l === 'vertical' ? '↕ 竖排' : '↔ 横排'}
              </button>
            ))}
          </div>

          {/* 横排子模式 */}
          {poem.layout === 'horizontal' && (
            <div style={{ display: 'flex', gap: '4px', background: '#f0ede8', borderRadius: '20px', padding: '3px' }}>
              {(['modern', 'letter'] as HorizontalSubMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setHSubMode(m)}
                  style={{
                    padding: '4px 12px', borderRadius: '16px', border: 'none',
                    background: hSubMode === m ? '#555' : 'transparent',
                    color: hSubMode === m ? '#fff' : '#888',
                    fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {m === 'modern' ? '现代' : '书信'}
                </button>
              ))}
            </div>
          )}

          {/* 花笺纸 */}
          <PaperStyleSelector value={poem.paperStyle} onChange={p => onPaperChange?.(p)} />

          {/* 字体选择 */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              value={poem.fontStyle || 'none'}
              onChange={e => onFontChange?.(e.target.value as FontStyle)}
              style={{
                padding: '4px 12px', borderRadius: '16px', border: '1px solid #d5cfc4',
                background: 'white', color: '#333', fontSize: '13px',
                fontFamily: 'var(--font-kaiti)', cursor: 'pointer', outline: 'none'
              }}
            >
              {Object.entries(FONT_STYLES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <button
              onClick={handleSetGlobalFont}
              style={{
                padding: '4px 10px', borderRadius: '16px', border: 'none',
                background: 'var(--cinnabar-red)', color: 'white', fontSize: '12px',
                fontFamily: 'var(--font-kaiti)', cursor: 'pointer'
              }}
              title="将当前选中的字体应用到整个软件界面"
            >
              设为全局
            </button>
          </div>
        </div>
      )}

      {/* 预览画布（固定比例） */}
      <div style={{
        flex: compact ? undefined : 1,
        aspectRatio: compact ? aspectRatio : undefined,
        position: 'relative',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05)',
        fontFamily: FONT_STYLES[poem.fontStyle || 'none'].family
      }}>
        <PaperBackground style={poem.paperStyle}>
          {poem.layout === 'vertical'
            ? (
              <VerticalLayout
                title={poem.title}
                author={poem.author}
                content={poem.content || '在此输入佳句...'}
                createdAt={poem.createdAt}
                sealDataUrl={sealDataUrl}
              />
            )
            : (
              <HorizontalLayout
                title={poem.title}
                author={poem.author}
                content={poem.content || '在此输入佳句...'}
                createdAt={poem.createdAt}
                subMode={hSubMode}
                sealDataUrl={sealDataUrl}
              />
            )
          }
        </PaperBackground>
      </div>
    </div>
  );
};

export default PoemPreview;
