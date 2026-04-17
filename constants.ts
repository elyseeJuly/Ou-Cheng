import { TemplateRule } from './types';

export const APP_SLOGAN = "佳句本天成，妙手偶得之";

export const TEMPLATES: Record<string, TemplateRule> = {
  jueju_5: {
    name: "五言绝句",
    description: "四句，每句五字。平仄严谨。",
    structure: ["○○●●○", "●●●○○", "●●○○●", "○○●●○"],
    charCountPerLine: 5
  },
  jueju_7: {
    name: "七言绝句",
    description: "四句，每句七字。气象开阔。",
    structure: ["●●○○●●○", "○○●●●○○", "○○●●○○●", "●●○○●●○"],
    charCountPerLine: 7
  },
  lvshi_5: {
    name: "五言律诗",
    description: "八句，每句五字。对仗工整。",
    structure: ["...", "...", "...", "...", "...", "...", "...", "..."],
    charCountPerLine: 5
  },
  lvshi_7: {
    name: "七言律诗",
    description: "八句，每句七字。起承转合。",
    structure: ["...", "...", "...", "...", "...", "...", "...", "..."],
    charCountPerLine: 7
  },
  sonnet: {
    name: "十四行诗",
    description: "西风东渐，十四行结构。",
    structure: ["ABAB", "CDCD", "EFEF", "GG"],
  }
};

export const MOCK_CLASSICS = [
  { title: "静夜思", author: "李白", dynasty: "唐代", content: "床前明月光\n疑是地上霜\n举头望明月\n低头思故乡" },
  { title: "春晓", author: "孟浩然", dynasty: "唐代", content: "春眠不觉晓\n处处闻啼鸟\n夜来风雨声\n花落知多少" },
  { title: "江雪", author: "柳宗元", dynasty: "唐代", content: "千山鸟飞绝\n万径人踪灭\n孤舟蓑笠翁\n独钓寒江雪" },
  { title: "登鹳雀楼", author: "王之涣", dynasty: "唐代", content: "白日依山尽\n黄河入海流\n欲穷千里目\n更上一层楼" },
];

export const BACKGROUND_STYLES = {
  paper: "bg-[#fdfbf7] text-stone-900", // Xuan Paper
  gold: "bg-[#f5e6ca] text-stone-900", // Sprinkled Gold (simulated)
  silk: "bg-[#eaddcf] text-stone-800", // Silk
  dark: "bg-stone-900 text-stone-200", // Ink mode
};

export const FONT_STYLES: Record<string, { label: string, family: string }> = {
  none: { label: '系统默认', family: 'var(--font-serif)' },
  lxgw_wenkai: { label: '霞鹜文楷', family: '"LXGW WenKai Lite", var(--font-serif)' },
  noto_serif: { label: '思源宋体', family: '"Noto Serif SC", var(--font-serif)' },
  zhi_mang_xing: { label: '志莽行书', family: '"Zhi Mang Xing", cursive' },
  long_cang: { label: '龙藏行书', family: '"Long Cang", cursive' },
  ma_shan_zheng: { label: '马善政楷', family: '"Ma Shan Zheng", "LXGW WenKai Lite", var(--font-serif)' }
};
