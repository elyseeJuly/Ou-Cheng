import React from 'react';
import { useCreateDocument, useCreateWorkflow } from './CreateContext';

const ActionBottomBar: React.FC = () => {
  const { activeContent, aiComment } = useCreateDocument();
  const {
    handleSave,
    handleClear,
    handleRestoreClear,
    canRestoreClear,
    aiLoading,
    handleAIReview,
  } = useCreateWorkflow();

  return (
    <div className="action-bottom-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <div className="action-bottom-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
            cursor: (!activeContent.trim() || aiLoading) ? 'not-allowed' : 'pointer'
          }}
        >
          {aiLoading ? '✦ 思量中...' : '✦ AI 点评'}
        </button>
        <button className="action-btn clear-btn" onClick={handleClear}>清空</button>
        {canRestoreClear && <button className="action-btn" onClick={handleRestoreClear}>撤销清空</button>}
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

export default React.memo(ActionBottomBar);
