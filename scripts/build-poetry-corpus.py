#!/usr/bin/env python3
"""
卷帙·经典文献语料构建（离线数据工具，不进入 App 运行时）

数据来源（均为 MIT 许可，详见 docs/data/CORPUS_SOURCES.md）:
  - chinese-poetry/chinese-poetry  https://github.com/chinese-poetry/chinese-poetry
  - Werneror/Poetry                https://github.com/Werneror/Poetry
  - open-chinese/poetry-collection https://github.com/open-chinese/poetry-collection （辞赋、宋人诗补充）

用法:
  pip install opencc-python-reimplemented
  python3 scripts/build-poetry-corpus.py --cp /path/to/chinese-poetry --wr /path/to/Werneror-Poetry \
      --oc /path/to/poetry-collection/by_poets   # 需要 汉-曹植 晋-陶渊明 宋-苏轼 宋-欧阳修 宋-范仲淹 .json
  # --cp 目录下需有: 全唐诗/唐诗三百首.json 宋词/宋词三百首.json 纳兰性德/纳兰性德诗集.json
  #                  蒙学/guwenguanzhi.json 蒙学/qianjiashi.json 五代诗词/huajianji/*.json
  # --wr 目录下需有: 汉.csv 魏晋.csv 南北朝.csv 明_1..4.csv 明末清初.csv 清_1.csv 清_2.csv 清末近现代初.csv
  # 也接受把上述文件平铺、文件名中 / 换成 _ 的目录。

输出: public/data/poetry.json（在已有语料上合并、清洗、去重）
清洗规则:
  - 繁体统一转简体（OpenCC t2s）
  - 去掉拉丁字母、阿拉伯数字（含全角）、括注（）()[]〔〕<>【】里的舞台提示/校记
  - 含缺字符（? � □ 及注音、片假名等异常字符）的整条剔除，不猜字
  - 含扩展 B 区以后生僻字（U+20000 以上，iOS/安卓常用字体无字形，会显示为方框）的整条剔除
  - 正文按句末标点分行，每行一句
"""
import argparse, csv, glob, json, os, random, re, sys

try:
    from opencc import OpenCC
except ImportError:
    sys.exit('需要 opencc: pip install opencc-python-reimplemented')

T2S = OpenCC('t2s')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/data/poetry.json')
csv.field_size_limit(10 ** 8)
random.seed(20261010)

# ───────── 清洗 ─────────
BRACKETS = re.compile(r'（[^）]*）|\([^)]*\)|\[[^\]]*\]|〔[^〕]*〕|<[^>]*>|【[^】]*】|［[^］]*］')
LATIN = re.compile(r'[A-Za-z0-9\uFF21-\uFF3A\uFF41-\uFF5A\uFF10-\uFF19]')
# 允许的字符：汉字（含扩展区）与常用中文标点、换行
ALLOWED = re.compile(r'^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff，。、；：？！“”‘’《》·—…「」『』\n]*$')
END_PUNCT = '。！？；'


def t2s(s: str) -> str:
    """繁转简；若转出扩展区字（如「鏦」→「𫓩」，常用字体没有字形），逐字回退保留原字"""
    out = T2S.convert(s)
    if all(ord(c) <= 0xFFFF for c in out):
        return out
    return ''.join(c2 if ord(c2) <= 0xFFFF else c for c in s for c2 in [T2S.convert(c)])


def clean_text(s: str) -> str:
    s = t2s(s or '')
    s = s.replace('・', '·').replace('/', '·').replace('"', '')
    s = re.sub(r'(.)々', r'\1\1', s)                    # 重文号还原为叠字
    s = re.sub(r'\?(?=[”’\n]|$)', '？', s)               # 句末半角问号是标点；句中 ? 是缺字，留给 readable 剔除
    s = BRACKETS.sub('', s)
    s = LATIN.sub('', s)
    s = s.replace('\u3000', '').replace(' ', '').replace('\t', '')
    s = s.replace(',', '，').replace(';', '；').replace(':', '：').replace('!', '！')
    s = re.sub(r'[“”"]{2,}', '', s)
    return s.strip()


