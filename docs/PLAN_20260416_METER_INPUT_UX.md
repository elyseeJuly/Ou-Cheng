# 偶成 (Ou Cheng) — 专业格律穿插填字与长调格律补全实施方案书
> **文档类别**: 阶段执行方案 (`EXEC_PLAN`)  
> **关联会话**: 专业格律穿插录入改造与长调截断缺陷修复  
> **真实时间**: 2026-04-16  
> **设计依据**: [/Users/quantumrose/Documents/Emberois/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md)

---

## 📖 一、 背景与设计痛点

在当前的专业格律（近体诗/词牌）创作模式中，存在若干严重的交互硬伤和底层数据缺陷，极大地制约了用户的“心流填词”体验。

### 🚨 核心痛点
1. **输入字数无硬性约束**：旧版采用大统一的 Textarea 文本框，用户填词时需要自己数数字，无法做到与选择的格律或词牌的每句字数 1:1 动态限制，容易导致出界。
2. **标点排版仪式感匮乏**：原有的输入区域和格律点阵是不带任何标点的。对于长短句错落的宋词而言，没有标点的视觉排布显得单调、杂乱，缺乏古典水墨般的韵律美。
3. **分栏布局的割裂感**：原本的格律点阵在最下方，而大输入框在上方。当用户在大输入框内填字时，必须频繁低头比对下方的平仄点阵，视觉视线来回跳跃，极其割裂。
4. **长调词牌（字数 > 91）整体拦腰折断**：底层数据库 `cipai.json` 中的很多长调（如《莺啼序》、《望海潮》、《六州歌头》、《兰陵王》等）由于早期仅录入了前两个小结作为测试占位符，导致字数和格律全部被腰斩，在前端变成了“半截诗”。

---

## 🛠&emsp;二、 技术实施方案

为了彻底重构这一体验，我们将曾经笼统的大文本输入框（Textarea）进行外科手术式拆解，代之以全新的 **结构化长短句矩阵 (`StructuredInput`)** 引擎，并彻底清洗补全底层长调词牌数据。

### 1. 结构化受控输入组件开发
新建 [StructuredInput.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/creator/StructuredInput.tsx) 组件：
- 根据当前选定的近体诗或词牌的 `patterns`（二维数组），为每一行渲染一个独立的 `<input type="text">`。
- 将 `maxLength` 限制属性硬绑定到每一行格律的字数长度（例如第一句 6 个字，则限制 `maxLength={6}`），在输入框右下方动态显示字数占比悬浮标记（如 `6/6`）。
- **智能跨行对焦**：使用 `useRef` 数组托管所有 input 元素，监听 `onKeyDown`。当用户敲击 `Enter` 或按下 `ArrowDown` 时自动聚焦到下一有效行；按下 `ArrowUp` 聚焦上一行；当当前行删空且按下 `Backspace` 时自动缩退回上一有效行。
- **智能句读符号结算**：在每行输入框末尾自动探测并追加渲染。若是阙（Stanza）的尾气或韵脚（含 `R` 或 `r`），渲染句号 `。`；否则默认追加逗号 `，`。

### 2. 双轨布局切换机制
在 [Create.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Create.tsx#L495-L503) 页面引入 `proInputMode: 'split' | 'interleaved'` 的状态切换：
- **方案 A（分栏模式 - `split`）**：格律大点阵 `<MeterGrid>` 仍然作为整体收纳展示在下方，输入框仅在上方展示。
- **方案 B（穿插模式 - `interleaved`）**：在 [StructuredInput.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/creator/StructuredInput.tsx#L102-L139) 中，将每一句的小巧平仄图标记点阵逐行贴附悬浮在它的专属文字输入框上方。

### 3. 长调词牌数据库底层重整
采用 Python 清洗脚本 [fix_long_cipai.py](file:///Users/quantumrose/Documents/Emberois/ou-cheng/scratch/fix_long_cipai.py)：
- 将《莺啼序》、《望海潮》、《六州歌头》等长调词牌的完整格律信息以拼音格式（X、P、Z、R）重新格式化，清洗成 `cipai.json` 要求的 `upperPattern`/`lowerPattern` 字段。
- 在清洗时，引入空字串作为“阙隔断占位符”。前端渲染时，若遇到空数组或空字串，自动渲染 **“· 换阕 ·”** 的虚线隔断，实现极具视觉层次感的阙段分流展示。

---

## 📂 三、 涉及修改与新增文件映射

### 1. [NEW] [StructuredInput.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/creator/StructuredInput.tsx)
- **职能**：实现行长强制约束、智能句读匹配、穿插式布局渲染、键盘跨行导航。

### 2. [MODIFY] [Create.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Create.tsx#L495-L503)
- **改动**：集成新组件，持久化 `proInputMode` 状态。在保存诗词时，在后台将 `proLines` 数组自动拼接上匹配的标点句读，合并为一整段优雅带标点的文本，永久沉淀至作品库中。

### 3. [MODIFY] [cipai.json](file:///Users/quantumrose/Documents/Emberois/ou-cheng/public/data/cipai.json)
- **改动**：用补全清洗后的长调数据无损覆写坏数据，让长调（如字数多达 240 字、包含四阕的《莺啼序》）完全展现。

---

## 🚫 四、 AI 执行约束与红线

> [!IMPORTANT]
> 1. **强制光标对齐与阻隔**：单行输入必须硬性受控于格律行字数，不能依赖保存时的校验。浏览器必须强行阻隔溢出的字符输入。
> 2. **零编译报错（TS Zero-Error）**：必须确保 `StructuredInputProps` 接口与 `Create.tsx` 交互状态类型高度匹配，严禁隐式 any 泄露。
> 3. **极简样式复用**：`StructuredInput` 内的平仄气泡点阵应当与 `MeterGrid` 组件样式保持高度一致，禁止随意引入游离的、非系统定义的 UI 配色。
