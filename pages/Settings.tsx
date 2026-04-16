import React, { useState } from 'react';
import { UserSettings, RhymeBook, PaperStyle, LayoutMode } from '../types';
import { getSettings, saveSettings } from '../services/storageService';
import SealManager from '../components/seals/SealManager';

const DEFAULT_RHYME_BOOKS: { value: RhymeBook; label: string; desc: string }[] = [
  { value: 'ci_lin', label: '词林正韵', desc: '宋代词韵标准，十九部' },
  { value: 'ping_shui', label: '平水韵', desc: '隋唐近体诗标准，106韵' },
  { value: 'xin_yun', label: '中华新韵', desc: '现代普通话声调分平仄' },
];

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [newPenName, setNewPenName] = useState('');
  const [tab, setTab] = useState<'general' | 'seals' | 'api'>('general');

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addPenName = () => {
    const name = newPenName.trim();
    if (!name || settings.penNames.includes(name)) return;
    setSettings(s => ({ ...s, penNames: [...s.penNames, name] }));
    setNewPenName('');
  };

  const removePenName = (name: string) => {
    if (settings.penNames.length <= 1) return;
    setSettings(s => ({
      ...s,
      penNames: s.penNames.filter(n => n !== name),
      defaultPenName: s.defaultPenName === name ? s.penNames.filter(n => n !== name)[0] : s.defaultPenName,
    }));
  };

  return (
    <div style={{ padding: '40px 60px', minHeight: '100vh', background: 'var(--paper-white)' }}>
      {/* 页头 */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '42px', color: 'var(--cinnabar-red)', letterSpacing: '8px', marginBottom: '8px' }}>
          印匣
        </h1>
      </div>

      {/* Tab 导航 */}
      <div style={{ display: 'flex', gap: '6px', background: '#f0ede8', borderRadius: '20px', padding: '3px', width: 'fit-content', margin: '0 auto 36px' }}>
        {([['general', '⚙ 通用'], ['seals', '🔖 印章库'], ['api', '🤖 AI 接入']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            style={{
              padding: '7px 20px', borderRadius: '16px', border: 'none',
              background: tab === v ? '#1a1a1a' : 'transparent',
              color: tab === v ? '#fff' : '#888',
              cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
              fontFamily: 'var(--font-kaiti)', letterSpacing: '1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* ── 通用设置 ── */}
        {tab === 'general' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* 笔名管理 */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '18px', color: '#333', letterSpacing: '3px', marginBottom: '14px' }}>
                笔名管理
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {settings.penNames.map(name => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '20px',
                    border: settings.defaultPenName === name ? '1px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                    background: settings.defaultPenName === name ? 'rgba(178,34,34,0.06)' : '#fdfbf7',
                    cursor: 'pointer',
                  }}
                    onClick={() => setSettings(s => ({ ...s, defaultPenName: name }))}>
                    <span style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px', color: settings.defaultPenName === name ? 'var(--cinnabar-red)' : '#555' }}>{name}</span>
                    {settings.defaultPenName === name && <span style={{ fontSize: '11px', color: 'var(--cinnabar-red)' }}>默认</span>}
                    {settings.penNames.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); removePenName(name); }}
                        style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '12px', padding: '0 0 0 2px' }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={newPenName}
                  onChange={e => setNewPenName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPenName()}
                  placeholder="新笔名..."
                  style={{ flex: 1, border: 'none', borderBottom: '1px solid #ddd', background: 'transparent', fontSize: '16px', padding: '6px 0', fontFamily: 'var(--font-kaiti)' }}
                />
                <button onClick={addPenName}
                  style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '16px', padding: '5px 14px', cursor: 'pointer', color: '#888', fontSize: '13px' }}>
                  添加
                </button>
              </div>
            </div>

            {/* 默认韵书 */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-kaiti)', fontSize: '18px', color: '#333', letterSpacing: '3px', marginBottom: '14px' }}>默认韵书</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DEFAULT_RHYME_BOOKS.map(rb => (
                  <div
                    key={rb.value}
                    onClick={() => setSettings(s => ({ ...s, rhymeBook: rb.value }))}
                    style={{
                      padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                      border: settings.rhymeBook === rb.value ? '2px solid var(--cinnabar-red)' : '1px solid #e0e0e0',
                      background: settings.rhymeBook === rb.value ? 'rgba(178,34,34,0.04)' : 'white',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-kaiti)', fontSize: '16px', color: settings.rhymeBook === rb.value ? 'var(--cinnabar-red)' : '#333' }}>{rb.label}</div>
                    <div style={{ fontSize: '12px', color: '#bbb', marginTop: '3px' }}>{rb.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 印章库 ── */}
        {tab === 'seals' && (
          <div className="fade-in">
            <SealManager penName={settings.defaultPenName} />
          </div>
        )}

        {/* ── AI 接入 ── */}
        {tab === 'api' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', background: 'rgba(45,90,61,0.06)', borderRadius: '8px', borderLeft: '3px solid #2d5a3d' }}>
              <p style={{ fontFamily: 'var(--font-kaiti)', fontSize: '15px', color: '#2d5a3d', lineHeight: 1.8 }}>
                MVP 阶段内置高质量文言模拟点评。如需接入私有大模型（如 Kimi / Deepseek / GPT），请填入 API Key。
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'monospace', display: 'block', marginBottom: '8px' }}>API KEY</label>
              <input
                type="password"
                placeholder="sk-..."
                value={settings.apiKey || ''}
                onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #e0e0e0', background: 'transparent', fontSize: '16px', padding: '8px 0', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#999', letterSpacing: '3px', fontFamily: 'monospace', display: 'block', marginBottom: '8px' }}>API BASE URL（可选）</label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={settings.apiBaseUrl || ''}
                onChange={e => setSettings(s => ({ ...s, apiBaseUrl: e.target.value }))}
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #e0e0e0', background: 'transparent', fontSize: '16px', padding: '8px 0', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}

        {/* 保存按钮 */}
        {tab !== 'seals' && (
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleSave}
              style={{
                background: 'var(--cinnabar-red)', color: 'white', border: 'none',
                borderRadius: '24px', padding: '10px 32px', cursor: 'pointer',
                fontFamily: 'var(--font-kaiti)', fontSize: '16px', letterSpacing: '3px',
                transition: 'all 0.2s',
              }}
            >
              保存设置
            </button>
            {saved && (
              <span style={{ color: '#2d5a3d', fontFamily: 'var(--font-kaiti)', fontSize: '15px' }}>
                ✓ 已保存
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
