import React, { useState } from 'react';
import { Poem, ExportFormat, ExportScale } from '../types';
import { exportPoem } from '../services/exportService';
import { getSeals, getSettings } from '../services/storageService';
import ModalDialog from './common/ModalDialog';

interface ExportModalProps {
  poem: Poem;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ poem, onClose }) => {
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>(poem.type === 'sonnet' ? 'horizontal' : 'vertical');
  const [scale, setScale] = useState<ExportScale>(2);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [template, setTemplate] = useState<'plain' | 'wusilan'>('plain');
  const [stripPunct, setStripPunct] = useState<boolean>(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const seals = getSeals();
  const settings = getSettings();
  const activeSeal = seals.find(s => s.id === (poem.sealId || settings.defaultSealId));

  const handleExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      const res = await exportPoem(poem, {
        direction,
        scale,
        format,
        sealDataUrl: activeSeal?.dataUrl,
        template: direction === 'vertical' ? template : 'plain',
        stripPunct,
      });
      if (!res.success) {
        setExportError(res.error || '导出失败。请检查内容或降低画质后重试。');
      }
    } catch (e) {
      setExportError('导出失败。请检查内容或降低画质后重试。');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ModalDialog
      label="导出海报"
      onClose={onClose}
      overlayStyle={{ background: 'rgba(0,0,0,0.75)', padding: '24px' }}
      panelStyle={{ background: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%', overflow: 'hidden' }}
    >
        {/* 标题 */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '20px', color: 'var(--ink-jiao)', letterSpacing: '3px' }}>导出海报</h3>
          <button onClick={onClose} style={{ background: '#f0ede8', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ padding: '24px', maxHeight: '78vh', overflowY: 'auto' }}>
          {/* 导出前实时预览 */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'var(--font-serif)', display: 'block', marginBottom: '10px' }}>
              · 海报预览 ·
            </label>
            <div style={{
              width: direction === 'vertical' ? '180px' : '280px',
              minHeight: direction === 'vertical' ? '240px' : '210px', maxHeight: '360px',
              margin: '0 auto', padding: '20px', boxSizing: 'border-box', overflow: 'auto',
              background: template === 'wusilan' && direction === 'vertical'
                ? 'repeating-linear-gradient(90deg, transparent 0 27px, rgba(166,58,43,.25) 27px 28px), #f7f1e3'
                : '#f7f1e3',
              border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-paper)',
              display: 'flex', flexDirection: direction === 'vertical' ? 'row-reverse' : 'column',
              gap: '8px', alignItems: 'center', justifyContent: 'center',
              fontFamily: poem.type === 'sonnet' ? 'Georgia, "Times New Roman", serif' : 'var(--font-kai)',
            }}>
              {poem.content.split('\n').filter(Boolean).map((line, index) => (
                <span key={index} style={{
                  writingMode: direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
                  fontSize: poem.type === 'sonnet' ? '7px' : '10px',
                  lineHeight: poem.type === 'sonnet' ? 1.45 : 1.7,
                  letterSpacing: poem.type === 'sonnet' ? 0 : '1px',
                  whiteSpace: direction === 'vertical' ? 'nowrap' : 'normal', color: '#26231f',
                }}>
                  {stripPunct ? line.replace(/[，。、；？！,.!?]/g, '') : line}
                </span>
              ))}
            </div>
          </div>
          {/* 排版方向 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'var(--font-serif)', display: 'block', marginBottom: '10px' }}>
              · 排版方向 ·
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {([['vertical', '竖版', '3:4'], ['horizontal', '横版', '4:3']] as const).map(([v, label, ratio]) => (
                <button
                  key={v}
                  onClick={() => setDirection(v)}
                  style={{
                    flex: 1, padding: '12px', border: direction === v ? '2px solid var(--accent-active)' : '1px solid var(--border-strong)',
                    borderRadius: '8px', background: direction === v ? 'rgba(178,34,34,0.04)' : 'white',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'var(--font-kai)',
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{v === 'vertical' ? '▯' : '▭'}</div>
                  <div style={{ fontSize: '14px', color: direction === v ? 'var(--accent-active)' : 'var(--ink-zhong)' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{ratio}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 分辨率 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'var(--font-serif)', display: 'block', marginBottom: '10px' }}>
              · 画质 ·
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([1, 2, 4] as ExportScale[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  style={{
                    flex: 1, padding: '8px', border: scale === s ? '2px solid var(--accent-active)' : '1px solid var(--border-strong)',
                    borderRadius: '8px', background: scale === s ? 'rgba(178,34,34,0.04)' : 'white',
                    cursor: 'pointer', fontFamily: 'var(--font-kai)',
                    color: scale === s ? 'var(--accent-active)' : 'var(--ink-zhong)', fontSize: '15px',
                  }}
                >
                  {s}× {s === 1 ? '标准' : s === 2 ? '高清' : '超清'}
                </button>
              ))}
            </div>
          </div>

          {/* 格式 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'var(--font-serif)', display: 'block', marginBottom: '10px' }}>
              · 格式 ·
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['png', 'jpg'] as ExportFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    flex: 1, padding: '8px', border: format === f ? '2px solid var(--accent-active)' : '1px solid var(--border-strong)',
                    borderRadius: '8px', background: format === f ? 'rgba(178,34,34,0.04)' : 'white',
                    cursor: 'pointer', fontFamily: 'var(--font-kai)',
                    color: format === f ? 'var(--accent-active)' : 'var(--ink-zhong)', fontSize: '15px',
                  }}
                >
                  .{f.toUpperCase()}
                  <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>{f === 'png' ? '无损画质' : '较小体积'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 纸本信笺（仅竖排时支持乌丝栏） */}
          {direction === 'vertical' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'var(--font-serif)', display: 'block', marginBottom: '10px' }}>
                · 纸本信笺 ·
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([['plain', '素笺', '纯净宣纸底'], ['wusilan', '乌丝栏', '红界格古风']] as const).map(([v, label, desc]) => (
                  <button
                    key={v}
                    onClick={() => setTemplate(v)}
                    style={{
                      flex: 1, padding: '8px', border: template === v ? '2px solid var(--accent-active)' : '1px solid var(--border-strong)',
                      borderRadius: '8px', background: template === v ? 'rgba(178,34,34,0.04)' : 'white',
                      cursor: 'pointer', fontFamily: 'var(--font-kai)',
                      color: template === v ? 'var(--accent-active)' : 'var(--ink-zhong)', fontSize: '15px',
                    }}
                  >
                    {label}
                    <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 句读标点 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'var(--font-serif)', display: 'block', marginBottom: '10px' }}>
              · 句读标点 ·
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([[false, '保留句读', '保留标点'], [true, '无句读', '剥离标点古风排版']] as const).map(([v, label, desc]) => (
                <button
                  key={v ? 'no-punc' : 'punc'}
                  onClick={() => setStripPunct(v)}
                  style={{
                    flex: 1, padding: '8px', border: stripPunct === v ? '2px solid var(--accent-active)' : '1px solid var(--border-strong)',
                    borderRadius: '8px', background: stripPunct === v ? 'rgba(178,34,34,0.04)' : 'white',
                    cursor: 'pointer', fontFamily: 'var(--font-kai)',
                    color: stripPunct === v ? 'var(--accent-active)' : 'var(--ink-zhong)', fontSize: '15px',
                  }}
                >
                  {label}
                  <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 印章预览 */}
          {activeSeal && (
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fdfbf7', borderRadius: '8px' }}>
              <img src={activeSeal.dataUrl} alt="印章" style={{ width: '44px', height: '44px' }} />
              <div>
                <div style={{ fontSize: '12px', color: '#999', fontFamily: 'var(--font-serif)' }}>将使用印章</div>
                <div style={{ fontSize: '14px', color: '#555', fontFamily: '"Ma Shan Zheng", serif' }}>{activeSeal.name}</div>
              </div>
            </div>
          )}

          {/* 导出按钮 */}
          {exporting && <div className="export-progress" role="progressbar" aria-label="正在生成海报"><i /></div>}
          {exportError && <p role="alert" style={{ color: 'var(--meter-error)', fontSize: '13px', marginBottom: '10px' }}>{exportError}</p>}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: '100%', padding: '14px', background: 'var(--accent-cta)', color: '#F9F3E6',
              border: 'none', borderRadius: '10px', cursor: exporting ? 'wait' : 'pointer',
              fontFamily: 'var(--font-kai)', fontSize: '18px', letterSpacing: '4px',
              opacity: exporting ? 0.7 : 1, transition: 'opacity 0.2s',
            }}
          >
            {exporting ? '渲染中...' : exportError ? '重试导出' : '下载海报'}
          </button>
        </div>
    </ModalDialog>
  );
};

export default ExportModal;
