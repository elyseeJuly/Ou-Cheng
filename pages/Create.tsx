import React, { useState } from 'react';
import { Poem, PoemType } from '../types';
import { checkMeterAndComment } from '../services/geminiService';
import { savePoem } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

const Create: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'free' | 'pro'>('free');

    // Form State
    const [title, setTitle] = useState('无题');
    const [author, setAuthor] = useState('偶成君');
    const [content, setContent] = useState('');
    const [poemType, setPoemType] = useState<string>('none');
    const [genre, setGenre] = useState<'modern' | 'ci'>('modern');

    // AI & Validation
    const [aiLoading, setAiLoading] = useState(false);
    const [aiComment, setAiComment] = useState('');

    const handleSave = () => {
        if (!content.trim()) return alert("请先写下诗句");

        const newPoem: Poem = {
            id: Date.now().toString(),
            title: title || "无题",
            author,
            content,
            notes: '',
            type: mode === 'free' ? 'free' : 'jueju_5',
            layout: 'vertical',
            backgroundTheme: 'paper',
            createdAt: Date.now(),
            aiComment
        };

        savePoem(newPoem);
        navigate('/works');
    };

    const handleAIReview = async () => {
        setAiLoading(true);
        const comment = await checkMeterAndComment(
            content,
            mode === 'free' ? "自由诗" : "格律诗",
            "中华新韵"
        );
        setAiComment(comment);
        setAiLoading(false);
    };

    const previewContent = content || '在此输入佳句...';
    // Remove "题" prefix logic if it's already "题无" or something.
    const displayTitle = title ? `题${title}` : '题无';

    return (
        <div className="editor-split">
            {/* Editor Left (Input) */}
            <div className="editor-left fade-in">
                {/* Mode Toggle (Tabs) */}
                <div className="mode-toggle">
                    <button
                        className={`mode-btn ${mode === 'free' ? 'active' : ''}`}
                        onClick={() => setMode('free')}
                    >
                        自由创作
                    </button>
                    <button
                        className={`mode-btn ${mode === 'pro' ? 'active' : ''}`}
                        onClick={() => setMode('pro')}
                    >
                        专业格律
                    </button>
                </div>

                {mode === 'free' && (
                    <div className="free-creation" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div className="input-group">
                            <label>标题</label>
                            <input
                                type="text"
                                className="borderless-input"
                                placeholder="无题"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>笔名</label>
                            <input
                                type="text"
                                className="borderless-input"
                                placeholder="偶成君"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                            />
                        </div>

                        <div className="sonnet-section">
                            <label>十四行诗体例 (可选)</label>
                            <div className="sonnet-types">
                                <button className={`sonnet-type ${poemType === 'none' ? 'active' : ''}`} onClick={() => setPoemType('none')}>无</button>
                                <button className={`sonnet-type ${poemType === 'shakespeare' ? 'active' : ''}`} onClick={() => setPoemType('shakespeare')}>莎士比亚</button>
                                <button className={`sonnet-type ${poemType === 'modern' ? 'active' : ''}`} onClick={() => setPoemType('modern')}>现代汉语</button>
                            </div>
                        </div>

                        <textarea
                            className="giant-textarea"
                            placeholder="在此输入诗词内容..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        <div className="ai-comment" style={{ marginTop: 'auto' }}>
                            <button className="action-btn clear-btn" onClick={() => setContent('')} style={{ marginRight: '15px' }}>清空</button>
                            <button className="action-btn save-btn" onClick={handleSave}>保存</button>
                            <button
                                className="action-btn"
                                onClick={handleAIReview}
                                disabled={!content || aiLoading}
                                style={{ background: 'var(--ink-green)', color: 'white', marginLeft: '15px', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', opacity: (!content || aiLoading) ? 0.5 : 1 }}
                            >
                                ✨ {aiLoading ? '请稍候...' : 'AI'}
                            </button>
                            {aiComment && <div style={{ marginTop: '10px' }}>{aiComment}</div>}
                        </div>
                    </div>
                )}

                {mode === 'pro' && (
                    <div className="pro-creation" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div className="genre-selector" style={{ marginBottom: '20px' }}>
                            <button
                                className={`genre-btn ${genre === 'modern' ? 'active' : ''}`}
                                onClick={() => setGenre('modern')}
                                style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', flex: 1 }}
                            >
                                近体诗
                            </button>
                            <button
                                className={`genre-btn ${genre === 'ci' ? 'active' : ''}`}
                                onClick={() => setGenre('ci')}
                                style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', flex: 1 }}
                            >
                                词牌
                            </button>
                        </div>

                        <textarea
                            className="giant-textarea"
                            placeholder="在此输入专业格律内容..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        <div className="ai-comment" style={{ marginTop: 'auto' }}>
                            <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--gray)' }}>
                                格律检查：输入诗句后自动分析...
                            </div>
                            <button
                                className="action-btn"
                                onClick={handleAIReview}
                                disabled={!content || aiLoading}
                                style={{ background: 'var(--ink-green)', color: 'white', marginTop: '20px', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', opacity: (!content || aiLoading) ? 0.5 : 1 }}
                            >
                                ✨ {aiLoading ? '请稍候...' : '获取 AI 点评'}
                            </button>
                            {aiComment && <div style={{ marginTop: '10px' }}>{aiComment}</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* Editor Right (Preview) */}
            <div className="editor-right fade-in">
                <button
                    style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '18px' }}
                >
                    ◫
                </button>

                <div style={{ position: 'absolute', top: '60px', right: '80px', textAlign: 'right', writingMode: 'vertical-rl', WebkitTextOrientation: 'upright', textOrientation: 'upright', display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', color: 'var(--ink-black)', letterSpacing: '5px', marginRight: '10px', fontFamily: '"Ma Shan Zheng", serif' }}>
                        {author}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)', letterSpacing: '5px', marginBottom: '20px', fontFamily: '"Ma Shan Zheng", serif' }}>
                        {new Date().getFullYear()}年<br />{new Date().getMonth() + 1}月
                    </div>
                </div>

                <div className="stamp-seal" style={{ position: 'absolute', top: '160px', right: '140px', width: '45px', height: '45px', border: '2px solid #a83232', color: '#a83232', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', borderRadius: '4px', transform: 'rotate(-5deg)', opacity: 0.9, fontFamily: '"ZCOOL KuaiLe", cursive' }}>
                    偶<br />成
                </div>

                <div className="vertical-content" style={{ marginTop: '180px', marginRight: '220px', width: 'calc(100% - 260px)', height: 'calc(100% - 300px)', writingMode: 'vertical-rl', WebkitTextOrientation: 'upright', textOrientation: 'upright', fontSize: '26px', lineHeight: 2.5, letterSpacing: '5px', display: 'flex', alignItems: 'center', color: 'var(--ink-black)' }}>
                    {previewContent.split('\n').map((line, idx) => (
                        <div key={idx} className="line" style={{ color: content ? 'var(--ink-black)' : '#999', marginLeft: '30px' }}>
                            {line}
                        </div>
                    ))}
                </div>

                <div className="large-title" style={{ position: 'absolute', bottom: '40px', right: '40px', fontSize: '80px', fontWeight: 'bold', color: 'rgba(26,26,26,0.08)', fontFamily: '"ZCOOL KuaiLe", cursive', writingMode: 'horizontal-tb', textAlign: 'right', pointerEvents: 'none', whiteSpace: 'nowrap', maxWidth: '80%', overflow: 'hidden' }}>
                    {displayTitle}
                </div>
            </div>
        </div>
    );
};

export default Create;
