import React, { useState, useEffect } from 'react';
import { Poem, PoemType } from '../../types';
import { getSettings } from '../../services/storageService';

interface ImportModalProps {
  onClose: () => void;
  onImport: (poem: Poem) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [detectedType, setDetectedType] = useState<PoemType>('free');
  const [detectedVariant, setDetectedVariant] = useState<string>('');
  
  // Custom manual override option
  const [isManualType, setIsManualType] = useState(false);

  const settings = getSettings();

  const TYPE_OPTIONS: { value: PoemType; label: string }[] = [
    { value: 'free', label: '自由创作' },
    { value: 'jueju_5', label: '五言绝句' },
    { value: 'jueju_7', label: '七言绝句' },
    { value: 'lvshi_5', label: '五言律诗' },
    { value: 'lvshi_7', label: '七言律诗' },
    { value: 'sonnet', label: '十四行诗' },
    { value: 'cipai', label: '词牌 (智能识别)' },
  ];

  useEffect(() => {
    if (isManualType || !inputText.trim()) return;

    // Auto-detect logic
    const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
    const lineCount = lines.length;
    if (lineCount === 0) return;

    // Clean punctuation to count actual chars
    const charCounts = lines.map(l => l.replace(/[，。、；？！]/g, '').length);
    const isUniform = charCounts.every(c => c === charCounts[0]);
    
    let type: PoemType = 'free';
    let variant = '';

    if (isUniform) {
      if (lineCount === 4 && charCounts[0] === 5) { type = 'jueju_5'; variant = 'jueju_5_ze_no'; }
      else if (lineCount === 4 && charCounts[0] === 7) { type = 'jueju_7'; variant = 'jueju_7_ze_yes'; }
      else if (lineCount === 8 && charCounts[0] === 5) { type = 'lvshi_5'; variant = 'lvshi_5_ze_no'; }
      else if (lineCount === 8 && charCounts[0] === 7) { type = 'lvshi_7'; variant = 'lvshi_7_ping_yes'; }
    } else if (lineCount === 14) {
      type = 'sonnet';
    } else if (lineCount > 1) {
      // Very naive heuristic for Cipai: variable length, maybe Cipai.
      type = 'cipai';
    }

    setDetectedType(type);
    setDetectedVariant(variant);
    
    // Auto title from first line if not set
    if (!title) {
      setTitle(lines[0].slice(0, 12).replace(/[，。、；？！]/g, ''));
    }

  }, [inputText, isManualType, title]);

  const handleImport = () => {
    if (!inputText.trim()) {
      alert('请填入文稿内容');
      return;
    }
    
    const finalTitle = title || inputText.split('\n')[0].slice(0, 12).replace(/[，。、；？！]/g, '') || '无题';
    
    const newPoem: Poem = {
      id: Date.now().toString(),
      title: finalTitle,
      author: author || settings.defaultPenName,
      content: inputText,
      heartNote: '',
      type: detectedType,
      jintiVariant: (detectedType.startsWith('jueju') || detectedType.startsWith('lvshi')) ? detectedVariant : undefined,
      layout: settings.defaultLayout,
      paperStyle: settings.defaultPaperStyle,
      rhymeBook: settings.rhymeBook,
      createdAt: Date.now(),
    };

    onImport(newPoem);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
      zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="fade-in-down" style={{
        background: '#fff', borderRadius: '12px', width: '90%', maxWidth: '600px',
        padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '24px', color: '#1a1a1a', margin: 0, letterSpacing: '2px' }}>
            📥 导入文稿
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>题名</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="自动提取..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>作者</label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder={settings.defaultPenName}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)' }} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>正文 (支持粘贴)</label>
          <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="在此粘贴诗词文本..."
            style={{ width: '100%', height: '160px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontFamily: 'var(--font-kaiti)', resize: 'none', lineHeight: 1.8 }} />
        </div>

        <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#333' }}>
              {isManualType ? '手动选择类型' : '🤖 智能识别类型'}
            </span>
            <button onClick={() => setIsManualType(!isManualType)} style={{ background: 'none', border: 'none', color: 'var(--cinnabar-red)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
              {isManualType ? '恢复智能识别' : '手动修正'}
            </button>
          </div>
          <div style={{ marginTop: '12px' }}>
            <select 
              value={detectedType} 
              onChange={e => setDetectedType(e.target.value as PoemType)}
              disabled={!isManualType}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd',
                background: isManualType ? '#fff' : '#f0f0f0', color: isManualType ? '#333' : '#666',
                fontFamily: 'var(--font-kaiti)', fontSize: '15px'
              }}
            >
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleImport} style={{
            flex: 2, background: 'var(--cinnabar-red)', color: 'white', border: 'none', padding: '12px',
            borderRadius: '6px', fontSize: '16px', fontFamily: 'var(--font-kaiti)', cursor: 'pointer', letterSpacing: '2px'
          }}>
            确认导入
          </button>
          <button onClick={onClose} style={{
            flex: 1, background: 'white', color: '#666', border: '1px solid #ddd', padding: '12px',
            borderRadius: '6px', fontSize: '15px', cursor: 'pointer'
          }}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
