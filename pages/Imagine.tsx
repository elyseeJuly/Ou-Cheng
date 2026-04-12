import React, { useState } from 'react';
import { generatePoemImage } from '../services/geminiService';
import { ImageSize } from '../types';
import { Wand2, Download, Loader2 } from 'lucide-react';

const Imagine: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const base64Img = await generatePoemImage(prompt, size);
      setGeneratedImage(base64Img);
    } catch (err) {
      setError("生成失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 flex-1 flex flex-col">
        <h2 className="text-xl font-serif font-bold text-stone-800 mb-1">绘意</h2>
        <p className="text-xs text-stone-500 mb-6 font-serif">以诗入画，AI 辅助生成水墨意境。</p>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述画面意象，如：孤舟蓑笠翁，独钓寒江雪..."
            className="w-full h-24 p-3 border border-stone-200 rounded-md font-serif text-sm focus:outline-none focus:border-red-800 resize-none"
          />
          
          <div className="flex justify-between items-center">
             <div className="flex gap-2">
               {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                 <button 
                   key={s}
                   onClick={() => setSize(s)}
                   className={`text-xs px-3 py-1 rounded-full border transition-all ${size === s ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-500 border-stone-200'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>

             <button 
               onClick={handleGenerate}
               disabled={isLoading || !prompt}
               className="bg-red-900 text-white px-4 py-2 rounded-full text-sm font-serif flex items-center gap-2 hover:bg-red-800 disabled:opacity-50"
             >
               {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
               生成
             </button>
          </div>
        </div>

        {/* Display Area */}
        <div className="flex-1 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden relative">
           {isLoading && (
             <div className="text-center">
               <Loader2 className="animate-spin mx-auto text-stone-400 mb-2" size={32} />
               <p className="text-xs text-stone-500 font-serif">墨研之中...</p>
             </div>
           )}
           
           {error && <p className="text-red-500 text-sm font-serif">{error}</p>}

           {generatedImage && (
             <>
               <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
               <a 
                 href={generatedImage} 
                 download={`oucheng_${Date.now()}.png`}
                 className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full text-stone-800 shadow-lg hover:bg-white"
               >
                 <Download size={20} />
               </a>
             </>
           )}
           
           {!isLoading && !generatedImage && !error && (
             <p className="text-stone-300 font-serif text-sm">画面将在此呈现</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default Imagine;
