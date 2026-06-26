import React from 'react';
import { useCreate } from './CreateContext';

const ActionBottomBar: React.FC = () => {
  const {
    activeContent,
    aiLoading,
    aiComment,
    handleAIReview,
    handleSave,
    handleClear,
  } = useCreate();

  return (
    <div style={{ paddingTop: '16px', borderTop: '1px solid #f0ede8', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="action-btn save-btn" onClick={handleSave}>保存墨迹</button>
        <button
          className="action-btn"
          onClick={handleAIReview}
          disabled={!activeContent.trim() || aiLoading}
          style={{
            background: '#2d5a3d', 
            color: 'white', 
            border: 'none',
            opacity: (!activeContent.trim() || aiLoading) ? 0.5 : 1,
          }}
        >
          {aiLoading ? '✦ 思量中...' : '✦ AI 点评'}
        </button>
        <button className="action-btn clear-btn" onClick={handleClear}>清空</button>
      </div>
      {aiComment && (
        <div style={{
          padding: '14px 16px', 
          background: 'linear-gradient(135deg, rgba(178,34,34,0.04), rgba(45,90,61,0.06))',
          borderRadius: '8px', 
          borderLeft: '3px solid var(--cinnabar-red)',
          fontFamily: 'var(--font-kaiti)', 
          fontSize: '15px',
          color: '#2d5a3d', 
          fontStyle: 'italic', 
          lineHeight: 1.9,
        }}>
          {aiComment}
        </div>
      )}
    </div>
  );
};

export default ActionBottomBar;