def to_lines(paragraphs) -> str:
    """段落 → 一句一行（到句末标点断行）"""
    if isinstance(paragraphs, list):  # 段末无标点时补句号，免得两段粘连（如纳兰词）
        text = ''.join(p if not p or p[-1] in END_PUNCT + '，、：' else p + '。' for p in (x.strip() for x in paragraphs))
    else:
        text = paragraphs or ''
    text = clean_text(text)
    lines, cur = [], ''
    chars = text.replace('\n', '')
    for i, ch in enumerate(chars):
        cur += ch
        nxt = chars[i + 1] if i + 1 < len(chars) else ''
        # 句末标点后紧跟的后引号（”’」』）留在本行，不让下一行以后引号开头
        if (ch in END_PUNCT or (ch in '”’」』' and cur[-2:-1] in tuple(END_PUNCT))) and nxt not in '”’」』':
            lines.append(cur)
            cur = ''
    if cur.strip():
        lines.append(cur + ('' if cur[-1] in END_PUNCT else '。'))
    return '\n'.join(l for l in lines if len(l) > 1)


def readable(p) -> bool:
    body = p['title'] + p['author'] + p['content']
    if not p['content'] or len(p['content']) < 8:
        return False
    return bool(ALLOWED.match(p['title'] + p['author'] + p['content'].replace('\n', '')))


def clean_author(a: str) -> str:
    a = clean_text(a)
    a = re.sub(r'^(先秦|两汉|汉|魏晋|南北朝|唐|宋|元|明|清)代?[：:]', '', a)
    return a.strip('：:') or '佚名'


# ───────── 体裁判别 ─────────
cipai_names = set()
try:
    raw = json.load(open(os.path.join(ROOT, 'public/data/cipai.json'), encoding='utf8'))
    for c in (raw.get('cipai') if isinstance(raw, dict) else raw):
        cipai_names.add(c['name'])
        for a in c.get('aliases') or []:
            cipai_names.add(a)
except Exception:
    pass


def is_ci_title(title: str) -> bool:
    head = re.split(r'[·・ 　（(]', title)[0]
    return head in cipai_names


def find(base, rel):
    for cand in (os.path.join(base, rel), os.path.join(base, rel.replace('/', '_'))):
        if os.path.exists(cand):
            return cand
    return None


def load_json(base, rel):
    path = find(base, rel)
    if not path:
        print(f'  缺少 {rel}，跳过')
        return None
    return json.load(open(path, encoding='utf8'))


def mk(title, author, content, category, dynasty):
    return {'title': clean_text(title) or '无题', 'author': clean_author(author), 'content': content,
            'category': category, 'dynasty': dynasty}


# ───────── chinese-poetry ─────────
def from_chinese_poetry(base):
    out = []
    d = load_json(base, '全唐诗/唐诗三百首.json')
    for x in d or []:
        out.append(mk(x['title'], x['author'], to_lines(x['paragraphs']), '唐诗', '唐代'))
    d = load_json(base, '宋词/宋词三百首.json')
    for x in d or []:
        out.append(mk(x['rhythmic'], x['author'], to_lines(x['paragraphs']), '宋词', '宋代'))
    d = load_json(base, '纳兰性德/纳兰性德诗集.json')
    for x in d or []:
        out.append(mk(x['title'], x['author'], to_lines(x.get('para') or x.get('paragraphs')), '清词', '清代'))
    for path in sorted(glob.glob(os.path.join(base, '五代诗词/huajianji/huajianji-*-juan.json'))
                       + glob.glob(os.path.join(base, '五代诗词_huajianji_huajianji-*-juan.json'))):
        for x in json.load(open(path, encoding='utf8')):
            out.append(mk(x['title'], x['author'], to_lines(x['paragraphs']), '五代诗词', '五代十国'))
    # 千家诗：按作者朝代归类，宋人诗作入「宋诗」
    d = load_json(base, '蒙学/qianjiashi.json')
    for group in (d or {}).get('content', []):
        for x in group['content']:
            author = T2S.convert(x.get('author', ''))
            m = re.match(r'[（(](.)[）)](.*)', author)
            dyn, name = (m.group(1), m.group(2)) if m else ('', author)
            cat, dynasty = {'唐': ('唐诗', '唐代'), '宋': ('宋诗', '宋代'), '明': ('明诗', '明代')}.get(dyn, (None, None))
            if not cat:
                continue
            paras = x['paragraphs']
            if paras and isinstance(paras[0], dict):  # 组诗：其一、其二……各成一首
                for sub in paras:
                    out.append(mk(f"{x['chapter']} {sub.get('subchapter') or ''}".strip(), name, to_lines(sub['paragraphs']), cat, dynasty))
            else:
                out.append(mk(x['chapter'], name, to_lines(paras), cat, dynasty))
    # 古文观止：只取赋与辞
    d = load_json(base, '蒙学/guwenguanzhi.json')
    for juan in (d or {}).get('content', []):
        for x in juan['content']:
            title = T2S.convert(x['chapter'])
            if not re.search(r'(赋|辞)$', title):
                continue
            author = T2S.convert(x.get('author', ''))
            dyn = author.split('：')[0] if '：' in author else ''
            dynasty = {'先秦': '先秦', '两汉': '两汉', '汉': '两汉', '魏晋': '魏晋', '唐': '唐代', '宋': '宋代'}.get(dyn, dyn or '历代')
            out.append(mk(title, author, to_lines(x['paragraphs']), f'{dynasty.rstrip("代")}赋', dynasty))
    return out


