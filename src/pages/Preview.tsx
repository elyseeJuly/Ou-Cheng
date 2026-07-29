import React, { lazy, Suspense, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PoemPreview from '../components/preview/PoemPreview';
import { getPoemById } from '../services/storageService';

const ExportModal = lazy(() => import('../components/ExportModal'));

const Preview: React.FC = () => {
  const navigate = useNavigate();
  const { poemId } = useParams();
  const poem = poemId ? getPoemById(poemId) : undefined;
  const [exportOpen, setExportOpen] = useState(false);

  if (!poem) {
    return (
      <main className="mobile-page preview-page">
        <div className="paper-empty"><strong>未找到这篇墨迹</strong><button onClick={() => navigate('/works')}>返回墨迹</button></div>
      </main>
    );
  }

  return (
    <main className="mobile-page preview-page" style={{ paddingBottom: '32px' }}>
      <header className="page-header">
        <button className="icon-button" onClick={() => navigate('/works')} aria-label="返回墨迹">返</button>
        <div><h1>{poem.title || '无题'}</h1><p>独立预览</p></div>
        <button className="icon-button" onClick={() => setExportOpen(true)}>导出</button>
      </header>
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <PoemPreview poem={poem} />
        {poem.heartNote && (
          <div style={{ marginTop: '24px', padding: '12px 16px', background: 'rgba(247,241,227,0.6)', borderRadius: '6px', borderLeft: '3px solid #e0d5c0' }}>
            <p style={{ fontSize: '11px', color: '#999', marginBottom: '4px', fontFamily: 'monospace', letterSpacing: '1px' }}>创作心声</p>
            <p style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px', color: '#666', lineHeight: 1.8 }}>{poem.heartNote}</p>
          </div>
        )}
        {poem.aiComment && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(45,90,61,0.04)', borderRadius: '6px', borderLeft: '3px solid rgba(45,90,61,0.3)' }}>
            <p style={{ fontSize: '11px', color: '#999', marginBottom: '4px', fontFamily: 'monospace', letterSpacing: '1px' }}>AI 点评</p>
            <p style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px', color: '#2d5a3d', fontStyle: 'italic', lineHeight: 1.8 }}>{poem.aiComment}</p>
          </div>
        )}
      </div>
      {exportOpen && (
        <Suspense fallback={<div className="modal-loading" role="status">正在准备导出工具…</div>}>
          <ExportModal poem={poem} onClose={() => setExportOpen(false)} />
        </Suspense>
      )}
    </main>
  );
};

export default Preview;
