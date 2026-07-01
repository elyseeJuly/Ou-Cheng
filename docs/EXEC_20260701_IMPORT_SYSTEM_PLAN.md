# 自动识别多首诗词导入与文集管理系统设计 (修订版)

本方案旨在解决「偶成」应用中导入与格律认定的核心痛点：
1. **支持任意 OpenAI 兼容大模型 API**：API 导入与点评不局限于 Gemini，支持通过自定义 `apiBaseUrl` 和 `apiModel` 接入 OpenAI、DeepSeek、Kimi 等任意主流大模型。
2. **专业级本地平仄与格律识别 (引入 `pinyin-pro`)**：
   - 引入开源拼音库 `pinyin-pro`，支持对**所有汉字**的现代拼音和声调进行提取，完美覆盖「中华新韵」；
   - 建立**入声字与平仄 exceptions 映射表**，结合 `pinyin-pro` 的现代声调，实现高精度的本地「平水韵」和「词林正韵」平仄判定，消除 200 字字典的局限性。
3. **近体诗格律变体自动判定**：导入律诗/绝句时，自动运行格律引擎比对该题材下的全部 4 种起律变体（平起/仄起，入韵/不入韵），自动选择违规字数最少的最佳匹配格律变体，避免硬编码默认值。
4. **多首诗词批量导入与文集归类**：一键拆分长文稿并支持批量分类至自定义文集。

---

## 架构与数据定义设计

### 1. 诗词与设置类型定义升级
在 [types.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/types.ts) 中增加 `collectionName` 与 `apiModel` 字段：
```typescript
export interface Poem {
  // ... 现有字段
  collectionName?: string; // 所属文集
}

export interface UserSettings {
  // ... 现有字段
  apiKey?: string;
  apiBaseUrl?: string;
  apiModel?: string; // [新增] 自定义大模型名称（如 deepseek-chat, gpt-4o 等）
}
```

### 2. 引入开源库 `pinyin-pro`
在项目依赖中引入 `pinyin-pro`。它是一个轻量级、零依赖的拼音汉字转换库，具备高精度的多音字和声调提取能力，适用于 Node.js 和浏览器。

---

## 本地平仄识别算法升级 (`rhymeData.ts`)

### 1. 「中华新韵」全汉字支持
在 [rhymeData.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/rhymeData.ts) 中引入 `pinyin-pro`：
- 使用 `pinyin(char, { toneType: 'num', type: 'array' })` 获取字符的拼音。
- 提取声调数字（1、2 为平声 `P`，3、4 为仄声 `Z`，5 或无声调作为轻声默认处理）。

### 2. 「平水韵」与「词林正韵」例外字映射
由于古代平水韵中存在“入声字”（现代普通话归入 1、2 声，但在古代为仄声）以及古今音变：
- 整理一个高频**入声字及音变例外字典**（如：`国, 百, 发, 得, 十, 七, 八, 日, 一, 入, 别, 出, 独, 读, 毒, 宿, 佛, 阁, 答, 塔, 劫, 决, 绝, 觉, 续, 俗, 逐, 烛, 轴, 铁, 舌, 敌, 笛, 极, 辑, 疾, 击, 织, 释, 适, 宿, 洁, 杰, 结, 劫, 捷, 截, 骨, 谷, 忽, 突, 凸, 薄, 泊, 驳, 拨, 夺, 捉, 酌, 昨, 杂, 凿, 直, 直, 植, 熟, 属, 蜀, 什, 食, 实, 石, 识, 辖, 侠, 狭, 峡, 辖, 瞎, 协, 胁, 叶, 歇, 学, 雪, 约, 缚, 剥, 瀑` 等）；
- 对于平水韵或词林正韵，查询时：
  1. 若汉字命中例外字典，则返回例外定义的平仄（如“国” -> `Z`）；
  2. 否则，降级使用 `pinyin-pro` 获取现代拼音的声调进行平仄映射（1/2 -> `P`, 3/4 -> `Z`）。
- 结合原有的多音字判定，极大提升本地平仄判定的覆盖率 and 准确度。

---

## 导入模式与拆分算法设计

### 1. 本地拆分与格律自动判定
在本地快速解析 `localParseManuscript` 中：
- **拆分逻辑**：通过双换行符 `\n\n` 分块。
- **题材判定**：
  - **十四行诗 (sonnet)**：英文占比 > 50% 且刚好 14 行。
  - **近体诗 (jueju_5/7, lvshi_5/7)**：若字数均等（全部为 5 字或 7 字且行数为 4 或 8 行），则触发**变体自动匹配**。
  - **词牌 (cipai)**：通过标题或正文匹配已知词牌（如：浣溪沙、江城子、水调歌头 等）。
  - **现代诗/自由创作 (free)**：非均等字数且未匹配词牌的作品，默认判定为自由创作/现代诗。
- **近体诗变体自动匹配**：
  在识别为近体诗时，遍历该题材对应的 4 种变体模板（如：仄起首句不入韵、平起首句入韵等），调用 `checkJintiShi` 运行格律比对，**自动选择违规字数最少（violationCount 最小）的变体作为该诗词的 `jintiVariant`**。

