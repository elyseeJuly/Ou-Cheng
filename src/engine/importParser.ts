import { PoemType, SonnetType, RhymeBook } from '../types';
import { checkJintiShi } from './meterChecker';
import { pinyin } from 'pinyin-pro';

export interface ParsedPoem {
  id: string;
  title: string;
  author: string;
  content: string;
  type: PoemType;
  sonnetType?: SonnetType;
  cipaiName?: string;
  jintiVariant?: string;
}

// Common Cipai names for offline recognition
const COMMON_CIPAIS = [
  '浣溪沙', '江城子', '西江月', '定风波', '虞美人', '卜算子', '蝶恋花', '雨霖铃', 
  '水调歌头', '念奴娇', '声声慢', '青玉案', '临江仙', '破阵子', '渔家傲', '菩萨蛮', 
  '相见欢', '如梦令', '乌夜啼', '忆秦娥', '清平乐', '鹧鸪天', '浪淘沙', '鹊桥仙', 
  '木兰花', '苏幕遮', '玉楼春', '满江红', '水龙吟', '望海潮', '八声甘州', '沁园春'
];

// Helper to auto-detect Jinti Shi variant with minimum violations
export function autoDetectJintiVariant(
  content: string,
  type: 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7',
  rhymeBook: RhymeBook
): string {
  let bestVariant = '';
  let minViolations = Infinity;

  const variantsMap: Record<string, string[]> = {
    jueju_5: ['jueju_5_ze_no', 'jueju_5_ze_yes', 'jueju_5_ping_no', 'jueju_5_ping_yes'],
    jueju_7: ['jueju_7_ze_no', 'jueju_7_ze_yes', 'jueju_7_ping_no', 'jueju_7_ping_yes'],
    lvshi_5: ['lvshi_5_ze_no', 'lvshi_5_ze_yes', 'lvshi_5_ping_no', 'lvshi_5_ping_yes'],
    lvshi_7: ['lvshi_7_ze_no', 'lvshi_7_ze_yes', 'lvshi_7_ping_no', 'lvshi_7_ping_yes'],
  };

  const candidateVariants = variantsMap[type] || [];
  
  // Clean content to match checkJintiShi line format expectations
  const clauses = content.split(/[，。、；？！\n\r]+/).map(l => l.trim()).filter(Boolean);
  const cleanContent = clauses.join('\n');

  for (const variant of candidateVariants) {
    const checkResult = checkJintiShi(cleanContent, variant, rhymeBook);
    if (checkResult.violationCount < minViolations) {
      minViolations = checkResult.violationCount;
      bestVariant = variant;
    }
  }

  return bestVariant || candidateVariants[0];
}

// Local rules for detecting poem type
export function localDetectPoemType(
  content: string,
  title: string,
  rhymeBook: RhymeBook = 'ci_lin'
): { 
  type: PoemType; 
  sonnetType?: SonnetType; 
  cipaiName?: string; 
  jintiVariant?: string; 
} {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const lineCount = lines.length;
  if (lineCount === 0) return { type: 'free' };

  // Check English sonnet:
  const plainText = content.replace(/\s+/g, '');
  const englishCharCount = (plainText.match(/[a-zA-Z]/g) || []).length;
  const isEnglish = plainText.length > 0 && (englishCharCount / plainText.length) > 0.5;

  if (isEnglish) {
    if (lineCount === 14) {
      return { type: 'sonnet', sonnetType: 'shakespeare' };
    }
    return { type: 'free' };
  }

  // Split by punctuation to support different line structures
  const clauses = content.split(/[，。、；？！\n\r]+/).map(l => l.trim()).filter(Boolean);
  const clauseCount = clauses.length;
  const isUniform5 = clauseCount > 0 && clauses.every(c => c.length === 5);
  const isUniform7 = clauseCount > 0 && clauses.every(c => c.length === 7);

  if (isUniform5) {
    if (clauseCount === 4) {
      const v = autoDetectJintiVariant(content, 'jueju_5', rhymeBook);
      return { type: 'jueju_5', jintiVariant: v };
    }
    if (clauseCount === 8) {
      const v = autoDetectJintiVariant(content, 'lvshi_5', rhymeBook);
      return { type: 'lvshi_5', jintiVariant: v };
    }
  }

  if (isUniform7) {
    if (clauseCount === 4) {
      const v = autoDetectJintiVariant(content, 'jueju_7', rhymeBook);
      return { type: 'jueju_7', jintiVariant: v };
    }
    if (clauseCount === 8) {
      const v = autoDetectJintiVariant(content, 'lvshi_7', rhymeBook);
      return { type: 'lvshi_7', jintiVariant: v };
    }
  }

  // Check if title or first line matches a known Cipai.
  let foundCipai = '';
  for (const name of COMMON_CIPAIS) {
    if (title.includes(name) || (lines[0] && lines[0].includes(name))) {
      foundCipai = name;
      break;
    }
  }

  if (foundCipai) {
    return { type: 'cipai', cipaiName: foundCipai };
  }

  return { type: 'free' };
}

