import { PoemType, SonnetType, RhymeBook, CipaiData } from '../types';
import { checkCipai, checkJintiShi, multiToneStrain } from './meterChecker';
import { pinyin } from 'pinyin-pro';
import { getCipaiPatterns, getCipaiStanzas } from './cipaiPatterns';
import { alignClausesWithCost, splitProsodyClauses } from './couyunProsody';

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
  /** 词序 / 小序：正文前的散文说明，导入后存入「心声」 */
  preface?: string;
  /** 文末附注、落款、译文赏析等 */
  notes?: string;
  /** self：作者自注 / 后记 / 落款，默认随心声导入；reference：译文、赏析等资料，默认不导入 */
  notesKind?: 'self' | 'reference';
  /** 稿中标明的韵书（如「（新韵）」） */
  rhymeBook?: RhymeBook;
  /** 未写词牌名，但句式与某词牌全合时的猜测 */
  cipaiGuess?: string;
  /** 句式是绝句 / 律诗、但平仄不全合（如古绝）时的提示 */
  formGuess?: { type: 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7'; variant: string; violations: number };
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
  /** 未能唯一匹配时，句式全合、平仄出入最少的一体，供用户一键采用 */
  suggestedId?: string;
}

export function normalizePoemClauses(content: string): string[] {
  return splitProsodyClauses(content);
}

