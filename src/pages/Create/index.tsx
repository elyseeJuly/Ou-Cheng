import React from 'react';
import { CreateProvider, useCreate } from './CreateContext';
import ModeToggle from './ModeToggle';
import FreePanel from './FreePanel';
import ProPanel from './ProPanel';
import ActionBottomBar from './ActionBottomBar';
import PoemPreview from '../../components/preview/PoemPreview';
import ImportModal from '../../components/creator/ImportModal';

const CreateLayout: React.FC = () => {
  const {
    mode,
    previewPoem,
    layout,
    setLayout,
    paperStyle,
    setPaperStyle,
    fontStyle,
    setFontStyle,
    showImport,
    setShowImport,
    setEditId,
    setTitle,
    setAuthor,
    setMode,
    setContent,
    setSonnetType,
    setProLines,
    setProTab,
    setPoemType,
    setJintiStart,
    setJintiRhyme,
  } = useCreate();

  return (
    <div className="editor-split">
      {/* ── 左侧编辑区 ────────────────────────────── */}
      <div className="editor-left">
        <ModeToggle />
        {mode === 'free' ? <FreePanel /> : <ProPanel />}
        <ActionBottomBar />
      </div>

      {/* ── 右侧预览区 ────────────────────────────── */}
      <div className="editor-right">
        <PoemPreview
          poem={{ ...previewPoem, layout, paperStyle, fontStyle }}
          onLayoutChange={setLayout}
          onPaperChange={setPaperStyle}
          onFontChange={setFontStyle}
        />
      </div>

      {/* 导入文稿弹窗 */}
      {showImport && (
        <ImportModal 
          onClose={() => setShowImport(false)} 
          onImport={(p) => {
            setEditId(null);
            setTitle(p.title || '');
            setAuthor(p.author || '');
            setMode('free');
            setContent(p.content || '');
            if (p.type === 'sonnet') setSonnetType(p.sonnetType || 'none');
            else if (p.type !== 'free') {
              setMode('pro');
              setProLines((p.content || '').split('\n').map(l => l.replace(/[，。、；？！]/g, '').trim()).filter(Boolean));
              if (p.type === 'cipai') setProTab('cipai');
              else {
                setProTab('jinti');
                setPoemType(p.type as any);
                if (p.jintiVariant) {
                  const parts = p.jintiVariant.split('_');
                  if (parts.length >= 4) {
                    setJintiStart(parts[2] as 'ping'|'ze');
                    setJintiRhyme(parts[3] as 'yes'|'no');
                  }
                }
              }
            }
            setShowImport(false);
          }} 
        />
      )}
    </div>
  );
};

const Create: React.FC = () => {
  return (
    <CreateProvider>
      <CreateLayout />
    </CreateProvider>
  );
};

export default Create;