// Local rules for splitting bulk text into multiple poems
export function localParseManuscript(
  text: string,
  defaultAuthor: string,
  rhymeBook: RhymeBook = 'ci_lin'
): ParsedPoem[] {
  const rawBlocks = text.split(/\r?\n\s*\r?\n+/).map(b => b.trim()).filter(Boolean);
  const parsedPoems: ParsedPoem[] = [];
  
  for (const block of rawBlocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    
    let title = '';
    let author = defaultAuthor;
    let contentLines: string[] = [];
    
    let lineIdx = 0;
    const firstLine = lines[0];
    const hasBookTitleBrackets = /^《.*》$/.test(firstLine);
    
    if (hasBookTitleBrackets) {
      title = firstLine.slice(1, -1);
      lineIdx++;
      
      if (lineIdx < lines.length) {
        const secondLine = lines[lineIdx];
        if (/^(作者[:：]|by\s+|（.*）)/i.test(secondLine) || secondLine.length < 6) {
          author = secondLine.replace(/^(作者[:：]|by\s+|（|）)/ig, '').trim();
          lineIdx++;
        }
      }
    } else {
      if (lines.length > 1 && firstLine.length < 15) {
        title = firstLine;
        lineIdx++;
        
        if (lineIdx < lines.length) {
          const secondLine = lines[lineIdx];
          if (/^(作者[:：]|by\s+|（.*）)/i.test(secondLine) || (secondLine.length < 6 && lines.length > 2)) {
            author = secondLine.replace(/^(作者[:：]|by\s+|（|）)/ig, '').trim();
            lineIdx++;
          }
        }
      }
    }
    
    contentLines = lines.slice(lineIdx);
    if (contentLines.length === 0) {
      contentLines = lines;
      title = '';
      author = defaultAuthor;
    }
    
    const contentText = contentLines.join('\n');
    if (!title) {
      const firstContent = contentLines[0] || '';
      title = firstContent.slice(0, 12).replace(/[，。、；？！]/g, '') || '无题';
    }
    
    const result = localDetectPoemType(contentText, title, rhymeBook);
    
    // Normalize content: if jueju/lvshi, format as 4/8 lines
    let normalizedContent = contentText;
    if (result.type.startsWith('jueju') || result.type.startsWith('lvshi')) {
      const clauses = contentText.split(/[，。、；？！\n\r]+/).map(l => l.trim()).filter(Boolean);
      normalizedContent = clauses.join('\n');
    }

    parsedPoems.push({
      id: Math.random().toString(36).substr(2, 9),
      title,
      author: author || defaultAuthor,
      content: normalizedContent,
      type: result.type,
      sonnetType: result.sonnetType,
      cipaiName: result.cipaiName,
      jintiVariant: result.jintiVariant
    });
  }
  
  return parsedPoems;
}
