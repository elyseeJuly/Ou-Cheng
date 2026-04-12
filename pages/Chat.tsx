import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithPoet } from '../services/geminiService';
import { Send, User, Bot } from 'lucide-react';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: '在下偶成君。关于诗词格律、典故或鉴赏，阁下有何指教？', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await chatWithPoet(messages, userMsg.text);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center shrink-0 border
              ${msg.role === 'user' ? 'bg-stone-200 border-stone-300' : 'bg-red-900 border-red-900 text-white'}
            `}>
              {msg.role === 'user' ? <User size={14} className="text-stone-500" /> : <span className="font-serif text-xs">偶</span>}
            </div>
            
            <div className={`
              max-w-[80%] p-3 rounded-lg text-sm font-serif leading-relaxed shadow-sm
              ${msg.role === 'user' ? 'bg-white text-stone-800' : 'bg-[#fdfbf7] border border-stone-200 text-stone-800'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center shrink-0 opacity-50">
               <span className="font-serif text-xs text-white">偶</span>
             </div>
             <div className="text-xs text-stone-400 self-center animate-pulse">正在沉吟...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="请教..."
          className="flex-1 border border-stone-300 rounded-full px-4 py-2 font-serif text-stone-800 focus:outline-none focus:border-red-800"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-red-900 text-white p-2 rounded-full hover:bg-red-800 disabled:opacity-50 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Chat;