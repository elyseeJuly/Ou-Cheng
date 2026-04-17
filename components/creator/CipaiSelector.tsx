import React, { useState, useEffect, useMemo } from 'react';
import { CipaiData, CipaiCategory } from '../../types';

interface CipaiSelectorProps {
  value?: string;
  onChange: (cipai: CipaiData) => void;
}

const CATEGORY_LABELS: Record<CipaiCategory, { label: string; range: string; color: string }> = {
  xiao_ling: { label: '小令', range: '≤58字', color: '#2d5a3d' },
  zhong_diao: { label: '中调', range: '59–90字', color: '#5a3a8a' },
  chang_diao: { label: '长调', range: '≥91字', color: '#b22222' },
};

const CipaiSelector: React.FC<CipaiSelectorProps> = ({ value, onChange }) => {
  const [cipaiList, setCipaiList] = useState<CipaiData[]>([]);
  const [activeCategory, setActiveCategory] = useState<CipaiCategory>('xiao_ling');
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cipai.json`)
      .then(r => r.json())
      .then((data: CipaiData[]) => { setCipaiList(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return cipaiList.filter(c => {
      const matchCat = c.category === activeCategory;
      const matchSearch = search
        ? c.name.includes(search) || c.aliases?.some(a => a.includes(search))
        : true;
      return matchCat && matchSearch;
    }).sort((a, b) => a.charCount - b.charCount);
  }, [cipaiList, activeCategory, search]);

  const selectedCipai = cipaiList.find(c => c.name === value);

  return (
    <div style={{ position: 'relative' }}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '10px 16px',
          border: '1px solid #e0e0e0', borderRadius: '8px',
          background: 'white', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-kaiti)', fontSize: '16px', color: '#333',
          transition: 'border 0.2s',
        }}
      >
        <span>
          {selectedCipai
            ? <><span style={{ color: 'var(--cinnabar-red)' }}>《{selectedCipai.name}》</span> <span style={{ fontSize: '12px', color: '#999' }}>{selectedCipai.charCount}字</span></>
            : <span style={{ color: '#bbb' }}>选择词牌...</span>
          }
        </span>
        <span style={{ color: '#ccc', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid #eee', borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          animation: 'fadeInDown 0.2s ease-out',
        }}>
          {/* 三级分类 Tab */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0ede8' }}>
            {(Object.entries(CATEGORY_LABELS) as [CipaiCategory, typeof CATEGORY_LABELS[CipaiCategory]][]).map(([cat, info]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none',
                  background: activeCategory === cat ? '#fdfbf7' : 'transparent',
                  borderBottom: activeCategory === cat ? `2px solid ${info.color}` : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s',
                  color: activeCategory === cat ? info.color : '#999',
                  fontFamily: 'var(--font-kaiti)', fontSize: '14px',
                  letterSpacing: '1px',
                }}
              >
                {info.label}
                <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.7 }}>{info.range}</div>
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f5f5f5' }}>
            <input
              type="text"
              placeholder="搜索词牌名..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', border: 'none', background: '#f8f7f5',
                borderRadius: '6px', padding: '6px 12px', fontSize: '14px',
                fontFamily: 'var(--font-kaiti)',
                outline: 'none',
              }}
            />
          </div>

          {/* 词牌列表 */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#bbb', fontFamily: '"Ma Shan Zheng", serif' }}>
                加载中...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#bbb', fontFamily: '"Ma Shan Zheng", serif' }}>
                未找到对应词牌
              </div>
            ) : (
              filtered.map(cipai => (
                <div
                  key={cipai.name}
                  onClick={() => { onChange(cipai); setIsOpen(false); setSearch(''); }}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    background: value === cipai.name ? '#fdf5f5' : 'transparent',
                    borderLeft: value === cipai.name ? '3px solid var(--cinnabar-red)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fdfbf7'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = value === cipai.name ? '#fdf5f5' : 'transparent'}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-kaiti)', fontSize: '16px', color: '#333' }}>
                      {cipai.name}
                    </span>
                    {cipai.aliases && cipai.aliases.length > 0 && (
                      <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '6px' }}>
                        又名：{cipai.aliases[0]}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#999' }}>{cipai.charCount}字</div>
                    {cipai.representative && (
                      <div style={{ fontSize: '11px', color: '#bbb' }}>{cipai.representative}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CipaiSelector;
