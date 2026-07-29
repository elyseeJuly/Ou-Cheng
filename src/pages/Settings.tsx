import React, { useState } from 'react';
import { UserSettings, RhymeBook, PaperStyle, LayoutMode, FontStyle } from '../types';
import { getSettings, saveSettings } from '../services/storageService';
import SealManager from '../components/seals/SealManager';
import { FONT_STYLES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { EventBus } from '../utils/EventBus';

const DEFAULT_RHYME_BOOKS: { value: RhymeBook; label: string; desc: string }[] = [
  { value: 'ci_lin', label: '词林正韵', desc: '宋代词韵标准，十九部' },
  { value: 'ping_shui', label: '平水韵', desc: '隋唐近体诗标准，106韵' },
  { value: 'xin_yun', label: '中华新韵', desc: '现代普通话声调分平仄' },
];

const FONT_OPTIONS: { value: FontStyle; label: string }[] = [
  { value: 'none', label: '系统默认' },
  ...Object.entries(FONT_STYLES).filter(([k]) => k !== 'none').map(([k, v]) => ({ value: k as FontStyle, label: v.label })),
];

const OPEN_SOURCE_PROJECTS = [
  { name: 'Kanripo / 御定词谱 KR4j0086', license: 'CC BY-SA', url: 'https://github.com/kanripo/KR4j0086', use: '763 调、2092 个可创作词谱变体及其作者词例' },
  { name: 'OpenCC JS', license: 'Apache-2.0', url: 'https://github.com/nk2028/opencc-js', use: '词谱数据构建时的繁简转换' },
  { name: 'chinese-poetry', license: 'MIT', url: 'https://github.com/chinese-poetry/chinese-poetry', use: '典籍、宋词及词牌代表作数据' },
  { name: 'chinese_word_rhyme', license: 'MIT', url: 'https://github.com/charlesix59/chinese_word_rhyme', use: '平水韵、词林正韵、中华新韵离线韵书底表' },
  { name: 'pinyin-pro', license: 'MIT', url: 'https://github.com/zh-lx/pinyin-pro', use: '本地拼音、声调和平仄辅助判断' },
  { name: 'React / React DOM', license: 'MIT', url: 'https://github.com/facebook/react', use: '应用界面与组件系统' },
  { name: 'React Router', license: 'MIT', url: 'https://github.com/remix-run/react-router', use: '页面路由' },
  { name: 'Zustand', license: 'MIT', url: 'https://github.com/pmndrs/zustand', use: '拾字囊等本地状态管理' },
  { name: 'Three.js', license: 'MIT', url: 'https://github.com/mrdoob/three.js', use: '意象星图与三维词云' },
  { name: 'html2canvas', license: 'MIT', url: 'https://github.com/niklasvh/html2canvas', use: '诗词海报渲染与图片导出' },
  { name: 'Noto Serif SC / Ma Shan Zheng', license: 'SIL OFL-1.1', url: 'https://github.com/google/fonts', use: '开源中文字体与书法字体' },
] as const;

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [newPenName, setNewPenName] = useState('');
  const [tab, setTab] = useState<'general' | 'seals' | 'api' | 'data' | 'about'>('general');

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    // 字体设置立即生效
    if (settings.globalFont && settings.globalFont !== 'none') {
      document.body.style.fontFamily = FONT_STYLES[settings.globalFont]?.family || '"Ma Shan Zheng", serif';
    } else {
      document.body.style.fontFamily = '';
    }
    // 同步 Haptics 引擎设置
    EventBus.emit('SETTINGS_HAPTICS', { on: settings.hapticsEnabled !== false });
    EventBus.emit('SETTINGS_BEAT_TICK_HAPTICS', { on: settings.beatTickHapticsEnabled === true });
    // 触发保存成功震动
    EventBus.emit('TRIGGER_BURST', { shapeType: 'peony' });

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
    <div className="collection-page settings-page" style={{ padding: '40px 60px', minHeight: '100vh', background: 'var(--paper-0)' }}>
      {/* 页头 */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-kai)', fontSize: '42px', color: 'var(--accent-seal)', letterSpacing: '8px', marginBottom: '8px' }}>
          印匣
        </h1>
      </div>

      {/* Tab 导航 — 改用 .opt-item */}
      <div className="opt-group" style={{ justifyContent: 'center', marginBottom: '36px' }}>
        {([['general', '通用'], ['seals', '印章库'], ['api', 'AI 接入'], ['data', '数据'], ['about', '关于']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`opt-item ${tab === v ? 'active' : ''}`}
            style={{ fontSize: 'var(--text-body)' }}
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
              <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '18px', color: 'var(--ink-jiao)', letterSpacing: '3px', marginBottom: '14px' }}>
                笔名管理
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {settings.penNames.map(name => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: 'var(--radius-xs)',
                    border: settings.defaultPenName === name ? '1px solid var(--accent-active)' : '1px solid var(--ink-qing)',
                    background: settings.defaultPenName === name ? 'var(--cinnabar-wash)' : 'var(--paper-1)',
                    cursor: 'pointer',
                  }}
                    onClick={() => setSettings(s => ({ ...s, defaultPenName: name }))}>
                    <span style={{ fontFamily: 'var(--font-kai)', fontSize: '15px', color: settings.defaultPenName === name ? 'var(--accent-active)' : 'var(--ink-zhong)' }}>{name}</span>
                    {settings.defaultPenName === name && <span style={{ fontSize: '11px', color: 'var(--accent-active)' }}>默认</span>}
                    {settings.penNames.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); removePenName(name); }}
                        style={{ background: 'none', border: 'none', color: 'var(--ink-dan)', cursor: 'pointer', fontSize: '12px', padding: '0 0 0 2px' }}>×</button>
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
                  className="borderless-input"
                  style={{ flex: 1, fontSize: '16px', padding: '6px 0' }}
                />
                <button onClick={addPenName}
                  style={{ background: 'none', border: '1px solid var(--ink-qing)', borderRadius: 'var(--radius-xs)', padding: '5px 14px', cursor: 'pointer', color: 'var(--ink-dan)', fontSize: '13px', fontFamily: 'var(--font-kai)' }}>
                  添加
                </button>
              </div>
            </div>

            {/* 默认韵书 — 改用 .opt-item */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '18px', color: 'var(--ink-jiao)', letterSpacing: '3px', marginBottom: '14px' }}>默认韵书</h3>
              <div className="opt-group" style={{ flexDirection: 'column', gap: '8px' }}>
                {DEFAULT_RHYME_BOOKS.map(rb => (
                  <button
                    key={rb.value}
                    onClick={() => setSettings(s => ({ ...s, rhymeBook: rb.value }))}
                    className={`opt-item ${settings.rhymeBook === rb.value ? 'active' : ''}`}
                    style={{ textAlign: 'left', padding: '12px 16px', width: '100%', justifyContent: 'flex-start', flexDirection: 'column', gap: '4px' }}
                  >
                    <div style={{ fontFamily: 'var(--font-kai)', fontSize: '16px' }}>{rb.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-dan)' }}>{rb.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 全局字体 — 从 PoemPreview 移到印匣 */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '18px', color: 'var(--ink-jiao)', letterSpacing: '3px', marginBottom: '14px' }}>全局字体</h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-dan)', fontFamily: 'var(--font-serif)', letterSpacing: '2px', marginBottom: '10px' }}>
                设为此字体后，所有页面文字统一使用该字体显示
              </p>
              <div className="opt-group" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setSettings(s => ({ ...s, globalFont: f.value }))}
                    className={`opt-item ${(settings.globalFont || 'none') === f.value ? 'active' : ''}`}
                    style={{ fontSize: '13px' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 触觉反馈设置 */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '18px', color: 'var(--ink-jiao)', letterSpacing: '3px', marginBottom: '14px' }}>触觉反馈 (Haptics)</h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-dan)', fontFamily: 'var(--font-serif)', letterSpacing: '2px', marginBottom: '10px' }}>
                在原生壳或移动端浏览器中提供物理触觉震动反馈，丰富操作感官
              </p>
              <div className="opt-group" style={{ gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setSettings(s => ({ ...s, hapticsEnabled: true }))}
                  className={`opt-item ${settings.hapticsEnabled !== false ? 'active' : ''}`}
                  style={{ fontSize: '13px', padding: '6px 16px' }}
                >
                  开启触觉
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, hapticsEnabled: false }))}
                  className={`opt-item ${settings.hapticsEnabled === false ? 'active' : ''}`}
                  style={{ fontSize: '13px', padding: '6px 16px' }}
                >
                  关闭触觉
                </button>
              </div>
            </div>

            {/* 拍点触觉设置 */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-kai)', fontSize: '18px', color: 'var(--ink-jiao)', letterSpacing: '3px', marginBottom: '14px' }}>节奏拍点震动</h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-dan)', fontFamily: 'var(--font-serif)', letterSpacing: '2px', marginBottom: '10px' }}>
                是否随创作节拍或韵律提示进行轻微的节奏性震动提示（默认关闭）
              </p>
              <div className="opt-group" style={{ gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setSettings(s => ({ ...s, beatTickHapticsEnabled: true }))}
                  className={`opt-item ${settings.beatTickHapticsEnabled === true ? 'active' : ''}`}
                  style={{ fontSize: '13px', padding: '6px 16px' }}
                >
                  随节拍震动
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, beatTickHapticsEnabled: false }))}
                  className={`opt-item ${settings.beatTickHapticsEnabled !== true ? 'active' : ''}`}
                  style={{ fontSize: '13px', padding: '6px 16px' }}
                >
                  无拍点震动
                </button>
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
            <div style={{ padding: '16px', background: 'rgba(45,90,61,0.06)', borderRadius: 'var(--radius-xs)', borderLeft: '3px solid #2d5a3d' }}>
              <p style={{ fontFamily: 'var(--font-kai)', fontSize: '15px', color: '#2d5a3d', lineHeight: 1.8 }}>
                内置文言模拟点评。如需接入私有大模型（如 Kimi / Deepseek / GPT / Gemini），请填入以下配置。
              </p>
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--ink-dan)', letterSpacing: '3px', fontFamily: 'monospace' }}>API KEY</label>
              <input
                type="password"
                placeholder="sk-..."
                value={settings.apiKey || ''}
                onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                className="borderless-input"
                style={{ width: '100%', fontSize: '16px', padding: '8px 0', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--ink-dan)', letterSpacing: '3px', fontFamily: 'monospace' }}>API BASE URL（可选）</label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={settings.apiBaseUrl || ''}
                onChange={e => setSettings(s => ({ ...s, apiBaseUrl: e.target.value }))}
                className="borderless-input"
                style={{ width: '100%', fontSize: '16px', padding: '8px 0', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--ink-dan)', letterSpacing: '3px', fontFamily: 'monospace' }}>模型名称（可选，如 deepseek-chat 或 gemini-2.5-flash）</label>
              <input
                type="text"
                placeholder="gemini-2.5-flash-preview-04-17"
                value={settings.apiModel || ''}
                onChange={e => setSettings(s => ({ ...s, apiModel: e.target.value }))}
                className="borderless-input"
                style={{ width: '100%', fontSize: '16px', padding: '8px 0', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}

        {/* ── 数据说明 ── */}
        {tab === 'data' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', background: 'rgba(45,90,61,0.06)', borderRadius: 'var(--radius-xs)', borderLeft: '3px solid var(--meter-ping)' }}>
              <p style={{ fontFamily: 'var(--font-kai)', fontSize: '15px', color: 'var(--meter-ping)', lineHeight: 1.8 }}>
                作品、设置与草稿只保存在当前浏览器。请定期在「墨迹」页面导出 JSON 备份，并在恢复前核对文件来源。
              </p>
            </div>
            <button className="save-btn" onClick={() => navigate('/works')} style={{ minHeight: '44px', borderRadius: '6px' }}>
              前往墨迹备份与恢复
            </button>
          </div>
        )}

        {/* ── 关于 & 致谢 ── */}
        {tab === 'about' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'var(--font-kai)' }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '48px', color: 'var(--accent-seal)', marginBottom: '16px' }}>偶成</div>
              <p style={{ fontSize: '14px', color: 'var(--ink-dan)', letterSpacing: '2px' }}>版本 v0.5.1 · 预备发布版</p>
            </div>

            <section>
              <h3 style={{ fontSize: '18px', color: 'var(--ink-jiao)', borderBottom: '1px solid var(--ink-qing)', paddingBottom: '8px', marginBottom: '12px', letterSpacing: '2px' }}>数据源致谢</h3>
              <p style={{ fontSize: '15px', color: 'var(--ink-zhong)', lineHeight: 1.8 }}>
                「典籍」模块及词牌代表作使用
                <a href="https://github.com/chinese-poetry/chinese-poetry" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-seal)', textDecoration: 'none', borderBottom: '1px solid var(--accent-seal)', margin: '0 4px' }}>chinese-poetry/chinese-poetry</a>
                提供的公版古典诗词数据。该项目以 MIT 许可证发布；感谢维护者与贡献者持续整理、校勘中华古典文献。
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '18px', color: 'var(--ink-jiao)', borderBottom: '1px solid var(--ink-qing)', paddingBottom: '8px', marginBottom: '12px', letterSpacing: '2px' }}>开源愿景</h3>
              <p style={{ fontSize: '15px', color: 'var(--ink-zhong)', lineHeight: 1.8 }}>
                偶成致力于提供完全本地的诗词创作、格律校验与典籍阅读体验，并通过可复现的数据脚本和清晰署名反哺开源社区。
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '18px', color: 'var(--ink-jiao)', borderBottom: '1px solid var(--ink-qing)', paddingBottom: '8px', marginBottom: '12px', letterSpacing: '2px' }}>使用的开源技术</h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-dan)', lineHeight: 1.7, marginBottom: '12px' }}>
                下列项目均已在当前版本中实际使用。点击项目名称可查看源码和许可证；许可证名称以对应项目仓库为准。
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {OPEN_SOURCE_PROJECTS.map(project => (
                  <li key={project.name} style={{ padding: '10px 12px', background: 'var(--paper-1)', borderLeft: '2px solid var(--ink-qing)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                      <a href={project.url} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-jiao)', textDecoration: 'none', borderBottom: '1px solid var(--ink-qing)' }}>
                        {project.name}
                      </a>
                      <span style={{ fontSize: '12px', color: 'var(--accent-seal)', whiteSpace: 'nowrap' }}>{project.license}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ink-dan)', marginTop: '5px' }}>{project.use}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* 保存按钮 */}
        {tab !== 'seals' && tab !== 'about' && (
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleSave}
              className="save-btn"
              style={{ borderRadius: '6px', padding: '10px 32px', fontSize: '16px', letterSpacing: '3px' }}
            >
              保存设置
            </button>
            {saved && (
              <span style={{ color: 'var(--meter-ping)', fontFamily: 'var(--font-kai)', fontSize: '15px' }}>
                已保存
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