# ───────── Werneror/Poetry ─────────
FAMOUS = {
    '魏晋': ['曹植', '陶潜', '阮籍', '嵇康', '曹丕', '陆机', '左思', '王粲', '刘桢', '潘岳', '郭璞', '张华', '刘琨', '谢道韫', '王羲之', '傅玄', '蔡琰', '孙绰'],
    '南北朝': ['谢灵运', '谢朓', '鲍照', '庾信', '沈约', '何逊', '吴均', '江淹', '阴铿', '王籍', '陶弘景', '范云', '萧统', '萧纲', '徐陵', '颜延之', '丘迟', '薛道衡'],
    '明': ['高启', '刘基', '杨慎', '唐寅', '于谦', '王守仁', '李东阳', '李梦阳', '何景明', '王世贞', '李攀龙', '徐渭', '袁宏道', '汤显祖', '文徵明', '沈周', '祝允明', '陈子龙', '夏完淳', '张煌言', '戚继光', '方孝孺', '杨基', '袁凯', '谢榛', '陈继儒', '袁中道', '钟惺', '王彦泓', '杨士奇', '解缙'],
    '清': ['龚自珍', '袁枚', '郑燮', '黄景仁', '王士禛', '赵翼', '朱彝尊', '陈维崧', '顾炎武', '吴伟业', '钱谦益', '查慎行', '厉鹗', '张问陶', '林则徐', '谭嗣同', '秋瑾', '黄遵宪', '顾贞观', '屈大均', '吴嘉纪', '沈德潜', '翁方纲', '项鸿祚', '蒋春霖', '郑文焯', '朱孝臧', '况周颐', '王鹏运', '吴藻', '纳兰性德', '宋琬', '施闰章', '曹贞吉', '丘逢甲'],
}
PER_AUTHOR = {'魏晋': 30, '南北朝': 22, '明': 18, '清': 16}
MUST = ['归园田居', '饮酒', '七步诗', '白马篇', '洛神赋', '咏怀', '赠从弟', '登池上楼', '玉阶怨', '晚登三山还望京邑', '拟行路难',
        '石灰吟', '桃花庵歌', '临江仙', '别云间', '马上作', '己亥杂诗', '竹石', '题画', '绮怀', '杂感', '论诗', '所见', '春日偶成',
        '金缕曲', '木兰花', '入若耶溪', '咏柳', '梅花', '寄怀', '秋夕']


def wr_rows(base, names):
    for n in names:
        path = find(base, f'{n}.csv')
        if not path:
            print(f'  缺少 {n}.csv，跳过')
            continue
        with open(path, encoding='utf8') as f:
            r = csv.reader(f)
            next(r, None)
            for row in r:
                if len(row) >= 4:
                    yield n, row[0], row[2].strip(), row[3]


def pick(rows, key, cap):
    """每位作者先取必选名篇，再取 4~12 句的篇目，固定种子抽样"""
    by = {}
    for r in rows:
        by.setdefault(r[key], []).append(r)
    out = []
    for author, items in by.items():
        must = [x for x in items if any(x['title'].startswith(m) for m in MUST)]
        rest = [x for x in items if x not in must and 4 <= x['content'].count('\n') + 1 <= 12]
        random.shuffle(rest)
        out.extend((must + rest)[:cap])
    return out


