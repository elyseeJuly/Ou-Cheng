import React, { useState, useEffect, useRef } from 'react';
import { CreateProvider, useCreateDocument, useCreateForm, useCreateCaret, useCreatePresentation, useCreateWorkflow } from './CreateContext';
import ModeToggle from './ModeToggle';
import FreePanel from './FreePanel';
import ProPanel from './ProPanel';
import ActionBottomBar from './ActionBottomBar';
import PoemPreview from '../../components/preview/PoemPreview';
import SidePanel from '../../components/creator/SidePanel';
import { savePoem } from '../../services/storageService';
import { usePouch } from '../../stores/pouchStore';
import { clausesToProLines, getCipaiEditorPatterns, normalizePoemClauses } from '../../engine/importParser';
import type { CipaiData } from '../../types';

const ImportModal = React.lazy(() => import('../../components/creator/ImportModal'));

const CreateLayout: React.FC = () => {
  const {
    setTitle, setAuthor, setContent, setProLines, proLines, setAiComment,
  } = useCreateDocument();
  const {
    mode, setMode,
    setSonnetType, setFormId, setProTab, setPoemType,
    setJintiStart, setJintiRhyme, setSelectedCipai,
    rhymeBook, setRhymeBook, currentPatterns,
  } = useCreateForm();
  const {
    rhymeMirrorVisible, setRhymeHintEnabled, anchorRhymeChar,
    usedRhymes, handleRhymePick, caretRow, caretCol, toneReq,
  } = useCreateCaret();
  const {
    previewPoem,
    layout,
    setLayout,
    paperStyle,
    setPaperStyle,
    fontStyle,
    setFontStyle,
  } = useCreatePresentation();
  const { showImport, setShowImport, setEditId } = useCreateWorkflow();

  const { visible: pouchVisible, toggle: togglePouch } = usePouch();
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 打开抽屉时锁背景滚动，且处理 Android 返回键/手势关闭抽屉
  useEffect(() => {
    document.body.style.overflow = previewOpen ? 'hidden' : '';
    
    if (previewOpen) {
      window.history.pushState({ previewOpen: true }, '');
      const handlePopState = () => {
        setPreviewOpen(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.previewOpen) {
          window.history.back();
        }
        document.body.style.overflow = '';
      };
    }
  }, [previewOpen]);

  useEffect(() => {
    if (!previewOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = previewRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [previewOpen]);

  const handleWordPick = (word: string) => {
    // 把意象词逐字填入当前光标所在行/列（规范：从当前格起覆盖，截断到行尾）
    if (mode === 'pro' && caretRow >= 0 && caretRow < currentPatterns.length) {
      const pattern = currentPatterns[caretRow];
      if (!pattern || pattern.length === 0) return;
      const pos = Math.max(0, Math.min(caretCol, pattern.length - 1));
      const currentLine = proLines[caretRow] || '';
      const currentChars = Array.from(currentLine);
      const wordChars = Array.from(word);
      const filled = [
        ...currentChars.slice(0, pos),
        ...wordChars,
        ...currentChars.slice(pos + wordChars.length),
      ].slice(0, pattern.length).join('');
      const newLines = [...proLines];
      newLines[caretRow] = filled;
      setProLines(newLines);
    }
    togglePouch();
  };

  return (
    <div className="editor-layout">
      {/* ── 左侧编辑区 ────────────────────────────── */}
      <section className={`editor-left ${mode === 'free' ? 'free-mode' : ''}`}>
        <ModeToggle />
        {/* 拾字囊入口 */}
        <button
          onClick={togglePouch}
          className="word-pouch-trigger"
        >
          拾字
        </button>
        {mode === 'free' ? (
          <div className="free-writing-sheet">
            <FreePanel />
            <ActionBottomBar />
          </div>
        ) : (
          <>
            <ProPanel />
            <ActionBottomBar />
          </>
        )}
      </section>

      {/* ── 右侧预览区 ────────────────────────────── */}
      <section
        ref={previewRef}
        className={`editor-right ${previewOpen ? 'open' : ''}`}
        role={previewOpen ? 'dialog' : undefined}
        aria-modal={previewOpen ? 'true' : undefined}
        aria-label={previewOpen ? '作品预览' : undefined}
      >
        <button className="preview-close" onClick={() => setPreviewOpen(false)}>收</button>
        <PoemPreview
          poem={{ ...previewPoem, layout, paperStyle, fontStyle }}
          onLayoutChange={setLayout}
          onPaperChange={setPaperStyle}
          onFontChange={setFontStyle}
        />
      </section>

      {/* 移动端专属：观 按钮 */}
      <button className="preview-fab" onClick={() => setPreviewOpen(true)}>观</button>

      {/* 抽屉遮罩 */}
      {previewOpen && <div className="preview-scrim" onClick={() => setPreviewOpen(false)} />}

      {/* 导入文稿弹窗 */}
      {showImport && (
        <React.Suspense fallback={<div className="modal-loading">正在载入本地解析器……</div>}>
          <ImportModal
            onClose={() => setShowImport(false)}
            onImport={async (pList) => {
              const list = Array.isArray(pList) ? pList : [pList];
              if (list.length > 0) {
                let failCount = 0;
                let lastErr = '';
                for (const p of list) {
                  const res = await savePoem(p);
                  if (!res.ok) {
                    failCount++;
                    lastErr = res.error || '保存未知错误';
                  }
                }
                if (failCount > 0) {
                  alert(`导入结果提示：共 ${list.length} 首作品，其中 ${failCount} 首保存失败（${lastErr}）。`);
                }
                const p = list[0];
              setEditId(p.id);
              setTitle(p.title || '');
              setAuthor(p.author || '');
              setAiComment(p.aiComment || '');
              setMode('free');
              setContent(p.content || '');
              setRhymeBook(p.rhymeBook);
              if (p.type === 'sonnet') setSonnetType(p.sonnetType);
              if ((p.type === 'free' || p.type === 'sonnet') && p.formId) setFormId(p.formId);
              else if (p.type === 'cipai' || p.type === 'jueju_5' || p.type === 'jueju_7' || p.type === 'lvshi_5' || p.type === 'lvshi_7') {
                setMode('pro');
                if (p.type === 'cipai') {
                  setProTab('cipai');
                  if (p.cipaiName || p.cipaiVariantId) {
                    fetch(`${import.meta.env.BASE_URL}data/cipai.json`)
                      .then(r => r.json())
                      .then((list: CipaiData[]) => {
                        const matched = list.find(c => c.id === p.cipaiVariantId)
                          || list.find(c => c.name === p.cipaiName || c.aliases?.includes(p.cipaiName));
                        if (matched) {
                          setSelectedCipai(matched);
                          setProLines(clausesToProLines(p.content || '', getCipaiEditorPatterns(matched)));
                        }
                      })
                      .catch(() => {});
                  }
                }
                else {
                  setProTab('jinti');
                  setProLines(normalizePoemClauses(p.content || ''));
                  setPoemType(p.type);
                  if (p.jintiVariant) {
                    const parts = p.jintiVariant.split('_');
                    if (parts.length >= 4) {
                      setJintiStart(parts[2] as 'ping'|'ze');
                      setJintiRhyme(parts[3] as 'yes'|'no');
                    }
                  }
                }
              }
            }
              setShowImport(false);
            }}
          />
        </React.Suspense>
      )}

      {/* 书案侧栏：韵镜 + 拾字囊 */}
      <SidePanel
        visible={(pouchVisible || rhymeMirrorVisible) && !previewOpen}
        onHide={() => { setRhymeHintEnabled(false); if (pouchVisible) togglePouch(); }}
        anchorChar={anchorRhymeChar}
        usedRhymes={usedRhymes}
        rhymeBook={rhymeBook}
        onRhymePos={rhymeMirrorVisible}
        onRhymePick={handleRhymePick}
        toneReq={toneReq}
        onWordPick={handleWordPick}
      />
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