export function getCipaiEditorPatterns(cipai: CipaiData): string[][] {
  return getCipaiStanzas(cipai).flatMap((stanza, index) => [
    ...(index > 0 ? [[]] : []),
    ...stanza.map(pattern => Array.from(pattern)),
  ]);
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

  const normalizedTitle = title.trim().replace(/^《|》$/g, '');
  const titleNames = normalizedTitle.split(/\s+/).filter(Boolean);
  const hasNamedPrefix = (name: string) => titleNames.some(part =>
    part === name || part.startsWith(`${name}·`) || part.startsWith(`${name}・`)
      || part.startsWith(`${name} `) || part.startsWith(`${name}：`) || part.startsWith(`${name}:`)
  );
  const namedMatches = cipais.map(cipai => {
    const matchedNames = [cipai.name, ...(cipai.aliases || [])].filter(hasNamedPrefix);
    return { cipai, matchLength: Math.max(0, ...matchedNames.map(name => Array.from(name).length)) };
  }).filter(item => item.matchLength > 0);
  const longestNameLength = Math.max(0, ...namedMatches.map(item => item.matchLength));
  const named = namedMatches.filter(item => item.matchLength === longestNameLength).map(item => item.cipai);
  const candidates = named.length ? named : cipais;
  const ranked = candidates.map((cipai, index) => {
    const patterns = getCipaiPatterns(cipai);
    const patternLengths = patterns.map(pattern => Array.from(pattern).length);
    const alignment = alignClausesWithCost(clauses, patternLengths);
    const aligned = alignment?.clauses ?? null;
    const alignCost = alignment?.cost ?? 0;
    const clauseLengths = (aligned || clauses).map(clause => Array.from(clause).length);
    const structureViolations = Math.abs(patternLengths.length - clauseLengths.length) * 12
      + patternLengths.reduce((sum, length, clauseIndex) => sum + Math.abs(length - (clauseLengths[clauseIndex] || 0)), 0);
    const meter = structureViolations === 0 ? checkCipai(aligned || clauses, cipai, rhymeBook) : null;
    const toneViolations = meter?.violationCount ?? Infinity;
    const rhymeStatus = meter?.rhymeCheckStatus || 'unverified';
    const rhymePenalty = rhymeStatus === 'fail' ? 2 : rhymeStatus === 'unverified' ? 1 : 0;
    return { cipai, index, aligned, alignCost, structureViolations, toneViolations, rhymeStatus, rhymePenalty, meterValid: meter?.isValid === true };
  }).sort((a, b) =>
    a.structureViolations - b.structureViolations
    || a.toneViolations - b.toneViolations
    || a.rhymePenalty - b.rhymePenalty
    || a.alignCost - b.alignCost
    || a.index - b.index
  );

  const structurallyExact = ranked.filter(item => item.structureViolations === 0);
  // A title match narrows the candidate set but never overrides a failed meter check.
  const eligible = structurallyExact.filter(item => item.meterValid);
  const best = eligible[0] || ranked[0];
  if (!best || eligible.length === 0) {
    return {
      ...unmatched,
      cipaiName: named.length ? best?.cipai.name : undefined,
      structureViolations: best?.structureViolations ?? Infinity,
      toneViolations: best?.toneViolations ?? Infinity,
      rhymeStatus: best?.rhymeStatus || 'unverified',
      candidateIds: ranked.slice(0, 8).flatMap(item => item.cipai.id ? [item.cipai.id] : []),
      suggestedId: named.length && best && best.structureViolations === 0 && Number.isFinite(best.toneViolations)
        ? best.cipai.id : undefined,
    };
  }

  const tied = eligible.filter(item =>
    item.structureViolations === best.structureViolations
    && item.toneViolations === best.toneViolations
    && item.rhymePenalty === best.rhymePenalty
    && item.alignCost === best.alignCost
  );
  const status = tied.length === 1 ? 'exact' : 'ambiguous';
  return {
    status,
    variant: status === 'exact' ? best.cipai : undefined,
    cipaiName: best.cipai.name,
    variantId: status === 'exact' ? best.cipai.id : undefined,
    rhymeBook,
    clauses: status === 'exact' && best.aligned ? best.aligned : clauses,
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
  return resolveJintiVariant(content, type, rhymeBook).variant;
}

export interface JintiResolution {
  status: 'exact' | 'ambiguous' | 'unmatched';
  variant: string;
  violationCount: number;
  unknownCount: number;
}

export function resolveJintiVariant(
  content: string,
  type: 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7',
  rhymeBook: RhymeBook
): JintiResolution {
  const variantsMap: Record<string, string[]> = {
    jueju_5: ['jueju_5_ze_no', 'jueju_5_ze_yes', 'jueju_5_ping_no', 'jueju_5_ping_yes'],
    jueju_7: ['jueju_7_ze_no', 'jueju_7_ze_yes', 'jueju_7_ping_no', 'jueju_7_ping_yes'],
    lvshi_5: ['lvshi_5_ze_no', 'lvshi_5_ze_yes', 'lvshi_5_ping_no', 'lvshi_5_ping_yes'],
    lvshi_7: ['lvshi_7_ze_no', 'lvshi_7_ze_yes', 'lvshi_7_ping_no', 'lvshi_7_ping_yes'],
  };

  const candidateVariants = variantsMap[type] || [];
  const clauses = normalizePoemClauses(content);
  const cleanContent = clauses.join('\n');
  const ranked = candidateVariants.map((variant, index) => {
    const result = checkJintiShi(cleanContent, variant, rhymeBook);
    return { variant, index, result };
  }).sort((left, right) => Number(right.result.isValid) - Number(left.result.isValid)
    || left.result.violationCount - right.result.violationCount
    || (left.result.unknownCount || 0) - (right.result.unknownCount || 0)
    || (left.result.rhymeCheckStatus === 'ok' ? -1 : 0) - (right.result.rhymeCheckStatus === 'ok' ? -1 : 0)
    || multiToneStrain(left.result) - multiToneStrain(right.result)
    || left.index - right.index);
  const best = ranked[0];
  const fallback = candidateVariants[0] || '';
  if (!best) return { status: 'unmatched', variant: fallback, violationCount: Infinity, unknownCount: 0 };
  const tied = ranked.filter(item => item.result.isValid === best.result.isValid
    && item.result.violationCount === best.result.violationCount
    && (item.result.unknownCount || 0) === (best.result.unknownCount || 0)
    && item.result.rhymeCheckStatus === best.result.rhymeCheckStatus
    && multiToneStrain(item.result) === multiToneStrain(best.result));
  return {
    status: best.result.isValid ? (tied.length === 1 ? 'exact' : 'ambiguous') : 'unmatched',
    variant: best.variant,
    violationCount: best.result.violationCount,
    unknownCount: best.result.unknownCount || 0,
  };
}

// Local rules for detecting poem type
export function localDetectPoemType(
  content: string,
  title: string,
  rhymeBook: RhymeBook = 'ci_lin',
  cipais: CipaiData[] = []
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
  const knownCipais = cipais.length
    ? cipais.flatMap(cipai => [cipai.name, ...(cipai.aliases || [])].map(name => ({ name, canonical: cipai.name })))
    : COMMON_CIPAIS.map(name => ({ name, canonical: name }));
  knownCipais.sort((left, right) => Array.from(right.name).length - Array.from(left.name).length);
  const hasCipaiPrefix = (text: string, name: string) => text === name
    || text.startsWith(`${name}·`) || text.startsWith(`${name}・`)
    || text.startsWith(`${name} `) || text.startsWith(`${name}：`) || text.startsWith(`${name}:`);
  const titleCipai = knownCipais.find(item => hasCipaiPrefix(title.trim().replace(/^《|》$/g, ''), item.name));
  const firstLineCipai = knownCipais.find(item => {
    const first = lines[0] || '';
    return hasCipaiPrefix(first, item.name);
  });
  const foundCipai = titleCipai || firstLineCipai;
  if (foundCipai) return { type: 'cipai', cipaiName: foundCipai.canonical };

  // Split by punctuation to support different line structures
  const clauses = normalizePoemClauses(content);
  const clauseCount = clauses.length;
  const isUniform5 = clauseCount > 0 && clauses.every(c => Array.from(c).length === 5);
  const isUniform7 = clauseCount > 0 && clauses.every(c => Array.from(c).length === 7);

  if (isUniform5) {
    if (clauseCount === 4) {
      const result = resolveJintiVariant(content, 'jueju_5', rhymeBook);
      if (result.status === 'exact' || (result.violationCount <= 1 && result.unknownCount === 0)) {
        return { type: 'jueju_5', jintiVariant: result.variant };
      }
    }
    if (clauseCount === 8) {
      const result = resolveJintiVariant(content, 'lvshi_5', rhymeBook);
      if (result.status === 'exact' || (result.violationCount <= 1 && result.unknownCount === 0)) {
        return { type: 'lvshi_5', jintiVariant: result.variant };
      }
    }
  }

  if (isUniform7) {
    if (clauseCount === 4) {
      const result = resolveJintiVariant(content, 'jueju_7', rhymeBook);
      if (result.status === 'exact' || (result.violationCount <= 1 && result.unknownCount === 0)) {
        return { type: 'jueju_7', jintiVariant: result.variant };
      }
    }
    if (clauseCount === 8) {
      const result = resolveJintiVariant(content, 'lvshi_7', rhymeBook);
      if (result.status === 'exact' || (result.violationCount <= 1 && result.unknownCount === 0)) {
        return { type: 'lvshi_7', jintiVariant: result.variant };
      }
    }
  }

  return { type: 'free' };
}

// ════════════════════════════════════════════════════════════════
// 文稿导入解析
//
// 流程：清洗文本 → 分段（空行段落 + 段内标题行）→ 归并成「首」
//      → 每首拆出 题目 / 作者 / 韵书 / 小序 / 正文 / 文末附注 → 体裁判定
// 目标：贴进来的东西五花八门（自己的诗稿、古诗文网、公众号、备忘录），
//      尽量自动拆对；拿不准的留给复核页，而不是猜错后静默导入。
// ════════════════════════════════════════════════════════════════

const DYNASTY = '先秦|秦|两汉|汉|魏晋|三国|魏|蜀|吴|晋|南北朝|南朝|北朝|隋|唐|五代十国|五代|南唐|宋|北宋|南宋|辽|金|元|明|清|近代|近现代|现代|当代';
const OPEN_B = '[\\[【〔（(［〖]';
const CLOSE_B = '[\\]】〕）)］〗]';
const RE_DYN_AUTHOR_A = new RegExp(`^${OPEN_B}?\\s*(?:${DYNASTY})(?:代|朝)?\\s*${CLOSE_B}?\\s*[·・•:：\\s]?\\s*([^\\s，。！？；,.!?;]{1,10})$`);
const RE_DYN_AUTHOR_B = new RegExp(`^([^\\s，。！？；,.!?;]{1,10})\\s*${OPEN_B}\\s*(?:${DYNASTY})(?:代|朝)?\\s*${CLOSE_B}$`);
const RE_BRACKET_TITLE = /^[《【〖「『]([^》】〗」』]{1,40})[》】〗」』](.*)$/;
const RE_TITLE_LABEL = /^(?:题目|标题|诗题|词题|题)\s*[:：]\s*(.+)$/;
const RE_AUTHOR_LABEL = /^(?:作者|作\s*者|撰|署名)\s*[:：]\s*(.+)$|^by\s+(.+)$/i;
const RE_CIPAI_LABEL = /^(?:词牌|词牌名|调寄|曲牌)\s*[:：]?\s*《?([^》\s]{2,8})》?$/;
const RE_QI = /^[（(]?\s*其\s*([一二三四五六七八九十百〇零\d]+)\s*[）)]?$/;
const RE_RHYME_ONLY = /^[（(【\[]?\s*(中华新韵|中华通韵|新韵|通韵|平水韵|词林正韵)\s*[）)】\]]?$/;
const RE_RHYME_IN = /[（(【\[]\s*(中华新韵|中华通韵|新韵|通韵|平水韵|词林正韵)\s*[）)】\]]/;
const RE_PREFACE_LABEL = /^[【\[]?(?:小序|词序|诗序|自序|序|题记|题序|引)[】\]]?\s*[:：]\s*(.*)$/;
const RE_NOTE_SECTION = /^[【\[〔]?\s*(注释|注解|自注|注|附记|附注|后记|跋|按|说明|备注|译文|翻译|今译|赏析|鉴赏|评析|简析|解析|创作背景|写作背景|背景|作者简介|题解|参考资料)\s*[】\]〕]?\s*(?:[:：]\s*(.*))?$/;
const REFERENCE_SECTIONS = new Set(['译文', '翻译', '今译', '赏析', '鉴赏', '评析', '简析', '解析', '创作背景', '写作背景', '背景', '作者简介', '题解', '参考资料']);
const RE_FOOTNOTE_DEF = /^(?:[\[［【〔(（]\s*\d{1,2}\s*[\]］】〕)）]|[①-⑳⑴-⒇❶-❿])\s*\S/;
const RE_FOOTNOTE = /[①-⑳⑴-⒇❶-❿]|[\[［【〔(（]\s*\d{1,2}\s*[\]］】〕)）]/g;
const RE_DATE_LINE = /^(?:[—–\-~～]{1,2}\s*)?(?:\d{2,4}\s*[年.\/\-]\s*\d{1,2}(?:\s*[月.\/\-]\s*\d{1,2}\s*日?)?|[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥](?:年)?|(?:公元)?[一二〇零○]{4}年)/;
const RE_SIGN_LINE = /^[—–]{1,2}\s*\S/;
const PROSE_HINT = /[之乎者也矣焉哉兮]|[作赋书记]此[篇阕词诗章]?|兼怀|以[纪志]之|[余予吾][^，。]{0,6}[作赋填]|遂|乃|因[而以]|故[作赋]|以[答赠寄记志]|[作赋填][《「]|一[阕首章篇]|时[年值]|[岁年]在|是[日夜岁年]/;
const SURNAMES = new Set(Array.from('赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯管卢莫房裘缪解应宗丁宣邓郁单杭洪包诸左石崔吉龚程嵇邢裴陆荣翁荀羊惠甄曲封储靳段富巫乌焦巴弓牧山谷车侯班仰秋仲伊宫宁仇栾暴甘厉戎祖武符刘景詹束龙叶幸司韶黎薄印宿白怀蒲从鄂索咸籍赖卓蔺屠蒙池乔阴胥能苍双闻党翟谭贡劳姬申扶堵冉宰郦雍桑桂濮牛寿通边扈燕冀浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终居衡步都耿满弘匡国文寇广禄阙东欧沃利蔚越夔隆师巩聂晁勾敖融冷辛阚那简饶曾沙养鞠须丰巢关蒯相查后荆红游竺权盖益桓公仝'));
const COMPOUND_SURNAMES = ['欧阳', '司马', '上官', '诸葛', '东方', '慕容', '令狐', '皇甫', '尉迟', '公孙', '长孙', '宇文', '夏侯', '独孤', '端木', '西门', '南宫', '纳兰', '辛弃', '元好'];

const vis = (line: string) => Array.from(line.replace(/\s/g, '')).length;
const hasPunct = (line: string) => /[，。！？；、,.!?;：:]/.test(line);
const endsSentence = (line: string) => /[。！？!?」』”）)]\s*$/.test(line);
const cjkRatio = (text: string) => {
  const plain = text.replace(/\s/g, '');
  if (!plain) return 0;
  return (plain.match(/[\u3400-\u9fff\uf900-\ufaff\u{20000}-\u{2ffff}]/gu) || []).length / Array.from(plain).length;
};

