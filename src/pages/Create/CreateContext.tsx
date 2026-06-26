import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Poem, PoemType, SonnetType, RhymeBook, PaperStyle, LayoutMode, FontStyle, CipaiData, MeterCheckResult } from '../../types';
import { checkJintiShi, checkCipai, checkSonnet } from '../../engine/meterChecker';
import { savePoem, getSettings, getPoemById } from '../../services/storageService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { JINTI_TEMPLATES } from '../../engine/meterChecker';
import { checkMeterAndComment } from '../../services/geminiService';

// ── Mock AI 点评（高质量文言库） ─────────────────────────
export const MOCK_COMMENTS = [
  '起笔清雅，意境悠远，然"月"字处平仄微滞，可酌改"霜"字以顺音律。',
  '此作情韵兼胜，颔联对仗工整，尾句余味悠长，颇得唐人神髓。',
  '入题直截，不假雕琢，自有天然之趣；唯第三句音节稍促，宜舒缓之。',
  '炼字见功，"孤""寒"二字相辅，境界自出，建议收笔再添一转折，使意更丰。',
  '节奏流畅，意象清骨，略嫌笔力稍薄，若增一实景衬托，则虚实相生矣。',
  '词气雍容，格调沉稳，用典得当，不显堆砌；末句"归"字一字千钧，可留。',
  '意脉连贯，行气一气合成，然音韵尚需磨砺，韵脚处宜再斟酌。',
];

export function getMockComment(): string {
  return MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
}

export const SONNET_TYPES: { value: SonnetType; label: string; sub: string }[] = [
  { value: 'none', label: '无', sub: '自由形式' },
  { value: 'shakespeare', label: '莎士比亚', sub: 'ABAB·CDCD·EFEF·GG' },
  { value: 'petrarchan', label: '彼特拉克', sub: 'ABBA·ABBA + CDE' },
  { value: 'chinese_modern', label: '现代汉语', sub: '11–15字·第9行Volta' },
];

export const JINTI_TYPES: { value: PoemType; label: string; chars: string }[] = [
  { value: 'jueju_5', label: '五言绝句', chars: '4句×5字' },
  { value: 'jueju_7', label: '七言绝句', chars: '4句×7字' },
  { value: 'lvshi_5', label: '五言律诗', chars: '8句×5字' },
  { value: 'lvshi_7', label: '七言律诗', chars: '8句×7字' },
];

export const RHYME_BOOKS: { value: RhymeBook; label: string }[] = [
  { value: 'ci_lin', label: '词林正韵' },
  { value: 'ping_shui', label: '平水韵' },
  { value: 'xin_yun', label: '中华新韵' },
];

export interface CreateContextType {
  // Navigation & Query
  navigate: ReturnType<typeof useNavigate>;
  searchParams: ReturnType<typeof useSearchParams>[0];
  settings: ReturnType<typeof getSettings>;

  // Dialog & Flow States
  editId: string | null;
  setEditId: React.Dispatch<React.SetStateAction<string | null>>;
  showImport: boolean;
  setShowImport: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Modes & Settings
  mode: 'free' | 'pro';
  setMode: React.Dispatch<React.SetStateAction<'free' | 'pro'>>;
  proTab: 'jinti' | 'cipai';
  setProTab: React.Dispatch<React.SetStateAction<'jinti' | 'cipai'>>;
  proInputMode: 'split' | 'interleaved';
  setProInputMode: React.Dispatch<React.SetStateAction<'split' | 'interleaved'>>;
  proLines: string[];
  setProLines: React.Dispatch<React.SetStateAction<string[]>>;

  // Form Content
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  author: string;
  setAuthor: React.Dispatch<React.SetStateAction<string>>;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  heartNote: string;
  setHeartNote: React.Dispatch<React.SetStateAction<string>>;
  poemType: PoemType;
  setPoemType: React.Dispatch<React.SetStateAction<PoemType>>;
  jintiStart: 'ping' | 'ze';
  setJintiStart: React.Dispatch<React.SetStateAction<'ping' | 'ze'>>;
  jintiRhyme: 'yes' | 'no';
  setJintiRhyme: React.Dispatch<React.SetStateAction<'yes' | 'no'>>;
  sonnetType: SonnetType;
  setSonnetType: React.Dispatch<React.SetStateAction<SonnetType>>;
  selectedCipai: CipaiData | null;
  setSelectedCipai: React.Dispatch<React.SetStateAction<CipaiData | null>>;
  rhymeBook: RhymeBook;
  setRhymeBook: React.Dispatch<React.SetStateAction<RhymeBook>>;
  
