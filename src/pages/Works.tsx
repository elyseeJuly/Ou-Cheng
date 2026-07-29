import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Poem } from '../types';
import { getPoems, deletePoem, exportAllPoems, importPoems, savePoem, getCollections, renameCollection, deleteCollection } from '../services/storageService';
import { useNavigate } from 'react-router-dom';
import { SONNET_FORM_MAP } from '../data/poemForms';
import { EventBus } from '../utils/EventBus';
import ModalDialog from '../components/common/ModalDialog';

const ExportModal = React.lazy(() => import('../components/ExportModal'));
const ImportModal = React.lazy(() => import('../components/creator/ImportModal'));

const Works: React.FC = () => {
  const navigate = useNavigate();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportPoem, setExportPoem] = useState<Poem | null>(null);
  const [showBackupAlert, setShowBackupAlert] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'edited' | 'title'>('desc');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [lastDeleted, setLastDeleted] = useState<Poem | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collection States
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null); // null = all, '__uncategorized__' = uncategorized
  const [renamingCollection, setRenamingCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [deletingCollection, setDeletingCollection] = useState<string | null>(null);
  const [deleteCollectionMode, setDeleteCollectionMode] = useState<'keep' | 'delete'>('keep');

  const refresh = useCallback(async () => {
    const ps = getPoems();
    let migrationError = '';
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      // 一次性迁移：旧十四行子体例 -> 新 formId（自由模式且未设 formId 时）
      if (p.type === 'sonnet' && p.sonnetType && !p.formId) {
        const migrated = {
          ...p,
          formId: SONNET_FORM_MAP[p.sonnetType] || 'free',
          formName: undefined,
        };
        const result = await savePoem(migrated);
        if (result.ok) ps[i] = migrated;
        else migrationError = result.error || '旧作品格式迁移失败';
      } else if (p.type === 'free' && !p.formId) {
        const migrated = { ...p, formId: 'free' };
        const result = await savePoem(migrated);
        if (result.ok) ps[i] = migrated;
        else migrationError = result.error || '旧作品格式迁移失败';
      }
    }
    setPoems(ps);
    if (migrationError) alert(`部分旧作品未能完成格式迁移：${migrationError}`);
    if (ps.length >= 30 && !sessionStorage.getItem('oucheng_backup_shown')) {
      setShowBackupAlert(true);
      sessionStorage.setItem('oucheng_backup_shown', '1');
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async (id: string) => {
    const deleted = poems.find(poem => poem.id === id) || null;
    const res = await deletePoem(id);
    if (!res.ok) {
      alert(res.error || '删除失败');
      return;
    }
    setLastDeleted(deleted);
    refresh();
    setConfirmDeleteId(null);
    EventBus.emit('TRIGGER_BURST', { shapeType: 'willow' }); // decay vibration on delete
  };

  useEffect(() => {
    if (!lastDeleted) return;
    const timer = window.setTimeout(() => setLastDeleted(null), 8000);
    return () => window.clearTimeout(timer);
  }, [lastDeleted]);

  const handleExportAll = () => {
    const json = exportAllPoems();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oucheng_backup_${Date.now()}.json`;
    a.click();
    EventBus.emit('TRIGGER_BURST', { shapeType: 'pearl' }); // success vibration
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = await importPoems(event.target?.result as string);
      if (res.error) {
        alert(`导入失败：${res.error}`);
      } else {
        alert(`成功导入 ${res.addedCount} 首墨迹！${res.isV2 ? '（已自动恢复关联印章、体例与拾字囊设置）' : ''}`);
      }
      refresh();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const collections = getCollections();

  let collectionFiltered = poems;
  if (selectedCollection === '__uncategorized__') {
    collectionFiltered = poems.filter(p => !p.collectionName || !p.collectionName.trim());
  } else if (selectedCollection) {
    collectionFiltered = poems.filter(p => p.collectionName === selectedCollection);
  }

  let filtered = collectionFiltered.filter(p =>
    p.title?.includes(searchTerm) ||
    p.content?.includes(searchTerm) ||
    p.author?.includes(searchTerm) ||
    (p.type === 'cipai' && p.cipaiName.includes(searchTerm)) ||
    p.collectionName?.includes(searchTerm)
  );

  if (typeFilter !== 'all') filtered = filtered.filter(poem => poem.type === typeFilter);

  filtered = filtered.sort((a, b) => {
    if (sortOrder === 'desc') return b.createdAt - a.createdAt;
    if (sortOrder === 'asc') return a.createdAt - b.createdAt;
    if (sortOrder === 'edited') return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    return a.title.localeCompare(b.title, 'zh-CN');
  });

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getLayoutIcon = (layout: string) => layout === 'vertical' ? '竖' : '横';
  const getTypeLabel = (p: Poem) => {
    if (p.type === 'cipai') return `《${p.cipaiName}》`;
    const map: Record<string, string> = { free: '自由', sonnet: '十四行', jueju_5: '五绝', jueju_7: '七绝', lvshi_5: '五律', lvshi_7: '七律' };
    return map[p.type] || p.type;
  };

  return (
    <div className="collection-page works-page" style={{ minHeight: '100vh', background: 'var(--paper-0)', padding: '40px 60px' }}>
      {/* 页头 */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-kai)', fontSize: '42px', color: 'var(--accent-seal)', letterSpacing: '8px', marginBottom: '8px' }}>
          墨迹
        </h1>
        <p style={{ fontSize: '14px', color: '#bbb', letterSpacing: '3px', fontFamily: 'var(--font-serif)' }}>
          共 {poems.length} 首
        </p>
      </div>

      {/* 工具栏：搜索与操作 */}
      <div style={{ maxWidth: '640px', margin: '0 auto 36px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="搜索诗题、作者、词牌、文集或佳句..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '12px 20px',
            border: '1px solid #e0e0e0', borderRadius: '24px',
            background: 'white', fontSize: '15px',
            fontFamily: 'var(--font-kai)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        />
        <select value={sortOrder} onChange={e => {
          const value = e.target.value;
          if (value === 'desc' || value === 'asc' || value === 'edited' || value === 'title') {
            setSortOrder(value);
          }
        }}
          style={{ padding: '0 16px', borderRadius: '24px', border: '1px solid #e0e0e0', background: 'white', fontFamily: 'var(--font-kai)' }}>
          <option value="desc">最新创作</option>
          <option value="asc">最早创作</option>
          <option value="edited">最近编辑</option>
          <option value="title">按标题</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="按体裁筛选"
          style={{ padding: '0 16px', borderRadius: '24px', border: '1px solid #e0e0e0', background: 'white', fontFamily: 'var(--font-kai)' }}>
          <option value="all">全部体裁</option>
          <option value="free">自由创作</option>
          <option value="jueju_5">五言绝句</option>
          <option value="jueju_7">七言绝句</option>
          <option value="lvshi_5">五言律诗</option>
          <option value="lvshi_7">七言律诗</option>
          <option value="cipai">词牌</option>
          <option value="sonnet">十四行诗</option>
        </select>
        <button onClick={() => setShowImport(true)} style={{ background: '#fdfbf7', border: '1px solid #d9c9b2', borderRadius: '24px', padding: '0 16px', color: '#8b5a2b', cursor: 'pointer', fontFamily: 'var(--font-kai)' }}>
          + 导入文稿
        </button>
        <button onClick={handleExportAll} style={{ background: '#fdfbf7', border: '1px solid #e0e0e0', borderRadius: '24px', padding: '0 16px', color: '#666', cursor: 'pointer', fontFamily: 'var(--font-kai)' }}>
          导出备份
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: '#fdfbf7', border: '1px solid #e0e0e0', borderRadius: '24px', padding: '0 16px', color: '#666', cursor: 'pointer', fontFamily: 'var(--font-kai)' }}>
          导入备份
        </button>
        <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportJson} />
      </div>

      {lastDeleted && (
        <div className="works-undo" role="status">
          <span>已删除《{lastDeleted.title || '无题'}》</span>
          <button onClick={async () => {
            const res = await savePoem(lastDeleted);
            if (!res.ok) {
              alert(res.error || '撤销保存失败');
              return;
            }
            setLastDeleted(null);
            refresh();
          }}>撤销</button>
        </div>
      )}

      {/* ≥30首备份提示 */}
      {showBackupAlert && (
        <div className="fade-in" style={{
          maxWidth: '560px', margin: '0 auto 28px',
          padding: '14px 20px', borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(178,34,34,0.05))',
          border: '1px solid rgba(212,175,55,0.35)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-kai)', color: '#7a5800', fontSize: '15px', lineHeight: 1.6 }}>
            <strong>典藏已逾三十首</strong>，建议适时导出备份，以免佳作散逸。
          </div>
          <button onClick={() => setShowBackupAlert(false)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 12px' }}>×</button>
        </div>
      )}

      {/* 墨迹列表及侧边栏 */}
      <div className="works-main" style={{ display: 'flex', gap: '30px', marginTop: '20px', alignItems: 'flex-start' }}>
        {/* 左侧文集侧边栏 */}
        <div className="works-sidebar" style={{
          width: '240px', flexShrink: 0, background: '#fff', borderRadius: '12px', 
          padding: '20px', border: '1px solid #f0ede8', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' 
        }}>
          <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '18px', color: '#1a1a1a', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', letterSpacing: '2px' }}>
            墨迹文集
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => setSelectedCollection(null)}
              style={{
                width: '100%', padding: '10px 12px', border: 'none', borderRadius: '6px', textAlign: 'left',
                background: selectedCollection === null ? 'var(--cinnabar-wash)' : 'transparent',
                color: selectedCollection === null ? 'var(--accent-active)' : '#555',
                cursor: 'pointer', fontFamily: 'var(--font-kai)', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span>全部墨迹</span>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>{poems.length}</span>
            </button>
            <button 
              onClick={() => setSelectedCollection('__uncategorized__')}
              style={{
                width: '100%', padding: '10px 12px', border: 'none', borderRadius: '6px', textAlign: 'left',
                background: selectedCollection === '__uncategorized__' ? 'var(--cinnabar-wash)' : 'transparent',
                color: selectedCollection === '__uncategorized__' ? 'var(--accent-active)' : '#555',
                cursor: 'pointer', fontFamily: 'var(--font-kai)', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span>未分类</span>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>{poems.filter(p => !p.collectionName || !p.collectionName.trim()).length}</span>
            </button>
            
            {collections.length > 0 && <div style={{ height: '1px', background: '#eee', margin: '8px 0' }} />}
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {collections.map(c => {
                const count = poems.filter(p => p.collectionName === c).length;
                const isSelected = selectedCollection === c;
                return (
                  <div key={c} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px',
                    background: isSelected ? 'var(--cinnabar-wash)' : 'transparent',
                    paddingRight: '6px'
                  }}>
                    <button 
                      onClick={() => setSelectedCollection(c)}
                      style={{
                        flex: 1, padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left',
                        color: isSelected ? 'var(--accent-active)' : '#555',
                        cursor: 'pointer', fontFamily: 'var(--font-kai)', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
                      <span style={{ fontSize: '12px', opacity: 0.6, flexShrink: 0, marginLeft: '8px' }}>{count}</span>
                    </button>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRenamingCollection(c); setNewCollectionName(c); }}
                        title="重命名"
                        style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                      >
                        改
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingCollection(c); setDeleteCollectionMode('keep'); }}
                        title="删除文集"
                        style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                      >
                        删
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧作品列表 */}
        <div className="works-content" style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#ccc', fontFamily: 'var(--font-kai)', fontSize: '22px' }}>
              {searchTerm ? '未找到相关墨迹' : '尚无墨迹，去创作第一首吧'}
              {!searchTerm && (
                <div style={{ marginTop: '20px' }}>
                  <button onClick={() => navigate('/')} style={{
                    background: 'var(--accent-cta)', color: 'white', border: 'none',
                    borderRadius: '24px', padding: '10px 28px', cursor: 'pointer',
                    fontFamily: 'var(--font-kai)', fontSize: '16px', letterSpacing: '3px',
                  }}>
                    开始创作
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="works-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
              {filtered.map(poem => (
                <div
                  key={poem.id}
                  onClick={() => navigate(`/preview/${encodeURIComponent(poem.id)}`)}
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
                  <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--accent-seal), rgba(178,34,34,0.3))' }} />

                  <div style={{ padding: '20px' }}>
                    {/* 标题行 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '20px', color: '#1a1a1a', letterSpacing: '2px' }}>
                        {poem.title || '无题'}
                      </h3>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '16px', color: '#bbb' }}>{getLayoutIcon(poem.layout)}</span>
                        <span style={{
                          fontSize: '11px', color: 'var(--accent-seal)',
                          border: '1px solid rgba(178,34,34,0.3)', borderRadius: '10px',
                          padding: '1px 6px', fontFamily: 'var(--font-kai)',
                        }}>{getTypeLabel(poem)}</span>
                      </div>
                    </div>

                    {/* 元信息 */}
                    <p style={{ fontSize: '12px', color: '#bbb', marginBottom: '12px', fontFamily: 'var(--font-serif)' }}>
                      {formatDate(poem.createdAt)} · {poem.author}{poem.collectionName && ` · ${poem.collectionName}`}
                    </p>

                    {/* 首句摘要 */}
                    <p style={{
                      fontFamily: 'var(--font-kai)', fontSize: '15px', color: '#666',
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
                        fontFamily: 'var(--font-kai)',
                        borderLeft: '2px solid #e0e0e0', paddingLeft: '8px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {poem.heartNote}
                      </p>
                    )}

                    {/* 操作 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f5f5f5' }}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res = await savePoem({ ...poem, favorite: !poem.favorite, updatedAt: Date.now() });
                          if (!res.ok) {
                            alert(res.error || '更新收藏状态失败');
                            return;
                          }
                          refresh();
                        }}
                        aria-pressed={Boolean(poem.favorite)}
                        style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '14px', padding: '3px 12px', fontSize: '12px', color: poem.favorite ? 'var(--accent-seal)' : '#888', cursor: 'pointer', fontFamily: 'var(--font-serif)' }}
                      >
                        {poem.favorite ? '已收藏' : '收藏'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExportPoem(poem); }}
                        style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '14px', padding: '3px 12px', fontSize: '12px', color: '#888', cursor: 'pointer', fontFamily: 'var(--font-serif)' }}
                      >
                        导出海报
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(poem.id); }}
                        style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-serif)' }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 导出海报弹窗 */}
      {exportPoem && <React.Suspense fallback={<div className="modal-loading">正在准备导出……</div>}><ExportModal poem={exportPoem} onClose={() => setExportPoem(null)} /></React.Suspense>}
      
      {/* 导入文稿弹窗 */}
      {showImport && (
        <React.Suspense fallback={<div className="modal-loading">正在载入本地解析器……</div>}><ImportModal
          onClose={() => setShowImport(false)} 
          onImport={async (pList) => {
            let failCount = 0;
            let lastErr = '';
            for (const p of pList) {
              const res = await savePoem(p);
              if (!res.ok) {
                failCount++;
                lastErr = res.error || '保存未知错误';
              }
            }
            if (failCount > 0) {
              alert(`导入完成，其中 ${failCount} 首作品保存失败（${lastErr}）。`);
            }
            refresh();
            setShowImport(false);
          }} 
        /></React.Suspense>
      )}

      {/* 自定义确认删除弹窗 */}
      {confirmDeleteId && (
        <ModalDialog label="确认删除墨迹" onClose={() => setConfirmDeleteId(null)} panelClassName="fade-in-down" panelStyle={{ background: 'var(--paper-1)', padding: '24px 32px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(178,34,34,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-kai)', color: 'var(--accent-seal)', marginBottom: '16px', fontSize: '20px' }}>确认删除此墨迹？</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>删除后将无法恢复，请谨慎操作。</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => handleDelete(confirmDeleteId)} style={{ background: 'var(--accent-cta)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-kai)' }}>确认删除</button>
              <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'transparent', border: '1px solid #ddd', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', color: '#666' }}>取消</button>
            </div>
        </ModalDialog>
      )}

      {/* 重命名文集弹窗 */}
      {renamingCollection && (
        <ModalDialog label="重命名文集" onClose={() => { setRenamingCollection(null); setNewCollectionName(''); }} panelClassName="fade-in-down" panelStyle={{ background: 'var(--paper-1)', padding: '24px 32px', borderRadius: '12px', width: '360px', border: '1px solid rgba(178,34,34,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-kai)', color: '#333', marginBottom: '16px', fontSize: '20px' }}>重命名文集</h3>
            <input 
              type="text" 
              value={newCollectionName} 
              onChange={e => setNewCollectionName(e.target.value)} 
              placeholder="新文集名称..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'var(--font-kai)', marginBottom: '20px', background: '#fff' }} 
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={async () => {
                  const cleaned = newCollectionName.trim();
                  if (cleaned && renamingCollection) {
                    const result = await renameCollection(renamingCollection, cleaned);
                    if (!result.ok) {
                      alert(`文集重命名失败：${result.error || '存储错误'}`);
                      return;
                    }
                    if (selectedCollection === renamingCollection) {
                      setSelectedCollection(cleaned);
                    }
                    setRenamingCollection(null);
                    setNewCollectionName('');
                    refresh();
                  }
                }} 
                style={{ background: 'var(--accent-cta)', color: 'white', border: 'none', padding: '6px 18px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-kai)', fontSize: '14px' }}
              >
                确认
              </button>
              <button onClick={() => { setRenamingCollection(null); setNewCollectionName(''); }} style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px 18px', borderRadius: '6px', cursor: 'pointer', color: '#666', fontSize: '14px' }}>
                取消
              </button>
            </div>
        </ModalDialog>
      )}

      {/* 删除文集确认弹窗 */}
      {deletingCollection && (
        <ModalDialog label="删除文集" onClose={() => setDeletingCollection(null)} panelClassName="fade-in-down" panelStyle={{ background: 'var(--paper-1)', padding: '24px 32px', borderRadius: '12px', width: '400px', border: '1px solid rgba(178,34,34,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-kai)', color: 'var(--accent-seal)', marginBottom: '16px', fontSize: '20px' }}>删除文集</h3>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6, fontFamily: 'var(--font-kai)' }}>
              请确认如何处理文集 <strong>「{deletingCollection}」</strong> 下的作品：
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', textAlign: 'left', background: '#f9f9f9', padding: '16px', borderRadius: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-kai)', color: '#333' }}>
                <input 
                  type="radio" 
                  name="deleteMode" 
                  checked={deleteCollectionMode === 'keep'} 
                  onChange={() => setDeleteCollectionMode('keep')} 
                />
                仅删除文集（保留作品，作品归为“未分类”）
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-kai)', color: '#333' }}>
                <input 
                  type="radio" 
                  name="deleteMode" 
                  checked={deleteCollectionMode === 'delete'} 
                  onChange={() => setDeleteCollectionMode('delete')} 
                />
                删除文集及分类下的所有诗词作品
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={async () => {
                  if (deletingCollection) {
                    const result = await deleteCollection(deletingCollection, deleteCollectionMode === 'delete');
                    if (!result.ok) {
                      alert(`文集删除失败：${result.error || '存储错误'}`);
                      return;
                    }
                    if (selectedCollection === deletingCollection) {
                      setSelectedCollection(null);
                    }
                    setDeletingCollection(null);
                    refresh();
                  }
                }} 
                style={{ background: 'var(--accent-cta)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-kai)' }}
              >
                确认删除
              </button>
              <button onClick={() => setDeletingCollection(null)} style={{ background: 'transparent', border: '1px solid #ddd', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', color: '#666' }}>
                取消
              </button>
            </div>
        </ModalDialog>
      )}
    </div>
  );
};

export default Works;
