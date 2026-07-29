import { PoemType, SonnetType, RhymeBook, CipaiData } from '../types';
import { checkCipai, checkJintiShi } from './meterChecker';
import { pinyin } from 'pinyin-pro';

export interface ParsedPoem {
  id: string;
  title: string;
  author: string;
  content: string;
  type: PoemType;
  sonnetType?: SonnetType;
  cipaiName?: string;
  cipaiVariantId?: string;
  jintiVariant?: string;
}

export interface CipaiResolution {
  status: 'exact' | 'ambiguous' | 'unmatched';
  variant?: CipaiData;
  cipaiName?: string;
  variantId?: string;
  rhymeBook: RhymeBook;
  clauses: string[];
  structureViolations: number;
  toneViolations: number;
  rhymeStatus: 'ok' | 'fail' | 'unverified';
  candidateIds: string[];
}

const CLAUSE_SEPARATOR = /[，。！？；、,.!?;：:\n\r]+/;

export function normalizePoemClauses(content: string): string[] {
  return content
    .split(CLAUSE_SEPARATOR)
    .map(clause => Array.from(clause).filter(char => !/\s/.test(char)).join(''))
    .filter(Boolean);
}

export function getCipaiEditorPatterns(cipai: CipaiData): string[][] {
  const upper = (cipai.upperPattern || []).map(pattern => Array.from(pattern));
  const lower = (cipai.lowerPattern || []).map(pattern => Array.from(pattern));
  return [...upper, ...(lower.length ? [[], ...lower] : [])];
}

export function clausesToProLines(content: string | string[], patterns: string[][]): string[] {
  const clauses = Array.isArray(content) ? content : normalizePoemClauses(content);
  let clauseIndex = 0;
  return patterns.map(pattern => pattern.length === 0 ? '' : (clauses[clauseIndex++] || ''));
}

// Common Cipai names for offline recognition
const COMMON_CIPAIS = [
  '凤凰台上忆吹箫', '双调·大德歌', '减字木兰花', '踏雪寻梅', '六州歌头', '八声甘州',
  '水调歌头', '念奴娇', '满江红', '沁园春', '莺啼序', '望海潮', '兰陵王', '贺新郎',
  '摸鱼儿', '雨霖铃', '声声慢', '永遇乐', '水龙吟', '江城子', '西江月', '定风波',
  '虞美人', '卜算子', '蝶恋花', '青玉案', '临江仙', '破阵子', '渔家傲', '菩萨蛮',
  '相见欢', '如梦令', '乌夜啼', '清平乐', '鹧鸪天', '鹊桥仙', '木兰花', '苏幕遮',
  '玉楼春', '渔歌子', '忆江南', '天净沙', '采桑子', '生查子', '长相思', '诉衷情',
  '点绛唇', '醉花阴', '一剪梅', '踏莎行', '南乡子', '钗头凤', '满庭芳', '扬州慢',
  '高阳台', '玉蝴蝶', '桂枝香', '暗香', '疏影', '风入松', '千秋岁', '惜红衣',
  '翠楼吟', '祝英台近', '一丛花', '八六子', '花犯', '好事近', '太常引', '阮郎归',
  '醉太平', '忆王孙', '天仙子', '霜天晓角', '朝天子', '沉醉东风', '水仙子', '山坡羊',
  '四块玉'
].sort((a, b) => b.length - a.length);

