import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Poem, PoemBase, PoemType, SonnetType, RhymeBook, PaperStyle, LayoutMode, FontStyle, CipaiData, MeterCheckResult, PoemForm } from '../../types';
import { checkJintiShi, checkCipai, checkSonnet } from '../../engine/meterChecker';
import { savePoem, getSettings, getPoemById, getDraft, saveDraft, deleteDraft } from '../../services/storageService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { JINTI_TEMPLATES } from '../../engine/meterChecker';
import { getForm, SONNET_FORM_MAP, checkCharsPerLine, formatChars } from '../../data/poemForms';
import { clausesToProLines, getCipaiEditorPatterns, normalizePoemClauses } from '../../engine/importParser';
import { mergePoemForSave } from '../../services/poemSave';
import { EventBus } from '../../utils/EventBus';
import { checkMeterAndComment } from '../../services/geminiService';

const getMockComment = () => {
  const mocks = [
    "此作意境深远，格律严整，字里行间颇有古人遗风，甚佳。",
    "起承转合自然，用词雅致，读来朗朗上口，回味无穷。",
    "遣词造句精妙，情感真挚，唯韵脚处可再斟酌，以臻完美。"
  ];
  return mocks[Math.floor(Math.random() * mocks.length)];
};

type ClearedSnapshot = {
  title: string;
  author: string;
  content: string;
  heartNote: string;
  proLines: string[];
  mode: 'free' | 'pro';
  proTab: 'jinti' | 'cipai';
  poemType: PoemType;
  jintiStart: 'ping' | 'ze';
  jintiRhyme: 'yes' | 'no';
  sonnetType: SonnetType;
  formId: string;
  selectedCipai: CipaiData | null;
  rhymeBook: RhymeBook;
  layout: LayoutMode;
  paperStyle: PaperStyle;
  fontStyle: FontStyle;
  manualRhymeGroupId: string | null;
};

type PoemVariantState = {
  mode: 'free' | 'pro';
  sonnetType: SonnetType;
  formId: string;
  formName: string;
  proTab: 'jinti' | 'cipai';
  selectedCipai: CipaiData | null;
  poemType: PoemType;
  jintiVariant: string;
};

const buildTypedPoem = (base: PoemBase, state: PoemVariantState): Poem => {
  if (state.mode === 'free') {
    const form = state.formId !== 'free' ? { formId: state.formId, formName: state.formName } : {};
    if (state.sonnetType !== 'none') return { ...base, ...form, type: 'sonnet', sonnetType: state.sonnetType };
    return { ...base, ...form, type: 'free' };
  }
  if (state.proTab === 'cipai' && state.selectedCipai?.id) {
    return { ...base, type: 'cipai', cipaiName: state.selectedCipai.name, cipaiVariantId: state.selectedCipai.id };
  }
  const type = state.poemType === 'jueju_5' || state.poemType === 'jueju_7'
    || state.poemType === 'lvshi_5' || state.poemType === 'lvshi_7'
    ? state.poemType
    : 'jueju_5';
  return { ...base, type, jintiVariant: state.jintiVariant };
};

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

// ── 细粒度 Context 定义 ──────────────────────────────────
export interface CreateDocumentState {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  author: string;
  setAuthor: React.Dispatch<React.SetStateAction<string>>;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  heartNote: string;
  setHeartNote: React.Dispatch<React.SetStateAction<string>>;
  proLines: string[];
  setProLines: React.Dispatch<React.SetStateAction<string[]>>;
  activeContent: string;
  showHeartNote: boolean;
  setShowHeartNote: React.Dispatch<React.SetStateAction<boolean>>;
  aiComment: string;
  setAiComment: React.Dispatch<React.SetStateAction<string>>;
}

