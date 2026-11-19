// ============================================================
// 偶成 (Ou Cheng) v5.1 — 全局类型定义
// ============================================================

export type LayoutMode = 'vertical' | 'horizontal';
export type HorizontalSubMode = 'modern' | 'letter'; // 传统书信式
export type PoemType = 'free' | 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7' | 'cipai' | 'sonnet';
export type SonnetType = 'shakespeare' | 'petrarchan' | 'chinese_modern' | 'none';
export type RhymeBook = 'ci_lin' | 'ping_shui' | 'xin_yun';
export type PaperStyle = 'xuan' | 'meihua' | 'yunwen' | 'zhu' | 'lianhua';
export type ExportFormat = 'png' | 'jpg';
export type ExportScale = 1 | 2 | 4;
export type CipaiCategory = 'xiao_ling' | 'zhong_diao' | 'chang_diao'; // 小令/中调/长调
export type Dynasty = 'all' | 'shijing' | 'han' | 'wei_jin' | 'tang' | 'song' | 'yuan' | 'ming' | 'qing';
export type Genre = 'all' | 'shi' | 'ci' | 'qu' | 'fu' | 'yuefu';
export type FontStyle = 'lxgw_wenkai' | 'noto_serif' | 'ma_shan_zheng' | 'none';

// 体例系统类型从 poemForms.ts 导入并重新导出（规范要求接口定义在 poemForms.ts）
export type { PoemForm } from './data/poemForms';

// ============================================================
// 诗词作品
// ============================================================
export interface PoemBase {
  id: string;
  title: string;           // 截取首句前12字自动生成，或手动输入
  author: string;          // 笔名
  content: string;         // 诗词正文
  heartNote: string;       // 创作心声
  layout: LayoutMode;
  horizontalSubMode?: HorizontalSubMode;
  paperStyle: PaperStyle;
  rhymeBook: RhymeBook;
  sealId?: string;         // 图章 ID
  createdAt: number;
  updatedAt?: number;
  favorite?: boolean;
  draft?: boolean;
  backgroundImage?: string; // 保留旧字段兼容
  fontStyle?: FontStyle;
  collectionName?: string; // 所属文集
  aiComment?: string;      // AI 点评结论（Option B 留存）
}

export interface FreePoem extends PoemBase {
  type: 'free';
  formId?: string;         // 体例 id（新体例系统，自由模式使用）
  formName?: string;       // 冗余存储体例名，防自定义体例删除后丢失
}

export interface SonnetPoem extends PoemBase {
  type: 'sonnet';
  sonnetType: Exclude<SonnetType, 'none'>; // 十四行诗子体例
  formId?: string;
  formName?: string;
}

export interface JintiPoem extends PoemBase {
  type: 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7';
  jintiVariant?: string;   // 近体诗细分变体（如 "ze_no" 等）
}

export interface CipaiPoem extends PoemBase {
  type: 'cipai';
  cipaiName: string;      // 词牌名
  cipaiVariantId: string; // 词牌变体 id
}

export type Poem = FreePoem | SonnetPoem | JintiPoem | CipaiPoem;

// ============================================================
// 用户设置
// ============================================================
export interface UserSettings {
  penNames: string[];
  defaultPenName: string;
  rhymeBook: RhymeBook;
  defaultPaperStyle: PaperStyle;
  defaultLayout: LayoutMode;
  defaultSealId?: string;
  globalFont?: FontStyle;
  rhymeHintEnabled?: boolean;  // 韵镜开关
  theme?: 'day' | 'night' | 'auto';  // 主题模式
  hapticsEnabled?: boolean;          // 触觉反馈开关
  beatTickHapticsEnabled?: boolean;  // 节奏拍点触觉开关
  apiKey?: string;         // 私有大模型 API Key（本地存储，Option B 留存）
  apiBaseUrl?: string;     // 自定义 API 地址（Option B 留存）
  apiModel?: string;       // 自定义大模型名称（Option B 留存）
}

// ============================================================
// 图章
// ============================================================
export type SealStyle = 'yang_yuan' | 'yin_fang' | 'jiudie' | 'niaochen' | 'guyuan';
// 阳文圆形 | 阴文方形 | 九叠篆 | 鸟虫篆 | 仿古圆角

export interface Seal {
  id: string;
  name: string;            // 通常对应笔名
  style: SealStyle;
  dataUrl: string;         // Canvas 生成的 Base64 或用户上传
  isCustom: boolean;       // true = 用户上传
  createdAt: number;
}