export function resolveCipaiVariant(
  content: string,
  title: string,
  cipais: CipaiData[],
  rhymeBook: RhymeBook = 'ci_lin'
): CipaiResolution {
  const clauses = normalizePoemClauses(content);
  const unmatched: CipaiResolution = {
    status: 'unmatched', rhymeBook, clauses, structureViolations: Infinity,
    toneViolations: Infinity, rhymeStatus: 'unverified', candidateIds: [],
  };
  if (clauses.length < 2 || cipais.length === 0) return unmatched;

  const namedMatches = cipais.map(cipai => {
    const matchedNames = [cipai.name, ...(cipai.aliases || [])].filter(name => title.includes(name));
    return { cipai, matchLength: Math.max(0, ...matchedNames.map(name => Array.from(name).length)) };
  }).filter(item => item.matchLength > 0);
  const longestNameLength = Math.max(0, ...namedMatches.map(item => item.matchLength));
  const named = namedMatches.filter(item => item.matchLength === longestNameLength).map(item => item.cipai);
  const candidates = named.length ? named : cipais;
  const ranked = candidates.map((cipai, index) => {
    const patterns = [...(cipai.upperPattern || []), ...(cipai.lowerPattern || [])];
    const patternLengths = patterns.map(pattern => Array.from(pattern).length);
    const clauseLengths = clauses.map(clause => Array.from(clause).length);
    const structureViolations = Math.abs(patternLengths.length - clauseLengths.length) * 12
      + patternLengths.reduce((sum, length, clauseIndex) => sum + Math.abs(length - (clauseLengths[clauseIndex] || 0)), 0);
    const meter = structureViolations === 0 ? checkCipai(clauses, cipai, rhymeBook) : null;
    const toneViolations = meter?.violationCount ?? Infinity;
    const rhymeStatus = meter?.rhymeCheckStatus || 'unverified';
    const rhymePenalty = rhymeStatus === 'fail' ? 2 : rhymeStatus === 'unverified' ? 1 : 0;
    return { cipai, index, structureViolations, toneViolations, rhymeStatus, rhymePenalty };
  }).sort((a, b) =>
    a.structureViolations - b.structureViolations
    || a.toneViolations - b.toneViolations
    || a.rhymePenalty - b.rhymePenalty
    || a.index - b.index
  );

  const structurallyExact = ranked.filter(item => item.structureViolations === 0);
  const eligible = named.length
    ? structurallyExact
    : structurallyExact.filter(item => item.toneViolations === 0 && item.rhymeStatus !== 'fail');
  const best = eligible[0] || ranked[0];
  if (!best || eligible.length === 0) {
    return {
      ...unmatched,
      cipaiName: named.length ? best?.cipai.name : undefined,
      structureViolations: best?.structureViolations ?? Infinity,
      toneViolations: best?.toneViolations ?? Infinity,
      rhymeStatus: best?.rhymeStatus || 'unverified',
      candidateIds: ranked.slice(0, 8).flatMap(item => item.cipai.id ? [item.cipai.id] : []),
    };
  }

  const tied = eligible.filter(item =>
    item.structureViolations === best.structureViolations
    && item.toneViolations === best.toneViolations
    && item.rhymePenalty === best.rhymePenalty
  );
  const status = tied.length === 1 ? 'exact' : 'ambiguous';
  return {
    status,
    variant: status === 'exact' ? best.cipai : undefined,
    cipaiName: best.cipai.name,
    variantId: status === 'exact' ? best.cipai.id : undefined,
    rhymeBook,
    clauses,
    structureViolations: best.structureViolations,
    toneViolations: best.toneViolations,
    rhymeStatus: best.rhymeStatus,
    candidateIds: tied.flatMap(item => item.cipai.id ? [item.cipai.id] : []),
  };
}

export function findBestCipaiVariant(content: string, title: string, cipais: CipaiData[], rhymeBook: RhymeBook = 'ci_lin'): CipaiData | undefined {
  const resolution = resolveCipaiVariant(content, title, cipais, rhymeBook);
  return resolution.status === 'exact' ? resolution.variant : undefined;
}

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
  const clauses = normalizePoemClauses(content);
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

  // 标题中的词牌名是用户给出的最强信号，应优先于正文句长判断。
  // 正文首行只在明确使用“词牌·题目”或“词牌 题目”格式时参与判断，
  // 避免普通诗句偶然包含词牌名而误分类。
  const titleCipai = COMMON_CIPAIS.find(name => title.includes(name));
  const firstLineCipai = COMMON_CIPAIS.find(name => {
    const first = lines[0] || '';
    return first === name || first.startsWith(`${name}·`) || first.startsWith(`${name} `);
  });
  const foundCipai = titleCipai || firstLineCipai;
  if (foundCipai) return { type: 'cipai', cipaiName: foundCipai };

  // Split by punctuation to support different line structures
  const clauses = normalizePoemClauses(content);
  const clauseCount = clauses.length;
  const isUniform5 = clauseCount > 0 && clauses.every(c => Array.from(c).length === 5);
  const isUniform7 = clauseCount > 0 && clauses.every(c => Array.from(c).length === 7);

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
      const clauses = normalizePoemClauses(contentText);
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
