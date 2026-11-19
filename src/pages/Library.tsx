import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dynasty, Genre, ClassicPoem, ImageryItem } from '../types';
import DualNavBar from '../components/library/DualNavBar';
import { loadIndex, ImageryIndexEntry } from '../services/imageryService';

const WordCloud3D = React.lazy(() => import('../components/library/WordCloud3D'));
const ClassicReader = React.lazy(() => import('../components/library/ClassicReader'));

/** 过滤含替换字符（U+FFFD）的残缺语料条目。 */
export const hasReadableCorpusText = (poem: ClassicPoem) =>
  !/[\uFFFD]/.test(`${poem.title || ''}${poem.author || ''}${poem.content || ''}`);

const Library: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allPoems, setAllPoems] = useState<ClassicPoem[]>([]);
  const [imageryItems, setImageryItems] = useState<ImageryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dynasty, setDynasty] = useState<Dynasty>('all');
  const [genre, setGenre] = useState<Genre>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordPoems, setWordPoems] = useState<ClassicPoem[]>([]);
  const [view, setView] = useState<'cloud' | 'read'>(searchParams.get('search') ? 'read' : 'cloud');

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/poetry.json`).then(r => r.json()).catch(() => []),
      loadIndex().catch(() => []),
    ]).then(([poems, imageryIndex]) => {
      setAllPoems((poems as ClassicPoem[]).filter(hasReadableCorpusText));
      // 新管线 index.json: {w,c,f,t} -> 兼容 WordCloud3D 的 ImageryItem
      setImageryItems((imageryIndex as ImageryIndexEntry[]).map(e => ({
        word: e.w,
        frequency: e.f,
        category: e.c,
        tone: e.t,
        relatedWords: [],
      })));
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
    if (q) setView('read');
  }, [searchParams]);

  // 过滤（以 category 字段为主，如"唐诗""宋词"）
  const filtered = allPoems.filter(p => {
    const cat = (p.category || '').toLowerCase();

    const dynMatch = dynasty === 'all' ||
      (dynasty === 'tang'    && cat.includes('唐')) ||
      (dynasty === 'song'    && cat.includes('宋')) ||
      (dynasty === 'yuan'    && cat.includes('元')) ||
      (dynasty === 'ming'    && cat.includes('明')) ||
      (dynasty === 'qing'    && cat.includes('清')) ||
      (dynasty === 'han'     && cat.includes('汉')) ||
      (dynasty === 'wei_jin' && (cat.includes('魏') || cat.includes('晋'))) ||
      (dynasty === 'shijing' && (cat.includes('诗经') || cat.includes('楚辞') || cat.includes('先秦')));

    const genreMatch = genre === 'all' ||
      (genre === 'shi'   && cat.includes('诗') && !cat.includes('词')) ||
      (genre === 'ci'    && cat.includes('词')) ||
      (genre === 'qu'    && cat.includes('曲')) ||
      (genre === 'fu'    && cat.includes('赋')) ||
      (genre === 'yuefu' && cat.includes('乐府'));

    const searchMatch = !searchTerm ||
      p.title?.includes(searchTerm) ||
      p.author?.includes(searchTerm) ||
      p.content?.includes(searchTerm);

    return dynMatch && genreMatch && searchMatch;
  });


  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
    setWordPoems(allPoems.filter(p => p.content?.includes(word) || p.title?.includes(word)).slice(0, 12));
  };

  const handleSearchChange = (q: string) => {
    setSearchTerm(q);
    if (q) {
      setSearchParams({ search: q });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="collection-page library-page" style={{ padding: '40px 60px', minHeight: '100vh', background: 'var(--paper-0)' }}>
      {/* 页头 */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: 'var(--font-kai)', fontSize: '42px',
          color: 'var(--accent-seal)', marginBottom: '8px', letterSpacing: '8px',
        }}>
          卷帙
        </h1>
        <p style={{ fontSize: '16px', color: '#999', letterSpacing: '4px', fontFamily: '"Ma Shan Zheng", serif' }}>
          经典与意象，皆可入诗
        </p>
      </div>

      {/* 视图切换 - 改用 .opt-item */}
      <div className="opt-group" style={{ justifyContent: 'center', marginBottom: '32px' }}>
        {([['cloud', '意象词云'], ['read', '经典赏读']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} className={`opt-item ${view === v ? 'active' : ''}`} style={{ fontSize: 'var(--text-body)' }}>{label}</button>
        ))}
      </div>

      {/* ── 3D 词云视图 ── */}
      {view === 'cloud' && (
        <div className="fade-in">
          <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
            {isLoading ? (
              <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-dan)', fontFamily: 'var(--font-kai)', fontSize: '20px' }}>
                正在加载卷帙...
              </div>
            ) : (
              <React.Suspense fallback={<div className="route-loading">正在绘制意象……</div>}><WordCloud3D
                imageryItems={imageryItems}
                onWordSelect={handleWordSelect}
              /></React.Suspense>
            )}
          </div>

          {/* 词云点击后相关诗词列表 */}
          {selectedWord && wordPoems.length > 0 && (
            <div className="fade-in" style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontFamily: 'var(--font-kai)', fontSize: '20px',
                color: '#333', letterSpacing: '4px', marginBottom: '16px',
              }}>
                含「{selectedWord}」的诗词 ({wordPoems.length} 首)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {wordPoems.slice(0, 9).map((p, i) => (
                  <div key={i} onClick={() => { setView('read'); setSearchTerm(p.title); }}
                    style={{
                      background: '#fdfbf7', padding: '20px',
                      borderLeft: '3px solid var(--accent-active)',
                      borderRadius: '0 6px 6px 0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                  >
                    <h4 style={{ fontFamily: 'var(--font-kai)', fontSize: '18px', color: '#1a1a1a', marginBottom: '4px' }}>{p.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--accent-seal)', marginBottom: '10px', fontFamily: '"Ma Shan Zheng", serif' }}>{p.author}</p>
                    <p style={{
                      fontSize: '14px', color: '#666', lineHeight: 1.7,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      fontFamily: 'var(--font-kai)', letterSpacing: '2px',
                    }}>
                      {p.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 经典赏读视图 ── */}
      {view === 'read' && (
        <div className="fade-in classic-read-view">
          {/* 双维导航 */}
          <DualNavBar dynasty={dynasty} genre={genre} onDynastyChange={setDynasty} onGenreChange={setGenre} />

          {/* 搜索 */}
          <div className="classic-search" style={{ marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
            <input
              type="text"
              placeholder="搜索诗题、作者或佳句..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: '100%', padding: '12px 20px',
                border: '1px solid #e0e0e0', borderRadius: '24px',
                background: 'white', fontSize: '16px',
                fontFamily: 'var(--font-kai)', boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            />
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#bbb', fontFamily: 'var(--font-kai)', fontSize: '20px' }}>
              正在加载卷帙...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#bbb', fontFamily: 'var(--font-kai)', fontSize: '20px' }}>
              未找到相关卷帙
            </div>
          ) : (
            <React.Suspense fallback={<div className="route-loading">正在展卷……</div>}><ClassicReader
              poems={filtered}
              imageryItems={imageryItems}
              onImageryClick={(word) => {
                setView('cloud');
                handleWordSelect(word);
              }}
            /></React.Suspense>
          )}
        </div>
      )}

      {/* 致谢页脚 */}
      <footer style={{
        marginTop: '60px', paddingTop: '20px', borderTop: '1px solid rgba(178,34,34,0.1)',
        textAlign: 'center', opacity: 0.6,
      }}>
        <p style={{ fontSize: '12px', color: '#888', fontFamily: '"Ma Shan Zheng", serif', letterSpacing: '2px' }}>
          数据源于 <a href="https://github.com/chinese-poetry/chinese-poetry" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-seal)', textDecoration: 'none' }}>chinese-poetry</a>、<a href="https://github.com/Werneror/Poetry" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-seal)', textDecoration: 'none' }}>Werneror/Poetry</a>、<a href="https://github.com/open-chinese/poetry-collection" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-seal)', textDecoration: 'none' }}>poetry-collection</a> 开源项目
        </p>
      </footer>
    </div>
  );
};

export default Library;
