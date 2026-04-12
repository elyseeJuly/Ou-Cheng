import React, { useState } from 'react';
import { MOCK_CLASSICS } from '../constants';
import { Search } from 'lucide-react';

const Library: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClassics = MOCK_CLASSICS.filter(p => 
    p.title.includes(searchTerm) || p.content.includes(searchTerm) || p.author.includes(searchTerm)
  );

  return (
    <div style={{ padding: '40px 60px', background: 'var(--paper-white)', minHeight: '100vh' }}>
      <div className="page-header fade-in" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontFamily: '"ZCOOL KuaiLe", cursive', fontSize: '48px', color: 'var(--cinnabar-red)', marginBottom: '20px' }}>经典赏读</h1>
          <p style={{ fontSize: '20px', opacity: 0.8 }}>品鉴千古佳作，汲取创作灵感</p>
      </div>

      <div style={{ marginBottom: '40px' }} className="relative">
        <div style={{ position: 'absolute', top: '12px', left: '15px', color: '#999' }}>
           <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="搜索诗题、作者或佳句..."
          style={{ width: '100%', padding: '12px 20px 12px 45px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '18px', fontFamily: '"Ma Shan Zheng", serif' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
        {filteredClassics.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px', color: '#999', fontFamily: '"Ma Shan Zheng", serif', fontSize: '24px' }}>
            未找到相关典籍
          </div>
        ) : (
          filteredClassics.map((classic, idx) => (
            <div key={idx} style={{ background: '#fdfbf7', padding: '30px', borderLeft: '4px solid var(--cinnabar-red)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
               <h3 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '28px', marginBottom: '10px', fontFamily: '"Ma Shan Zheng", serif', color: 'var(--ink-black)' }}>{classic.title}</h3>
               <p style={{ textAlign: 'center', fontSize: '16px', color: 'var(--cinnabar-red)', marginBottom: '20px', fontFamily: '"Ma Shan Zheng", serif' }}>[{classic.author}]</p>
               <div style={{ textAlign: 'center', fontFamily: '"Ma Shan Zheng", serif', color: 'var(--ink-black)', lineHeight: 2, fontSize: '20px' }}>
                 {classic.content.split('\n').map((l, i) => <p key={i}>{l}</p>)}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Library;