// ============================================================
// 词牌
// ============================================================
export interface CipaiData {
  id?: string;
  name: string;
  aliases?: string[];
  charCount: number;        // 总字数
  category: CipaiCategory;
  upperPattern: string[];   // 上阕格律点阵（'P'=平,'Z'=仄,'R'=韵,'X'=可平可仄）
  lowerPattern?: string[];  // 下阕（单调词牌无此字段）
  stanzas?: string[][];     // 完整分片；三叠、四叠不再压扁成“双调”
  stanzaCount?: number;
  rhymeGroups?: (string | null)[]; // 每句韵脚所属换韵组；非韵句为 null
  rhymeTones?: (('P' | 'Z') | null)[]; // 每句韵脚应为平声或仄声
  representative?: string;  // 代表词人
  variantLabel?: string;    // 正体 / 又一体序号
  isVariant?: boolean;
  sourceAuthor?: string;
  sourceIncipit?: string;
  sourceText?: string;
  sourceBook?: string;
  sourceRef?: string;
  description?: string;
}

// ============================================================
// 格律校验结果
// ============================================================
export type CharStatus = 'ok' | 'warn' | 'error' | 'neutral' | 'rhyme';

export interface CharResult {
  char: string;
  status: CharStatus;
  expected?: string;  // 期望平仄
  actual?: string;    // 实际读音
  tooltip?: string;
}

export interface LineResult {
  lineIndex: number;
  chars: CharResult[];
  isVolta?: boolean;  // 十四行诗 Volta（第9行）
  rhymeLabel?: string; // 十四行诗：该行在韵式中的字母（A/B/C…）
  note?: string;       // 十四行诗：音节数 / 字数
}

export interface CoupletParallelism {
  isToneAligned: boolean;
  verificationStatus: 'verified' | 'unverified';
  score: number; // 0 - 100
  opposingToneRate: number; // 0 - 1
  duplicateChars: string[];
  unknownPositions: number[];
  summary: string;
}

export interface ParallelismResult {
  hanLian?: CoupletParallelism; // 颔联 (第3、4句)
  jingLian?: CoupletParallelism; // 颈联 (第5、6句)
}

export interface MeterCheckResult {
  lines: LineResult[];
  summary: string;
  isValid: boolean;
  violationCount: number;
  unknownCount?: number;
  verificationStatus?: 'verified' | 'unverified' | 'ambiguous';
  rhymeCheckStatus?: 'ok' | 'fail' | 'unverified';
  matchedTemplate?: string;
  parallelism?: ParallelismResult;
}

// ============================================================
// 3D 词云意象
// ============================================================
export interface ImageryItem {
  word: string;
  frequency: number;   // 历史词频（用于字号）
  dynasty?: string;    // 主要出现朝代
  samplePoems?: string[]; // 含该意象的诗词 ID 或标题
  relatedWords?: { word: string; strength: number }[]; // 关联意象及共现强度
  sampleLines?: string[];   // 含该意象的最佳例句
  category?: string;        // 所属类目
  tone?: string;            // 该词逐字平仄
}

// ============================================================
// 古典诗词（典籍库）
// ============================================================
export interface ClassicPoem {
  id?: string;
  title: string;
  author: string;
  content: string;
  dynasty?: string;
  genre?: string;
  category?: string;
}

// ============================================================
// AI 对话
// ============================================================
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// ============================================================
// 旧兼容
// ============================================================
export interface TemplateRule {
  name: string;
  description: string;
  structure: string[];
  charCountPerLine?: number;
}

// ============================================================
// V2 全量备份包
// ============================================================
export interface OuchengBackupV2 {
  schemaVersion: 2;
  exportedAt: number;
  poems: Poem[];
  settings: UserSettings;
  seals: Seal[];
  customForms: import('./data/poemForms').PoemForm[];
  pouch: import('./stores/pouchStore').PouchItem[];
  drafts?: Array<{ key: string; data: CreateDraft }>;
}

export interface CreateDraft {
  editId?: string | null;
  mode?: 'free' | 'pro';
  proTab?: 'jinti' | 'cipai';
  proLines?: string[];
  title?: string;
  author?: string;
  content?: string;
  heartNote?: string;
  poemType?: PoemType;
  jintiStart?: 'ping' | 'ze';
  jintiRhyme?: 'yes' | 'no';
  sonnetType?: SonnetType;
  formId?: string;
  rhymeBook?: RhymeBook;
  selectedCipaiId?: string;
  layout?: LayoutMode;
  paperStyle?: PaperStyle;
  fontStyle?: FontStyle;
  manualRhymeGroupId?: string | null;
  aiComment?: string;          // AI 点评（Option B 留存）
}
