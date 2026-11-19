import React, { useState } from 'react';
import { Poem, LayoutMode, HorizontalSubMode, PaperStyle, FontStyle } from '../../types';
import PaperBackground, { PaperStyleSelector } from './PaperBackground';
import VerticalLayout from './VerticalLayout';
import HorizontalLayout from './HorizontalLayout';
import { getSeals, getSettings, saveSettings } from '../../services/storageService';
import { FONT_STYLES } from '../../constants';

// 预览排版偏好：刷新后保持（Muse 2026-10-28：版式与句读刷新后回到默认）
const TEMPLATE_KEY = 'oucheng_preview_template';
const JUDOU_KEY = 'oucheng_preview_judou';
const readPref = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const writePref = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* ignore */ } };

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
  const [template, setTemplateState] = useState<'plain' | 'wusilan'>(() => readPref(TEMPLATE_KEY) === 'wusilan' ? 'wusilan' : 'plain');
  const [stripPunct, setStripPunctState] = useState<boolean>(() => readPref(JUDOU_KEY) === 'strip');
  const setTemplate = (t: 'plain' | 'wusilan') => { setTemplateState(t); writePref(TEMPLATE_KEY, t); };
  const setStripPunct = (sp: boolean) => { setStripPunctState(sp); writePref(JUDOU_KEY, sp ? 'strip' : 'keep'); };

  const seals = getSeals();
  const settings = getSettings();
  const activeSealId = poem.sealId || settings.defaultSealId;
  const sealDataUrl = seals.find(s => s.id === activeSealId)?.dataUrl;

  const aspectRatio = poem.layout === 'vertical' ? '3/4' : '4/3';

  return (
    <div className={`poem-preview ${compact ? 'is-compact' : ''}`}>
      {/* 工具栏 - 改用去胶囊 opt-item */}
      {!compact && (
        <>
        <div className="preview-page-title">预览（观）</div>
        <div className="preview-toolbar" style={{
          borderBottom: '1px solid rgba(26,26,26,0.06)',
          paddingBottom: '10px',
        }}>
          {/* 排版切换 */}
          <div className="opt-group">
            {(['vertical', 'horizontal'] as LayoutMode[]).map(l => (
              <button
                key={l}
                onClick={() => onLayoutChange?.(l)}
                className={`opt-item ${poem.layout === l ? 'active' : ''}`}
                style={{ fontSize: '13px' }}
              >
                {l === 'vertical' ? '竖排' : '横排'}
              </button>
            ))}
          </div>

          <i className="tb-sep" />

          {/* 横排子模式 / 乌丝栏 */}
          {poem.layout === 'horizontal' ? (
            <>
              <div className="opt-group">
                {(['modern', 'letter'] as HorizontalSubMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setHSubMode(m)}
                    className={`opt-item ${hSubMode === m ? 'active' : ''}`}
                    style={{ fontSize: '12px' }}
                  >
                    {m === 'modern' ? '现代' : '书信'}
                  </button>
                ))}
              </div>
              <i className="tb-sep" />
            </>
          ) : (
            <>
              <div className="opt-group">
                {(['plain', 'wusilan'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`opt-item ${template === t ? 'active' : ''}`}
                    style={{ fontSize: '13px' }}
                  >
                    {t === 'plain' ? '素笺' : '乌丝栏'}
                  </button>
                ))}
              </div>
              <i className="tb-sep" />
            </>
          )}

          {/* 句读切换 */}
          <div className="opt-group">
            {([false, true] as const).map(sp => (
              <button
                key={sp ? 'no-punc' : 'punc'}
                onClick={() => setStripPunct(sp)}
                className={`opt-item ${stripPunct === sp ? 'active' : ''}`}
                style={{ fontSize: '13px' }}
              >
                {sp ? '无句读' : '保留句读'}
              </button>
            ))}
          </div>

          <i className="tb-sep" />

          {/* 花笺纸 */}
          <PaperStyleSelector value={poem.paperStyle} onChange={p => onPaperChange?.(p)} />

          <i className="tb-sep" />

          {/* 字体选择 - 去胶囊圆角 */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              value={poem.fontStyle || 'none'}
              onChange={e => onFontChange?.(e.target.value as FontStyle)}
              style={{
                border: 'none',
                borderBottom: '1px solid var(--border-strong)',
                background: 'transparent',
                color: 'var(--ink-zhong)',
                fontSize: '13px',
                fontFamily: 'var(--font-kai)',
                cursor: 'pointer',
                outline: 'none',
                padding: '4px 6px',
                borderRadius: 0,
              }}
            >
              {Object.entries(FONT_STYLES).map(([key, val]) => (
                <option key={key} value={key} style={{ background: 'var(--paper-1)', color: 'var(--ink-nong)' }}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        </>
      )}

      {/* 预览画布 */}
      <div data-theme="day" className="preview-canvas" style={{
        flex: compact ? undefined : 1,
        aspectRatio: compact ? aspectRatio : undefined,
        position: 'relative',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lift)',
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
                template={template}
                stripPunct={stripPunct}
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
                stripPunct={stripPunct}
              />
            )
          }
        </PaperBackground>
      </div>
    </div>
  );
};

export default PoemPreview;
