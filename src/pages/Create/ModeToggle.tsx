import React from 'react';
import { useCreate } from './CreateContext';

const ModeToggle: React.FC = () => {
  const { mode, setMode, setShowImport } = useCreate();

  return (
    <div className="mode-toggle">
      {(['free', 'pro'] as const).map(m => (
        <button
          key={m}
          className={`mode-btn ${mode === m ? 'active' : ''}`}
          onClick={() => setMode(m)}
        >
          {m === 'free' ? '自由挥毫' : '专业格律'}
        </button>
      ))}
      <button 
        onClick={() => setShowImport(true)} 
        style={{ 
          marginLeft: 'auto', 
          background: 'none', 
          border: '1px solid #d9c9b2', 
          color: '#8b5a2b', 
          padding: '4px 12px', 
          borderRadius: '16px', 
          fontSize: '13px', 
          cursor: 'pointer', 
          fontFamily: 'var(--font-kaiti)' 
        }}
      >
        + 导入文稿
      </button>
    </div>
  );
};

export default ModeToggle;