  // Layout Styles
  layout: LayoutMode;
  setLayout: React.Dispatch<React.SetStateAction<LayoutMode>>;
  paperStyle: PaperStyle;
  setPaperStyle: React.Dispatch<React.SetStateAction<PaperStyle>>;
  fontStyle: FontStyle;
  setFontStyle: React.Dispatch<React.SetStateAction<FontStyle>>;

  // Derived Memos
  derivedPoemType: string;
  currentPatterns: string[][];
  activeContent: string;
  previewPoem: Poem;
  sonnetLineCount: number;

  // Validation & AI
  meterResult: MeterCheckResult | null;
  setMeterResult: React.Dispatch<React.SetStateAction<MeterCheckResult | null>>;
  aiLoading: boolean;
  setAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  aiComment: string;
  setAiComment: React.Dispatch<React.SetStateAction<string>>;
  showHeartNote: boolean;
  setShowHeartNote: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions
  handleAIReview: () => Promise<void>;
  handleSave: () => void;
  handleClear: () => void;
}

const CreateContext = createContext<CreateContextType | undefined>(undefined);

export const CreateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const settings = getSettings();

  const [editId, setEditId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  // ── 模式 ──────────────────────────────────────────────
  const [mode, setMode] = useState<'free' | 'pro'>('free');
  const [proTab, setProTab] = useState<'jinti' | 'cipai'>('jinti');
  const [proInputMode, setProInputMode] = useState<'split' | 'interleaved'>('interleaved');
  const [proLines, setProLines] = useState<string[]>([]);

  // ── 表单状态 ────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(settings.defaultPenName);
  const [content, setContent] = useState('');
  const [heartNote, setHeartNote] = useState('');
  const [poemType, setPoemType] = useState<PoemType>('jueju_5');
  const [jintiStart, setJintiStart] = useState<'ping' | 'ze'>('ze');
  const [jintiRhyme, setJintiRhyme] = useState<'yes' | 'no'>('no');
  const [sonnetType, setSonnetType] = useState<SonnetType>('none');
  const [selectedCipai, setSelectedCipai] = useState<CipaiData | null>(null);
  const [rhymeBook, setRhymeBook] = useState<RhymeBook>(settings.rhymeBook);
  const [layout, setLayout] = useState<LayoutMode>(settings.defaultLayout);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(settings.defaultPaperStyle);
  const [fontStyle, setFontStyle] = useState<FontStyle>('none');

  // ── 格律校验 ────────────────────────────────────────────
  const [meterResult, setMeterResult] = useState<MeterCheckResult | null>(null);

  // ── AI 点评 ─────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiComment, setAiComment] = useState('');
  const [showHeartNote, setShowHeartNote] = useState(false);

  // 初始化编辑状态
  useEffect(() => {
    const eid = searchParams.get('edit');
    if (eid) {
      const p = getPoemById(eid);
      if (p) {
        setEditId(p.id);
        setTitle(p.title || '');
        setAuthor(p.author || '');
        setHeartNote(p.heartNote || '');
        setLayout(p.layout || settings.defaultLayout);
        setPaperStyle(p.paperStyle || settings.defaultPaperStyle);
        setFontStyle(p.fontStyle || 'none');
        setRhymeBook(p.rhymeBook || settings.rhymeBook);
        setAiComment(p.aiComment || '');
        
        const linesWithoutPunc = (p.content || '').split('\n').map(l => l.replace(/[，。、；？！]/g, '').trim()).filter(Boolean);
        
        if (p.type === 'free' || p.type === 'sonnet') {
          setMode('free');
          setContent(p.content || '');
          if (p.type === 'sonnet' && p.sonnetType) setSonnetType(p.sonnetType);
        } else {
          setMode('pro');
          setProLines(linesWithoutPunc);
          if (p.type === 'cipai') {
            setProTab('cipai');
          } else {
            setProTab('jinti');
            setPoemType(p.type as PoemType);
            if (p.jintiVariant) {
               const parts = p.jintiVariant.split('_');
               if (parts.length >= 4) {
                 setJintiStart(parts[2] as 'ping'|'ze');
                 setJintiRhyme(parts[3] as 'yes'|'no');
               }
            }
          }
        }
      }
    }
  }, [searchParams, settings]);

  const derivedPoemType = useMemo(() => {
    return `${poemType}_${jintiStart}_${jintiRhyme}`;
  }, [poemType, jintiStart, jintiRhyme]);

  const currentPatterns = useMemo(() => {
    let pts: string[][] = [];
    if (proTab === 'jinti') {
      const templateKey = JINTI_TEMPLATES[derivedPoemType] ? derivedPoemType : (poemType === 'jueju_5' ? 'jueju_5_ze_no' : poemType === 'jueju_7' ? 'jueju_7_ze_yes' : poemType === 'lvshi_5' ? 'lvshi_5_ze_no' : poemType === 'lvshi_7' ? 'lvshi_7_ping_yes' : 'jueju_5_ze_no');
      pts = JINTI_TEMPLATES[templateKey] || [];
    } else if (proTab === 'cipai' && selectedCipai) {
      const upper = selectedCipai.upperPattern.map(s => s.split(''));
      const lower = selectedCipai.lowerPattern?.map(s => s.split('')) || [];
      pts = [...upper, ...(lower.length ? [[], ...lower] : [])];
    }
    return pts;
  }, [proTab, poemType, derivedPoemType, selectedCipai]);

  const activeContent = useMemo(() => {
    if (mode === 'free') return content;
    return currentPatterns.map((row, ri) => {
      if (row.length === 0) return '';
      const isLastInStanza = (ri === currentPatterns.length - 1) || (currentPatterns[ri + 1]?.length === 0);
      const endsWithRhyme = row[row.length - 1] === 'R' || row[row.length - 1] === 'r';
      const punc = (endsWithRhyme || isLastInStanza) ? '。' : '，';
      const lineText = proLines[ri] || '';
      if (!lineText.trim()) return '';
      return lineText + punc;
    }).filter(s => s !== '').join('\n');
  }, [mode, content, currentPatterns, proLines]);

  // 实时格律校验
  useEffect(() => {
    if (!activeContent.trim()) {
      setMeterResult(null);
      return;
    }
    if (mode === 'free' && sonnetType !== 'none') {
      const timer = setTimeout(() => {
        try {
          const result = checkSonnet(activeContent, sonnetType);
          setMeterResult(result);
        } catch (_) { /* ignore */ }
      }, 400);
      return () => clearTimeout(timer);
    }
    if (mode === 'free') {
      setMeterResult(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        let result: MeterCheckResult;
        if (proTab === 'jinti') {
          result = checkJintiShi(activeContent, derivedPoemType, rhymeBook);
        } else if (selectedCipai) {
          result = checkCipai(activeContent, selectedCipai, rhymeBook);
        } else return;
        setMeterResult(result);
      } catch (_) { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [activeContent, mode, proTab, poemType, derivedPoemType, selectedCipai, rhymeBook, sonnetType]);

  // 自由模式十四行实时状态
  const [sonnetLineCount, setSonnetLineCount] = useState(0);
  useEffect(() => {
    setSonnetLineCount(activeContent.split('\n').filter(l => l.trim()).length);
  }, [activeContent]);

  const handleAIReview = async () => {
    if (!activeContent.trim()) return;
    setAiLoading(true);
    try {
      const typeLabel = mode === 'pro'
        ? (proTab === 'cipai' ? `《${selectedCipai?.name || '词牌'}》` : (poemType === 'jueju_5' ? '五绝' : poemType === 'jueju_7' ? '七绝' : poemType === 'lvshi_5' ? '五律' : '七律'))
        : (sonnetType !== 'none' ? '十四行诗' : '自由创作诗词');
      const rhymeLabel = rhymeBook === 'ci_lin' ? '词林正韵' : rhymeBook === 'ping_shui' ? '平水韵' : '中华新韵';
      const comment = await checkMeterAndComment(activeContent, typeLabel, rhymeLabel);
      if (comment === "API_KEY_MISSING") {
        setAiComment("【提示】偶成君之思绪受限，请前往「印匣」配置您的 Gemini API Key 以激活 AI 点评。");
      } else if (comment && comment !== "评价服务暂不可用。") {
        setAiComment(comment);
      } else {
        setAiComment(getMockComment());
      }
    } catch (_) {
      setAiComment(getMockComment());
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!activeContent.trim()) { alert('请先写下诗句'); return; }

    if (mode === 'pro') {
      const nonSeparatorPatterns = currentPatterns.filter(p => p.length > 0);
      const typedLines = proLines.filter((l, idx) => currentPatterns[idx]?.length > 0 && l.trim().length > 0);
      
      if (typedLines.length < nonSeparatorPatterns.length) {
        alert('结构不完整，保存前请完整填写所有诗词行！');
        return;
      }
      
      for (let ri = 0; ri < currentPatterns.length; ri++) {
        if (currentPatterns[ri].length > 0) {
          const expectedLen = currentPatterns[ri].length;
          const actualLen = (proLines[ri] || '').trim().length;
          if (actualLen < expectedLen) {
            alert(`第 ${ri + 1} 行缺字！应为 ${expectedLen} 字，实为 ${actualLen} 字，请补全。`);
            return;
          }
        }
      }
    }

    const autoTitle = title || activeContent.split('\n')[0].slice(0, 12).replace(/[，。]/g, '') || '无题';
    const poem: Poem = {
      id: editId || Date.now().toString(),
      title: autoTitle,
      author: author || '佚名',
      content: activeContent,
      heartNote,
      type: mode === 'free'
        ? (sonnetType !== 'none' ? 'sonnet' : 'free')
        : (proTab === 'cipai' ? 'cipai' : poemType),
      sonnetType: sonnetType !== 'none' ? sonnetType : undefined,
      jintiVariant: mode === 'pro' && proTab === 'jinti' ? derivedPoemType : undefined,
      cipaiName: selectedCipai?.name,
      layout,
      paperStyle,
      fontStyle,
      rhymeBook,
      createdAt: Date.now(),
      aiComment,
    };
    savePoem(poem);
    navigate('/works');
  };

  const handleClear = () => {
    setContent('');
    setProLines([]);
    setAiComment('');
    setMeterResult(null);
  };

  // 预览用 poem 对象
  const previewPoem = useMemo((): Poem => ({
    id: 'preview',
    title: title || '无题',
    author: author || '佚名',
    content: activeContent || '在此输入佳句...',
    heartNote,
    type: mode === 'free'
      ? (sonnetType !== 'none' ? 'sonnet' : 'free')
      : (proTab === 'cipai' ? 'cipai' : poemType),
    sonnetType: sonnetType !== 'none' ? sonnetType : undefined,
    cipaiName: selectedCipai?.name,
    layout,
    paperStyle,
    fontStyle,
    rhymeBook,
    createdAt: Date.now(),
    aiComment,
  }), [title, author, activeContent, heartNote, mode, sonnetType, poemType, selectedCipai, layout, paperStyle, fontStyle, rhymeBook, aiComment]);

  return (
    <CreateContext.Provider value={{
      navigate,
      searchParams,
      settings,
      editId,
      setEditId,
      showImport,
      setShowImport,
      mode,
      setMode,
      proTab,
      setProTab,
      proInputMode,
      setProInputMode,
      proLines,
      setProLines,
      title,
      setTitle,
      author,
      setAuthor,
      content,
      setContent,
      heartNote,
      setHeartNote,
      poemType,
      setPoemType,
      jintiStart,
      setJintiStart,
      jintiRhyme,
      setJintiRhyme,
      sonnetType,
      setSonnetType,
      selectedCipai,
      setSelectedCipai,
      rhymeBook,
      setRhymeBook,
      layout,
      setLayout,
      paperStyle,
      setPaperStyle,
      fontStyle,
      setFontStyle,
      derivedPoemType,
      currentPatterns,
      activeContent,
      previewPoem,
      sonnetLineCount,
      meterResult,
      setMeterResult,
      aiLoading,
      setAiLoading,
      aiComment,
      setAiComment,
      showHeartNote,
      setShowHeartNote,
      handleAIReview,
      handleSave,
      handleClear,
    }}>
      {children}
    </CreateContext.Provider>
  );
};

export const useCreate = () => {
  const context = useContext(CreateContext);
  if (!context) {
    throw new Error('useCreate must be used within a CreateProvider');
  }
  return context;
};
