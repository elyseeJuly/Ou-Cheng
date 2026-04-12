import React, { useState, useRef } from 'react';
import { Poem, PoemType, LayoutMode } from '../types';
import { TEMPLATES } from '../constants';
import { checkMeterAndComment } from '../services/geminiService';
import { savePoem } from '../services/storageService';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Type, RotateCcw } from 'lucide-react';

const Create: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'free' | 'pro'>('free');
  
  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('居士');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [layout, setLayout] = useState<LayoutMode>('vertical');
  const [poemType, setPoemType] = useState<PoemType>('free');
  
  // AI & Validation
  const [aiLoading, setAiLoading] = useState(false);
  const [aiComment, setAiComment] = useState('');

  const handleSave = () => {
    if (!content.trim()) return alert("请先写下诗句");
    
    const newPoem: Poem = {
      id: Date.now().toString(),
      title: title || "无题",
      author,
      content,
      notes,
      type: poemType,
      layout,
      backgroundTheme: 'paper',
      createdAt: Date.now(),
      aiComment
    };
    
    savePoem(newPoem);
    navigate('/');
  };

  const handleAIReview = async () => {
    setAiLoading(true);
    const comment = await checkMeterAndComment(
      content, 
      TEMPLATES[poemType]?.name || "自由诗", 
      "中华新韵" // Defaulting for MVP
    );
    setAiComment(comment);
    setAiLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7]">
      {/* Mode Switcher */}
      <div className="flex text-center font-serif text-sm border-b border-stone-200 bg-stone-50">
        <button 
          onClick={() => { setMode('free'); setPoemType('free'); }}
          className={`flex-1 py-3 ${mode === 'free' ? 'bg-white font-bold text-stone-900 border-b-2 border-stone-800' : 'text-stone-400'}`}
        >
          自由创作
        </button>
        <button 
          onClick={() => { setMode('pro'); setPoemType('jueju_5'); }}
          className={`flex-1 py-3 ${mode === 'pro' ? 'bg-white font-bold text-red-900 border-b-2 border-red-800' : 'text-stone-400'}`}
        >
          格律严修
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Pro Mode: Template Selector */}
        {mode === 'pro' && (
          <div className="bg-stone-100 p-4 rounded-lg border border-stone-200">
            <label className="text-xs font-bold text-stone-500 block mb-2">选择词牌/体裁</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => setPoemType(key as PoemType)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${poemType === key ? 'bg-red-800 text-white border-red-800' : 'bg-white text-stone-600 border-stone-300'}`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
            {TEMPLATES[poemType] && (
              <div className="mt-3 text-xs text-stone-500 bg-stone-50 p-2 rounded">
                <p className="font-bold mb-1">{TEMPLATES[poemType].description}</p>
                <div className="flex flex-wrap gap-1 opacity-50 font-mono">
                  {TEMPLATES[poemType].structure.map((line, i) => <span key={i}>{line}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="题目 (选填)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-center text-xl font-bold font-serif bg-transparent border-b border-stone-200 focus:border-stone-800 outline-none pb-2 placeholder:text-stone-300"
          />
          
          <div className="flex justify-center gap-4 text-xs font-serif text-stone-500">
             <input 
               value={author} 
               onChange={e => setAuthor(e.target.value)}
               className="bg-transparent border-b border-stone-200 w-20 text-center focus:border-stone-800 outline-none" 
             />
             <button onClick={() => setLayout(l => l === 'vertical' ? 'horizontal' : 'vertical')} className="flex items-center gap-1 hover:text-stone-800">
               <RotateCcw size={12} /> {layout === 'vertical' ? '竖排' : '横排'}
             </button>
          </div>

          <textarea
            placeholder={mode === 'pro' ? "请依格律填词..." : "佳句本天成..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`
              w-full min-h-[300px] p-6 font-serif text-lg leading-loose bg-white border border-stone-100 shadow-inner rounded-sm resize-none outline-none focus:ring-1 focus:ring-stone-200
              ${layout === 'vertical' ? '[writing-mode:vertical-rl] overflow-x-auto text-left' : 'text-center'}
            `}
          />
        </div>

        {/* AI & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Notes */}
          <div className="bg-white p-4 rounded-sm border border-stone-100">
            <h4 className="text-xs font-bold text-stone-400 mb-2">创作心声</h4>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="记录此刻灵感..."
              className="w-full text-sm font-serif text-stone-600 outline-none h-20 resize-none"
            />
          </div>

          {/* AI Feedback */}
          <div className="bg-stone-50 p-4 rounded-sm border border-stone-100 relative">
            <h4 className="text-xs font-bold text-stone-400 mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-600" /> 偶成君点评
            </h4>
            {aiLoading ? (
               <div className="text-xs text-stone-400 animate-pulse">正在以此韵推敲...</div>
            ) : aiComment ? (
               <p className="text-xs text-stone-700 leading-relaxed font-serif">{aiComment}</p>
            ) : (
               <button 
                 onClick={handleAIReview}
                 disabled={!content}
                 className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-600 px-3 py-1 rounded transition-colors disabled:opacity-50"
               >
                 请求点评
               </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
        <button 
          onClick={handleSave}
          className="bg-red-900 text-white px-6 py-2 rounded-full font-serif shadow-lg flex items-center gap-2 hover:bg-red-800 transition-colors active:scale-95"
        >
          <Save size={18} />
          <span>定稿</span>
        </button>
      </div>
    </div>
  );
};

export default Create;