def from_werneror(base):
    out = []
    # 汉：两汉乐府 → 汉乐府；其余名家 → 汉诗
    for _, title, author, content in wr_rows(base, ['汉']):
        body = to_lines(content)
        if author in ('两汉乐府', '佚名', '作者未详', '无名氏'):
            out.append(mk(title, '汉乐府' if author == '两汉乐府' else '佚名', body, '汉乐府', '两汉'))
        else:
            out.append(mk(title, author, body, '汉诗', '两汉'))
    # 魏晋 / 南北朝：名家 + 无名氏乐府民歌
    for era, cat, dyn in (('魏晋', '魏晋诗', '魏晋'), ('南北朝', '南北朝诗', '南北朝')):
        famous, folk = [], []
        for _, title, author, content in wr_rows(base, [era]):
            p = {'title': title, 'author': author, 'content': to_lines(content)}
            if author in FAMOUS[era]:
                famous.append(p)
            elif author in ('无名氏', '佚名') and (title.startswith(('古诗十九首', '子夜', '西洲曲', '木兰', '敕勒', '长干', '读曲', '华山畿', '古绝句', '古乐府', '陌上', '孔雀'))):
                folk.append(p)
        for p in pick(famous, 'author', PER_AUTHOR[era]):
            out.append(mk(p['title'], p['author'], p['content'], '洛神赋' == p['title'] and '魏晋赋' or cat, dyn))
        for p in folk[:120]:
            folk_cat = '魏晋诗' if p['title'].startswith('古诗十九首') else f'{era}乐府'
            out.append(mk(p['title'], '佚名', p['content'], folk_cat, dyn))
    # 明 / 清：名家诗词
    for era, files, dyn in (('明', ['明_1', '明_2', '明_3', '明_4', '明末清初'], '明代'),
                            ('清', ['清_1', '清_2', '明末清初', '清末近现代初'], '清代')):
        rows = []
        seen = set()
        for n, title, author, content in wr_rows(base, files):
            if author not in FAMOUS[era] or (author, title) in seen:
                continue
            if n == '明末清初' and era == '明' and author not in ('陈子龙', '夏完淳', '张煌言'):
                continue
            seen.add((author, title))
            rows.append({'title': title, 'author': author, 'content': to_lines(content)})
        for p in pick(rows, 'author', PER_AUTHOR[era]):
            cat = f'{era}词' if is_ci_title(T2S.convert(p['title'])) else f'{era}诗'
            out.append(mk(p['title'], p['author'], p['content'], cat, dyn))
    return out


def from_open_chinese(base):
    out = []
    if not base:
        return out
    fu_files = {'汉-曹植.json': ('魏晋赋', '魏晋'), '晋-陶渊明.json': ('魏晋赋', '魏晋')}
    song_files = {'宋-苏轼.json': 40, '宋-欧阳修.json': 30, '宋-范仲淹.json': 20}
    for name, (cat, dyn) in fu_files.items():
        path = os.path.join(base, name)
        if not os.path.exists(path):
            print(f'  缺少 {name}，跳过'); continue
        for x in json.load(open(path, encoding='utf8')):
            t = x.get('title') or ''
            if re.search(r'赋(并序)?$', t) and len(x.get('content') or '') > 120:
                out.append(mk(t.replace('并序', ''), x['author'], to_lines(x['content']), cat, dyn))
    for name, cap in song_files.items():
        path = os.path.join(base, name)
        if not os.path.exists(path):
            print(f'  缺少 {name}，跳过'); continue
        items = [x for x in json.load(open(path, encoding='utf8'))
                 if not is_ci_title(x.get('title') or '') and 4 <= (x.get('content') or '').count('\n') + 1 <= 8]
        random.shuffle(items)
        for x in items[:cap]:
            out.append(mk(x['title'], x['author'], to_lines(x['content']), '宋诗', '宋代'))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cp', required=True, help='chinese-poetry 数据目录')
    ap.add_argument('--wr', required=True, help='Werneror/Poetry 数据目录')
    ap.add_argument('--oc', default='', help='open-chinese/poetry-collection 的 by_poets 目录')
    args = ap.parse_args()

    existing = json.load(open(OUT, encoding='utf8'))
    # 已有语料重新清洗：去括注、拉丁字符与数字；曹操诗集归入汉末三国
    base = []
    for p in existing:
        q = {**p, 'title': clean_text(p.get('title', '')), 'author': clean_author(p.get('author', '')),
             'content': '\n'.join(filter(None, (clean_text(l) for l in (p.get('content') or '').split('\n'))))}
        base.append(q)

    merged = base + from_chinese_poetry(args.cp) + from_werneror(args.wr) + from_open_chinese(args.oc)
    out, seen, dropped = [], set(), 0
    for p in merged:
        key = (p['author'], re.sub(r'[，。、；：？！\n]', '', p['content'])[:24])
        if key in seen:
            continue
        if not readable(p):
            dropped += 1
            continue
        seen.add(key)
        out.append(p)

    json.dump(out, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    from collections import Counter
    print(f'输出 {len(out)} 首（剔除含缺字/异常字符 {dropped} 首）')
    for k, v in Counter(f"{p['category']}|{p['dynasty']}" for p in out).most_common():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
