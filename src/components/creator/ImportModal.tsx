import React, { useState, useEffect } from 'react';
import { Poem, PoemType, SonnetType } from '../../types';
import { getSettings, getCollections } from '../../services/storageService';
import { localParseManuscript } from '../../engine/importParser';
import { splitAndClassifyManuscript } from '../../services/geminiService';

interface ImportModalProps {
  onClose: () => void;
  onImport: (poems: Poem[]) => void;
}

interface TempPoem {
  id: string;
  checked: boolean;
  title: string;
  author: string;
  content: string;
  type: PoemType;
  cipaiName?: string;
  sonnetType?: SonnetType;
  jintiVariant?: string;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const settings = getSettings();
  const existingCollections = getCollections();

  const [step, setStep] = useState<1 | 2>(1);
  const [inputText, setInputText] = useState('');
  const [defaultAuthor, setDefaultAuthor] = useState(settings.defaultPenName);
  
  // Collection States
  const [collectionSelect, setCollectionSelect] = useState<string>(''); // '' = none, '__new__' = new
  const [newCollectionName, setNewCollectionName] = useState('');

  // Parsing & Review States
  const [loading, setLoading] = useState(false);
  const [parsedPoems, setParsedPoems] = useState<TempPoem[]>([]);

  const TYPE_OPTIONS: { value: PoemType; label: string }[] = [
    { value: 'free', label: '自由创作 / 现代诗' },
    { value: 'jueju_5', label: '五言绝句' },
    { value: 'jueju_7', label: '七言绝句' },
    { value: 'lvshi_5', label: '五言律诗' },
    { value: 'lvshi_7', label: '七言律诗' },
    { value: 'cipai', label: '词牌 (填词)' },
    { value: 'sonnet', label: '十四行诗' },
  ];

  const SONNET_OPTIONS: { value: SonnetType; label: string }[] = [
    { value: 'none', label: '无子变体' },
    { value: 'shakespeare', label: '莎士比亚体 (Shakespearean)' },
    { value: 'petrarchan', label: '彼特拉克体 (Petrarchan)' },
    { value: 'chinese_modern', label: '现代汉化十四行诗' },
  ];

  // Resolve final collection name
  const getFinalCollection = (): string | undefined => {
    if (collectionSelect === '__new__') {
      return newCollectionName.trim() || undefined;
    }
    return collectionSelect || undefined;
  };

  const handleLocalParse = () => {
    if (!inputText.trim()) {
      alert('请填入文稿内容');
      return;
    }
    const localParsed = localParseManuscript(inputText, defaultAuthor, settings.rhymeBook);
    if (localParsed.length === 0) {
      alert('未识别到有效的诗词，请检查输入格式');
      return;
    }
    setParsedPoems(localParsed.map(p => ({
      ...p,
      checked: true,
      sonnetType: p.sonnetType || 'none'
    })));
    setStep(2);
  };

