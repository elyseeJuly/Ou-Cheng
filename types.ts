export type LayoutMode = 'horizontal' | 'vertical';
export type PoemType = 'free' | 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7' | 'cipai' | 'sonnet';
export type ImageSize = '1K' | '2K' | '4K';

export interface Poem {
  id: string;
  title: string;
  author: string; // Pen name
  content: string; // The poem text
  notes: string; // "Xin Sheng" - thoughts/context
  type: PoemType;
  layout: LayoutMode;
  backgroundTheme: string; // 'paper', 'silk', 'gold'
  createdAt: number;
  aiComment?: string;
  backgroundImage?: string; // For AI generated backgrounds
}

export interface UserSettings {
  penNames: string[];
  defaultPenName: string;
  rhymeScheme: 'ci_lin_zheng_yun' | 'zhong_hua_xin_yun';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface TemplateRule {
  name: string;
  description: string;
  structure: string[]; // Simplistic visual guide
  charCountPerLine?: number;
}
