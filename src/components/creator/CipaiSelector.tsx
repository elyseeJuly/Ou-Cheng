import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CipaiData } from '../../types';

interface CipaiSelectorProps {
  value?: CipaiData;
}

const CATEGORY_LABELS = {
  xiao_ling: '小令',
  zhong_diao: '中调',
  chang_diao: '长调',
} as const;

const CipaiSelector: React.FC<CipaiSelectorProps> = ({ value }) => {
  const navigate = useNavigate();

  return (
    <button type="button" className="cipai-picker-card" onClick={() => navigate('/cipai')}>
      <span className="cipai-picker-kicker">{value ? '当前词牌' : '词牌大观'}</span>
      {value ? (
        <>
          <strong>《{value.name}》</strong>
          <small>{value.charCount} 字 · {CATEGORY_LABELS[value.category]} · {value.variantLabel || '正体'}</small>
          <span className="cipai-picker-action">重新选择</span>
        </>
      ) : (
        <>
          <strong>循词牌入宋韵</strong>
          <small>浏览词牌源流、代表作与 2092 种真实变体</small>
          <span className="cipai-picker-action">选择词牌</span>
        </>
      )}
    </button>
  );
};

export default CipaiSelector;
