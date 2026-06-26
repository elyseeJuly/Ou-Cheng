import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdatePrompt: React.FC = () => {
  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker 注册成功', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker 注册失败', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div
      className="pwa-update-prompt fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 10000,
        backgroundColor: 'var(--paper-white)',
        border: '2px solid var(--cinnabar-red)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '16px 20px',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'var(--font-kaiti)',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4
          style={{
            margin: 0,
            color: 'var(--cinnabar-red)',
            fontSize: '1.1rem',
            fontWeight: 600,
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>📜</span> 偶成新版就绪
        </h4>
        <button
          onClick={close}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--gray)',
            padding: '2px',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="关闭"
        >
          &times;
        </button>
      </div>
      <p style={{ fontSize: '0.9rem', color: 'var(--ink-black)', lineHeight: 1.5, margin: 0 }}>
        新版画卷已绘制完毕，是否立即启封阅览？
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={close}
          style={{
            padding: '4px 12px',
            border: '1px solid var(--gray)',
            background: 'none',
            color: 'var(--gray)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-kaiti)',
          }}
        >
          暂缓
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          style={{
            padding: '4px 16px',
            border: 'none',
            background: 'var(--cinnabar-red)',
            color: 'var(--paper-white)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
            fontFamily: 'var(--font-kaiti)',
            boxShadow: '0 2px 6px rgba(178, 34, 34, 0.2)',
          }}
        >
          启封
        </button>
      </div>
    </div>
  );
};
export default UpdatePrompt;
