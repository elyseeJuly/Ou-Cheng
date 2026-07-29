import React, { useState, useEffect } from 'react';
import { useCreateDocument, useCreateForm, useCreateWorkflow } from './CreateContext';
import { getAllForms, saveCustomForm, deleteCustomForm, parseChars, PoemForm } from '../../data/poemForms';
import ModalDialog from '../../components/common/ModalDialog';

const FormSelector: React.FC<{ value: string; onChange: (id: string) => void }> = ({ value, onChange }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [forms, setForms] = useState(getAllForms());

  useEffect(() => { setForms(getAllForms()); }, [value, showEditor]);

  return (
    <>
      <div className="opt-group form-selector" style={{ flexWrap: 'wrap' }}>
        {forms.map(f => (
          <button
            key={f.id}
            className={`opt-item ${value === f.id ? 'active' : ''}`}
            onClick={() => onChange(f.id)}
            onDoubleClick={() => !f.builtin && confirm(`删除「${f.name}」？`)
              && (deleteCustomForm(f.id), setForms(getAllForms()), onChange('free'))}
            title={f.guide}
          >
            {f.name}
          </button>
        ))}
        <button className="opt-item form-add" onClick={() => setShowEditor(true)}>自定 +</button>
      </div>
      {showEditor && <FormEditor onSave={f => {
        const nf = saveCustomForm(f); setForms(getAllForms());
        onChange(nf.id); setShowEditor(false);
      }} onClose={() => setShowEditor(false)} />}
    </>
  );
};

const FormEditor: React.FC<{ onSave: (f: Omit<PoemForm, 'id' | 'builtin'>) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const [newForm, setNewForm] = useState<Omit<PoemForm, 'id' | 'builtin'>>({
    name: '', lineCount: undefined, charsPerLine: undefined, rhymeScheme: undefined, voltaAt: undefined, guide: '',
  });
  const [charsInput, setCharsInput] = useState('');

  const handleSave = () => {
    if (!newForm.name.trim()) { alert('请输入体例名称'); return; }
    onSave(newForm);
    setNewForm({ name: '', lineCount: undefined, charsPerLine: undefined, rhymeScheme: undefined, voltaAt: undefined, guide: '' });
    setCharsInput('');
  };

  return (
    <ModalDialog label="新建自定义体例" onClose={onClose} panelClassName="modal-panel" panelStyle={{ maxWidth: '480px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontFamily: 'var(--font-serif)' }}>新建自定义体例</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="input-group">
            <label>名称</label>
            <input className="borderless-input" placeholder="如：五言六行" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label>行数（空=不限）</label>
            <input type="number" min={1} className="borderless-input" value={newForm.lineCount || ''} onChange={e => setNewForm({ ...newForm, lineCount: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div className="input-group">
            <label>每行字数（空/单值/范围）</label>
            <input className="borderless-input" placeholder="如 5 或 5-7" value={charsInput} onChange={e => { setCharsInput(e.target.value); setNewForm({ ...newForm, charsPerLine: parseChars(e.target.value) }); }} />
          </div>
          <div className="input-group">
            <label>Volta 行</label>
            <input type="number" min={1} className="borderless-input" value={newForm.voltaAt || ''} onChange={e => setNewForm({ ...newForm, voltaAt: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </div>
        <div className="input-group" style={{ marginTop: '8px' }}>
          <label>韵式（选填）</label>
          <input className="borderless-input" placeholder="如 ABAB CDCD EFEF GG" value={newForm.rhymeScheme || ''} onChange={e => setNewForm({ ...newForm, rhymeScheme: e.target.value || undefined })} />
        </div>
        <div className="input-group" style={{ marginTop: '8px' }}>
          <label>说明（选填）</label>
          <input className="borderless-input" placeholder="一句话体例说明" value={newForm.guide || ''} onChange={e => setNewForm({ ...newForm, guide: e.target.value })} />
        </div>
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
    </ModalDialog>
  );
};

const FreePanel: React.FC = () => {
  const {
    title, setTitle,
    author, setAuthor,
    content, setContent,
    heartNote, setHeartNote,
    showHeartNote, setShowHeartNote,
    activeContent,
  } = useCreateDocument();
  const {
    formId, setFormId,
    currentForm,
  } = useCreateForm();
  const { settings } = useCreateWorkflow();

  const lines = content.split('\n');

  const guideText = [
    currentForm.name,
    currentForm.guide,
    currentForm.rhymeScheme && `韵式 ${currentForm.rhymeScheme}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="fade-in free-panel">
      {/* 基本信息 */}
      <div className="input-group free-title-field">
        <label>标题（留空则自动截取首句）</label>
        <input className="borderless-input" placeholder="无题" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="input-group free-author-field">
        <label>笔名</label>
        <input className="borderless-input" placeholder={settings.defaultPenName} value={author} onChange={e => setAuthor(e.target.value)} />
      </div>

      {/* 体例选择器 */}
      <div className="form-selector-block free-form-selector-block">
        <FormSelector value={formId} onChange={nextFormId => {
          if (nextFormId === formId) return;
          if (activeContent.trim() && !confirm('切换体例会改变结构提示，当前正文不会删除。是否继续？')) return;
          setFormId(nextFormId);
        }} />
      </div>

      {/* 体例引导 + 行标尺 */}
      {guideText && <p className="form-guide">{guideText}</p>}

      <div className="free-editor free-editor-main">
        {(currentForm.lineCount || currentForm.voltaAt) && (
          <div className="line-rail" aria-hidden>
            {Array.from({ length: Math.max(currentForm.lineCount ?? 0, lines.length) }).map((_, i) => {
              const line = lines[i] ?? '';
              const cpl = currentForm.charsPerLine;
              const cn = line.replace(/[\s，。、；：？！,.!?]/g, '').length;
              const fit = cpl == null ? line.length > 0
                : Array.isArray(cpl) ? cn >= cpl[0] && cn <= cpl[1] : cn === cpl;
              return (
                <span key={i} className="rail-cell">
                  {currentForm.voltaAt === i + 1 && <i className="rail-volta">转</i>}
                  <em className={`rail-no ${fit && line ? 'fit' : ''}`}>
                    {fit && line ? '合' : i + 1}
                  </em>
                </span>
              );
            })}
          </div>
        )}
        <textarea
          className="giant-textarea"
          placeholder={currentForm.id === 'free' ? '在此输入诗词内容...' : `在此输入 ${currentForm.name} ...`}
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      {/* 挥毫心声 */}
      <div className="heart-note-section">
        <button
          onClick={() => setShowHeartNote(!showHeartNote)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-dan)', fontSize: '13px', fontFamily: 'var(--font-serif)', letterSpacing: '2px', padding: 0,
          }}
        >
          {showHeartNote ? '▲' : '▼'} 挥毫心声
        </button>
        {showHeartNote && (
          <textarea
            placeholder="记录灵感来源或挥毫感想..."
            value={heartNote}
            onChange={e => setHeartNote(e.target.value)}
            style={{
              display: 'block', width: '100%', marginTop: '8px', minHeight: '80px',
              border: '1px solid var(--ink-qing)', borderRadius: '6px', padding: '10px',
              resize: 'vertical', fontFamily: 'var(--font-kai)', fontSize: '15px',
              background: 'var(--paper-1)', color: 'var(--ink-zhong)', lineHeight: 1.8,
            }}
          />
        )}
      </div>

    </div>
  );
};

export default React.memo(FreePanel);