function rhymeBookFromMarker(marker: string): RhymeBook | undefined {
  if (/新韵|通韵/.test(marker)) return 'xin_yun';
  if (/平水/.test(marker)) return 'ping_shui';
  if (/词林/.test(marker)) return 'ci_lin';
  return undefined;
}

/** 清洗：BOM、零宽字符、各类空白、Markdown 标记、全角数字等 */
function normalizeManuscript(text: string): { lines: string[]; headings: Set<number> } {
  const headings = new Set<number>();
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u3000\t]/g, ' ')
    .split('\n')
    .map((raw, index) => {
      let line = raw.trim();
      const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
      if (heading) { line = heading[1]; headings.add(index); }
      line = line
        .replace(/^>\s?/, '')
        .replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1')
        .replace(/^[*_]{1,2}(.+?)[*_]{1,2}$/, '$1')
        .replace(/^[-*_=~]{3,}$/, '')
        .replace(/ {2,}/g, ' ')
        .trim();
      return line;
    });
  return { lines, headings };
}

function clauseLengths(lines: string[]): number[] {
  return normalizePoemClauses(lines.join('\n')).map(c => Array.from(c).length);
}

function isCompleteRegulated(lines: string[]): boolean {
  const lens = clauseLengths(lines);
  return (lens.length === 4 || lens.length === 8) && new Set(lens).size === 1 && (lens[0] === 5 || lens[0] === 7);
}

