import React, { useState, useEffect, useCallback } from 'react';
import { Poem } from '../types';
import { getPoems, deletePoem } from '../services/storageService';
import PoemPreview from '../components/preview/PoemPreview';
import ExportModal from '../components/ExportModal';
import { useNavigate } from 'react-router-dom';

const Works: React.FC = () => {
  const navigate = useNavigate();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  const [exportPoem, setExportPoem] = useState<Poem | null>(null);
  const [showBackupAlert, setShowBackupAlert] = useState(false);

  const refresh = useCallback(() => {
    const ps = getPoems();
    setPoems(ps);
    if (ps.length >= 30 && !sessionStorage.getItem('oucheng_backup_shown')) {
      setShowBackupAlert(true);
      sessionStorage.setItem('oucheng_backup_shown', '1');
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定删除此墨迹吗？删除后不可恢复。')) {
      deletePoem(id);
      refresh();
      if (selectedPoem?.id === id) setSelectedPoem(null);
    }
  };

  const filtered = poems.filter(p =>
    p.title?.includes(searchTerm) ||
    p.content?.includes(searchTerm) ||
    p.author?.includes(searchTerm)
  );

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getLayoutIcon = (layout: string) => layout === 'vertical' ? '↕' : '↔';
  const getTypeLabel = (p: Poem) => {
    if (p.cipaiName) return `《${p.cipaiName}》`;
    const map: Record<string, string> = { free: '自由', sonnet: '十四行', jueju_5: '五绝', jueju_7: '七绝', lvshi_5: '五律', lvshi_7: '七律' };
    return map[p.type] || p.type;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-white)', padding: '40px 60px' }}>
      {/* 页头 */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '42px', color: 'var(--cinnabar-red)', letterSpacing: '8px', marginBottom: '8px' }}>
          我的墨迹
        </h1>
        <p style={{ fontSize: '14px', color: '#bbb', letterSpacing: '3px', fontFamily: 'monospace' }}>
          共 {poems.length} 首
        </p>
      </div>

      {/* 搜索栏 */}
      <div style={{ maxWidth: '560px', margin: '0 auto 36px' }}>
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

      {/* ≥30首备份提示 */}
      {showBackupAlert && (
        <div className="fade-in" style={{
          maxWidth: '560px', margin: '0 auto 28px',
          padding: '14px 20px', borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(178,34,34,0.05))',
          border: '1px solid rgba(212,175,55,0.35)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-kaiti)', color: '#7a5800', fontSize: '15px', lineHeight: 1.6 }}>
            📜 <strong>典藏已逾三十首</strong>，建议适时导出备份，以免佳作散逸。
          </div>
          <button onClick={() => setShowBackupAlert(false)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 12px' }}>×</button>
        </div>
      )}

      {/* 墨迹列表 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#ccc', fontFamily: 'var(--font-kaiti)', fontSize: '22px' }}>
          {searchTerm ? '未找到相关墨迹' : '尚无墨迹，去创作第一首吧'}
          {!searchTerm && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => navigate('/')} style={{
                background: 'var(--cinnabar-red)', color: 'white', border: 'none',
                borderRadius: '24px', padding: '10px 28px', cursor: 'pointer',
                fontFamily: 'var(--font-kaiti)', fontSize: '16px', letterSpacing: '3px',
              }}>
                开始创作
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filtered.map(poem => (
            <div
              key={poem.id}
              onClick={() => setSelectedPoem(poem)}
              style={{
                background: 'white', borderRadius: '10px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f0ede8',
                cursor: 'pointer', overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
            >
              {/* 色条 */}
              <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--cinnabar-red), rgba(178,34,34,0.3))' }} />

              <div style={{ padding: '20px' }}>
                {/* 标题行 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '20px', color: '#1a1a1a', letterSpacing: '2px' }}>
                    {poem.title || '无题'}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '16px', color: '#bbb' }}>{getLayoutIcon(poem.layout)}</span>
                    <span style={{
                      fontSize: '11px', color: 'var(--cinnabar-red)',
                      border: '1px solid rgba(178,34,34,0.3)', borderRadius: '10px',
                      padding: '1px 6px', fontFamily: 'var(--font-kaiti)',
                    }}>{getTypeLabel(poem)}</span>
                  </div>
                </div>

                {/* 元信息 */}
                <p style={{ fontSize: '12px', color: '#bbb', marginBottom: '12px', fontFamily: 'monospace' }}>
                  {formatDate(poem.createdAt)} · {poem.author}
                </p>

                {/* 首句摘要 */}
                <p style={{
                  fontFamily: 'var(--font-kaiti)', fontSize: '15px', color: '#666',
                  lineHeight: 1.8, letterSpacing: '2px',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  marginBottom: poem.heartNote ? '10px' : '0',
                }}>
                  {poem.content}
                </p>

                {/* 心声预览 */}
                {poem.heartNote && (
                  <p style={{
                    fontSize: '12px', color: '#999', fontStyle: 'italic',
                    fontFamily: 'var(--font-kaiti)',
                    borderLeft: '2px solid #e0e0e0', paddingLeft: '8px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    ✦ {poem.heartNote}
                  </p>
                )}

                {/* 操作 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f5f5f5' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExportPoem(poem); }}
                    style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '14px', padding: '3px 12px', fontSize: '12px', color: '#888', cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    导出海报
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, poem.id)}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace' }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 墨迹详情弹窗 */}
      {selectedPoem && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setSelectedPoem(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '12px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '24px', color: '#1a1a1a', letterSpacing: '4px' }}>
                  {selectedPoem.title || '无题'}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setExportPoem(selectedPoem); setSelectedPoem(null); }}
                    style={{ background: 'var(--cinnabar-red)', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'var(--font-kaiti)', fontSize: '14px' }}>
                    导出海报
                  </button>
                  <button onClick={() => setSelectedPoem(null)}
                    style={{ background: '#f0ede8', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>
                    ×
                  </button>
                </div>
              </div>
              <PoemPreview poem={selectedPoem} compact />
              {selectedPoem.heartNote && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(247,241,227,0.6)', borderRadius: '6px', borderLeft: '3px solid #e0d5c0' }}>
                  <p style={{ fontSize: '12px', color: '#bbb', marginBottom: '4px', fontFamily: 'monospace' }}>创作心声</p>
                  <p style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px', color: '#666', lineHeight: 1.8 }}>{selectedPoem.heartNote}</p>
                </div>
              )}
              {selectedPoem.aiComment && (
                <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(45,90,61,0.04)', borderRadius: '6px', borderLeft: '3px solid rgba(45,90,61,0.3)' }}>
                  <p style={{ fontSize: '12px', color: '#bbb', marginBottom: '4px', fontFamily: 'monospace' }}>AI 点评</p>
                  <p style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px', color: '#2d5a3d', fontStyle: 'italic', lineHeight: 1.8 }}>{selectedPoem.aiComment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 导出海报弹窗 */}
      {exportPoem && <ExportModal poem={exportPoem} onClose={() => setExportPoem(null)} />}
    </div>
  );
};

export default Works;
