import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CipaiData, ClassicPoem } from '../types';

const clauseLengths = (content: string) => content
  .split(/[，。、；？！\n\r]+/)
  .map(line => Array.from(line.replace(/\s/g, '')).length)
  .filter(Boolean);

export const matchesCipaiVariant = (poem: ClassicPoem, cipai: CipaiData) => {
  if (/[□〓]/.test(poem.content)) return false;
  const names = [cipai.name, ...(cipai.aliases || [])];
  if (!names.some(name => poem.title === name || poem.title.startsWith(`${name}·`) || poem.title.startsWith(`${name}・`))) return false;
  const expected = [...cipai.upperPattern, ...(cipai.lowerPattern || [])].map(pattern => pattern.length);
  const actual = clauseLengths(poem.content);
  return expected.length === actual.length && expected.every((length, index) => length === actual[index]);
};

const CipaiDetail: React.FC = () => {
  const navigate = useNavigate();
  const { variantId = '' } = useParams();
  const [items, setItems] = useState<CipaiData[]>([]);
  const [poems, setPoems] = useState<ClassicPoem[]>([]);
  const [selectedId, setSelectedId] = useState(decodeURIComponent(variantId));
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    setSelectedId(decodeURIComponent(variantId));
  }, [variantId]);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    let cancelled = false;

    setLoading(true);
    setLoadFailed(false);

    fetch(`${baseUrl}data/cipai.json`)
      .then(r => {
        if (!r.ok) throw new Error('cipai load failed');
        return r.json();
      })
      .then(cipai => {
        if (cancelled) return;
        setItems(Array.isArray(cipai) ? cipai : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setLoading(false);
        setLoadFailed(true);
      });

    fetch(`${baseUrl}data/poetry.json`)
      .then(r => {
        if (!r.ok) throw new Error('poetry load failed');
        return r.json();
      })
      .then(poetry => {
        if (!cancelled) setPoems(Array.isArray(poetry) ? poetry : []);
      })
      .catch(() => {
        if (!cancelled) setPoems([]);
      });

    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(() => items.find(item => item.id === selectedId) || items.find(item => item.name === selectedId), [items, selectedId]);
  const variants = useMemo(() => selected ? items.filter(item => item.name === selected.name) : [], [items, selected]);
  const examples = useMemo(() => {
    if (!selected) return [];
    const canonical: ClassicPoem[] = selected.sourceText ? [{
      title: selected.name,
      author: selected.sourceAuthor || '佚名',
      content: selected.sourceText,
      category: '谱例',
      dynasty: '历代',
    }] : [];
    return [...canonical, ...poems.filter(poem => matchesCipaiVariant(poem, selected))].slice(0, 5);
  }, [poems, selected]);
  const currentExample = examples[exampleIndex] || examples[0];
  const lineCount = selected ? selected.upperPattern.length + (selected.lowerPattern?.length || 0) : 0;

  useEffect(() => { setExampleIndex(0); }, [selectedId]);

  if (loading) return <div className="mobile-page"><header className="page-header"><button className="icon-button" onClick={() => navigate(-1)} aria-label="返回"><ChevronLeft /></button><h1>词牌详情</h1><span className="header-spacer" /></header><div className="cipai-detail-loading">正在展卷……</div></div>;

  if (loadFailed) return <div className="mobile-page"><header className="page-header"><button className="icon-button" onClick={() => navigate(-1)} aria-label="返回"><ChevronLeft /></button><h1>词牌详情</h1><span className="header-spacer" /></header><div className="paper-empty"><strong>词牌数据未能载入</strong><span>请回到词牌大观后重试。</span></div></div>;

  if (!selected) return <div className="mobile-page"><header className="page-header"><button className="icon-button" onClick={() => navigate(-1)} aria-label="返回"><ChevronLeft /></button><h1>词牌详情</h1><span className="header-spacer" /></header><div className="paper-empty"><strong>未寻得此词牌</strong><span>请回到词牌大观重新选择。</span></div></div>;

  return (
    <div className="mobile-page cipai-detail-page">
      <header className="page-header compact">
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="返回"><ChevronLeft /></button>
        <h1>词牌详情</h1>
        <span className="header-spacer" />
      </header>

      <article className="cipai-masthead">
        <div className="cipai-vertical-name"><strong>{selected.name}</strong><i>词</i></div>
        <dl>
          <div><dt>字数</dt><dd>{selected.charCount} 字</dd></div>
          <div><dt>句数</dt><dd>{lineCount} 句</dd></div>
          <div><dt>片数</dt><dd>{selected.lowerPattern?.length ? '双调' : '单调'}</dd></div>
          <div><dt>格体</dt><dd>{selected.variantLabel || '正体'}</dd></div>
          {selected.aliases?.length ? <div className="wide"><dt>别名</dt><dd>{selected.aliases.join('、')}</dd></div> : null}
        </dl>
      </article>

      <section className="detail-block">
        <h2>词牌简介</h2>
        <p>{selected.description || `《${selected.name}》为传统词牌，${selected.sourceBook ? `谱据《${selected.sourceBook}》所录，` : ''}本体共 ${selected.charCount} 字。选择具体变体后，可按真实谱式逐字填词。`}</p>
      </section>

      {currentExample && <section className="detail-block example-browser">
        <div className="example-heading"><h2>{currentExample === examples[0] && selected.sourceText ? '定格词作' : '同体词作'}</h2><span>{Math.min(exampleIndex + 1, examples.length)} / {examples.length}</span></div>
        <div className="example-poem"><h3>{currentExample.title}</h3><span>{currentExample.author}{currentExample === examples[0] && selected.sourceRef ? ` · ${selected.sourceRef}` : ''}</span><p>{currentExample.content}</p></div>
        {examples.length > 1 && <div className="example-pager" aria-label="切换词作">
          <button disabled={exampleIndex === 0} onClick={() => setExampleIndex(index => index - 1)}>上一篇</button>
          <div>{examples.map((poem, index) => <button key={`${poem.title}-${poem.author}-${index}`} className={index === exampleIndex ? 'active' : ''} onClick={() => setExampleIndex(index)} aria-label={`查看第 ${index + 1} 首词作`} />)}</div>
          <button disabled={exampleIndex === examples.length - 1} onClick={() => setExampleIndex(index => index + 1)}>下一篇</button>
        </div>}
      </section>}

      {variants.length > 1 && <section className="detail-block variant-block"><h2>词牌变体</h2><select value={selected.id || selected.name} onChange={e => { setExampleIndex(0); setSelectedId(e.target.value); }}>{variants.map((variant, index) => <option key={variant.id || index} value={variant.id || variant.name}>{variant.variantLabel || `第 ${index + 1} 体`} · {variant.charCount} 字</option>)}</select></section>}

      <div className="sticky-primary"><button onClick={() => navigate(`/?mode=pro&cipai=${encodeURIComponent(selected.id || selected.name)}`)}>依此填词</button></div>
    </div>
  );
};

export default CipaiDetail;
