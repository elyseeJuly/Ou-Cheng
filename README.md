# 偶成 (Ou-Cheng) - 东方美学诗词创作助手

<div align="center">
  <p><em>“佳句本天成，妙手偶得之。”</em></p>
</div>

---

## 📖 项目简介

**偶成 (Ou-Cheng)** 是一款专注于东方美学的诗词创作与鉴赏工具。它结合了传统诗词的格律底蕴与现代 AI 技术，为创作者提供一个沉浸式、极简且专业的创作空间。

本项目已从原生原生架构全面迁移至 **React + Vite** 体系，确保了在保留高保真审美设计的同时，拥有更强大的逻辑处理与 AI 交互能力。

## ✨ 核心特性

- **✒️ 创作大厅 (Creation Room)**
  - **分屏创作体验**：左侧极简输入区，右侧实时纸型预览。
  - **沉浸式 UI**：无边框设计、下划线输入、宣纸质感背景。
  - **实时纵向预览**：自动将诗词转换为传统纵向排版，支持红印章（Red Seal）生成。
  - **多模式切换**：支持“自由创作”与“专业格律”两种模式，适配多样化需求。

- **📚 用户文集 (Works Library)**
  - **作品管理**：瀑布流式展示历史创作，支持预览、搜索及删除。
  - **审美一致性**：文集页面延续左侧导航边栏设计，保持全局交互逻辑统一。

- **⛩ 经典赏读 (Classics Appreciation)**
  - **名篇荟萃**：精选历代名家名篇，提供极简的阅读视界。
  - **灵感源泉**：在创作间隙品味经典，汲取文字与意象的力量。

- **✨ 偶成君 AI 点评**
  - 集成 **Gemini AI**，为您的诗作提供即时的格律分析、意象解读与审美建议。

## 🛠 技术栈

- **框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 6](https://vitejs.dev/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS
- **图标**: [Lucide React](https://lucide.dev/)
- **字体**: Noto Serif SC, Ma Shan Zheng, ZCOOL KuaiLe
- **AI 能力**: [Google Gemini Pro](https://ai.google.dev/)

## ⚡ 一键启动（推荐）

> **最简单的启动方式**
>
> 在 Finder 中双击项目根目录的 **`启动.command`** 文件，脚本将自动：
> 1. 初始化 Node.js 运行环境（通过 nvm）
> 2. 首次运行时自动安装所有依赖
> 3. 启动开发服务器，并自动在浏览器中打开应用
>
> ⚠️ 首次双击时，macOS 可能提示"来源不明"，请在 **系统偏好设置 → 安全性与隐私** 中点击"仍要打开"。

---

## 🚀 手动启动

### 环境依赖

- [Node.js](https://nodejs.org/) (建议最新 LTS 版本)

### 安装与运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/elyseeJuly/Ou-Cheng.git
   cd Ou-Cheng
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   在根目录创建 `.env.local` 文件并添加您的 Gemini API Key：
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 🎨 视觉设计

本项目采用了独特的“左侧大边栏”桌面布局，针对大屏幕进行了适配。
- **色彩规范**：采用温润的纸张白 (`#F7F1E3`) 作为背景，文字使用墨黑色 (`rgba(26, 26, 26, 0.85)`)，点缀朱砂红 (`#B22222`)。
- **排版系统**：创作核心区采用 **Vertical Writing Mode**，还原宣纸书写体验。

## 🤝 贡献指南

我们欢迎并感谢任何形式的贡献！如果您有好的建议或发现了 Bug，请通过以下方式参与：

1. **提交 Issue**：描述您遇到的问题或建议的功能。
2. **提交 Pull Request**：
   - Fork 本仓库。
   - 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)。
   - 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)。
   - 推送到分支 (`git push origin feature/AmazingFeature`)。
   - 开启一个 Pull Request。

### 开源要求
- 请保持代码风格的一致性。
- 提交 PR 前请确保本地运行无误。
- 对于涉及 UI 变动的贡献，请附上截图或录屏。

### 鸣谢与数据归属
本项目的“经典赏读”模块中，唐诗与宋词的数据来源于开源项目 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)。特别感谢该项目对中华传统文化数字化的贡献！

## 📄 开源协议


本项目采用 [MIT License](LICENSE) 开源协议。您可以自由地使用、修改和分发本项目，但请保留原作者的版权声明。

---

© 2026 偶成开发组。传承经典，创新未来。
