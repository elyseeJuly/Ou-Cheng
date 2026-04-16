import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/',          iconPath: '/icons/huihao.png',  label: '挥毫' },
  { path: '/works',     iconPath: '/icons/moji.png',    label: '墨迹' },
  { path: '/classics',  iconPath: '/icons/juanzhi.png', label: '卷帙' },
  { path: '/settings',  iconPath: '/icons/yinxia.png',  label: '印匣' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {/* Left Sidebar */}
      <aside className="sidebar-nav">
        <div className="sidebar-logo">偶成</div>
        <ul className="sidebar-links">
          {NAV_ITEMS.map(item => (
            <li key={item.path}>
              <Link to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                <img src={item.iconPath} className="sidebar-icon" alt={item.label} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">v4.0</div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: '80px', minHeight: '100vh' }}>
        {children}
      </main>
    </>
  );
};

export default Layout;