function looksLikePersonName(text: string): boolean {
  const t = text.trim();
  if (!/^[\u3400-\u9fff·・]{2,5}$/.test(t)) return false;
  return COMPOUND_SURNAMES.some(s => t.startsWith(s)) || SURNAMES.has(Array.from(t)[0]);
}

/** 显式的作者行：作者：X / by X / （X） / 唐·李白 / 李白〔唐〕 */
function parseAuthorLine(line: string): string | undefined {
  const label = line.match(RE_AUTHOR_LABEL);
  if (label) return (label[1] || label[2] || '').trim() || undefined;
  const dynA = line.match(RE_DYN_AUTHOR_A);
  if (dynA && new RegExp(`^${OPEN_B}?\\s*(?:${DYNASTY})`).test(line)) return dynA[1].trim();
  const dynB = line.match(RE_DYN_AUTHOR_B);
  if (dynB) return dynB[1].trim();
  const bracketed = line.match(/^[（(〔［\[]\s*([^，。！？；()（）]{1,12}?)\s*[）)〕］\]]$/);
  if (bracketed && !RE_RHYME_ONLY.test(line) && !RE_QI.test(line)) return bracketed[1].trim();
  const signed = line.match(/^[—–]{1,2}\s*([\u3400-\u9fff·・]{2,6})$/);
  if (signed) return signed[1];
  return undefined;
}

function plainTitleCandidate(line: string): boolean {
  if (!line || hasPunct(line.replace(/[·・\-—：:]/g, ''))) return false;
  if (RE_NOTE_SECTION.test(line) || RE_DATE_LINE.test(line)) return false;
  return vis(line) <= 18;
}

/** 句子是否是诗行（而非散文）：参照正文中位句长 */
function isProseLine(line: string, bodyMedian: number, classical: boolean): boolean {
  const len = vis(line);
  if (len < 16) return false;
  const stops = (line.match(/[。！？；!?;]/g) || []).length;
  const marks = (line.match(/[，。！？；、,.!?;]/g) || []).length;
  if (marks < 2) return false;
  const longest = Math.max(...line.split(/[，。！？；、,.!?;：:]/).map(c => vis(c.replace(/《[^》]*》/g, '书'))));
  const hinted = PROSE_HINT.test(line);
  if (classical) {
    return (len >= bodyMedian * 2.2 && (stops >= 1 || hinted)) || longest > 11 || (hinted && len >= bodyMedian * 1.8);
  }
  // 现代诗句子本来就长：只有带「序」语气或明显超长时才算
  return hinted ? len >= bodyMedian * 2 && stops >= 1 : len >= bodyMedian * 3.2 && stops >= 2;
}

