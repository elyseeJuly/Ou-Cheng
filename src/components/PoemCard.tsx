import React, { forwardRef } from 'react';
import { Poem } from '../types';
import { BACKGROUND_STYLES } from '../constants';

interface PoemCardProps {
  poem: Poem;
  previewMode?: boolean;
}

const PoemCard = forwardRef<HTMLDivElement, PoemCardProps>(({ poem, previewMode = false }, ref) => {
  const isVertical = poem.layout === 'vertical';
  
  // Parse content to handle newlines
  const lines = poem.content.split('\n');

  return (
    <div 
      ref={ref}
      className={`relative overflow-hidden transition-all duration-500 shadow-lg
        ${previewMode ? 'w-full aspect-[3/4] max-w-md mx-auto scale-95' : 'w-full min-h-[60vh]'}
        ${BACKGROUND_STYLES.paper}
      `}
      style={{
        backgroundImage: poem.backgroundImage ? `url(${poem.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply'
      }}
    >
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>

      <div className={`
        relative z-10 h-full p-8 flex flex-col
        ${isVertical ? 'items-end' : 'items-center'}
      `}>
        {/* Content Container */}
        <div className={`
          flex-1 flex 
          ${isVertical ? 'flex-row-reverse overflow-x-auto py-12 px-6' : 'flex-col justify-center py-12'}
          gap-6 md:gap-8
        `}>
          
          {/* Title & Author Group - Placed logically based on layout */}
          <div className={`
            flex 
            ${isVertical ? 'flex-col items-center gap-4 ml-8 border-l border-stone-800/20 pl-4 h-fit' : 'flex-col items-center mb-8'}
          `}>
             <h1 className={`
                font-bold text-stone-900 leading-relaxed
                ${isVertical ? '[writing-mode:vertical-rl] text-2xl md:text-3xl tracking-widest' : 'text-3xl mb-2'}
                font-['Ma_Shan_Zheng']
             `}>
               {poem.title || "无题"}
             </h1>
             <div className={`
                text-stone-600 text-sm font-serif
                ${isVertical ? '[writing-mode:vertical-rl] mt-4' : ''}
             `}>
               <span className="bg-red-800 text-white px-1 py-0.5 rounded-sm text-xs mr-1 opacity-80">
                  {poem.type === 'free' ? '偶成' : '格律'}
               </span>
               {poem.author}
             </div>
          </div>

          {/* Poem Lines */}
          <div className={`
             flex 
             ${isVertical ? 'flex-row-reverse items-start gap-3 md:gap-6' : 'flex-col items-center gap-3'}
          `}>
            {lines.map((line, idx) => (
              <p key={idx} className={`
                text-lg md:text-xl text-stone-800 font-serif leading-loose tracking-widest
                ${isVertical ? '[writing-mode:vertical-rl]' : 'text-center'}
              `}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Seal / Footer */}
        <div className="absolute bottom-6 left-6 opacity-60">
           <div className="w-8 h-8 border-2 border-red-900 rounded-sm flex items-center justify-center">
             <span className="text-red-900 text-[10px] font-bold">偶<br/>成</span>
           </div>
        </div>

      </div>
    </div>
  );
});

export default PoemCard;
