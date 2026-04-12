import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {/* Left Sidebar */}
      <aside className="sidebar-nav">
        <div className="sidebar-logo">偶成</div>
        <ul className="sidebar-links">
            <li>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                    <span className="sidebar-icon">✍</span>
                    创作
                </Link>
            </li>
            <li>
                <Link to="/works" className={location.pathname === '/works' ? 'active' : ''}>
                    <span className="sidebar-icon">📚</span>
                    作品
                </Link>
            </li>
            <li>
                <Link to="/classics" className={location.pathname === '/classics' ? 'active' : ''}>
                    <span className="sidebar-icon">⛩</span>
                    典籍
                </Link>
            </li>
        </ul>
        <div className="sidebar-bottom">v1.0.0</div>
      </aside>

      {/* Main Content */}
      <main className="main" style={{ marginLeft: '80px', minHeight: '100vh' }}>
        {children}
      </main>
    </>
  );
};

export default Layout;