function medianOf(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** 从文字里找出词牌：「作《X》」「调寄X」「倚X声」「填X」以及任意《X》 */
function findCipaiMention(text: string, cipais: CipaiData[]): string | undefined {
  const names = cipais.length
    ? cipais.flatMap(c => [c.name, ...(c.aliases || [])].map(name => ({ name, canonical: c.name })))
    : COMMON_CIPAIS.map(name => ({ name, canonical: name }));
  names.sort((a, b) => Array.from(b.name).length - Array.from(a.name).length);
  const lookup = (raw: string) => {
    const t = raw.trim();
    const hit = names.find(n => t === n.name || t.startsWith(`${n.name}·`) || t.startsWith(`${n.name}・`));
    return hit ? hit.canonical : undefined;
  };
  const bracketed = [...text.matchAll(/《([^》]{1,20})》/g)];
  const preferred = bracketed.filter(m => /[作填赋成谱以倚和寄]\s*$/.test(text.slice(0, m.index)));
  for (const m of [...preferred.reverse(), ...bracketed.reverse()]) {
    const hit = lookup(m[1]);
    if (hit) return hit;
  }
  const bare = text.match(/(?:调寄|倚|填|谱|调名)\s*[「“]?([\u3400-\u9fff·]{2,8})/);
  if (bare) {
    const t = bare[1];
    const hit = names.find(n => t.startsWith(n.name));
    if (hit) return hit.canonical;
  }
  return undefined;
}

interface Group { lines: string[]; paraBreaks: Set<number>; inheritedTitle?: string }

/** 段落的「头」：是否以明确的标题行开始 */
function explicitHeader(line: string, isHeading: boolean): boolean {
  return isHeading || RE_BRACKET_TITLE.test(line) && !hasPunct(line.replace(RE_BRACKET_TITLE, '$1'))
    || RE_TITLE_LABEL.test(line) || RE_QI.test(line);
}

function segmentManuscript(text: string, cipaiSigs: Set<string>): Group[] {
  const { lines, headings } = normalizeManuscript(text);

  // 1) 段落（空行分隔），并记录每行是否是 Markdown 标题
  type Para = { lines: string[]; heads: boolean[] };
  const paras: Para[] = [];
  let cur: Para = { lines: [], heads: [] };
  lines.forEach((line, index) => {
    if (!line) {
      if (cur.lines.length) paras.push(cur);
      cur = { lines: [], heads: [] };
      return;
    }
    cur.lines.push(line);
    cur.heads.push(headings.has(index));
  });
  if (cur.lines.length) paras.push(cur);

  // 2) 段内再切：明确标题行、「其N」，或句号收尾后的无标点短行（其后仍是带标点的诗句）
  const pieces: Para[] = [];
  for (const para of paras) {
    const punctuated = para.lines.filter(hasPunct).length >= Math.max(2, para.lines.length * 0.5);
    let start = 0;
    for (let i = 1; i < para.lines.length; i++) {
      const line = para.lines[i];
      const prev = para.lines[i - 1];
      const bodyBefore = para.lines.slice(start, i).filter(hasPunct).length;
      const after = para.lines.slice(i + 1);
      const before = para.lines.slice(start, i).filter(l => hasPunct(l));
      const beforeSig = clauseLengths(before).join(',');
      const beforeComplete = isCompleteRegulated(before) || cipaiSigs.has(beforeSig) || before.length >= 4;
      const wholeIsOne = cipaiSigs.has(clauseLengths(para.lines.slice(start)).join(','));
      const isSplit = (explicitHeader(line, para.heads[i]) && bodyBefore >= 1)
        || (punctuated && endsSentence(prev) && bodyBefore >= 2 && beforeComplete && !wholeIsOne
          && plainTitleCandidate(line) && !parseAuthorLine(line) && after.filter(hasPunct).length >= 2
          && !RE_NOTE_SECTION.test(line));
      if (isSplit) {
        pieces.push({ lines: para.lines.slice(start, i), heads: para.heads.slice(start, i) });
        start = i;
      }
    }
    pieces.push({ lines: para.lines.slice(start), heads: para.heads.slice(start) });
  }

  // 3) 归并成首
  const groups: (Group & { header: boolean; bodyLines: string[]; title?: string })[] = [];
  const isMetaOnly = (p: Para) => p.lines.length <= 3 && p.lines.every(l => !hasPunct(l) || parseAuthorLine(l) || RE_BRACKET_TITLE.test(l) || RE_TITLE_LABEL.test(l) || RE_RHYME_ONLY.test(l));
  const sig = (ls: string[]) => clauseLengths(ls).join(',');
  for (const piece of pieces) {
    const first = piece.lines[0];
    const header = explicitHeader(first, piece.heads[0]);
    const last = groups[groups.length - 1];
    const startNew = () => groups.push({ lines: [...piece.lines], paraBreaks: new Set(), header, bodyLines: header ? piece.lines.slice(1) : [...piece.lines] });
    const attach = () => {
      last.paraBreaks.add(last.lines.length);
      last.lines.push(...piece.lines);
      last.bodyLines.push(...piece.lines);
    };
    if (!last) { startNew(); continue; }
    const lastHasBody = last.bodyLines.some(hasPunct) || last.bodyLines.length >= 2;
    if (RE_NOTE_SECTION.test(first) || RE_FOOTNOTE_DEF.test(first) || RE_DATE_LINE.test(first) || RE_SIGN_LINE.test(first)) { if (lastHasBody) { attach(); continue; } }
    if (header) {
      startNew();
      // 「其二」沿用上一首的题目
      if (RE_QI.test(first)) {
        const prevTitle = last.inheritedTitle || last.title || (() => {
          const m = last.lines[0].match(RE_BRACKET_TITLE);
          return m ? m[1] : (plainTitleCandidate(last.lines[0]) ? last.lines[0] : undefined);
        })();
        groups[groups.length - 1].inheritedTitle = prevTitle;
        if (!last.inheritedTitle && prevTitle && !RE_QI.test(last.lines[0]) && !last.lines.some(l => RE_QI.test(l))) last.title = prevTitle;
      }
      continue;
    }
    if (!lastHasBody || isMetaOnly({ lines: last.lines, heads: [] })) { attach(); continue; }
    if (isMetaOnly(piece) && piece.lines.length <= 2 && !piece.lines.some(hasPunct) && piece.lines.length < 2) { attach(); continue; }
    // 无标题段：是另一首，还是上下阕 / 下一节？
    const pieceBody = piece.lines;
    const lastBody = last.bodyLines.filter(l => !parseAuthorLine(l));
    const plainHeaded = plainTitleCandidate(first) && pieceBody.length >= 3 && pieceBody.slice(1).filter(hasPunct).length >= 2
      && lastBody.filter(hasPunct).length >= 2;
    if (plainHeaded && !cipaiSigs.has(sig([...lastBody, ...pieceBody]))) { startNew(); continue; }
    if (isCompleteRegulated(lastBody) && isCompleteRegulated(pieceBody)) { startNew(); continue; }
    if (cipaiSigs.has(sig([...lastBody, ...pieceBody]))) { attach(); continue; }
    if (cipaiSigs.has(sig(lastBody)) && cipaiSigs.has(sig(pieceBody))) { startNew(); continue; }
    attach();
  }
  return groups.map(g => ({ lines: g.lines, paraBreaks: g.paraBreaks, inheritedTitle: g.inheritedTitle || g.title }));
}

function buildCipaiSignatures(cipais: CipaiData[]): Set<string> {
  const sigs = new Set<string>();
  for (const cipai of cipais) {
    try {
      const lens = getCipaiPatterns(cipai).map(p => Array.from(p).length);
      if (lens.length >= 4 && new Set(lens).size > 1) sigs.add(lens.join(','));
    } catch { /* 跳过异常词谱 */ }
  }
  return sigs;
}

/** 句式全合的词牌（未写词牌名时的提示） */
function guessCipaiByStructure(content: string, cipais: CipaiData[]): string | undefined {
  const lens = clauseLengths([content]);
  if (lens.length < 4 || new Set(lens).size < 2) return undefined;
  const key = lens.join(',');
  const names = new Set<string>();
  for (const cipai of cipais) {
    try {
      if (getCipaiPatterns(cipai).map(p => Array.from(p).length).join(',') === key) names.add(cipai.name);
    } catch { /* ignore */ }
  }
  return names.size === 1 ? [...names][0] : undefined;
}

function splitTitleAndAuthor(raw: string, cipaiNames: string[]): { title: string; author?: string } {
  const text = raw.trim();
  // 显式分隔：静夜思 / 李白、静夜思——李白、静夜思｜李白
  const sep = text.match(/^(.+?)\s*(?:[\/｜|]|——|—|－－|--)\s*(.+)$/);
  if (sep) {
    const author = parseAuthorLine(sep[2]) || (looksLikePersonName(sep[2]) || vis(sep[2]) <= 6 ? sep[2].trim() : undefined);
    if (author) return { title: sep[1].trim(), author };
  }
  // 空格分隔：静夜思 李白 / 静夜思 唐·李白；但「临江仙 夜归临皋」是词牌 + 词题
  const space = text.match(/^(.+)\s+(\S+)$/);
  if (space) {
    const dyn = parseAuthorLine(space[2]);
    if (dyn && dyn !== space[2]) return { title: space[1].trim(), author: dyn };
    const left = space[1].trim();
    const isCipaiLeft = cipaiNames.some(n => left === n);
    if (!isCipaiLeft && looksLikePersonName(space[2])) return { title: left, author: space[2] };
    const dynSpace = text.match(new RegExp(`^(.+?)\\s+((?:${DYNASTY})(?:代|朝)?\\s*[·・:：]?\\s*\\S{1,8})$`));
    if (dynSpace) {
      const a = parseAuthorLine(dynSpace[2]);
      if (a) return { title: dynSpace[1].trim(), author: a };
    }
  }
  return { title: text };
}

function cleanBodyLine(line: string): string {
  let out = line.replace(RE_FOOTNOTE, '').trim();
  // 无标点、以空格分句的诗行：「床前明月光 疑是地上霜」
  if (!hasPunct(out) && / /.test(out) && cjkRatio(out) > 0.8) {
    const parts = out.split(' ').filter(Boolean);
    if (parts.length >= 2 && parts.every(p => vis(p) >= 3 && vis(p) <= 11)) out = parts.join('，');
  }
  return out;
}

export function localParseManuscript(
  text: string,
  defaultAuthor: string,
  rhymeBook: RhymeBook = 'ci_lin',
  cipais: CipaiData[] = []
): ParsedPoem[] {
  const cipaiSigs = buildCipaiSignatures(cipais);
  const cipaiNames = cipais.length
    ? [...new Set(cipais.flatMap(c => [c.name, ...(c.aliases || [])]))]
    : COMMON_CIPAIS;
  const groups = segmentManuscript(text, cipaiSigs);
  const parsedPoems: ParsedPoem[] = [];

  for (const group of groups) {
    const lines = group.lines;
    if (!lines.length) continue;

    let title = '';
    let author = '';
    let cipaiHint: string | undefined;
    let markedRhyme: RhymeBook | undefined;
    const prefaceParts: string[] = [];
    // 靠推断（非「序：」标注）拆出的小序，正文过短时退回正文
    const guessed = new Set<number>();
    const guessRaw: string[] = [];
    const takeRhymeMarker = (s: string) => {
      const m = s.match(RE_RHYME_IN);
      if (m) { markedRhyme = rhymeBookFromMarker(m[1]); return s.replace(RE_RHYME_IN, '').trim(); }
      return s;
    };
    const setTitle = (rawTitle: string) => {
      let t = takeRhymeMarker(rawTitle.trim());
      // 题内括注的长小序：临江仙（……以答之）
      const paren = t.match(/^(.+?)[（(](.+)[）)]$/);
      if (paren && vis(paren[2]) >= 12 && hasPunct(paren[2])) {
        prefaceParts.push(paren[2].trim());
        t = paren[1].trim();
      }
      const dk = t.match(/[（(]\s*调寄\s*《?([^》）)]+)》?\s*[）)]/);
      if (dk) { cipaiHint = dk[1].trim(); t = t.replace(dk[0], '').trim(); }
      const tj = t.match(/^调寄\s*《?([^》]+)》?$/);
      if (tj) cipaiHint = tj[1].trim();
      t = t.replace(/\s*并序$/, '');
      const split = splitTitleAndAuthor(t, cipaiNames);
      title = split.title.replace(/^《(.+)》$/, '$1');
      if (split.author && !author) author = split.author;
    };

    // ── 文末：附注 / 译文 / 落款 ─────────────────────────
    let end = lines.length;
    let notesKind: 'self' | 'reference' = 'self';
    const minBodyEnd = Math.min(lines.length, 2);
    for (let i = minBodyEnd; i < lines.length; i++) {
      if (RE_FOOTNOTE_DEF.test(lines[i]) && i >= 2) { end = i; break; }
      const m = lines[i].match(RE_NOTE_SECTION);
      if (m && (m[2] !== undefined || vis(lines[i]) <= 8)) {
        end = i;
        if (REFERENCE_SECTIONS.has(m[1])) notesKind = 'reference';
        break;
      }
    }
    const noteStart = end;
    // 落款、日期（只在正文末尾）
    const tailSign: string[] = [];
    while (end > 2) {
      const l = lines[end - 1];
      if ((RE_DATE_LINE.test(l) && vis(l) <= 24) || (RE_SIGN_LINE.test(l) && vis(l) <= 24)) { tailSign.unshift(l); end -= 1; } else break;
    }
    let signer: string | undefined;
    const signIndex = tailSign.findIndex(l => /^[—–]{1,2}\s*([\u3400-\u9fff·・]{2,6})$/.test(l));
    if (signIndex >= 0) {
      signer = tailSign[signIndex].replace(/^[—–]{1,2}\s*/, '');
      tailSign.splice(signIndex, 1);
    }
    let rest = lines.slice(0, end);
    const finalNotes = [...tailSign, ...lines.slice(noteStart)].filter(Boolean);
    // 文言 / 现代：看「的了着们吗呢吧」等虚词的密度
    const allText = lines.slice(0, end).join('');
    const modernDensity = (allText.match(/[的了着们吗呢吧啊么这那地得你他她]/g) || []).length / Math.max(1, vis(allText));
    const classical = cjkRatio(allText) > 0.6 && modernDensity < 0.035;
    const isLatin = cjkRatio(allText) < 0.3;

    // ── 文首：题 / 作者 / 韵书 / 小序 ───────────────────
    if (group.inheritedTitle) title = group.inheritedTitle;
    const bodyCandidates = rest.filter(l => !RE_BRACKET_TITLE.test(l) && !parseAuthorLine(l) && !RE_PREFACE_LABEL.test(l));
    const bodyMedian = medianOf(bodyCandidates.map(vis).filter(n => n > 0));
    // 去掉首行后正文恰好合某词牌 / 近体句式，而带上它就不合：首行是小序
    const sigOf = (ls: string[]) => clauseLengths(ls).join(',');
    const structuralPreface = (ls: string[]) => ls.length >= 3 && hasPunct(ls[0]) && endsSentence(ls[0])
      && (ls[0].match(/[，。！？；、]/g) || []).length >= 2
      && ((cipaiSigs.has(sigOf(ls.slice(1))) && !cipaiSigs.has(sigOf(ls)))
        || (isCompleteRegulated(ls.slice(1)) && !isCompleteRegulated(ls)));
    let idx = 0;
    let inPreface = false;
    let explicitTitle = false;
    let prefaceExpected = false;
    while (idx < rest.length - 1) {
      const line = rest[idx];
      const remaining = rest.length - idx - 1;
      if (inPreface && classical && !endsSentence(prefaceParts[prefaceParts.length - 1] || '。')) {
        prefaceParts[prefaceParts.length - 1] += line; guessRaw.push(line); idx++;
        if (endsSentence(line)) inPreface = false;
        continue;
      }
      const pp = line.match(/^([^，。！？（(《]{1,16})[（(](.{12,})[）)]$/);
      if (pp && !explicitTitle && hasPunct(pp[2])) { setTitle(line); explicitTitle = true; idx++; continue; }
      const qi = line.match(RE_QI);
      if (qi) { title = `${title || group.inheritedTitle || ''}${title || group.inheritedTitle ? '·' : ''}其${qi[1]}`; explicitTitle = true; idx++; continue; }
      const bt = line.match(RE_BRACKET_TITLE);
      if (bt && !explicitTitle && !hasPunct(bt[1])) {
        setTitle(bt[1]);
        explicitTitle = true;
        const tail = takeRhymeMarker(bt[2].trim()).replace(/^[\/｜|—\-–\s]+/, '').trim();
        if (tail) {
          const a = parseAuthorLine(tail) || (looksLikePersonName(tail) || vis(tail) <= 6 ? tail : undefined);
          if (a) author = a;
        }
        prefaceExpected = /并序/.test(bt[1]);
        idx++; continue;
      }
      const tl = line.match(RE_TITLE_LABEL);
      if (tl && !explicitTitle) { setTitle(tl[1]); explicitTitle = true; idx++; continue; }
      const cl = line.match(RE_CIPAI_LABEL);
      if (cl && cipaiNames.some(n => cl[1].startsWith(n))) { cipaiHint = cl[1]; idx++; continue; }
      const al = parseAuthorLine(line);
      if (al && remaining >= 1 && (explicitTitle || title || idx <= 2)) { if (!author) author = al; idx++; continue; }
      if (RE_RHYME_ONLY.test(line)) { markedRhyme = rhymeBookFromMarker(line); idx++; continue; }
      const pl = line.match(RE_PREFACE_LABEL);
      if (pl) { prefaceParts.push(pl[1]); inPreface = !endsSentence(pl[1]); idx++; continue; }
      if (!isLatin && remaining >= 2 && (classical || endsSentence(line))
        && (isProseLine(line, bodyMedian || 7, classical) || structuralPreface(rest.slice(idx)) || (prefaceExpected && vis(line) >= 12 && hasPunct(line)))) {
        prefaceParts.push(line); guessed.add(prefaceParts.length - 1); guessRaw.push(line);
        inPreface = !endsSentence(line);
        idx++; continue;
      }
      break;
    }
    rest = rest.slice(idx);

    // 未带括号的题 / 作者：沿用打分假设，避免把无题诗的前两句吞掉
    if (!explicitTitle && !title && rest.length >= 2) {
      const first = rest[0];
      const second = rest[1];
      const hyps = [
        { consumed: 0, score: bodyStructureScore(rest) },
        ...(plainTitleCandidate(first) ? [{ consumed: 1, score: bodyStructureScore(rest.slice(1)) + 5 }] : []),
        ...(second && plainTitleCandidate(first) && plainTitleCandidate(second) && rest.length >= 4
          && (looksLikePersonName(second) || parseAuthorLine(second) || vis(second) <= 4) ? [{ consumed: 2, score: bodyStructureScore(rest.slice(2)) + 10 }] : []),
      ];
      // 首行明显比正文句短、且正文带标点，几乎可以肯定是题目
      if (plainTitleCandidate(first) && rest.slice(1).filter(hasPunct).length >= Math.max(1, (rest.length - 1) * 0.6)) hyps.push({ consumed: 1, score: 1000 });
      // 题目独占一段（其后空一行才是正文）
      if (plainTitleCandidate(first) && group.paraBreaks.has(group.lines.indexOf(first) + 1)) hyps.push({ consumed: 1, score: 2000 });
      const best = hyps.sort((a, b) => b.score - a.score || a.consumed - b.consumed)[0];
      if (best.consumed >= 1) setTitle(first);
      if (best.consumed === 2) {
        if (!author) author = parseAuthorLine(second) || second;
      }
      rest = rest.slice(best.consumed);
      // 题后的作者 / 小序（题目无括号时同样可能出现）
      while (rest.length > 2) {
        const q = rest[0].match(RE_QI);
        if (q) { title = `${title}·其${q[1]}`; rest = rest.slice(1); continue; }
        const al = parseAuthorLine(rest[0]) || (best.consumed === 1 && !author && looksLikePersonName(rest[0]) && !hasPunct(rest[0]) && rest.slice(1).some(hasPunct) ? rest[0] : undefined);
        if (al) { if (!author) author = al; rest = rest.slice(1); continue; }
        if (RE_RHYME_ONLY.test(rest[0])) { markedRhyme = rhymeBookFromMarker(rest[0]); rest = rest.slice(1); continue; }
        const pl = rest[0].match(RE_PREFACE_LABEL);
        if (pl) { prefaceParts.push(pl[1]); rest = rest.slice(1); continue; }
        if (!isLatin && (classical || endsSentence(rest[0])) && (isProseLine(rest[0], bodyMedian || 7, classical) || structuralPreface(rest))) {
          prefaceParts.push(rest[0]); guessed.add(prefaceParts.length - 1); guessRaw.push(rest[0]); rest = rest.slice(1);
          while (classical && rest.length > 2 && !endsSentence(prefaceParts[prefaceParts.length - 1])) { prefaceParts[prefaceParts.length - 1] += rest[0]; guessRaw.push(rest[0]); rest = rest.slice(1); }
          continue;
        }
        break;
      }
    } else if (explicitTitle && !author && rest.length >= 2) {
      // 《题》之后的一行短名：作者（仅当去掉它正文结构不变差）
      const line = rest[0];
      const baseScore = bodyStructureScore(rest);
      const authorScore = bodyStructureScore(rest.slice(1));
      if (!hasPunct(line) && (looksLikePersonName(line) || (vis(line) <= 12 && authorScore > 0 && authorScore >= baseScore && rest.slice(1).some(hasPunct)))) {
        author = line; rest = rest.slice(1);
        while (rest.length > 2 && !isLatin && isProseLine(rest[0], bodyMedian || 7, classical)) { prefaceParts.push(rest[0]); guessed.add(prefaceParts.length - 1); guessRaw.push(rest[0]); rest = rest.slice(1); }
      }
    }

    if (guessRaw.length && rest.length < 2) {
      rest = [...guessRaw, ...rest];
      const kept = prefaceParts.filter((_, i) => !guessed.has(i));
      prefaceParts.length = 0;
      prefaceParts.push(...kept);
    }
    if (signer && !author) author = signer;
    if (rest.length === 0) {
      rest = lines.slice(0, end);
      title = '';
      author = '';
      prefaceParts.length = 0;
    }

    // ── 正文 ──────────────────────────────────────────
    const bodyLines = rest.map(cleanBodyLine).filter(Boolean);
    const preface = prefaceParts.map(p => p.trim()).filter(Boolean).join('\n');

    if (!cipaiHint) cipaiHint = preface ? findCipaiMention(preface, cipais) : undefined;
    if (!cipaiHint && title) {
      const m = findCipaiMention(`《${title}》`, cipais);
      if (m && title.startsWith(m)) cipaiHint = m;
    }
    if (!title && cipaiHint) title = cipaiHint;
    if (!title) {
      const firstClause = normalizePoemClauses(bodyLines[0] || '')[0] || '';
      title = Array.from(firstClause).slice(0, 12).join('') || '无题';
    }

    const effectiveRhyme = markedRhyme || rhymeBook;
    const contentText = bodyLines.join('\n');
    const detectTitle = cipaiHint && !title.startsWith(cipaiHint) ? `${cipaiHint} ${title}` : title;
    const result = localDetectPoemType(contentText, detectTitle, effectiveRhyme, cipais);

    let normalizedContent = contentText;
    if (result.type.startsWith('jueju') || result.type.startsWith('lvshi')) {
      normalizedContent = normalizePoemClauses(contentText).join('\n');
    } else if (result.type === 'free' && group.paraBreaks.size) {
      // 现代诗保留分节空行
      const firstBodyIndex = group.lines.indexOf(rest[0]);
      normalizedContent = rest.map((line, i) => (group.paraBreaks.has(firstBodyIndex + i) && i > 0 ? `\n${cleanBodyLine(line)}` : cleanBodyLine(line))).filter(l => l !== '').join('\n');
    }
    const cipaiGuess = result.type === 'free' && !isLatin && cipais.length ? guessCipaiByStructure(contentText, cipais) : undefined;
    const notes = finalNotes.join('\n').trim();
    let formGuess: ParsedPoem['formGuess'];
    if (result.type === 'free' && !cipaiGuess && classical) {
      const lens = clauseLengths(bodyLines);
      if ((lens.length === 4 || lens.length === 8) && new Set(lens).size === 1 && (lens[0] === 5 || lens[0] === 7)) {
        const t = `${lens.length === 4 ? 'jueju' : 'lvshi'}_${lens[0]}` as 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7';
        const r = resolveJintiVariant(contentText, t, effectiveRhyme);
        formGuess = { type: t, variant: r.variant, violations: r.violationCount };
      }
    }

    parsedPoems.push({
      id: Math.random().toString(36).substr(2, 9),
      title,
      author: author || defaultAuthor,
      content: normalizedContent,
      type: result.type,
      sonnetType: result.sonnetType,
      cipaiName: result.cipaiName,
      jintiVariant: result.jintiVariant,
      ...(preface ? { preface } : {}),
      ...(notes ? { notes, notesKind } : {}),
      ...(markedRhyme ? { rhymeBook: markedRhyme } : {}),
      ...(cipaiGuess ? { cipaiGuess } : {}),
      ...(formGuess ? { formGuess } : {}),
    });
  }

  return parsedPoems;
}

function bodyStructureScore(lines: string[]): number {
  if (lines.length === 0) return -100;
  const content = lines.join('\n');
  const clauses = normalizePoemClauses(content);
  const lengths = clauses.map(clause => Array.from(clause).length);
  if ((clauses.length === 4 || clauses.length === 8) && lengths.every(length => length === 5 || length === 7) && new Set(lengths).size === 1) return 100;
  const latin = (content.match(/[A-Za-z]/g) || []).length;
  if (clauses.length === 14 && latin > content.length / 2) return 100;
  return clauses.length >= 2 ? 15 : 0;
}
