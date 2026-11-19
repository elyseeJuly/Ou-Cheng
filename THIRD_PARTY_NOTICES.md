# 第三方开源鸣谢与许可说明

偶成优先采用许可证明确、可复核的开源实现和数据。下面只列出当前版本中实际使用或适配移植的项目；“参考过”但没有复制代码的项目不冒充依赖。

## couyun

- 项目：[`hulbji/couyun`](https://github.com/hulbji/couyun)
- 固定提交：`1744e87f850c2205bc231bfdd858256036c0e4db`
- 许可：MIT
- 作者版权：Copyright (c) 2026 hulbji
- 偶成中的用途：
  - 《钦定词谱》结构化谱式、句读、换韵和词例数据；
  - 导入文本中括注清理与句读规范化算法的 TypeScript 适配；
  - 五言、七言律句候选规则及拗句备选格式的 TypeScript 适配。
- 完整许可文本：[`data/cipai/LICENSE.couyun`](data/cipai/LICENSE.couyun)

适配代码为配合偶成的数据结构、离线韵书和界面反馈重新实现；上游项目不为偶成的修改或判定结果背书。

## chinese-poetry

- 项目：[`chinese-poetry/chinese-poetry`](https://github.com/chinese-poetry/chinese-poetry)
- 许可：MIT
- 偶成中的用途：
  - 唐宋经典诗词典籍语料库、作者考证及名篇题注；
  - 卷帙经典赏读模块的数据源与词云意象关联基础；
  - 2026-10-10 补充：唐诗三百首、宋词三百首、花间集、纳兰性德诗集、千家诗、古文观止辞赋。
- 完整许可文本：[`docs/data/licenses/chinese-poetry-MIT.txt`](docs/data/licenses/chinese-poetry-MIT.txt)

## Werneror/Poetry

- 项目：[`Werneror/Poetry`](https://github.com/Werneror/Poetry)
- 许可：MIT（Copyright (c) 2018 Werner）
- 偶成中的用途：两汉、魏晋、南北朝、明、清名家诗词，两汉乐府、古诗十九首与南北朝民歌。
- 完整许可文本：[`docs/data/licenses/Werneror-Poetry-MIT.txt`](docs/data/licenses/Werneror-Poetry-MIT.txt)

## open-chinese/poetry-collection

- 项目：[`open-chinese/poetry-collection`](https://github.com/open-chinese/poetry-collection)
- 许可：MIT（Copyright (c) 2024 Open Chinese | 开放中文）
- 偶成中的用途：曹植、陶渊明辞赋，苏轼、欧阳修、范仲淹诗作。
- 完整许可文本：[`docs/data/licenses/open-chinese-poetry-collection-MIT.txt`](docs/data/licenses/open-chinese-poetry-collection-MIT.txt)

## 霞鹜文楷 LXGW WenKai

- 项目：[`lxgw/LxgwWenKai`](https://github.com/lxgw/LxgwWenKai)
- 许可：SIL Open Font License 1.1
- 偶成中的用途：意象词云字体，按词库裁切为 WOFF2 子集（仅作网页字体内嵌，不作为可安装字体分发）。
- 完整许可文本：[`src/assets/fonts/LXGWWenKai-OFL.txt`](src/assets/fonts/LXGWWenKai-OFL.txt)

## iOS 内嵌正文字体

iOS 构建另外内嵌完整的 Noto Serif SC（思源宋体）、Ma Shan Zheng（马善政楷）与 LXGW WenKai Lite（霞鹜文楷）。它们分别取自 `google/fonts` 和 `lxgw/LxgwWenKai-Lite` 官方开源仓库，只转换为 WOFF2 网页字体格式，不裁切字表，不作为可安装桌面字体分发。三种字体选择及海报导出在断网时不再依赖字体 CDN。

- 字体与原始文件校验值：[`src/assets/fonts/ios/manifest.json`](src/assets/fonts/ios/manifest.json)
- 原始完整许可证：[`public/licenses/NotoSerifSC-OFL.txt`](public/licenses/NotoSerifSC-OFL.txt)、[`public/licenses/MaShanZheng-OFL.txt`](public/licenses/MaShanZheng-OFL.txt)、[`public/licenses/LXGWWenKaiLite-OFL.txt`](public/licenses/LXGWWenKaiLite-OFL.txt)
- iOS 通过构建入口加载本地字体；Web/PWA 保持现有远程字体源，未将完整字体加入 Web 构建。

## App 内完整许可文本

[`public/licenses/THIRD_PARTY_LICENSES.txt`](public/licenses/THIRD_PARTY_LICENSES.txt) 随 App 分发，收录运行依赖、数据来源和字体的版权与完整许可文本。依赖或许可证变更后运行 `node scripts/build-third-party-notices.mjs` 重新生成；应用“印匣”中的本地许可入口使用该文件。

语料的选取原则、清洗规则与复现命令见 [`docs/data/CORPUS_SOURCES.md`](docs/data/CORPUS_SOURCES.md)。

## chinese_word_rhyme

- 项目：[`charlesix59/chinese_word_rhyme`](https://github.com/charlesix59/chinese_word_rhyme)
- 许可：MIT
- 偶成中的用途：
  - 《平水韵》与《词林正韵》韵部映射及声律字表数据源。

## 其他数据与运行时依赖

完整项目清单、用途和上游链接显示在应用“印匣 → 关于 → 使用的开源技术”中。npm 依赖的精确版本见 `package.json` 和锁文件。

## 仅作调研、未复制代码

本次也核对了 `LingDong-/cope`、`wb14123/rhyme-checker`、`SongCiApp` 等实现。由于许可证缺失或许可证边界与本项目不匹配，其源码未并入偶成；它们仅用于核对问题范围和测试思路。
