import React, { useState, useEffect } from 'react';
import { Poem } from '../types';
import { getPoems, deletePoem } from '../services/storageService';
import PoemCard from '../components/PoemCard';

const Works: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);

  useEffect(() => {
    setPoems(getPoems());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm("确定删除此作品吗？")) {
      deletePoem(id);
      setPoems(getPoems());
    }
  };

  const filteredMyWorks = poems.filter(p => 
    p.title.includes(searchTerm) || p.content.includes(searchTerm)
  );

  return (
    <div style={{ padding: '40px 60px', background: 'var(--paper-white)', minHeight: '100vh' }}>
      <div className="page-header fade-in" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontFamily: '"ZCOOL KuaiLe", cursive', fontSize: '48px', color: 'var(--cinnabar-red)', marginBottom: '20px' }}>作品管理</h1>
          <p style={{ fontSize: '20px', opacity: 0.8 }}>传承经典，创新未来</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <input 
          type="text"
          placeholder="搜索诗题、作者或佳句..."
          style={{ width: '100%', padding: '12px 20px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', fontFamily: '"Ma Shan Zheng", serif' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredMyWorks.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px', color: '#999', fontFamily: '"Ma Shan Zheng", serif' }}>
            <p style={{ fontSize: '24px' }}>暂无作品</p>
          </div>
        ) : (
          filteredMyWorks.map(poem => (
            <div 
              key={poem.id} 
              onClick={() => setSelectedPoem(poem)}
              style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}
            >
               <h3 style={{ fontFamily: '"Ma Shan Zheng", serif', fontSize: '24px', color: 'var(--ink-black)', marginBottom: '10px' }}>{poem.title || "无题"}</h3>
               <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>{new Date(poem.createdAt).toLocaleDateString()} · {poem.author}</p>
               <p style={{ fontFamily: '"Ma Shan Zheng", serif', fontSize: '16px', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                 {poem.content}
               </p>
               <button onClick={(e) => handleDelete(e, poem.id)} style={{ marginTop: '15px', color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                 删除
               </button>
            </div>
          ))
        )}
      </div>

      {selectedPoem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedPoem(null)}>
           <div style={{ background: 'var(--paper-white)', padding: '40px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
             <PoemCard poem={selectedPoem} />
           </div>
        </div>
      )}
    </div>
  );
};

export default Works;
