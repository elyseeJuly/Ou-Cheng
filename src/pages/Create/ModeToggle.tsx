import React from 'react';
import { useCreateDocument, useCreateForm, useCreateWorkflow } from './CreateContext';

const ModeToggle: React.FC = () => {
  const { activeContent } = useCreateDocument();
  const { mode, setMode } = useCreateForm();
  const { setShowImport } = useCreateWorkflow();

  const handleModeChange = (nextMode: 'free' | 'pro') => {
    if (nextMode === mode) return;
    if (activeContent.trim() && !confirm('切换创作模式会重新解释当前结构，正文草稿仍会保留。是否继续？')) return;
    setMode(nextMode);
  };

  return (
    <div className="mode-toggle">
      {(['free', 'pro'] as const).map(m => (
        <button
          key={m}
          className={`mode-btn ${mode === m ? 'active' : ''}`}
          onClick={() => handleModeChange(m)}
        >
          {m === 'free' ? '自由挥毫' : '专业格律'}
        </button>
      ))}
      <button 
        onClick={() => setShowImport(true)} 
        className="import-trigger"
      >
        导入文稿
      </button>
    </div>
  );
};

export default React.memo(ModeToggle);