  const handleAIParse = async () => {
    if (!inputText.trim()) {
      alert('请填入文稿内容');
      return;
    }
    if (!settings.apiKey) {
      alert('未配置 API Key。请先前往「印匣」完成大模型 API 接入。');
      return;
    }

    setLoading(true);
    try {
      const aiParsed = await splitAndClassifyManuscript(inputText);
      if (aiParsed.length === 0) {
        alert('AI 未能拆分识别出任何作品，已为您退回本地解析。');
        handleLocalParse();
        return;
      }
      setParsedPoems(aiParsed.map((p, idx) => ({
        id: `ai_${idx}_${Date.now()}`,
        checked: true,
        title: p.title || '无题',
        author: p.author || defaultAuthor,
        content: p.content,
        type: p.type || 'free',
        cipaiName: p.cipaiName,
        sonnetType: p.sonnetType || 'none',
      })));
      setStep(2);
    } catch (e) {
      console.error(e);
      alert('AI 解析服务出现错误，已为您自动切换至本地快速解析。');
      handleLocalParse();
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = () => {
    const selected = parsedPoems.filter(p => p.checked);
    if (selected.length === 0) {
      alert('请至少选择一首诗词进行导入');
      return;
    }

    const finalCollection = getFinalCollection();

    const finalPoems: Poem[] = selected.map((p, idx) => {
      // Setup correct variants for jueju/lvshi if not already set
      let jintiVariant = p.jintiVariant;
      if (!jintiVariant && (p.type.startsWith('jueju') || p.type.startsWith('lvshi'))) {
        const variants: Record<string, string> = {
          jueju_5: 'jueju_5_ze_no',
          jueju_7: 'jueju_7_ze_yes',
          lvshi_5: 'lvshi_5_ze_no',
          lvshi_7: 'lvshi_7_ping_yes',
        };
        jintiVariant = variants[p.type];
      }

      return {
        id: `${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        title: p.title || '无题',
        author: p.author || defaultAuthor || '无名氏',
        content: p.content,
        heartNote: '',
        type: p.type,
        sonnetType: p.type === 'sonnet' ? p.sonnetType : undefined,
        cipaiName: p.type === 'cipai' ? p.cipaiName : undefined,
        jintiVariant,
        layout: settings.defaultLayout,
        paperStyle: settings.defaultPaperStyle,
        rhymeBook: settings.rhymeBook,
        collectionName: finalCollection,
        createdAt: Date.now() - (selected.length - idx) * 1000, // ensure ordering
      };
    });

    onImport(finalPoems);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
      zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="fade-in-down" style={{
        background: '#fff', borderRadius: '12px', width: '90%', maxWidth: step === 1 ? '600px' : '800px',
        padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '24px', color: '#1a1a1a', margin: 0, letterSpacing: '2px' }}>
            📥 {step === 1 ? '导入文稿' : '预览与确认导入'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '20px' }}>
            <div className="spinner" style={{
              width: '40px', height: '40px', border: '3px solid rgba(178,34,34,0.1)', 
              borderTop: '3px solid var(--cinnabar-red)', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <p style={{ fontFamily: 'var(--font-kaiti)', color: '#666', fontSize: '16px' }}>🤖 偶成君正在为您拆分并识别文稿题材，请稍候...</p>
          </div>
        ) : step === 1 ? (
          /* Step 1: Input Raw Text */
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>默认作者笔名</label>
                <input type="text" value={defaultAuthor} onChange={e => setDefaultAuthor(e.target.value)} placeholder="笔名..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>放置到文集</label>
                <select value={collectionSelect} onChange={e => setCollectionSelect(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)', background: '#fff' }}>
                  <option value="">📁 不归入文集（未分类）</option>
                  <option value="__new__">＋ 新建文集...</option>
                  {existingCollections.map(c => (
                    <option key={c} value={c}>📓 {c}</option>
                  ))}
                </select>
              </div>
            </div>

            {collectionSelect === '__new__' && (
              <div className="fade-in">
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>新建文集名称</label>
                <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} placeholder="请输入文集名称（如：行客集）"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)' }} />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>正文 (支持粘贴多首诗，多首诗词之间用空行分隔)</label>
              <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="在此粘贴诗词文本...&#10;例如：&#10;《春晓》&#10;春眠不觉晓，处处闻啼鸟。&#10;夜来风雨声，花落知多少。&#10;&#10;《送友人》&#10;青山横北郭，白水绕东城。&#10;此地一为别，孤蓬万里征。"
                style={{ width: '100%', height: '220px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)', resize: 'none', lineHeight: 1.6 }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button onClick={handleLocalParse} style={{
                flex: 1, background: '#fdfbf7', border: '1px solid #d9c9b2', color: '#8b5a2b', padding: '12px',
                borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                ⚡ 本地快速解析
              </button>
              <button 
                onClick={handleAIParse}
                style={{
                  flex: 1, background: 'var(--cinnabar-red)', color: 'white', border: 'none', padding: '12px',
                  borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kaiti)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: settings.apiKey ? 1 : 0.6
                }}
              >
                🤖 AI 智能解析 {settings.apiKey ? '' : '(需配Key)'}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Review & Edit Parsed Poems */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {getFinalCollection() && (
              <div style={{ background: '#fdfbf7', border: '1px solid #d9c9b2', color: '#8b5a2b', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', fontFamily: 'var(--font-kaiti)' }}>
                📓 准备导入至文集：<strong>{getFinalCollection()}</strong>
              </div>
            )}
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {parsedPoems.map((poem, index) => (
                <div key={poem.id} style={{
                  border: '1px solid #eee', borderRadius: '8px', padding: '20px', background: poem.checked ? '#fff' : '#fcfcfc',
                  boxShadow: poem.checked ? '0 4px 12px rgba(0,0,0,0.04)' : 'none', opacity: poem.checked ? 1 : 0.6,
                  transition: 'all 0.2s', borderLeft: poem.checked ? '4px solid var(--cinnabar-red)' : '4px solid #ccc'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'var(--font-kaiti)', fontSize: '16px' }}>
                      <input type="checkbox" checked={poem.checked} 
                        onChange={e => {
                          const updated = [...parsedPoems];
                          updated[index].checked = e.target.checked;
                          setParsedPoems(updated);
                        }} 
                      />
                      作品 #{index + 1}
                    </label>
                    {!poem.checked && <span style={{ fontSize: '13px', color: '#999' }}>排除导入</span>}
                  </div>

                  {poem.checked && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 2 }}>
                          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>标题</label>
                          <input type="text" value={poem.title} 
                            onChange={e => {
                              const updated = [...parsedPoems];
                              updated[index].title = e.target.value;
                              setParsedPoems(updated);
                            }} 
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kaiti)' }} 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>作者</label>
                          <input type="text" value={poem.author} 
                            onChange={e => {
                              const updated = [...parsedPoems];
                              updated[index].author = e.target.value;
                              setParsedPoems(updated);
                            }} 
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kaiti)' }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>体裁判定</label>
                          <select value={poem.type} 
                            onChange={e => {
                              const updated = [...parsedPoems];
                              updated[index].type = e.target.value as PoemType;
                              setParsedPoems(updated);
                            }} 
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kaiti)', background: '#fff' }}
                          >
                            {TYPE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        {poem.type === 'cipai' && (
                          <div style={{ flex: 1 }} className="fade-in">
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>词牌名称</label>
                            <input type="text" value={poem.cipaiName || ''} placeholder="例如：浣溪沙"
                              onChange={e => {
                                const updated = [...parsedPoems];
                                updated[index].cipaiName = e.target.value;
                                setParsedPoems(updated);
                              }} 
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kaiti)' }} 
                            />
                          </div>
                        )}

                        {poem.type === 'sonnet' && (
                          <div style={{ flex: 1 }} className="fade-in">
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>十四行诗变体</label>
                            <select value={poem.sonnetType || 'none'} 
                              onChange={e => {
                                const updated = [...parsedPoems];
                                updated[index].sonnetType = e.target.value as SonnetType;
                                setParsedPoems(updated);
                              }} 
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kaiti)', background: '#fff' }}
                            >
                              {SONNET_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>正文内容</label>
                        <textarea value={poem.content} 
                          onChange={e => {
                            const updated = [...parsedPoems];
                            updated[index].content = e.target.value;
                            setParsedPoems(updated);
                          }} 
                          style={{ width: '100%', height: '100px', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kaiti)', resize: 'none', lineHeight: 1.5 }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <button onClick={handleImportSubmit} style={{
                flex: 2, background: 'var(--cinnabar-red)', color: 'white', border: 'none', padding: '12px',
                borderRadius: '6px', fontSize: '16px', fontFamily: 'var(--font-kaiti)', cursor: 'pointer', letterSpacing: '2px'
              }}>
                确认导入 (已选择 {parsedPoems.filter(p => p.checked).length} 首)
              </button>
              <button onClick={() => setStep(1)} style={{
                flex: 1, background: 'white', color: '#666', border: '1px solid #ddd', padding: '12px',
                borderRadius: '6px', fontSize: '15px', cursor: 'pointer'
              }}>
                返回重新输入
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImportModal;
