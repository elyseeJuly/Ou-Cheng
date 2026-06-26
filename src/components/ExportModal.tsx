import React, { useState } from 'react';
import { Poem, ExportFormat, ExportScale } from '../types';
import { exportPoem } from '../services/exportService';
import { getSeals, getSettings } from '../services/storageService';

interface ExportModalProps {
  poem: Poem;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ poem, onClose }) => {
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [scale, setScale] = useState<ExportScale>(2);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [exporting, setExporting] = useState(false);

  const seals = getSeals();
  const settings = getSettings();
  const activeSeal = seals.find(s => s.id === (poem.sealId || settings.defaultSealId));

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPoem(poem, {
        direction,
        scale,
        format,
        sealDataUrl: activeSeal?.dataUrl,
      });
    } catch (e) {
      alert('导出失败，请稍后再试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题 */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '20px', color: '#1a1a1a', letterSpacing: '3px' }}>导出海报</h3>
          <button onClick={onClose} style={{ background: '#f0ede8', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* 排版方向 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'monospace', display: 'block', marginBottom: '10px' }}>
              · 排版方向 ·
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {([['vertical', '↕ 竖版', '3:4'], ['horizontal', '↔ 横版', '4:3']] as const).map(([v, label, ratio]) => (
                <button
                  key={v}
                  onClick={() => setDirection(v)}
                  style={{
                    flex: 1, padding: '12px', border: direction === v ? '2px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                    borderRadius: '8px', background: direction === v ? 'rgba(178,34,34,0.04)' : 'white',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'var(--font-kaiti)',
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{v === 'vertical' ? '▯' : '▭'}</div>
                  <div style={{ fontSize: '14px', color: direction === v ? 'var(--cinnabar-red)' : '#666' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{ratio}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 分辨率 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'monospace', display: 'block', marginBottom: '10px' }}>
              · 画质 ·
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([1, 2, 4] as ExportScale[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  style={{
                    flex: 1, padding: '8px', border: scale === s ? '2px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                    borderRadius: '8px', background: scale === s ? 'rgba(178,34,34,0.04)' : 'white',
                    cursor: 'pointer', fontFamily: 'var(--font-kaiti)',
                    color: scale === s ? 'var(--cinnabar-red)' : '#666', fontSize: '15px',
                  }}
                >
                  {s}× {s === 1 ? '标准' : s === 2 ? '高清' : '超清'}
                </button>
              ))}
            </div>
          </div>

          {/* 格式 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'monospace', display: 'block', marginBottom: '10px' }}>
              · 格式 ·
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['png', 'jpg'] as ExportFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    flex: 1, padding: '8px', border: format === f ? '2px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                    borderRadius: '8px', background: format === f ? 'rgba(178,34,34,0.04)' : 'white',
                    cursor: 'pointer', fontFamily: 'var(--font-kaiti)',
                    color: format === f ? 'var(--cinnabar-red)' : '#666', fontSize: '15px',
                  }}
                >
                  .{f.toUpperCase()}
                  <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>{f === 'png' ? '透明底' : '较小体积'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 印章预览 */}
          {activeSeal && (
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fdfbf7', borderRadius: '8px' }}>
              <img src={activeSeal.dataUrl} alt="印章" style={{ width: '44px', height: '44px' }} />
              <div>
                <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>将使用印章</div>
                <div style={{ fontSize: '14px', color: '#555', fontFamily: '"Ma Shan Zheng", serif' }}>{activeSeal.name}</div>
              </div>
            </div>
          )}

          {/* 导出按钮 */}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: '100%', padding: '14px', background: 'var(--cinnabar-red)', color: 'white',
              border: 'none', borderRadius: '10px', cursor: exporting ? 'wait' : 'pointer',
              fontFamily: 'var(--font-kaiti)', fontSize: '18px', letterSpacing: '4px',
              opacity: exporting ? 0.7 : 1, transition: 'opacity 0.2s',
            }}
          >
            {exporting ? '渲染中...' : '下载海报'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
