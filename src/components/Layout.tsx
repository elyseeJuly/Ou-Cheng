import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getSettings, saveSettings } from '../services/storageService';
import { applyTheme, getThemePref, ThemePref } from '../utils/theme';

const NAV_ITEMS = [
  { path: '/',          iconPath: '/icons/huihao.png',  label: '挥毫' },
  { path: '/works',     iconPath: '/icons/moji.png',    label: '墨迹' },
  { path: '/classics',  iconPath: '/icons/juanzhi.png', label: '卷帙' },
  { path: '/settings',  iconPath: '/icons/yinxia.png',  label: '印匣' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // '/' 同时高亮 /cipai/* 子路由
  const isActive = (path: string) => path === '/'
    ? location.pathname === '/' || location.pathname.startsWith('/cipai')
    : location.pathname === path;

  const [pref, setPref] = useState<ThemePref>(getThemePref());
  const isNight = pref === 'night';

  const toggleTheme = () => {
    const next = pref === 'night' ? 'day' : 'night';
    applyTheme(next, true);
    setPref(next);
    const settings = getSettings();
    saveSettings({ ...settings, theme: next });
  };

  return (
    <>
      {/* Left Sidebar */}
      <aside className="sidebar-nav">
        <div className="sidebar-logo">偶成</div>
        <ul className="sidebar-links">
          {NAV_ITEMS.map(item => (
            <li key={item.path}>
              <Link to={item.path} className={isActive(item.path) ? 'active' : ''}>
                <img
                  src={`${(import.meta as any).env.BASE_URL || ''}${item.iconPath.replace(/^\//, '')}`}
                  className="sidebar-icon"
                  alt={item.label}
                />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={isNight ? '切换为昼' : '夜读模式'}
        >
          {isNight ? '昼' : '夜'}
        </button>
        <div className="sidebar-bottom">v5.0</div>
      </aside>

      {/* Main Content */}
      <main className="app-main" id="main-content">
        {children}
      </main>
    </>
  );
};

export default Layout;
