import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CipaiCategory, CipaiData } from '../types';

const GROUPS: Array<{ value: CipaiCategory; label: string; note: string }> = [
  { value: 'xiao_ling', label: '小令', note: '五十八字以内' },
  { value: 'zhong_diao', label: '中调', note: '五十九至九十字' },
  { value: 'chang_diao', label: '长调', note: '九十一字以上' },
];

const CipaiGallery: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CipaiData[]>([]);
  const [query, setQuery] = useState(() => sessionStorage.getItem('oucheng_cipai_query') || '');
  const [error, setError] = useState(false);
  const [visibleCounts, setVisibleCounts] = useState<Record<CipaiCategory, number>>({
    xiao_ling: 48,
    zhong_diao: 48,
    chang_diao: 48,
  });

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cipai.json`)
      .then(r => {
        if (!r.ok) throw new Error('load failed');
        return r.json();
      })
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('oucheng_cipai_query', query);
  }, [query]);

  const primary = useMemo(() => {
    const byName = new Map<string, CipaiData>();
    items.forEach(item => {
      if (!byName.has(item.name) || item.variantLabel === '正体') byName.set(item.name, item);
    });
    return Array.from(byName.values());
  }, [items]);

  const filtered = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) return primary;
    return primary.filter(item =>
      item.name.includes(keyword)
      || item.aliases?.some(alias => alias.includes(keyword))
      || item.representative?.includes(keyword)
      || item.sourceAuthor?.includes(keyword)
    );
  }, [primary, query]);

  const variantCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach(item => counts.set(item.name, (counts.get(item.name) || 0) + 1));
    return counts;
  }, [items]);

  return (
    <div className="mobile-page cipai-page">
      <header className="page-header">
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="返回"><ChevronLeft /></button>
        <div><h1>词牌大观</h1><p>以词牌为舟，渡入宋词长河</p></div>
        <span className="header-spacer" />
      </header>

      <label className="ink-search">
        <Search size={18} aria-hidden="true" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索词牌、别名或词人" />
        {query && <button onClick={() => setQuery('')}>清除</button>}
      </label>

      {error ? (
        <div className="paper-empty"><strong>词牌数据未能载入</strong><span>请稍后重试，已有创作不会受到影响。</span></div>
      ) : items.length === 0 ? (
        <div className="cipai-skeleton" aria-label="正在载入词牌"><i /><i /><i /><i /><i /><i /></div>
      ) : query ? (
        <section className="cipai-section">
          <div className="section-heading"><h2>搜索结果</h2><span>{filtered.length} 个词牌</span></div>
          <div className="cipai-card-grid">{filtered.map(item => <CipaiCard key={item.id || item.name} item={item} variants={variantCounts.get(item.name) || 1} query={query} onOpen={() => navigate(`/cipai/${encodeURIComponent(item.id || item.name)}`)} />)}</div>
          {filtered.length === 0 && <div className="paper-empty"><strong>未寻得相关词牌</strong><span>可尝试词牌别名或减少关键词。</span></div>}
        </section>
      ) : GROUPS.map(group => {
        const groupItems = filtered.filter(item => item.category === group.value);
        return (
          <section className="cipai-section" key={group.value}>
            <div className="section-heading"><div><h2>{group.label}</h2><small>{group.note}</small></div><span>{groupItems.length} 调</span></div>
            <div className="cipai-card-grid">{groupItems.slice(0, visibleCounts[group.value]).map(item => <CipaiCard key={item.id || item.name} item={item} variants={variantCounts.get(item.name) || 1} onOpen={() => navigate(`/cipai/${encodeURIComponent(item.id || item.name)}`)} />)}</div>
            {visibleCounts[group.value] < groupItems.length && (
              <button
                className="cipai-load-more"
                onClick={() => setVisibleCounts(current => ({ ...current, [group.value]: current[group.value] + 48 }))}
              >
                展开更多（已显示 {visibleCounts[group.value]} / {groupItems.length}）
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
};

const CipaiCard: React.FC<{ item: CipaiData; variants: number; query?: string; onOpen: () => void }> = ({ item, variants, query, onOpen }) => {
  const matchedAlias = query ? item.aliases?.find(alias => alias.includes(query) && !item.name.includes(query)) : undefined;
  return (
  <button className="cipai-slip" onClick={onOpen}>
    <strong>{item.name}</strong>
    <span>{item.charCount} 字 · {variants} 体</span>
    <small>{item.representative || item.sourceAuthor || '历代词家'}</small>
    {matchedAlias && <small>又名 {matchedAlias}</small>}
  </button>
  );
};

export default CipaiGallery;
