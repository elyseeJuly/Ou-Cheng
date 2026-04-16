import React, { useState, useRef } from 'react';
import { Seal, SealStyle } from '../../types';
import { getSeals, saveSeal, deleteSeal, setDefaultSeal, getSettings } from '../../services/storageService';
import SealGenerator, { generateSealDataUrl, SEAL_STYLE_LABELS } from './SealGenerator';

interface SealManagerProps {
  penName?: string;
  onSelect?: (seal: Seal) => void;
  compact?: boolean;
}

const ALL_STYLES: SealStyle[] = ['yang_yuan', 'yin_fang', 'jiudie', 'niaochen', 'guyuan'];

const SealManager: React.FC<SealManagerProps> = ({ penName = '偶成君', onSelect, compact = false }) => {
  const [seals, setSeals] = useState<Seal[]>(() => getSeals());
  const [defaultSealId, setDefaultSealId] = useState(() => getSettings().defaultSealId);
  const [generating, setGenerating] = useState(false);
  const [previewName, setPreviewName] = useState(penName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSeals = () => {
    setSeals(getSeals());
    setDefaultSealId(getSettings().defaultSealId);
  };

  // Generate all 5 styles for a pen name
  const handleGenerateAll = () => {
    setGenerating(true);
    setTimeout(() => {
      ALL_STYLES.forEach(style => {
        const dataUrl = generateSealDataUrl(previewName, style, 120);
        const seal: Seal = {
          id: `${previewName}_${style}_${Date.now()}`,
          name: previewName,
          style,
          dataUrl,
          isCustom: false,
          createdAt: Date.now(),
        };
        saveSeal(seal);
      });
      refreshSeals();
      setGenerating(false);
    }, 50);
  };

  // Upload custom seal
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      // Remove white background via Canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 220 && g > 220 && b > 220) data[i + 3] = 0;
        }
        ctx.putImageData(imageData, 0, 0);
        const processed = canvas.toDataURL('image/png');
        const seal: Seal = {
          id: `custom_${Date.now()}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          style: 'yang_yuan',
          dataUrl: processed,
          isCustom: true,
          createdAt: Date.now(),
        };
        saveSeal(seal);
        refreshSeals();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSetDefault = (id: string) => {
    setDefaultSeal(id);
    setDefaultSealId(id);
  };

  const handleDelete = (id: string) => {
    deleteSeal(id);
    refreshSeals();
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {seals.map(seal => (
          <div
            key={seal.id}
            onClick={() => onSelect?.(seal)}
            style={{
              cursor: 'pointer',
              border: defaultSealId === seal.id ? '2px solid var(--cinnabar-red)' : '2px solid transparent',
              borderRadius: '4px', padding: '2px',
              transition: 'border 0.2s',
            }}
          >
            <img src={seal.dataUrl} alt={seal.name} style={{ width: 48, height: 48 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 生成面板 */}
      <div style={{
        background: '#fdfbf7', border: '1px solid #eee',
        borderRadius: '8px', padding: '20px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <input
            type="text"
            value={previewName}
            onChange={e => setPreviewName(e.target.value)}
            placeholder="输入笔名"
            style={{
              flex: 1, border: 'none', borderBottom: '1px solid #ddd',
              background: 'transparent', fontSize: '16px', padding: '6px 0',
              fontFamily: 'var(--font-kaiti)',
            }}
          />
          <button
            onClick={handleGenerateAll}
            disabled={generating || !previewName.trim()}
            style={{
              background: 'var(--cinnabar-red)', color: 'white',
              border: 'none', borderRadius: '6px', padding: '8px 20px',
              cursor: generating ? 'wait' : 'pointer', fontSize: '14px',
              fontFamily: 'var(--font-kaiti)', opacity: generating ? 0.7 : 1,
            }}
          >
            {generating ? '生成中...' : '生成五式印章'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'transparent', color: '#666',
              border: '1px solid #ddd', borderRadius: '6px', padding: '8px 16px',
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            上传印章
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" hidden onChange={handleUpload} />
        </div>
      </div>

      {/* 图章库 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '16px',
      }}>
        {seals.map(seal => (
          <div
            key={seal.id}
            style={{
              background: '#fdfbf7',
              border: defaultSealId === seal.id ? '2px solid var(--cinnabar-red)' : '1px solid #eee',
              borderRadius: '8px', padding: '16px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onClick={() => onSelect?.(seal)}
          >
            <img src={seal.dataUrl} alt={seal.name} style={{ width: 64, height: 64 }} />
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', fontFamily: '"Ma Shan Zheng", serif' }}>
              {seal.name}
              {!seal.isCustom && <div style={{ fontSize: '11px', color: '#bbb' }}>{SEAL_STYLE_LABELS[seal.style]}</div>}
              {seal.isCustom && <div style={{ fontSize: '11px', color: 'var(--cinnabar-red)' }}>自定义</div>}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {defaultSealId !== seal.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSetDefault(seal.id); }}
                  style={{ fontSize: '11px', color: 'var(--cinnabar-red)', background: 'none', border: '1px solid rgba(178,34,34,0.3)', borderRadius: '10px', padding: '2px 8px', cursor: 'pointer' }}
                >
                  置默认
                </button>
              )}
              {defaultSealId === seal.id && (
                <span style={{ fontSize: '11px', color: 'var(--cinnabar-red)' }}>✓ 默认</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(seal.id); }}
                style={{ fontSize: '11px', color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >
                删除
              </button>
            </div>
          </div>
        ))}

        {seals.length === 0 && (
          <div style={{
            gridColumn: '1/-1', textAlign: 'center', padding: '40px',
            color: '#bbb', fontFamily: 'var(--font-kaiti)', fontSize: '18px',
          }}>
            暂无印章，请生成或上传
          </div>
        )}
      </div>
    </div>
  );
};

export default SealManager;
