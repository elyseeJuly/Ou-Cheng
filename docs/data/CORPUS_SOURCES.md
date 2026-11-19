# 卷帙 · 经典文献语料来源与清洗说明

更新：2026-10-10 · 语料文件：`public/data/poetry.json`（5118 首）

偶成的「卷帙 → 经典赏读」、意象词云的例句与关联、词牌详情的定格词作，都读这一份本地语料。语料全部来自许可证明确的开源库，打包进 App，运行时不联网。

## 引用的开源库

| 开源库 | 许可 | 取用内容 | 许可全文 |
|---|---|---|---|
| [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) | MIT · © 2016 JackeyGao | 《唐诗三百首》（`全唐诗/唐诗三百首.json`）、《宋词三百首》（`宋词/宋词三百首.json`）、《花间集》（`五代诗词/huajianji/`）、南唐二主词、《纳兰性德诗集》、《千家诗》（`蒙学/qianjiashi.json`）、《古文观止》中的赋（`蒙学/guwenguanzhi.json`），以及原有的全唐诗、全宋词、诗经、楚辞、曹操诗集、元曲选段 | [licenses/chinese-poetry-MIT.txt](licenses/chinese-poetry-MIT.txt) |
| [Werneror/Poetry](https://github.com/Werneror/Poetry) | MIT · © 2018 Werner | 两汉（`汉.csv`，含两汉乐府）、魏晋（`魏晋.csv`，含古诗十九首和魏晋乐府）、南北朝（`南北朝.csv`）、明（`明_1~4.csv`、`明末清初.csv`）、清（`清_1~2.csv`、`清末近现代初.csv`）名家诗词 | [licenses/Werneror-Poetry-MIT.txt](licenses/Werneror-Poetry-MIT.txt) |
| [open-chinese/poetry-collection](https://github.com/open-chinese/poetry-collection) | MIT · © 2024 Open Chinese | 曹植、陶渊明的赋（`by_poets/汉-曹植.json`、`晋-陶渊明.json`），以及苏轼、欧阳修、范仲淹的诗作 | [licenses/open-chinese-poetry-collection-MIT.txt](licenses/open-chinese-poetry-collection-MIT.txt) |

意象词云还用到「霞鹜文楷」字体（[lxgw/LxgwWenKai](https://github.com/lxgw/LxgwWenKai)，SIL OFL 1.1）。只按词库用到的字裁切成子集，许可全文见 `src/assets/fonts/LXGWWenKai-OFL.txt`。

## 各标签收录量

| 标签 | 篇数 | 构成 |
|---|---|---|
| 诗经·楚辞 | 365 | 诗经 301，楚辞 64 |
| 汉 | 322 | 汉诗 188，汉乐府 108，曹操诗集 26 |
| 魏晋南北朝 | 756 | 魏晋诗 320，南北朝诗 306，魏晋乐府 101，魏晋赋 27，南北朝乐府 2 |
| 唐 | 970 | 唐诗 969，唐赋 1 |
| 宋 | 911 | 宋词 737，宋诗 171，宋赋 3 |
| 元 | 452 | 元曲 |
| 明 | 505 | 明诗 466，明词 39 |
| 清 | 743 | 清词 420（纳兰性德为主），清诗 323 |
| 体裁·辞赋 | 95 | 赋 31，楚辞 64 |
| 体裁·乐府 | 211 | 汉乐府、魏晋乐府、南北朝乐府 |

另有五代诗词 94 首，不属于任何朝代标签，只在「全部」中出现。

## 选取原则

- 唐宋两代以《唐诗三百首》《宋词三百首》《千家诗》等经典选本为主，原有语料保留并去重。
- 汉魏六朝与明清两代，按名家名单取篇目，每位作者设有上限。名单见 `scripts/build-poetry-corpus.py` 中的 `FAMOUS`。
  - 每位作者先收必选名篇，如《归园田居》《洛神赋》《别云间》《己亥杂诗》等。
  - 其余篇目从 4～12 句的作品中按固定种子抽取，因此可以复现。
- 明、清作品按题目判断体裁：题首是词牌名（以 `cipai.json` 中的词牌及别名为准）的归入「词」，其余归入「诗」。

## 清洗规则（问题修复：英文字符与杂符）

- 繁体统一转为简体（OpenCC `t2s`）。
- 删去拉丁字母和阿拉伯数字，包括全角形式。例如作者名「杨适1」改为「杨适」。
- 删去括注 `（）()[]〔〕<>【】`。元曲中的「(旦云)」等舞台提示、校记都在此一并去掉。
- 规范符号：
  - `・` 和 `/` 统一为 `·`。
  - 重文号 `々` 还原为叠字。
  - 句末的半角 `?` 改为「？」。
- 含缺字的篇目整篇剔除，不猜字。缺字包括 `?`、`�`、`□`，以及注音符号、假名等异常字符。含扩展 B 区以后生僻字（U+20000 以上）的篇目也剔除，因为常用字体没有这些字形，会显示成方框。
- 繁简转换时，如果转出的是扩展区字形（例如「鏦」会被转成「𫓩」），就逐字保留原字。
- 句末标点后的后引号（”」）留在本行，下一行不会以后引号开头。本次共剔除 146 首。
- 正文按句末标点（。！？；）分行。原文分段处没有标点的，补一个句号，避免两段粘连。
- 词谱的体名由「格2」改为「格二」，界面上不再出现阿拉伯数字。见 `scripts/build-cipai-data.cjs`。

## 复现

```bash
pip install opencc-python-reimplemented fonttools brotli
python3 scripts/build-poetry-corpus.py \
  --cp  <chinese-poetry 仓库目录> \
  --wr  <Werneror/Poetry 仓库目录> \
  --oc  <poetry-collection 仓库>/by_poets
node scripts/build-imagery.cjs        # 意象词库与例句
node scripts/build-rhyme-freq.cjs     # 字频
bash scripts/build-cloud-font.sh <LXGWWenKai-Medium.ttf>   # 词云字体子集
```

脚本会在现有的 `poetry.json` 上合并并去重，所以重复运行不会产生重复篇目。
