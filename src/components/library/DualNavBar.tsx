import React from 'react';
import { Dynasty, Genre } from '../../types';

interface DualNavBarProps {
  dynasty: Dynasty;
  genre: Genre;
  onDynastyChange: (d: Dynasty) => void;
  onGenreChange: (g: Genre) => void;
  counts?: Partial<Record<Dynasty, number>>;
}

const DYNASTY_OPTIONS: { value: Dynasty; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'shijing', label: '诗经·楚辞' },
  { value: 'han', label: '汉' },
  { value: 'wei_jin', label: '魏晋' },
  { value: 'tang', label: '唐' },
  { value: 'song', label: '宋' },
  { value: 'yuan', label: '元' },
  { value: 'ming', label: '明' },
  { value: 'qing', label: '清' },
];

const GENRE_OPTIONS: { value: Genre; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '☆' },
  { value: 'shi', label: '诗', icon: '律' },
  { value: 'ci', label: '词', icon: '曲' },
  { value: 'qu', label: '曲', icon: '折' },
  { value: 'fu', label: '赋', icon: '赋' },
  { value: 'yuefu', label: '乐府', icon: '乐' },
];

const DualNavBar: React.FC<DualNavBarProps> = ({ dynasty, genre, onDynastyChange, onGenreChange }) => {
  return (
    <div className="classic-dual-nav" style={{ marginBottom: '32px' }}>
      {/* 朝代栏 */}
      <div className="classic-filter-group" style={{ marginBottom: '14px' }}>
        <div className="classic-filter-label" style={{
          fontSize: '11px', color: '#999', letterSpacing: '3px',
          fontFamily: 'var(--font-serif)', marginBottom: '8px',
        }}>
          · 朝代 ·
        </div>
        <div className="classic-filter-options" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {DYNASTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onDynastyChange(opt.value)}
              className={dynasty === opt.value ? 'active' : ''}
              style={{
                padding: '5px 14px',
                border: dynasty === opt.value ? '1px solid var(--accent-active)' : '1px solid var(--ink-qing)',
                borderRadius: '20px',
                background: dynasty === opt.value ? 'var(--accent-active)' : 'transparent',
                color: dynasty === opt.value ? '#F9F3E6' : 'var(--ink-zhong)',
                fontSize: '13px',
                fontFamily: 'var(--font-kai)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '1px',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 体裁栏 */}
      <div className="classic-filter-group">
        <div className="classic-filter-label" style={{
          fontSize: '11px', color: '#999', letterSpacing: '3px',
          fontFamily: 'var(--font-serif)', marginBottom: '8px',
        }}>
          · 体裁 ·
        </div>
        <div className="classic-filter-options" style={{ display: 'flex', gap: '8px' }}>
          {GENRE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onGenreChange(opt.value)}
              className={genre === opt.value ? 'active' : ''}
              style={{
                padding: '5px 14px',
                border: genre === opt.value ? '1px solid #2d5a3d' : '1px solid var(--ink-qing)',
                borderRadius: '20px',
                background: genre === opt.value ? '#2d5a3d' : 'transparent',
                color: genre === opt.value ? '#F9F3E6' : 'var(--ink-zhong)',
                fontSize: '13px',
                fontFamily: 'var(--font-kai)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '1px',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DualNavBar;
