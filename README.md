# 偶成 (Ou Cheng) — v4.0 东方美学诗词创作助手

<div align="center">
  <p><em>“佳句本天成，妙手偶得之。”</em></p>
  <p>
    <img src="https://img.shields.io/badge/Version-4.0-B22222?style=flat-square" alt="Version">
    <img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License">
    <img src="https://img.shields.io/badge/Tech-React__19-61DAFB?style=flat-square" alt="React">
  </p>
</div>

---

## 📖 项目综述

**偶成 (Ou Cheng)** 是一款专为文人志士打造的东方美学诗词创作与鉴赏工具。它不仅是一个编辑器，更是一个集**格律校验、意象探索引导、艺术级排版导出**于一体的数字书斋。

在 **v4.0 "东方美学" 重大更新**中，我们重构了整个项目的底层架构，引入了更专业的格律检测引擎与更加细腻的视界设计，旨在为您提供最纯粹的创作体验。

## ✨ 核心功能模块

### ✒️ 创作大厅 (Creation Room v4.0)
- **跨时空体例支持**：完美支持近体诗（绝句、律诗）、词牌、十四行诗（莎翁体、彼特拉克体、现代体）及自由创作。
- **专业格律引擎**：集成 `Meter Engine`，提供实时平仄校验、韵脚标注及违规预警，内置《平水韵》、《词林正韵》及《中华新韵》。
- **分屏沉浸布局**：左侧结构化输入，右侧实时纸型预览，支持横竖排版一键切换。
- **AI 偶成君点评**：通过 Gemini AI 提供不仅限于文本的意趣点评、炼字建议。

### 🖼️ 艺术级导出系统 (Export System)
- **金石印存**：内置多种艺术印章样式（阳文、阴文、九叠篆等），支持动态生成笔名印章。
- **宣纸花笺**：提供多种宣纸纹理（梅花、云纹、竹影等）背景，完美还原纸墨质感。
- **极清画面**：支持 1x/2x/4x 无损缩放导出 PNG/JPG，为您生成的诗词画卷达到收藏级精度。

### ⛩️ 典籍与意象 (Classics & Imagery)
- **3D 意象云**：从历代典籍中提取核心意象，以 3D 动力学词云展示，助您在枯竭时捕捉灵感。
- **古籍赏读**：基于海量唐宋诗词数据，提供深度阅读与结构化检索。

## 🛠 技术底层

- **前端框架**: React 19 + Vite 6 (标准模块化架构)
- **视觉系统**: Tailwind CSS + 原生 CSS 滤镜 (模拟纸张纤维纹理)
- **核心逻辑**: 自研 `src/engine/` 核心，处理高并发格律运算与正则匹配
- **数据来源**: 特别鸣谢 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 项目提供的数字化支持

## ⚡ 快速开始 (macOS)

为了让您能够立即进入创作状态，我们为 macOS 用户准备了“一键启动”方案：

1. **下载并进入目录**
2. **双击启动**：在 Finder 中双击根目录下的 **`启动.command`**。
   *该脚本会自动检查 Node.js 环境、安装依赖并开启开发服务器。*

---

## 🚀 手动部署

### 1. 环境准备
- Node.js (v18.0 或更高版本)
- 一个 [Google AI Studio](https://aistudio.google.com/) 的 API Key (用于 AI 点评功能)

### 2. 初始化
```bash
npm install
```

### 3. 配置
在根目录创建 `.env.local` 文件：
```env
VITE_GEMINI_API_KEY=您的_API_KEY
```

### 4. 运行
```bash
npm run dev
```

## 📄 开源协议

本项目采用 **MIT License**。我们鼓励您在保留原作者版权声明的前提下，自由地进行二次开发与艺术创作。

---

© 2026 偶成开发组。**传承经典，创新未来。**
