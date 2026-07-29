import React, { useState, useEffect, useRef } from 'react';
import { Poem, PoemBase, PoemType, SonnetType, CipaiData, RhymeBook } from '../../types';
import { getSettings, getCollections } from '../../services/storageService';
import {
  autoDetectJintiVariant,
  localParseManuscript,
  resolveCipaiVariant,
} from '../../engine/importParser';

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
  cipaiVariantId?: string;
  sonnetType?: SonnetType;
  jintiVariant?: string;
  rhymeBook: RhymeBook;
  matchStatus?: 'exact' | 'ambiguous' | 'unmatched';
  candidateIds?: string[];
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const settings = getSettings();
  const existingCollections = getCollections();

  const [step, setStep] = useState<1 | 2>(1);
  const [inputText, setInputText] = useState('');
  const [defaultAuthor, setDefaultAuthor] = useState(settings.defaultPenName);
  
  // Collection States
  const [collectionSelect, setCollectionSelect] = useState<string>(''); // '' = none, '__new__' = new
  const [newCollectionName, setNewCollectionName] = useState('');

  // Parsing & Review States
  const [parsedPoems, setParsedPoems] = useState<TempPoem[]>([]);
  const [cipais, setCipais] = useState<CipaiData[]>([]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const getFocusable = () => dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    getFocusable()?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

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

  const ensureCipais = async (): Promise<CipaiData[]> => {
    if (cipais.length) return cipais;
    try {
      const data = await fetch(`${import.meta.env.BASE_URL || ''}data/cipai.json`).then(response => {
        if (!response.ok) throw new Error('cipai load failed');
        return response.json();
      });
      const list = Array.isArray(data) ? data : [];
      setCipais(list);
      return list;
    } catch (_) {
      return [];
    }
  };

  const resolveTempPoem = (
    poem: Omit<TempPoem, 'matchStatus' | 'candidateIds'>,
    data: CipaiData[],
    allowAutoCipai = false
  ): TempPoem => {
    const rhymeBook = poem.rhymeBook || settings.rhymeBook;
    const resolution = resolveCipaiVariant(
      poem.content,
      `${poem.cipaiName || ''} ${poem.title}`.trim(),
      data,
      rhymeBook
    );
    const resolvedAsCipai = poem.type === 'cipai' || (allowAutoCipai && resolution.status === 'exact');
    let jintiVariant = poem.jintiVariant;
    if (poem.type.startsWith('jueju') || poem.type.startsWith('lvshi')) {
      jintiVariant = autoDetectJintiVariant(poem.content, poem.type as 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7', rhymeBook);
    }
    return {
      ...poem,
      type: resolvedAsCipai && resolution.status === 'exact' ? 'cipai' : poem.type,
      cipaiName: resolvedAsCipai ? (resolution.cipaiName || poem.cipaiName) : undefined,
      cipaiVariantId: resolvedAsCipai ? resolution.variantId : undefined,
      jintiVariant,
      rhymeBook,
      matchStatus: resolvedAsCipai ? resolution.status : undefined,
      candidateIds: resolvedAsCipai ? resolution.candidateIds : undefined,
    };
  };

  const updateParsedPoem = (index: number, patch: Partial<TempPoem>, rerunResolution = false) => {
    setParsedPoems(current => current.map((poem, poemIndex) => {
      if (poemIndex !== index) return poem;
      const updated = { ...poem, ...patch };
      if (!rerunResolution) return updated;
      return resolveTempPoem(updated, cipais);
    }));
  };

  const handleLocalParse = async () => {
    if (!inputText.trim()) {
      alert('请填入文稿内容');
      return;
    }
    const localParsed = localParseManuscript(inputText, defaultAuthor, settings.rhymeBook);
    if (localParsed.length === 0) {
      alert('未识别到有效的诗词，请检查输入格式');
      return;
    }
    const cipaiData = await ensureCipais();
    setParsedPoems(localParsed.map(p => resolveTempPoem({
        ...p,
        checked: true,
        sonnetType: p.sonnetType || 'none',
        rhymeBook: settings.rhymeBook,
      }, cipaiData, true)));
    setStep(2);
  };

  const handleImportSubmit = () => {
    const selected = parsedPoems.filter(p => p.checked);
    if (selected.length === 0) {
      alert('请至少选择一首诗词进行导入');
      return;
    }
    const unresolvedCipai = selected.find(p => p.type === 'cipai' && !p.cipaiVariantId);
    if (unresolvedCipai) {
      alert(`《${unresolvedCipai.title || '无题'}》尚未确定具体词牌变体，请在复核页选择后再导入。`);
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

      const base: PoemBase = {
        id: `${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        title: p.title || '无题',
        author: p.author || defaultAuthor || '无名氏',
        content: p.content,
        heartNote: '',
        layout: settings.defaultLayout,
        paperStyle: settings.defaultPaperStyle,
        rhymeBook: p.rhymeBook,
        collectionName: finalCollection,
        createdAt: Date.now() - (selected.length - idx) * 1000, // ensure ordering
      };

      if (p.type === 'cipai' && p.cipaiName && p.cipaiVariantId) {
        return { ...base, type: 'cipai', cipaiName: p.cipaiName, cipaiVariantId: p.cipaiVariantId };
      }
      if (p.type === 'sonnet' && p.sonnetType && p.sonnetType !== 'none') {
        return { ...base, type: 'sonnet', sonnetType: p.sonnetType };
      }
      if (p.type === 'jueju_5' || p.type === 'jueju_7' || p.type === 'lvshi_5' || p.type === 'lvshi_7') {
        return { ...base, type: p.type, jintiVariant };
      }
      return { ...base, type: 'free' };
    });

    onImport(finalPoems);
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="导入文稿" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
      zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="fade-in-down" style={{
        background: 'var(--paper-2)', borderRadius: '12px', width: '90%', maxWidth: step === 1 ? '600px' : '800px',
        padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-kai)', fontSize: '24px', color: 'var(--ink-jiao)', margin: 0, letterSpacing: '2px' }}>
            {step === 1 ? '导入文稿' : '预览与确认导入'}
          </h2>
          <button aria-label="关闭导入文稿" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {step === 1 ? (
          /* Step 1: Input Raw Text */
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-zhong)', marginBottom: '6px' }}>默认作者笔名</label>
                <input type="text" value={defaultAuthor} onChange={e => setDefaultAuthor(e.target.value)} placeholder="笔名..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ink-qing)', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kai)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-zhong)', marginBottom: '6px' }}>放置到文集</label>
                <select value={collectionSelect} onChange={e => setCollectionSelect(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ink-qing)', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kai)', background: 'var(--paper-2)' }}>
                  <option value="">不归入文集（未分类）</option>
                  <option value="__new__">＋ 新建文集...</option>
                  {existingCollections.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {collectionSelect === '__new__' && (
              <div className="fade-in">
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-zhong)', marginBottom: '6px' }}>新建文集名称</label>
                <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} placeholder="请输入文集名称（如：行客集）"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ink-qing)', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kai)' }} />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-zhong)', marginBottom: '6px' }}>正文 (支持粘贴多首诗，多首诗词之间用空行分隔)</label>
              <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="在此粘贴诗词文本...&#10;例如：&#10;《春晓》&#10;春眠不觉晓，处处闻啼鸟。&#10;夜来风雨声，花落知多少。&#10;&#10;《送友人》&#10;青山横北郭，白水绕东城。&#10;此地一为别，孤蓬万里征。"
                style={{ width: '100%', height: '220px', padding: '12px', border: '1px solid var(--ink-qing)', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kai)', resize: 'none', lineHeight: 1.6 }} />
            </div>

            <div style={{ display: 'flex', marginTop: '10px' }}>
              <button onClick={handleLocalParse} style={{
                width: '100%', background: 'var(--accent-cta)', border: 'none', color: '#F9F3E6', padding: '12px',
                borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kai)', cursor: 'pointer'
              }}>
                本地解析并复核
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Review & Edit Parsed Poems */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {getFinalCollection() && (
              <div style={{ background: 'var(--paper-1)', border: '1px solid var(--ink-qing)', color: 'var(--ink-zhong)', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', fontFamily: 'var(--font-kai)' }}>
                准备导入至文集：<strong>{getFinalCollection()}</strong>
              </div>
            )}
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {parsedPoems.map((poem, index) => (
                <div key={poem.id} style={{
                  border: '1px solid #eee', borderRadius: '8px', padding: '20px', background: poem.checked ? 'var(--paper-2)' : '#fcfcfc',
                  boxShadow: poem.checked ? '0 4px 12px rgba(0,0,0,0.04)' : 'none', opacity: poem.checked ? 1 : 0.6,
                  transition: 'all 0.2s', borderLeft: poem.checked ? '4px solid var(--accent-active)' : '4px solid var(--ink-qing)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'var(--font-kai)', fontSize: '16px' }}>
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
                            onChange={e => updateParsedPoem(index, { title: e.target.value }, poem.type === 'cipai')}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)' }} 
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
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)' }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>体裁判定</label>
                          <select value={poem.type} 
                            onChange={e => {
                              const type = e.target.value as PoemType;
                              if (type === 'cipai') {
                                updateParsedPoem(index, { type, cipaiVariantId: undefined }, true);
                                return;
                              }
                              const jintiVariant = type.startsWith('jueju') || type.startsWith('lvshi')
                                ? autoDetectJintiVariant(poem.content, type as 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7', poem.rhymeBook)
                                : undefined;
                              updateParsedPoem(index, {
                                type, jintiVariant, cipaiName: undefined, cipaiVariantId: undefined,
                                matchStatus: undefined, candidateIds: undefined,
                              });
                            }} 
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)', background: 'var(--paper-2)' }}
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
                              onChange={e => updateParsedPoem(index, {
                                cipaiName: e.target.value, cipaiVariantId: undefined,
                              }, true)}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)' }} 
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
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)', background: 'var(--paper-2)' }}
                            >
                              {SONNET_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>本次校验韵书</label>
                          <select
                            value={poem.rhymeBook}
                            onChange={e => {
                              const rhymeBook = e.target.value as RhymeBook;
                              if (poem.type === 'cipai') {
                                updateParsedPoem(index, { rhymeBook, cipaiVariantId: undefined }, true);
                                return;
                              }
                              const jintiVariant = poem.type.startsWith('jueju') || poem.type.startsWith('lvshi')
                                ? autoDetectJintiVariant(poem.content, poem.type as 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7', rhymeBook)
                                : poem.jintiVariant;
                              updateParsedPoem(index, { rhymeBook, jintiVariant });
                            }}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)', background: 'var(--paper-2)' }}
                          >
                            <option value="ci_lin">词林正韵</option>
                            <option value="ping_shui">平水韵</option>
                            <option value="xin_yun">中华新韵</option>
                          </select>
                        </div>

                        {poem.type === 'cipai' && (
                          <div style={{ flex: 2 }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>具体词牌变体</label>
                            <select
                              value={poem.cipaiVariantId || ''}
                              onChange={e => {
                                const variant = cipais.find(cipai => cipai.id === e.target.value);
                                if (!variant) {
                                  updateParsedPoem(index, { cipaiVariantId: undefined, matchStatus: 'unmatched' });
                                  return;
                                }
                                updateParsedPoem(index, {
                                  cipaiName: variant.name,
                                  cipaiVariantId: variant.id,
                                  matchStatus: 'exact',
                                  candidateIds: variant.id ? [variant.id] : [],
                                });
                              }}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)', background: 'var(--paper-2)' }}
                            >
                              <option value="">{poem.matchStatus === 'ambiguous' ? '请选择匹配体' : '尚未确定具体格体'}</option>
                              {cipais.filter(cipai =>
                                cipai.name === poem.cipaiName || poem.candidateIds?.includes(cipai.id || '')
                              ).map((cipai, variantIndex) => (
                                <option key={cipai.id || `${cipai.name}-${variantIndex}`} value={cipai.id || ''}>
                                  {cipai.name} · {cipai.variantLabel || '正体'} · {cipai.charCount} 字 · {cipai.sourceAuthor || '佚名'}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {poem.type === 'cipai' && (
                        <div style={{ fontSize: '12px', color: poem.cipaiVariantId ? 'var(--meter-ping)' : 'var(--meter-warn)' }}>
                          {poem.cipaiVariantId
                            ? '已确定本地词谱变体，导入后将使用同一韵书继续校验。'
                            : poem.matchStatus === 'ambiguous'
                              ? '存在多个同分候选，请明确选择具体变体。'
                              : '正文与本地词谱尚未形成唯一匹配，请核对正文、词牌名或手动选择。'}
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>正文内容</label>
                        <textarea value={poem.content} 
                          onChange={e => updateParsedPoem(index, {
                            content: e.target.value,
                            cipaiVariantId: poem.type === 'cipai' ? undefined : poem.cipaiVariantId,
                          }, poem.type === 'cipai')}
                          style={{ width: '100%', height: '100px', padding: '8px 10px', border: '1px solid var(--ink-qing)', borderRadius: '4px', fontSize: '14px', fontFamily: 'var(--font-kai)', resize: 'none', lineHeight: 1.5 }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <button onClick={handleImportSubmit} style={{
                flex: 2, background: 'var(--accent-cta)', color: '#F9F3E6', border: 'none', padding: '12px',
                borderRadius: '6px', fontSize: '16px', fontFamily: 'var(--font-kai)', cursor: 'pointer', letterSpacing: '2px'
              }}>
                确认导入 (已选择 {parsedPoems.filter(p => p.checked).length} 首)
              </button>
              <button onClick={() => setStep(1)} style={{
                flex: 1, background: 'white', color: 'var(--ink-zhong)', border: '1px solid var(--ink-qing)', padding: '12px',
                borderRadius: '6px', fontSize: '15px', cursor: 'pointer'
              }}>
                返回重新输入
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