export interface CreateFormState {
  mode: 'free' | 'pro';
  setMode: React.Dispatch<React.SetStateAction<'free' | 'pro'>>;
  proTab: 'jinti' | 'cipai';
  setProTab: React.Dispatch<React.SetStateAction<'jinti' | 'cipai'>>;
  poemType: PoemType;
  setPoemType: React.Dispatch<React.SetStateAction<PoemType>>;
  jintiStart: 'ping' | 'ze';
  setJintiStart: React.Dispatch<React.SetStateAction<'ping' | 'ze'>>;
  jintiRhyme: 'yes' | 'no';
  setJintiRhyme: React.Dispatch<React.SetStateAction<'yes' | 'no'>>;
  sonnetType: SonnetType;
  setSonnetType: React.Dispatch<React.SetStateAction<SonnetType>>;
  formId: string;
  setFormId: React.Dispatch<React.SetStateAction<string>>;
  currentForm: PoemForm;
  selectedCipai: CipaiData | null;
  setSelectedCipai: React.Dispatch<React.SetStateAction<CipaiData | null>>;
  rhymeBook: RhymeBook;
  setRhymeBook: React.Dispatch<React.SetStateAction<RhymeBook>>;
  derivedPoemType: string;
  currentPatterns: string[][];
}

export interface CreateCaretState {
  rhymeHintEnabled: boolean;
  setRhymeHintEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  rhymeMirrorVisible: boolean;
  rhymeMirrorRowIndex: number;
  anchorRhymeChar: string | null;
  usedRhymes: string[];
  onCaretOnRhyme: (isOnRhyme: boolean, rowIndex: number) => void;
  handleRhymePick: (char: string) => void;
  manualRhymeGroupId: string | null;
  setManualRhymeGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  caretRow: number;
  caretCol: number;
  toneReq: 'P' | 'Z' | null;
  onCellFocus: (toneReq: 'P' | 'Z' | null) => void;
  onCaretCell: (rowIndex: number, colIndex: number) => void;
}

export interface CreatePresentationState {
  layout: LayoutMode;
  setLayout: React.Dispatch<React.SetStateAction<LayoutMode>>;
  paperStyle: PaperStyle;
  setPaperStyle: React.Dispatch<React.SetStateAction<PaperStyle>>;
  fontStyle: FontStyle;
  setFontStyle: React.Dispatch<React.SetStateAction<FontStyle>>;
  previewPoem: Poem;
}

export interface CreateWorkflowState {
  settings: ReturnType<typeof getSettings>;
  editId: string | null;
  setEditId: React.Dispatch<React.SetStateAction<string | null>>;
  showImport: boolean;
  setShowImport: React.Dispatch<React.SetStateAction<boolean>>;
  sonnetLineCount: number;
  meterResult: MeterCheckResult | null;
  setMeterResult: React.Dispatch<React.SetStateAction<MeterCheckResult | null>>;
  handleSave: () => Promise<void>;
  handleClear: () => void;
  handleRestoreClear: () => void;
  canRestoreClear: boolean;
  aiLoading: boolean;
  handleAIReview: () => Promise<void>;
}

const CreateDocumentContext = createContext<CreateDocumentState | undefined>(undefined);
const CreateFormContext = createContext<CreateFormState | undefined>(undefined);
const CreateCaretContext = createContext<CreateCaretState | undefined>(undefined);
const CreatePresentationContext = createContext<CreatePresentationState | undefined>(undefined);
const CreateWorkflowContext = createContext<CreateWorkflowState | undefined>(undefined);


