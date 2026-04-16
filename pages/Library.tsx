import React, { useState, useEffect } from 'react';
import { Dynasty, Genre, ClassicPoem, ImageryItem } from '../types';
import WordCloud3D from '../components/library/WordCloud3D';
import ClassicReader from '../components/library/ClassicReader';
import DualNavBar from '../components/library/DualNavBar';

const Library: React.FC = () => {
  const [allPoems, setAllPoems] = useState<ClassicPoem[]>([]);
  const [imageryItems, setImageryItems] = useState<ImageryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dynasty, setDynasty] = useState<Dynasty>('all');
  const [genre, setGenre] = useState<Genre>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordPoems, setWordPoems] = useState<ClassicPoem[]>([]);
  const [view, setView] = useState<'cloud' | 'read'>('cloud');

  useEffect(() => {
    Promise.all([
      fetch('/data/poetry.json').then(r => r.json()).catch(() => []),
      fetch('/data/imagery.json').then(r => r.json()).catch(() => []),
    ]).then(([poems, imagery]) => {
      setAllPoems(poems);
      setImageryItems(imagery);
      setIsLoading(false);
    });
  }, []);

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


  const handleWordSelect = (word: string, poems: ClassicPoem[]) => {
    setSelectedWord(word);
    setWordPoems(poems);
  };

  return (
    <div style={{ padding: '40px 60px', minHeight: '100vh', background: 'var(--paper-white)' }}>
      {/* 页头 */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: 'var(--font-kaiti)', fontSize: '42px',
          color: 'var(--cinnabar-red)', marginBottom: '8px', letterSpacing: '8px',
        }}>
          寻章摘句
        </h1>
        <p style={{ fontSize: '16px', color: '#999', letterSpacing: '4px', fontFamily: '"Ma Shan Zheng", serif' }}>
          典藏 33,000 首 · 唐宋至清 · 公版古典诗词
        </p>
      </div>

      {/* 视图切换 */}
      <div style={{ display: 'flex', gap: '6px', background: '#f0ede8', borderRadius: '20px', padding: '3px', width: 'fit-content', margin: '0 auto 32px' }}>
        {([['cloud', '☁ 意象词云'], ['read', '📖 经典赏读']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '7px 24px', borderRadius: '16px', border: 'none',
            background: view === v ? '#1a1a1a' : 'transparent',
            color: view === v ? '#fff' : '#888',
            cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
            fontFamily: 'var(--font-kaiti)', letterSpacing: '2px',
          }}>{label}</button>
        ))}
      </div>

      {/* ── 3D 词云视图 ── */}
      {view === 'cloud' && (
        <div className="fade-in">
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            {isLoading ? (
              <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: 'var(--font-kaiti)', fontSize: '20px' }}>
                正在加载卷帙...
              </div>
            ) : (
              <WordCloud3D
                imageryItems={imageryItems}
                allPoems={allPoems}
                onWordSelect={handleWordSelect}
              />
            )}
          </div>

          {/* 词云点击后相关诗词列表 */}
          {selectedWord && wordPoems.length > 0 && (
            <div className="fade-in" style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontFamily: 'var(--font-kaiti)', fontSize: '20px',
                color: '#333', letterSpacing: '4px', marginBottom: '16px',
              }}>
                含「{selectedWord}」的诗词 ({wordPoems.length} 首)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {wordPoems.slice(0, 9).map((p, i) => (
                  <div key={i} onClick={() => { setView('read'); }}
                    style={{
                      background: '#fdfbf7', padding: '20px',
                      borderLeft: '3px solid var(--cinnabar-red)',
                      borderRadius: '0 6px 6px 0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                  >
                    <h4 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '18px', color: '#1a1a1a', marginBottom: '4px' }}>{p.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--cinnabar-red)', marginBottom: '10px', fontFamily: '"Ma Shan Zheng", serif' }}>{p.author}</p>
                    <p style={{
                      fontSize: '14px', color: '#666', lineHeight: 1.7,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      fontFamily: 'var(--font-kaiti)', letterSpacing: '2px',
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
        <div className="fade-in">
          {/* 双维导航 */}
          <DualNavBar dynasty={dynasty} genre={genre} onDynastyChange={setDynasty} onGenreChange={setGenre} />

          {/* 搜索 */}
          <div style={{ marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
            <input
              type="text"
              placeholder="搜索诗题、作者或佳句..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '12px 20px',
                border: '1px solid #e0e0e0', borderRadius: '24px',
                background: 'white', fontSize: '16px',
                fontFamily: 'var(--font-kaiti)', boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            />
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#bbb', fontFamily: 'var(--font-kaiti)', fontSize: '20px' }}>
              正在加载卷帙...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#bbb', fontFamily: 'var(--font-kaiti)', fontSize: '20px' }}>
              未找到相关卷帙
            </div>
          ) : (
            <ClassicReader poems={filtered.slice(0, 500)} />
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