### 2. 多模型兼容的 AI 智能判定与拆分 (`geminiService.ts`)
重构 [geminiService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/services/geminiService.ts) 以支持第三方 OpenAI 兼容 API（如 DeepSeek, Kimi）：
- 检查 `apiBaseUrl`。如果配置了非 Google 域名且提供了 API Key，则使用标准的 `fetch` 接口请求 `${apiBaseUrl}/chat/completions`。
- 请求头包含 `Authorization: Bearer ${apiKey}`。
- 请求体使用标准 OpenAI 格式，传递模型名称 `apiModel` (如 `deepseek-chat`)，支持 `response_format: { type: "json_object" }`（若要求 JSON 响应）。
- 适配此通用调用方式重构 `checkMeterAndComment`、`chatWithPoet` 及新增的 `splitAndClassifyManuscript`。

---

## 界面与用户交互重构

### 1. 导入文稿弹窗 (ImportModal) 升级
- **录入阶段**：增加“所属文集”选择器（下拉菜单含已有文集名称，亦可输入新文集名）。
- **解析模式**：
  - 「⚡ 本地快速解析」：即时根据 `pinyin-pro` 及规则进行解析。
  - 「🤖 AI 智能解析」：若配置了 API Key，支持点击；若未配置，显示指引。解析时使用配置的大模型进行拆分与判定。
- **预览微调阶段**：以卡片列表形式展示拆分出的多首诗词，用户可勾选导入，调整每首诗词的标题、作者、体裁分类。

### 2. 我的墨迹页面 (Works) 文集侧边栏与管理
- **双栏布局**：左侧展示文集侧边栏，右侧为作品网格。
- **分类筛选**：支持“全部墨迹”、“未分类”及各个自定义文集（📓）的切换过滤。
- **文集重命名与级联删除**：
  - 鼠标悬浮在文集上时显示重命名与删除按钮。
  - 删除文集时弹出对话框，由用户选择“仅删除文集，保留其下诗词（变更为未分类）”或“级联删除文集下所有诗词”。
- **卡片元信息**：属于文集的作品，卡片中会以标签形式标注文集名称。

---

## 拟修改/新增文件列表

1. [package.json](file:///Users/quantumrose/Documents/Emberois/ou-cheng/package.json): [MODIFY] 添加 `pinyin-pro` 依赖。
2. [types.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/types.ts): [MODIFY] 在 `Poem` 接口中添加 `collectionName?: string`；在 `UserSettings` 接口中添加 `apiModel?: string`。
3. [storageService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/services/storageService.ts): [MODIFY] 增加 `getCollections`、`renameCollection`、`deleteCollection` 等核心存储操作。
4. [rhymeData.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/rhymeData.ts): [MODIFY] 引入 `pinyin-pro`，添加常用入声字例外词典，升级平仄判定引擎。
5. [geminiService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/services/geminiService.ts): [MODIFY] 实现通用 OpenAI 兼容模型调用逻辑，升级原有的 `checkMeterAndComment` 与 `chatWithPoet`；新增 `splitAndClassifyManuscript`。
6. [Settings.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/pages/Settings.tsx): [MODIFY] 在「AI 接入」Tab 中增加“模型名称”输入项（对应 `apiModel`），允许用户输入任意模型（如 `deepseek-chat`）。
7. [ImportModal.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/components/creator/ImportModal.tsx): [MODIFY] 重构为分步向导，支持多首拆分结果的卡片预览、勾选、微调、起律变体自动比对，以及文集指定。
8. [Works.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/pages/Works.tsx): [MODIFY] 引入左侧文集管理侧边栏、级联/非级联删除与重命名，在作品卡片上展示所属文集。
9. [Create/index.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/pages/Create/index.tsx): [MODIFY] 适配 `ImportModal` 的批量导入返回值，保存所有导入作品，并将第一首载入编辑器。

---

## 验证与测试方案

### 1. 自动化测试
- 编写 [importParser.test.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/importParser.test.ts)，校验：
  - 例外字典与 `pinyin-pro` 结合对平水韵平仄判定的准确性（如“国”、“白”是否被识别为仄，普通平仄是否正确）。
  - 近体诗变体自动匹配算法能否为一篇绝句/律诗正确识别并选择包含最少失误的变体。
  - 多首诗词混合输入时是否能按预期正确拆分。
- 运行 `npm run test` 以确保所有测试通过。

### 2. 手动功能验证
- 启动 `npm run dev`。
- 前往「印匣」，测试配置第三方模型（如 DeepSeek，输入 `apiBaseUrl: https://api.deepseek.com/v1`, `apiModel: deepseek-chat`），测试 AI 点评与 AI 导入解析是否工作正常。
- 粘贴包含古体诗、现代诗、词作和英十四行的多首诗，分别使用本地解析和 AI 解析，核对体裁识别准确度与近体诗变体格律的匹配度。
- 进行文集的增、删、改、筛选操作，检查墨迹卡片的文集归属显示是否完美。
