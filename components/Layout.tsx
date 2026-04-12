import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PenTool, BookOpen, MessageCircle, Image, User } from 'lucide-react';
import { APP_SLOGAN } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <BookOpen size={20} />, label: '赏读' },
    { path: '/create', icon: <PenTool size={20} />, label: '创作' },
    { path: '/chat', icon: <MessageCircle size={20} />, label: '问道' },
    { path: '/imagine', icon: <Image size={20} />, label: '绘意' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col max-w-3xl mx-auto shadow-2xl border-x border-stone-200">
      
      {/* Top Bar */}
      <header className="h-14 bg-stone-100 border-b border-stone-200 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-red-800 rounded-sm flex items-center justify-center text-white text-xs font-serif">偶</div>
           <span className="font-serif font-bold text-stone-800 text-lg">偶成</span>
        </div>
        <span className="text-[10px] text-stone-500 font-serif hidden sm:block">{APP_SLOGAN}</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-16 bg-[#fdfbf7] border-t border-stone-200 fixed bottom-0 left-0 right-0 max-w-3xl mx-auto z-50 flex justify-around items-center px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-red-900' : 'text-stone-400'}`}
            >
              {item.icon}
              <span className="text-[10px] font-serif font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
