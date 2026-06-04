# 偶成 (Ou Cheng) — 东方美学诗词助手 / Eastern Aesthetic Poetry Assistant

<div align="center">
  <p><em>“佳句本天成，妙手偶得之。” / "A beautiful verse is born of nature, captured by chance through a master's touch."</em></p>
  <p>
    <a href="#-简体中文">简体中文 (Chinese)</a> | <a href="#-english">English</a>
  </p>
  <p>
    <a href="https://elyseejuly.github.io/Ou-Cheng/">
      <img src="https://img.shields.io/badge/Version-v5.0.0-B22222?style=for-the-badge" alt="Version">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-444444?style=for-the-badge" alt="License">
    </a>
    <a href="https://github.com/chinese-poetry/chinese-poetry">
      <img src="https://img.shields.io/badge/Data-Chinese--Poetry-8A2BE2?style=for-the-badge" alt="Data Source">
    </a>
    <a href="https://react.dev/">
      <img src="https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    </a>
  </p>
</div>

---

> [!IMPORTANT]
> 🚀 **在线体验 / Live Demo**: 
> - **[点击此处访问在线体验 (Demo Link)](https://elyseejuly.github.io/Ou-Cheng/)**
> - **[Click here to experience Ou Cheng online (Demo Link)](https://elyseejuly.github.io/Ou-Cheng/)**

---

## 🇨🇳 简体中文

### 📖 项目综述

**偶成 (Ou Cheng)** 是一款专为现代创作者打造的东方美学诗词创作与灵感探寻工具。它将传统的纸墨意境与前沿数字技术相融合，不仅提供极高格律严谨性的**实时检测引擎**，更创新性地融合了**3D 意象共现灵感球**与**智能 AI 创作辅助**，为您构建一个沉浸式的心流数字书斋。

在 **v5.0 “意理通流” 重大更新**中，我们完善了底层格律变体架构，引入了智能一键文稿导入，打通了作品二次编辑心流，并重构了基于海量经典文本的真实意象共现 3D 动力学连线网络，助力您的每一次落笔。

---

### ✨ 核心功能模块

#### 🖌️ 1. 挥毫 (Inkflow Creation) — 创作大厅
* **跨时空体例支持**：支持近体诗（五绝、七绝、五律、七律及不同平仄变体）、词牌（内置高频词牌格律）、十四行诗（经典莎翁体、彼特拉克体、现代体）及自由创作。
* **专业格律引擎**：集成核心 `Meter Engine`，提供实时平仄校验、韵脚自动标注与错漏违规预警，内置《平水韵》、《词林正韵》及《中华新韵》。
* **分屏沉浸布局**：左侧结构化输入格律提示，右侧实时纸型渲染预览，支持横竖排版一键切换。
* **AI 偶成君点评**：通过 Gemini 大模型提供符合古典诗性逻辑的语义点评、对仗建议与炼字润色建议。
* **一键智能导入 [v5.0 新增]**：智能识别粘贴文稿的行数与字数，自动判定并匹配相应体裁，同时支持手动修正覆盖。

#### 🖼️ 2. 墨迹 (Mo Ji / Works) — 个人作品库
* **宣纸花笺呈现**：提供宣纸纹理及多种古典视觉卡片底纹，精细还原墨宝质感。
* **金石印存**：支持自定义生成艺术印章（包含阳文、阴文、九叠篆等古风印章），为导出的画卷钤印。
* **二次编辑修改 [v5.0 新增]**：打通闭环，作品详情中支持“编辑修改”，一键载入创作大厅还原历史创作状态。
* **全量备份与流通 [v5.0 新增]**：支持一键将所有作品导出为备份 JSON 文件，或通过 JSON 文件批量恢复数据。
* **自定义确认弹窗 [v5.0 新增]**：移除了浏览器原生 confirm 警告框，重构了更具国风古典美学的防误删二次确认弹层。
* **时序与类型检索 [v5.0 新增]**：支持按创作时间升序/降序、体裁类型过滤等方式快速管理您的文稿。
* **高精无损导出**：支持 1x/2x/4x 无损缩放导出 PNG/JPG，为您的诗词画卷达到收藏级输出精度。

#### 📚 3. 卷帙与意象 (Volumes & Imagery) — 典籍库与词云
* **古典文献馆**：内置 1941 首本地古诗词（源自 `chinese-poetry` 库精简清洗），支持结构化阅读与智能检索。
* **3D 意象共现网络 [v5.0 重构]**：
  * 基于真实历史诗库重建了意象共现矩阵引擎（通过 `build-imagery.cjs` 提取 144 个核心古典意象种子词的关联度）。
  * 采用 Three.js 3D 渲染，点击词云意象（如“明月”）将高亮并动态绘制到达其最强关联词（如“相思”、“清酒”、“离愁”）的金色贝塞尔曲线，弱化非关联词（透明度降至 0.15），可视化发散创作灵感。
* **纠错反馈**：内置 AI 审计功能，一键生成修改差异 JSON，鼓励创作者将数据问题反哺开源社区。

#### ⚙️ 4. 印匣 (Settings) — 系统配置
* 统一的大模型 API Key 安全录入。
* 全局默认韵书（平水韵 / 词林正韵 / 中华新韵）配置。
* 独立印章配置，设置名号、字体与印章样式。

---

### 🛠️ 技术底层

* **前端框架**: React 19 + Vite 6 + TypeScript (严格编译模式)
* **3D 引擎**: Three.js (用于词云交互与 Bezier 空间连线)
* **视觉系统**: CSS 滤镜 (模拟纸张纤维纹理) + 原生 CSS 变量控制 (无 Tailwind 额外负担，保持响应式极速响应)
* **核心逻辑**: 自研正则与平仄匹配状态机，多源韵书字典（平水韵 9k+ 字，中华新韵等）。

---

### ⚡ 快速开始 (本地运行)

1. **双击启动**：在 Finder 中双击根目录下的 **`启动.command`**（或在终端运行 `npm run dev`）。
2. **环境配置**：脚本会自动检查 Node.js 环境、安装依赖并拉起浏览器。
3. **录入 API Key**：请在「印匣 (Settings)」页面中录入您的大模型 [Gemini API Key](https://aistudio.google.com/)，以激活 AI 偶成君点评与纠错功能。

---

## 🇺🇸 English

### 📖 Project Overview

**Ou Cheng (偶成)** is a digital study and appreciation tool designed for creators of classical and modern poetry. It blends traditional Eastern aesthetic brush-and-ink elements with modern interactive technology. It features a real-time **Prosody & Rhyme Meter Engine**, an interactive **3D Imagery Cloud Network**, and a **Semantic AI Writing Companion** to create an immersive, calm creative flow.

In the **v5.0 "System Flow" Release**, we expanded the underlying metrics engine, integrated smart document importing, added secondary work revisions, and built a brand-new **3D Co-occurrence Imagery Network** mapped from large-scale classical corpuses.

---

### ✨ Core Modules

#### 🖌️ 1. Inkflow (挥毫) — Creation Studio
* **Multi-Genre Support**: Fully accommodates regulated verses (Five/Seven-Character Jueju & Lvshi with variant tone styles), Song Lyrics (Cipai formulas), Sonnets (Shakespearean, Petrarchan, Modern), and Free Verse.
* **Meter Engine**: Performs real-time checks on tone patterns (Ping/Ze), rhyming marks, and structures, showing errors instantly. Comes pre-loaded with *Pingshui Yun*, *Cilin Zhengyun*, and *Zhonghua Xinyun*.
* **Immersive Layout**: Split-screen design featuring structured meter guides on the left and a live, elegant scroll preview on the right (supports instant horizontal/vertical text toggling).
* **AI Companion "Ou Cheng Jun"**: Powered by Gemini, providing lyrical aesthetic analysis, structural/parallelism critique, and word-polishing suggestions.
* **Smart Text Import [New in v5.0]**: Analyzes lines and character patterns of pasted texts to auto-detect and configure the matching genre, with manual override settings.

#### 🖼️ 2. Ink Marks (墨迹) — Works Collection
* **Xuan Paper Aesthetics**: Display written works on realistic Xuan paper cards with classical textured borders.
* **Artistic Stamp Seals**: Generate custom digital signature stamp seals (featuring Yin/Yang seal script styles) to stamp on exported works.
* **Secondary Revision [New in v5.0]**: Edit previously saved poems by loading them directly back from your archive into the Creation Studio with all historical parameters restored.
* **Batch Backup & Restore [New in v5.0]**: Export your entire poetry collection into a single JSON file for offline backups, or restore data via import.
* **Classical UI Dialogs [New in v5.0]**: Native browser alerts replaced with beautifully styled Eastern-themed confirmation popups for zero distraction.
* **Sorting & Querying [New in v5.0]**: Organize works chronologically (ascending/descending) or filter by specific poetic genres.
* **High-Res Export**: Support 1x/2x/4x lossless scaling to export works as crisp JPG/PNG files ready for print or sharing.

#### 📚 3. Volumes & Imagery (卷帙与意象) — Library & 3D Cloud
* **Classical Library**: Home to 1,941 curated offline classical poems (derived from the `chinese-poetry` database) for local lookup and reading.
* **3D Imagery Association Network [Rebuilt in v5.0]**:
  * An imagery co-occurrence matrix engine compiled from the classical corpus (calculating the semantic linkages of 144 core imagery concepts via `build-imagery.cjs`).
  * Powered by Three.js. Clicking an imagery node (e.g., "Bright Moon") highlights it and dynamically draws glowing golden Bezier curves to its strongly related words (e.g., "Lovesick", "Clear Wine"), fading irrelevant nodes to 0.15 opacity.
* **AI Auditing**: Scan for historical database errors and generate diff JSON reports to contribute corrections back to upstream open-source communities.

#### ⚙️ 4. Seal Box (印匣) — Settings & Setup
* Secure Gemini API Key configuration.
* System default rhyming dictionary setup (Pingshui, Cilin, Zhonghua).
* Dynamic seal stamp designer (text, fonts, stamp styles).

---

### 🛠️ Technology Stack

* **Frontend**: React 19 + Vite 6 + TypeScript (Strict Compiler Mode)
* **3D Graphics**: Three.js (for the 3D Imagery Network and Bezier arc rendering)
* **Styles**: Native CSS variables + CSS blend mode filters (for Xuan paper grain effects), lightweight, fast, and fully responsive.
* **Core engine**: Custom regular expression engines for prosodic scanning and rhyme analysis.

---

### ⚡ Quick Start

1. **Launch**: Double-click **`启动.command`** in Finder (or run `npm run dev` in your terminal).
2. **Setup Dependencies**: The script auto-installs missing Node dependencies and opens the web portal.
3. **API Activation**: Insert your [Gemini API Key](https://aistudio.google.com/) in the "Seal Box (Settings)" panel to activate the AI critique and audit features.

---

## 📄 开源协议 / License

本项目采用 [MIT License](LICENSE)。我们在保留版权声明的前提下，鼓励所有的二次开发与文学创作。  
This project is licensed under the [MIT License](LICENSE). We encourage creative extensions and derivatives while retaining original copyrights.

---

© 2026 偶成开发组 (Ou Cheng Dev Group). **传承经典，创新未来。 / Preserving heritage, shaping the future.**