export const CreateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const settings = useMemo(() => getSettings(), []);
  const draftRestored = useRef(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [aiComment, setAiComment] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ── 模式 ──────────────────────────────────────────────
  const [mode, setMode] = useState<'free' | 'pro'>('free');
  const [proTab, setProTab] = useState<'jinti' | 'cipai'>('jinti');
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
  const [formId, setFormId] = useState<string>('free');
  const [selectedCipai, setSelectedCipai] = useState<CipaiData | null>(null);
  const [rhymeBook, setRhymeBook] = useState<RhymeBook>(settings.rhymeBook);
  const [layout, setLayout] = useState<LayoutMode>(settings.defaultLayout);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(settings.defaultPaperStyle);
  const [fontStyle, setFontStyle] = useState<FontStyle>('none');

  // ── 格律校验 ────────────────────────────────────────────
  const [meterResult, setMeterResult] = useState<MeterCheckResult | null>(null);
  const [showHeartNote, setShowHeartNote] = useState(false);
  const [manualRhymeGroupId, setManualRhymeGroupId] = useState<string | null>(null);
  const [clearedSnapshot, setClearedSnapshot] = useState<ClearedSnapshot | null>(null);

  // ── 韵镜与光标状态 ─────────────────────────────────────
  const [rhymeHintEnabled, setRhymeHintEnabled] = useState(settings.rhymeHintEnabled ?? true);
  const [rhymeMirrorVisible, setRhymeMirrorVisible] = useState(false);
  const [rhymeMirrorRowIndex, setRhymeMirrorRowIndex] = useState(-1);
  const [caretRow, setCaretRow] = useState(-1);
  const [caretCol, setCaretCol] = useState(-1);
  const [toneReq, setToneReq] = useState<'P' | 'Z' | null>(null);

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
        setAiComment(p.aiComment || '');
        setLayout(p.layout || settings.defaultLayout);
        setPaperStyle(p.paperStyle || settings.defaultPaperStyle);
        setFontStyle(p.fontStyle || 'none');
        setRhymeBook(p.rhymeBook || settings.rhymeBook);
        setRhymeHintEnabled(settings.rhymeHintEnabled ?? true);
        const linesWithoutPunc = normalizePoemClauses(p.content || '');
        
        if (p.type === 'free' || p.type === 'sonnet') {
          setMode('free');
          setContent(p.content || '');
          if (p.type === 'sonnet' && p.sonnetType) {
            setSonnetType(p.sonnetType);
            setFormId(SONNET_FORM_MAP[p.sonnetType] || 'free');
          }
        } else {
          setMode('pro');
          if (p.type === 'cipai') {
            setProTab('cipai');
            if (p.cipaiName || p.cipaiVariantId) {
              fetch(`${import.meta.env.BASE_URL}data/cipai.json`)
                .then(r => r.json())
                .then((list: CipaiData[]) => {
                  const matched = list.find(c => c.id === p.cipaiVariantId)
                    || list.find(c => c.name === p.cipaiName || c.aliases?.includes(p.cipaiName!));
                  if (matched) {
                    setSelectedCipai(matched);
                    setProLines(clausesToProLines(linesWithoutPunc, getCipaiEditorPatterns(matched)));
                  }
                })
                .catch(() => {});
            }
          } else {
            setProTab('jinti');
            setProLines(linesWithoutPunc);
            setPoemType(p.type);
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

  // 从词牌详情页进入创作
  useEffect(() => {
    const cipaiId = searchParams.get('cipai');
    if (!cipaiId || searchParams.get('edit')) return;
    fetch(`${import.meta.env.BASE_URL}data/cipai.json`)
      .then(r => r.json())
      .then((list: CipaiData[]) => {
        const matched = list.find(c => c.id === cipaiId);
        if (!matched) return;
        const draft = getDraft(null);
        const draftCipaiId = draft?.selectedCipaiId;
        const draftClauses = Array.isArray(draft?.proLines)
          ? draft.proLines.filter((line: string) => line?.trim())
          : [];
        if (draftClauses.length && draftCipaiId && draftCipaiId !== matched.id) {
          const expectedCount = getCipaiEditorPatterns(matched).filter(pattern => pattern.length > 0).length;
          if (draftClauses.length !== expectedCount) {
            alert('新词牌句数与当前草稿不一致，已保留原词牌和草稿。请先保存当前作品后再切换。');
            return;
          }
          const confirmed = confirm('将当前草稿按新词牌重新排布。原文不会清空，是否继续？');
          if (!confirmed) return;
        }
        setMode('pro');
        setProTab('cipai');
        setSelectedCipai(matched);
        if (draftClauses.length) {
          setProLines(clausesToProLines(draftClauses, getCipaiEditorPatterns(matched)));
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // 从近体诗直达路由进入创作
  useEffect(() => {
    const variant = searchParams.get('jinti');
    if (!variant || searchParams.get('edit') || !JINTI_TEMPLATES[variant]) return;
    const parts = variant.split('_');
    if (parts.length < 4) return;
    const type = `${parts[0]}_${parts[1]}` as PoemType;
    setMode('pro');
    setProTab('jinti');
    setPoemType(type);
    setJintiStart(parts[2] as 'ping' | 'ze');
    setJintiRhyme(parts[3] as 'yes' | 'no');
  }, [searchParams]);

  // 自动恢复当前作品对应的草稿
  useEffect(() => {
    if (draftRestored.current) return;
    draftRestored.current = true;
    try {
      const draft = getDraft(searchParams.get('edit'));
      if (!draft) return;
      setMode(draft.mode === 'pro' ? 'pro' : 'free');
      setProTab(draft.proTab === 'cipai' ? 'cipai' : 'jinti');
      setProLines(Array.isArray(draft.proLines) ? draft.proLines : []);
      setTitle(draft.title || '');
      setAuthor(draft.author || settings.defaultPenName);
      setContent(draft.content || '');
      setHeartNote(draft.heartNote || '');
      if (draft.poemType) setPoemType(draft.poemType);
      if (draft.jintiStart) setJintiStart(draft.jintiStart);
      if (draft.jintiRhyme) setJintiRhyme(draft.jintiRhyme);
      if (draft.sonnetType) setSonnetType(draft.sonnetType);
      if (draft.formId) setFormId(draft.formId);
      if (draft.rhymeBook) setRhymeBook(draft.rhymeBook);
      if (draft.layout) setLayout(draft.layout);
      if (draft.paperStyle) setPaperStyle(draft.paperStyle);
      if (draft.fontStyle) setFontStyle(draft.fontStyle);
      if (draft.manualRhymeGroupId !== undefined) setManualRhymeGroupId(draft.manualRhymeGroupId);
      const draftCipaiId = draft.selectedCipaiId;
      if (draftCipaiId && !searchParams.get('cipai')) {
        fetch(`${import.meta.env.BASE_URL}data/cipai.json`)
          .then(r => r.json())
          .then((list: CipaiData[]) => {
            const matched = list.find(c => c.id === draftCipaiId);
            if (matched) {
              setSelectedCipai(matched);
              const patterns = getCipaiEditorPatterns(matched);
              setProLines(lines => lines.length === patterns.filter(pattern => pattern.length > 0).length && patterns.some(pattern => pattern.length === 0)
                ? clausesToProLines(lines, patterns)
                : lines);
            }
          })
          .catch(() => {});
      }
    } catch (_) {}
  }, [searchParams, settings.defaultPenName]);

  // 防误触/刷新丢稿
  useEffect(() => {
    if (!draftRestored.current) return;
    const persistDraft = () => {
      const hasWriting = title.trim() || content.trim() || proLines.some(line => line.trim()) || heartNote.trim();
      if (!hasWriting) return;
      saveDraft(editId, {
        editId, mode, proTab, proLines, title, author, content, heartNote, poemType,
        jintiStart, jintiRhyme, sonnetType, formId, rhymeBook,
        selectedCipaiId: selectedCipai?.id,
        layout, paperStyle, fontStyle, manualRhymeGroupId,
      });
    };
    const timer = window.setTimeout(persistDraft, 300);
    const handlePageHide = () => persistDraft();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') persistDraft();
    };
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [editId, mode, proTab, proLines, title, author, content, heartNote, poemType, jintiStart, jintiRhyme, sonnetType, formId, selectedCipai, rhymeBook, layout, paperStyle, fontStyle, manualRhymeGroupId]);

  const derivedPoemType = useMemo(() => {
    return `${poemType}_${jintiStart}_${jintiRhyme}`;
  }, [poemType, jintiStart, jintiRhyme]);

  const currentPatterns = useMemo(() => {
    let pts: string[][] = [];
    if (proTab === 'jinti') {
      const templateKey = JINTI_TEMPLATES[derivedPoemType] ? derivedPoemType : (poemType === 'jueju_5' ? 'jueju_5_ze_no' : poemType === 'jueju_7' ? 'jueju_7_ze_yes' : poemType === 'lvshi_5' ? 'lvshi_5_ze_no' : poemType === 'lvshi_7' ? 'lvshi_7_ping_yes' : 'jueju_5_ze_no');
      pts = JINTI_TEMPLATES[templateKey] || [];
    } else if (proTab === 'cipai' && selectedCipai) {
      pts = getCipaiEditorPatterns(selectedCipai);
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

  const onCellFocus = useCallback((req: 'P' | 'Z' | null) => { setToneReq(req); }, []);
  const onCaretCell = useCallback((rowIndex: number, colIndex: number) => {
    setCaretRow(rowIndex);
    setCaretCol(colIndex);
  }, []);

  useEffect(() => {
    setManualRhymeGroupId(null);
  }, [proTab, poemType, selectedCipai]);

  const anchorRhymeChar = useMemo(() => {
    if (mode === 'free') return null;
    for (let ri = 0; ri < currentPatterns.length; ri++) {
      const row = currentPatterns[ri];
      if (row.length === 0) continue;
      const lastCharIndex = row.length - 1;
      if (row[lastCharIndex] === 'R' || row[lastCharIndex] === 'r') {
        const line = proLines[ri] || '';
        const ch = [...line][lastCharIndex];
        if (ch && ch.trim()) return ch;
      }
    }
    return null;
  }, [mode, currentPatterns, proLines]);

  const usedRhymes = useMemo(() => {
    const used: string[] = [];
    if (mode === 'free') return used;
    for (let ri = 0; ri < currentPatterns.length; ri++) {
      const row = currentPatterns[ri];
      if (row.length === 0) continue;
      const lastCharIndex = row.length - 1;
      if (row[lastCharIndex] === 'R' || row[lastCharIndex] === 'r') {
        const line = proLines[ri] || '';
        const ch = [...line][lastCharIndex];
        if (ch && ch.trim()) used.push(ch);
      }
    }
    return used;
  }, [mode, currentPatterns, proLines]);

  const onCaretOnRhyme = useCallback((isOnRhyme: boolean, rowIndex: number) => {
    setRhymeMirrorVisible(isOnRhyme && rhymeHintEnabled);
    setRhymeMirrorRowIndex(rowIndex);
  }, [rhymeHintEnabled]);

  const handleRhymePick = useCallback((char: string) => {
    if (rhymeMirrorRowIndex < 0 || rhymeMirrorRowIndex >= currentPatterns.length) return;
    const row = currentPatterns[rhymeMirrorRowIndex];
    if (row.length === 0) return;
    const lastCharIndex = row.length - 1;
    const newLines = [...proLines];
    const currentLine = newLines[rhymeMirrorRowIndex] || '';
    const chars = [...currentLine];
    while (chars.length < lastCharIndex) chars.push(' ');
    chars[lastCharIndex] = char;
    newLines[rhymeMirrorRowIndex] = chars.join('').trimEnd();
    setProLines(newLines);
  }, [rhymeMirrorRowIndex, currentPatterns, proLines]);

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
        } catch (_) {}
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
          result = checkJintiShi(activeContent, derivedPoemType, rhymeBook, manualRhymeGroupId);
        } else if (selectedCipai) {
          result = checkCipai(activeContent, selectedCipai, rhymeBook, manualRhymeGroupId);
        } else return;
        setMeterResult(result);
      } catch (_) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [activeContent, mode, proTab, poemType, derivedPoemType, selectedCipai, rhymeBook, sonnetType, manualRhymeGroupId]);

  const [sonnetLineCount, setSonnetLineCount] = useState(0);
  useEffect(() => {
    setSonnetLineCount(activeContent.split('\n').filter(l => l.trim()).length);
  }, [activeContent]);

  const currentForm = useMemo(() => getForm(formId), [formId]);

  const handleAIReview = useCallback(async () => {
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
  }, [activeContent, mode, proTab, selectedCipai, poemType, sonnetType, rhymeBook]);

  const handleSave = useCallback(async () => {
    if (mode === 'pro' && proTab === 'cipai' && !selectedCipai?.id) {
      EventBus.emit('TRIGGER_BURST', { shapeType: 'starburst' });
      alert('请先选择具体词牌变体');
      return;
    }
    if (!activeContent.trim()) {
      EventBus.emit('TRIGGER_BURST', { shapeType: 'starburst' });
      alert('请先写下诗句');
      return;
    }

    if (mode === 'pro') {
      const nonSeparatorPatterns = currentPatterns.filter(p => p.length > 0);
      const typedLines = proLines.filter((l, idx) => currentPatterns[idx]?.length > 0 && l.trim().length > 0);
      
      if (typedLines.length < nonSeparatorPatterns.length) {
        EventBus.emit('TRIGGER_BURST', { shapeType: 'starburst' });
        alert('结构不完整，保存前请完整填写所有诗词行！');
        return;
      }
      
      for (let ri = 0; ri < currentPatterns.length; ri++) {
        if (currentPatterns[ri].length > 0) {
          const expectedLen = currentPatterns[ri].length;
          const actualLen = Array.from((proLines[ri] || '').trim()).length;
          if (actualLen !== expectedLen) {
            EventBus.emit('TRIGGER_BURST', { shapeType: 'starburst' });
            alert(`第 ${ri + 1} 行字数不符！应为 ${expectedLen} 字，实为 ${actualLen} 字，请调整。`);
            return;
          }
        }
      }
    }

    const form = currentForm;
    if (form.lineCount && sonnetLineCount !== form.lineCount) {
      EventBus.emit('TRIGGER_BURST', { shapeType: 'crossette' });
      const ok = confirm(`${form.name} 要求 ${form.lineCount} 行，当前 ${sonnetLineCount} 行。是否仍然保存？`);
      if (!ok) return;
    }
    if (form.charsPerLine && mode === 'free') {
      const lines = activeContent.split('\n').filter(l => l.trim());
      const bad = lines.some(l => {
        const len = Array.from(l.replace(/[，。、；：？！,.!?]/g, '')).length;
        return !checkCharsPerLine(len, form.charsPerLine);
      });
      if (bad) {
        const ok = confirm(`${form.name} 要求每行 ${formatChars(form.charsPerLine)} 字，部分行字数不符。是否仍然保存？`);
        if (!ok) return;
      }
    }

    const autoTitle = title || Array.from(activeContent.split('\n')[0]).slice(0, 12).join('').replace(/[，。]/g, '') || '无题';
    const existingPoem = editId ? getPoemById(editId) : undefined;
    const now = Date.now();
    const nextPoem = buildTypedPoem({
      id: editId || Date.now().toString(),
      title: autoTitle,
      author: author || '佚名',
      content: activeContent,
      heartNote,
      layout,
      paperStyle,
      fontStyle,
      rhymeBook,
      createdAt: existingPoem?.createdAt || now,
      aiComment: existingPoem?.aiComment || aiComment,
    }, { mode, sonnetType, formId, formName: form.name, proTab, selectedCipai, poemType, jintiVariant: derivedPoemType });

    const finalPoem = mergePoemForSave(existingPoem, nextPoem, now);
    const saveRes = await savePoem(finalPoem);
    if (!saveRes.ok) {
      EventBus.emit('TRIGGER_BURST', { shapeType: 'crossette' });
      alert(saveRes.error || '保存失败，可能因存储空间不足');
      return;
    }
    await deleteDraft(editId);

    EventBus.emit('TRIGGER_BURST', { shapeType: 'peony' });
    navigate('/works');
  }, [mode, proTab, selectedCipai, activeContent, currentPatterns, proLines, currentForm, sonnetLineCount, title, editId, author, heartNote, poemType, layout, paperStyle, fontStyle, rhymeBook, derivedPoemType, navigate]);

  const handleClear = useCallback(() => {
    setClearedSnapshot({
      title, author, content, heartNote, proLines: [...proLines],
      mode, proTab, poemType, jintiStart, jintiRhyme, sonnetType,
      formId, selectedCipai, rhymeBook, layout, paperStyle, fontStyle,
      manualRhymeGroupId,
    });
    setTitle('');
    setContent('');
    setHeartNote('');
    setProLines([]);
    setSelectedCipai(null);
    setManualRhymeGroupId(null);
    setAiComment('');
    deleteDraft(editId);
    EventBus.emit('TRIGGER_BURST', { shapeType: 'willow' });
  }, [title, author, content, heartNote, proLines, mode, proTab, poemType, jintiStart, jintiRhyme, sonnetType, formId, selectedCipai, rhymeBook, layout, paperStyle, fontStyle, manualRhymeGroupId, editId]);

  const handleRestoreClear = useCallback(() => {
    if (!clearedSnapshot) return;
    setTitle(clearedSnapshot.title || '');
    setAuthor(clearedSnapshot.author || settings.defaultPenName);
    setContent(clearedSnapshot.content || '');
    setHeartNote(clearedSnapshot.heartNote || '');
    setProLines(clearedSnapshot.proLines || []);
    setMode(clearedSnapshot.mode || 'free');
    setProTab(clearedSnapshot.proTab || 'jinti');
    setPoemType(clearedSnapshot.poemType || 'jueju_5');
    setJintiStart(clearedSnapshot.jintiStart || 'ze');
    setJintiRhyme(clearedSnapshot.jintiRhyme || 'no');
    setSonnetType(clearedSnapshot.sonnetType || 'none');
    setFormId(clearedSnapshot.formId || 'free');
    setSelectedCipai(clearedSnapshot.selectedCipai || null);
    setRhymeBook(clearedSnapshot.rhymeBook || settings.rhymeBook);
    setLayout(clearedSnapshot.layout || settings.defaultLayout);
    setPaperStyle(clearedSnapshot.paperStyle || settings.defaultPaperStyle);
    setFontStyle(clearedSnapshot.fontStyle || 'none');
    setManualRhymeGroupId(clearedSnapshot.manualRhymeGroupId || null);
    setAiComment('');
    setClearedSnapshot(null);
    EventBus.emit('TRIGGER_BURST', { shapeType: 'saturn' });
  }, [clearedSnapshot, settings]);

  const previewPoem = useMemo<Poem>(() => buildTypedPoem({
    id: editId || 'preview',
    title: title || '无题',
    author: author || '佚名',
    content: activeContent || '（诗文效果预览）',
    heartNote,
    layout,
    paperStyle,
    fontStyle,
    rhymeBook,
    createdAt: Date.now(),
  }, { mode, sonnetType, formId, formName: currentForm.name, proTab, selectedCipai, poemType, jintiVariant: derivedPoemType }), [editId, title, author, activeContent, heartNote, mode, sonnetType, formId, currentForm, proTab, selectedCipai, poemType, derivedPoemType, layout, paperStyle, fontStyle, rhymeBook]);

  // ── 子 State 分组 ──────────────────────────────────────
  const docState = useMemo<CreateDocumentState>(() => ({
    title, setTitle, author, setAuthor, content, setContent,
    heartNote, setHeartNote, proLines, setProLines, activeContent,
    showHeartNote, setShowHeartNote,
    aiComment, setAiComment,
  }), [title, author, content, heartNote, proLines, activeContent, showHeartNote, aiComment]);

  const formState = useMemo<CreateFormState>(() => ({
    mode, setMode, proTab, setProTab, poemType, setPoemType,
    jintiStart, setJintiStart, jintiRhyme, setJintiRhyme,
    sonnetType, setSonnetType, formId, setFormId, currentForm,
    selectedCipai, setSelectedCipai, rhymeBook, setRhymeBook,
    derivedPoemType, currentPatterns,
  }), [mode, proTab, poemType, jintiStart, jintiRhyme, sonnetType, formId, currentForm, selectedCipai, rhymeBook, derivedPoemType, currentPatterns]);

  const caretState = useMemo<CreateCaretState>(() => ({
    rhymeHintEnabled, setRhymeHintEnabled, rhymeMirrorVisible,
    rhymeMirrorRowIndex, anchorRhymeChar, usedRhymes, onCaretOnRhyme,
    handleRhymePick, manualRhymeGroupId, setManualRhymeGroupId,
    caretRow, caretCol, toneReq, onCellFocus, onCaretCell,
  }), [rhymeHintEnabled, rhymeMirrorVisible, rhymeMirrorRowIndex, anchorRhymeChar, usedRhymes, onCaretOnRhyme, handleRhymePick, manualRhymeGroupId, caretRow, caretCol, toneReq, onCellFocus, onCaretCell]);

  const presentationState = useMemo<CreatePresentationState>(() => ({
    layout, setLayout, paperStyle, setPaperStyle, fontStyle, setFontStyle, previewPoem,
  }), [layout, paperStyle, fontStyle, previewPoem]);

  const workflowState = useMemo<CreateWorkflowState>(() => ({
    settings, editId, setEditId, showImport, setShowImport,
    sonnetLineCount, meterResult, setMeterResult, handleSave, handleClear,
    handleRestoreClear, canRestoreClear: Boolean(clearedSnapshot),
    aiLoading, handleAIReview,
  }), [settings, editId, showImport, sonnetLineCount, meterResult, handleSave, handleClear, handleRestoreClear, clearedSnapshot, aiLoading, handleAIReview]);

  return (
    <CreateDocumentContext.Provider value={docState}>
      <CreateFormContext.Provider value={formState}>
        <CreateCaretContext.Provider value={caretState}>
          <CreatePresentationContext.Provider value={presentationState}>
            <CreateWorkflowContext.Provider value={workflowState}>
              {children}
            </CreateWorkflowContext.Provider>
          </CreatePresentationContext.Provider>
        </CreateCaretContext.Provider>
      </CreateFormContext.Provider>
    </CreateDocumentContext.Provider>
  );
};

export const useCreateDocument = () => {
  const context = useContext(CreateDocumentContext);
  if (!context) throw new Error('useCreateDocument must be used within CreateProvider');
  return context;
};

export const useCreateForm = () => {
  const context = useContext(CreateFormContext);
  if (!context) throw new Error('useCreateForm must be used within CreateProvider');
  return context;
};

export const useCreateCaret = () => {
  const context = useContext(CreateCaretContext);
  if (!context) throw new Error('useCreateCaret must be used within CreateProvider');
  return context;
};

export const useCreatePresentation = () => {
  const context = useContext(CreatePresentationContext);
  if (!context) throw new Error('useCreatePresentation must be used within CreateProvider');
  return context;
};

export const useCreateWorkflow = () => {
  const context = useContext(CreateWorkflowContext);
  if (!context) throw new Error('useCreateWorkflow must be used within CreateProvider');
  return context;
};
