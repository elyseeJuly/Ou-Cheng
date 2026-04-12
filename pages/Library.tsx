import React, { useState, useEffect } from 'react';
import { Poem } from '../types';
import { getPoems } from '../services/storageService';
import { MOCK_CLASSICS } from '../constants';
import PoemCard from '../components/PoemCard';
import { Search, Trash2 } from 'lucide-react';
import { deletePoem } from '../services/storageService';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my_works' | 'classics'>('my_works');
  const [poems, setPoems] = useState<Poem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);

  useEffect(() => {
    setPoems(getPoems());
  }, [activeTab]); // Refresh when tab changes

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

  const filteredClassics = MOCK_CLASSICS.filter(p => 
    p.title.includes(searchTerm) || p.content.includes(searchTerm)
  );

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-stone-400" size={18} />
        <input 
          type="text"
          placeholder="搜索诗题、作者或佳句..."
          className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-10 pr-4 font-serif text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-stone-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6">
        <button 
          onClick={() => setActiveTab('my_works')}
          className={`pb-2 px-4 font-serif transition-colors ${activeTab === 'my_works' ? 'border-b-2 border-red-800 text-red-900 font-bold' : 'text-stone-400'}`}
        >
          我的作品
        </button>
        <button 
          onClick={() => setActiveTab('classics')}
          className={`pb-2 px-4 font-serif transition-colors ${activeTab === 'classics' ? 'border-b-2 border-red-800 text-red-900 font-bold' : 'text-stone-400'}`}
        >
          经典赏读
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'my_works' ? (
          filteredMyWorks.length === 0 ? (
            <div className="text-center py-20 text-stone-400 font-serif">
              <p>暂无作品</p>
              <p className="text-xs mt-2">点击下方“创作”开始</p>
            </div>
          ) : (
            filteredMyWorks.map(poem => (
              <div 
                key={poem.id} 
                onClick={() => setSelectedPoem(poem)}
                className="bg-white p-4 rounded-sm shadow-sm border border-stone-100 flex justify-between items-start cursor-pointer hover:bg-stone-50 transition-colors"
              >
                 <div className="flex-1">
                   <h3 className="font-bold text-stone-800 font-serif text-lg">{poem.title || "无题"}</h3>
                   <p className="text-stone-500 text-xs mt-1 font-serif">{new Date(poem.createdAt).toLocaleDateString()} · {poem.author}</p>
                   <p className="text-stone-600 mt-3 font-serif line-clamp-2 text-sm leading-relaxed opacity-80">
                     {poem.content.substring(0, 40).replace(/\n/g, ' ')}...
                   </p>
                 </div>
                 <button onClick={(e) => handleDelete(e, poem.id)} className="text-stone-300 hover:text-red-700 p-2">
                   <Trash2 size={16} />
                 </button>
              </div>
            ))
          )
        ) : (
          filteredClassics.map((classic, idx) => (
            <div key={idx} className="bg-[#fdfbf7] p-6 border-l-4 border-stone-300 shadow-sm">
               <h3 className="text-center font-bold text-xl mb-1 font-['Ma_Shan_Zheng']">{classic.title}</h3>
               <p className="text-center text-xs text-stone-500 mb-4 font-serif">[{classic.author}]</p>
               <div className="text-center font-serif text-stone-800 leading-loose">
                 {classic.content.split('\n').map((l, i) => <p key={i}>{l}</p>)}
               </div>
            </div>
          ))
        )}
      </div>

      {/* Simple Modal for Viewing */}
      {selectedPoem && (
        <div className="fixed inset-0 z-[60] bg-stone-900/90 flex items-center justify-center p-4" onClick={() => setSelectedPoem(null)}>
           <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
             <PoemCard poem={selectedPoem} />
           </div>
        </div>
      )}
    </div>
  );
};

export default Library;
