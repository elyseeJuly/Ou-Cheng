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
    <div style={{ marginBottom: '32px' }}>
      {/* 朝代栏 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{
          fontSize: '11px', color: '#999', letterSpacing: '3px',
          fontFamily: 'monospace', marginBottom: '8px',
        }}>
          · 朝代 ·
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {DYNASTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onDynastyChange(opt.value)}
              style={{
                padding: '5px 14px',
                border: dynasty === opt.value ? '1px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                borderRadius: '20px',
                background: dynasty === opt.value ? 'var(--cinnabar-red)' : 'transparent',
                color: dynasty === opt.value ? 'white' : '#666',
                fontSize: '13px',
                fontFamily: 'var(--font-kaiti)',
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
      <div>
        <div style={{
          fontSize: '11px', color: '#999', letterSpacing: '3px',
          fontFamily: 'monospace', marginBottom: '8px',
        }}>
          · 体裁 ·
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {GENRE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onGenreChange(opt.value)}
              style={{
                padding: '5px 14px',
                border: genre === opt.value ? '1px solid #2d5a3d' : '1px solid #e0e0e0',
                borderRadius: '20px',
                background: genre === opt.value ? '#2d5a3d' : 'transparent',
                color: genre === opt.value ? 'white' : '#666',
                fontSize: '13px',
                fontFamily: 'var(--font-kaiti)',
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
