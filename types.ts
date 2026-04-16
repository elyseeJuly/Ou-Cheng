// ============================================================
// 偶成 (Ou Cheng) v4.0 — 全局类型定义
// ============================================================

export type LayoutMode = 'vertical' | 'horizontal';
export type HorizontalSubMode = 'modern' | 'letter'; // 传统书信式
export type PoemType = 'free' | 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7' | 'cipai' | 'sonnet';
export type SonnetType = 'shakespeare' | 'petrarchan' | 'chinese_modern' | 'none';
export type RhymeBook = 'ci_lin' | 'ping_shui' | 'xin_yun';
export type PaperStyle = 'xuan' | 'meihua' | 'yunwen' | 'zhu' | 'lianhua';
export type ImageSize = '1K' | '2K' | '4K';
export type ExportFormat = 'png' | 'jpg';
export type ExportScale = 1 | 2 | 4;
export type CipaiCategory = 'xiao_ling' | 'zhong_diao' | 'chang_diao'; // 小令/中调/长调
export type Dynasty = 'all' | 'shijing' | 'han' | 'wei_jin' | 'tang' | 'song' | 'yuan' | 'ming' | 'qing';
export type Genre = 'all' | 'shi' | 'ci' | 'qu' | 'fu' | 'yuefu';
export type FontStyle = 'lxgw_wenkai' | 'noto_serif' | 'ma_shan_zheng' | 'zhi_mang_xing' | 'long_cang' | 'none';

// ============================================================
// 诗词作品
// ============================================================
export interface Poem {
  id: string;
  title: string;           // 截取首句前12字自动生成，或手动输入
  author: string;          // 笔名
  content: string;         // 诗词正文
  heartNote: string;       // 创作心声
  type: PoemType;
  sonnetType?: SonnetType; // 十四行诗子体例
  cipaiName?: string;      // 词牌名（type=cipai时）
  layout: LayoutMode;
  horizontalSubMode?: HorizontalSubMode;
  paperStyle: PaperStyle;
  rhymeBook: RhymeBook;
  sealId?: string;         // 图章 ID
  createdAt: number;
  aiComment?: string;
  backgroundImage?: string; // 保留旧字段兼容
  fontStyle?: FontStyle;
}

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
  apiKey?: string;         // 私有大模型 API Key（本地加密存储）
  apiBaseUrl?: string;     // 自定义 API 地址
  globalFont?: FontStyle;
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
  name: string;
  aliases?: string[];
  charCount: number;        // 总字数
  category: CipaiCategory;
  upperPattern: string[];   // 上阕格律点阵（'P'=平,'Z'=仄,'R'=韵,'X'=可平可仄）
  lowerPattern?: string[];  // 下阕（单调词牌无此字段）
  representative?: string;  // 代表词人
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
}

export interface MeterCheckResult {
  lines: LineResult[];
  summary: string;
  isValid: boolean;
  violationCount: number;
}

// ============================================================
// 3D 词云意象
// ============================================================
export interface ImageryItem {
  word: string;
  frequency: number;   // 历史词频（用于字号）
  dynasty?: string;    // 主要出现朝代
  samplePoems?: string[]; // 含该意象的诗词 ID 或标题
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
