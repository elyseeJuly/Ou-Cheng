# 偶成 (Ou Cheng) — 东方美学诗词助手 / Eastern Aesthetic Poetry Assistant

<div align="center">
  <p><em>“佳句本天成，妙手偶得之。” / "A beautiful verse is born of nature, captured by chance through a master's touch."</em></p>
  <p>
    <a href="#-简体中文">简体中文 (Chinese)</a> | <a href="#-english">English</a>
  </p>
  <p>
    <a href="https://elyseejuly.github.io/Ou-Cheng/">
      <img src="https://img.shields.io/badge/Version-v5.1.0-B22222?style=for-the-badge" alt="Version">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-444444?style=for-the-badge" alt="License">
    </a>
    <a href="docs/data/CORPUS_SOURCES.md">
      <img src="https://img.shields.io/badge/Corpus-5118%20poems-8A2BE2?style=for-the-badge" alt="Corpus">
    </a>
    <a href="docs/data/CORPUS_SOURCES.md">
      <img src="https://img.shields.io/badge/Ci%20Patterns-2280-6B8E23?style=for-the-badge" alt="Ci patterns">
    </a>
    <a href="https://react.dev/">
      <img src="https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    </a>
  </p>
</div>

---

> [!IMPORTANT]
> 🚀 **在线体验 / Live Demo**: **[elyseejuly.github.io/Ou-Cheng](https://elyseejuly.github.io/Ou-Cheng/)**
>
> 作品、草稿与设置只保存在你自己的浏览器（IndexedDB），不上传任何服务器；可安装为 PWA 离线使用。
> Your works, drafts and settings stay in your own browser (IndexedDB) and are never uploaded. Installable as an offline PWA.

---

## 🇨🇳 简体中文

### 📖 项目综述

**偶成** 是一款面向诗词创作者的东方美学写作工具：一边写，一边实时校验平仄与韵脚；写完以宣纸、乌丝栏与印章排成一张可以收藏的诗笺。它内置 5118 首经典诗词、2280 体词谱与三部韵书，全部离线可用。

**v5.1（2026-11-19）** 把格律引擎、数据与稳定性全面补强：近体诗对仗检测、换韵与邻韵通押、十四行诗韵式识别、三叠四叠词牌按段校验，经典语料扩充到 5118 首，词谱扩充到 2280 体。

---

### ✨ 核心功能

#### 🖌️ 1. 挥毫 — 创作大厅
* **体裁**：近体诗（五绝、七绝、五律、七律，含各平仄起式与变体）、词（2280 体，813 个词牌，含三叠、四叠长调）、十四行诗（莎翁体、彼特拉克体、现代汉语体）与自由体。
* **格律引擎**：逐字平仄校验、韵脚标注与出韵预警；律诗颔联、颈联**对仗检测**；词的**换韵分组**与词林正韵**邻韵通押**；近体首句**借邻韵**判定。
* **十四行诗**：自动识别 ABAB CDCD EFEF GG、彼特拉克 CDE / CDC 等韵式，逐行标出韵式字母与音节（字数）提示。
* **三部韵书**：《平水韵》、《词林正韵》（以平水韵补全，约 8.8k 字）、《中华新韵》，可全局设定默认韵书。
* **字格输入**：按格律生成字格，输入法组字期间不跳格、不截断。
* **文稿导入**：粘贴整篇文稿，自动识别标题、作者与朝代、韵书标记、序或导语、注与后记、译文赏析、落款日期，并判定体裁与词牌；可一次导入多首。
* **AI 偶成君（可选）**：在「印匣」填入自己的 API Key 后，可获得语义点评、对仗与炼字建议。不填也不影响任何其他功能。

#### 🖼️ 2. 墨迹 — 作品库与诗笺
* **横排 / 竖排预览**：宣纸纹理、乌丝栏、导语与落款；「保留句读 / 无句读」在横竖两种版式都生效，选择刷新后仍会保留。
* **金石印存**：阳文圆印、阴文方印、九叠篆、鸟虫篆、仿古圆角五种印式；生成前预载字体，首次生成也不会退回系统字体。
* **海报导出**：按内容自适应尺寸，1x / 2x / 4x 无损导出 PNG / JPG。
* **二次编辑**：作品一键载回创作大厅，恢复体裁、词牌、韵书与全部内容。
* **备份与恢复**：全部作品导出为一个 JSON 备份；导入前校验版本与完整性，损坏的备份不会覆盖现有数据。
* **管理**：按时间升降序、按体裁筛选；删除前二次确认，删除失败会明确提示作品仍在。

#### 📚 3. 卷帙 — 典籍与词谱
* **古典文献馆**：5118 首本地古诗词，支持阅读与检索。
* **词牌详情**：按段展示平仄谱（三叠、四叠正确分段）与例词，一键以该词牌开始创作；从详情进入创作不会覆盖已有草稿。
* **3D 意象共现网络**：从经典语料统计意象共现关系（Three.js 渲染），点击一个意象即可看到它最常相伴的意象。

#### ⚙️ 4. 印匣 — 设置
* 默认韵书、印章名号 / 字体 / 印式。
* 可选的 AI 服务 Key、接口地址与模型。

---

### 📦 数据来源

| 数据 | 规模 | 来源 |
| :--- | :--- | :--- |
| 经典诗词语料 | 5118 首 | [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)、[Werneror/Poetry](https://github.com/Werneror/Poetry)、[open-chinese/poetry-collection](https://github.com/open-chinese/poetry-collection)，经 OpenCC 规范化并过滤残缺字符 |
| 词谱 | 2280 体 / 813 词牌 | couyun 词谱、《钦定词谱》（Kanripo），经结构校验 |
| 韵书 | 平水韵、词林正韵、中华新韵 | 见 `data/rhyme/` |

各来源的许可证与署名见 [`docs/data/CORPUS_SOURCES.md`](docs/data/CORPUS_SOURCES.md)、[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) 与 `public/licenses/`。发现数据错误欢迎提 Issue 或 PR。

---

### 🛠️ 技术栈

* **前端**：React 19 + Vite 6 + TypeScript（严格模式），PWA 离线缓存
* **存储**：IndexedDB（连接被其他标签页关闭时自动重连）
* **3D**：Three.js（意象共现网络）
* **格律**：自研平仄与韵部状态机、对仗与十四行诗韵式检测
* **测试**：Vitest（25 个测试文件，184 项）+ Playwright 浏览器测试

---

### ⚡ 本地运行

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

macOS 也可以直接双击根目录的 **`启动.command`**，脚本会检查 Node、安装依赖并打开浏览器。

常用命令：

| 命令 | 作用 |
| :--- | :--- |
| `npm run build` | 生产构建（输出到 `dist/`） |
| `npm test` | 运行全部单元测试 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run verify:smoke` | 冒烟测试 |
| `npm run verify:browser` | Playwright 浏览器测试（需先 `npx playwright install chromium`） |
| `npm run build:rhyme` / `build:cipai` | 由 `data/` 重新生成韵书与词谱 |

开发文档与每次迭代的记录见 [`docs/README.md`](docs/README.md)。

---

## 🇺🇸 English

### 📖 Overview

**Ou Cheng (偶成)** is a writing tool for classical Chinese poetry with an Eastern brush-and-paper aesthetic. It checks tones and rhymes as you write, then lays the finished poem out as a collectible sheet with Xuan paper, ruled columns and a seal. It ships with 5,118 classical poems, 2,280 ci patterns and three rhyme dictionaries, all available offline.

**v5.1 (2026-11-19)** strengthens the meter engine, data and stability: couplet parallelism checks, rhyme switching and neighbouring-rhyme rules, sonnet rhyme-scheme detection, stanza-by-stanza checks for three- and four-stanza ci, a corpus grown to 5,118 poems and 2,280 ci patterns.

---

### ✨ Features

#### 🖌️ 1. Inkflow (挥毫) — Creation Studio
* **Forms**: regulated verse (5- and 7-character jueju and lüshi with tonal variants), ci (2,280 patterns across 813 tunes, including three- and four-stanza tunes), sonnets (Shakespearean, Petrarchan, modern Chinese) and free verse.
* **Meter engine**: per-character tone checks, rhyme marking and off-rhyme warnings; **parallelism checks** for the middle couplets of lüshi; **rhyme-switch groups** and Cilin **neighbouring-rhyme** rules for ci; first-line borrowed-rhyme handling for regulated verse.
* **Sonnets**: detects ABAB CDCD EFEF GG, Petrarchan CDE / CDC and more, labelling each line with its rhyme letter and syllable (character) count.
* **Three rhyme books**: *Pingshui Yun*, *Cilin Zhengyun* (completed from Pingshui, about 8.8k characters) and *Zhonghua Xinyun*, with a global default.
* **Grid input**: character cells follow the meter, and IME composition never skips or truncates a cell.
* **Import**: paste a whole manuscript and it recognises title, author and dynasty, rhyme-book markers, prefaces, notes and afterwords, translations and dated signatures, then detects the form and tune. Several poems can be imported at once.
* **AI companion (optional)**: add your own API key in Settings for critique, parallelism and word-choice suggestions. Everything else works without it.

#### 🖼️ 2. Ink Marks (墨迹) — Works & Poem Sheets
* **Horizontal and vertical layouts** with Xuan paper, ruled columns, preface and signature; "keep / strip punctuation" works in both layouts and is remembered across reloads.
* **Seals**: five seal styles (round relief, square intaglio, nine-fold seal script, bird-and-insect script, antique rounded); fonts are preloaded so the first seal never falls back to a system font.
* **Poster export**: sized to the content, lossless PNG / JPG at 1x, 2x or 4x.
* **Revise**: load any saved work back into the studio with its form, tune, rhyme book and text restored.
* **Backup & restore**: export everything as one JSON file; imports are checked for version and integrity, so a damaged backup never overwrites your data.
* **Manage**: sort by date, filter by form, confirm before deleting, with a clear notice if a delete fails.

#### 📚 3. Volumes (卷帙) — Library & Ci Patterns
* **Classical library**: 5,118 poems to read and search offline.
* **Ci tune pages**: tonal patterns shown stanza by stanza (three- and four-stanza tunes split correctly) with example poems; start writing in that tune in one tap without overwriting an existing draft.
* **3D imagery network**: co-occurrence of imagery mined from the corpus, rendered with Three.js; tap an image to see its closest companions.

#### ⚙️ 4. Seal Box (印匣) — Settings
* Default rhyme book, seal name / font / style.
* Optional AI key, endpoint and model.

---

### 📦 Data Sources

| Data | Size | Sources |
| :--- | :--- | :--- |
| Classical corpus | 5,118 poems | [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry), [Werneror/Poetry](https://github.com/Werneror/Poetry), [open-chinese/poetry-collection](https://github.com/open-chinese/poetry-collection), normalised with OpenCC and filtered for broken characters |
| Ci patterns | 2,280 / 813 tunes | couyun patterns and the *Qinding Cipu* (Kanripo), structurally validated |
| Rhyme books | Pingshui, Cilin, Zhonghua | see `data/rhyme/` |

Licences and attributions are in [`docs/data/CORPUS_SOURCES.md`](docs/data/CORPUS_SOURCES.md), [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and `public/licenses/`. Data corrections are welcome as issues or PRs.

---

### 🛠️ Tech Stack

* **Frontend**: React 19 + Vite 6 + TypeScript (strict), PWA offline cache
* **Storage**: IndexedDB, reconnecting automatically when another tab closes the connection
* **3D**: Three.js for the imagery network
* **Meter**: custom tone and rhyme state machines, parallelism and sonnet-scheme detection
* **Tests**: Vitest (25 files, 184 tests) + Playwright browser tests

---

### ⚡ Run Locally

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
```

On macOS you can also double-click **`启动.command`** in the project root; it checks Node, installs dependencies and opens the browser.

| Command | What it does |
| :--- | :--- |
| `npm run build` | Production build into `dist/` |
| `npm test` | Run all unit tests |
| `npm run typecheck` | TypeScript type check |
| `npm run verify:smoke` | Smoke tests |
| `npm run verify:browser` | Playwright browser tests (run `npx playwright install chromium` first) |
| `npm run build:rhyme` / `build:cipai` | Rebuild rhyme books and ci patterns from `data/` |

Development notes and per-iteration records live in [`docs/README.md`](docs/README.md).

---

## 📄 开源协议 / License

本项目代码采用 [MIT License](LICENSE)；内置数据沿用各来源的许可证，详见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
Code is licensed under the [MIT License](LICENSE); bundled data keeps the licences of its sources, listed in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

---

© 2026 偶成开发组 (Ou Cheng Dev Group). **传承经典，创新未来。 / Preserving heritage, shaping the future.**
