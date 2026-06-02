# 偶成 (Ou Cheng) v4.0 — 全系统深度审计报告
> **文档类别**: 系统审计报告 (`AUDIT`)  
> **审计范围**: 全量代码、数据资产、工程依赖与交互体验  
> **审计日期**: 2026-06-02  
> **审计基准**: 4 页面 · 15 组件 · 4 服务 · 1 引擎模块 · 3 数据资产  
> **设计依据**: [SPEC_20260520_AI_CODER_BEHAVIORAL_GUIDELINES.md](file:///Users/quantumrose/Documents/Emberois/SPEC_20260520_AI_CODER_BEHAVIORAL_GUIDELINES.md) / [SPEC_20260520_AI_DEVELOPMENT_SOP.md](file:///Users/quantumrose/Documents/Emberois/SPEC_20260520_AI_DEVELOPMENT_SOP.md)

---

## 📊 一、 审计总览

| 审计维度 | 发现数量 | 严重等级分布 |
| :--- | :--- | :--- |
| **🔴 致命缺陷 (Critical Bug)** | 2 | 必须立即修复 |
| **🟠 重大缺陷 (Major Bug)** | 5 | 影响核心功能体验 |
| **🟡 一般缺陷 (Minor Bug)** | 6 | 影响边缘场景或美学表现 |
| **⚪ 死代码/冗余 (Dead Code)** | 5 | 需清理以维持工程洁癖 |
| **🔵 功能缺失 (Missing Feature)** | 4 | 用户价值高但当前未实现 |
| **🟢 优化建议 (Enhancement)** | 5 | 锦上添花，非紧急 |

---

## 🔴 二、 致命缺陷 (Critical Bugs)

### C-1. 保存诗词类型字段不匹配 — `derivedPoemType` 越界

- **文件**: [Create.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Create.tsx#L208)
- **现象**: 专业格律模式（近体诗）保存时，`poem.type` 被赋值为 `derivedPoemType`（如 `"jueju_5_ze_no"`），而 `PoemType` 联合类型仅定义了 `'jueju_5'`、`'jueju_7'` 等基本值。
- **影响链路**:
  1. `Works.tsx` 中的 `getTypeLabel()` 无法匹配到该复合 key，最终在作品卡片上显示原始字符串 `"jueju_5_ze_no"` 而非"五绝"。
  2. 如果将来需要按类型统计、分组展示或导出，该字段会全线失灵。
- **修复建议**: 保存时将 `poem.type` 强制还原为基础 `PoemType` 值（如 `'jueju_5'`），额外的起调/韵式信息存入独立字段（如 `jintiVariant`）。

### C-2. 清除按钮在专业格律模式下失效

- **文件**: [Create.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Create.tsx#L557)
- **现象**: 底部"清除"按钮仅重置 `content`（自由模式的文本），未同步重置 `proLines`（专业格律模式的受控多行数组）。
- **影响**: 用户在专业格律模式下点击"清除"后，界面残留全部已输入内容，造成"按钮失灵"的假象。
- **修复建议**: 在 `onClick` 回调中增加 `setProLines([])`。

---

## 🟠 三、 重大缺陷 (Major Bugs)

### M-1. `rhymeData.ts` 中 `'...'` 被误映射为字符

- **文件**: [rhymeData.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/rhymeData.ts#L144)
- **现象**: 在 `XIN_YUN_MAP` 中，字面量 `'...'` 被错误映射为仄声字 `'Z'`。这是一个残留的占位符。
- **影响**: 若用户输入包含省略号的文本，格律检测器会将其误判为"仄声字"，产生错误的审计结果。

### M-2. 意象词云（`imagery.json`）数据极度匮乏

- **文件**: [imagery.json](file:///Users/quantumrose/Documents/Emberois/ou-cheng/public/data/imagery.json)
- **现象**: 当前仅包含 **20 个硬编码意象词**（明月、东风、落花……），`frequency` 为手动填写的 mock 数据。
- **影响**: 3D 词云视觉上极其稀疏（仅 20 个粒子漂浮在球体上），无法达到"典藏 33,000 首"应有的数据底蕴和视觉冲击。词云对灵感激发的价值极为有限。

### M-3. 韵脚校验永远处于 `'unverified'` 状态

- **文件**: [meterChecker.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/meterChecker.ts)
- **现象**: `MeterCheckResult.rhymeCheckStatus` 始终为 `'unverified'`。格律校验引擎目前仅检查平仄，不检查韵脚是否归入同一韵部。
- **影响**: 用户无法得知自己创作的诗词是否押韵，而押韵是近体诗/宋词最核心的格律要素之一。

### M-4. 词云缺乏"意象连线"交互

- **文件**: [WordCloud3D.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/library/WordCloud3D.tsx)
- **现象**: 点击一个意象词后，仅展开相关诗词列表。没有实现"联想连线"功能——即点击"明月"后，应同时高亮并牵连出"相思"、"离愁"、"西楼"等共现频率高的关联意象，以可视化关联网络启发灵感。
- **影响**: 词云作为灵感激发核心交互，缺乏深度联想能力，沦为简单的关键词检索入口。

### M-5. 个人文集（作品库）功能缺失严重

- **文件**: [Works.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Works.tsx)
- **现象**: 当前仅为简单的 CRUD 列表 + 模态详情 + 导出海报，缺少以下用户高频诉求：
  - ❌ 不支持"编辑已有作品"（只能查看和删除）
  - ❌ 不支持"导入外部文稿"
  - ❌ 不支持按类型/日期排序、按文集分组
  - ❌ 不支持全量导出/备份为 JSON 文件
  - ❌ 不支持批量操作（多选删除/导出）
- **影响**: 随着用户作品数量增长，管理和检索体验会迅速恶化。

---

## 🟡 四、 一般缺陷 (Minor Bugs)

### N-1. AI 点评请求硬编码韵书标签为"平水韵"

- **文件**: [Create.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Create.tsx#L159-L161)
- **现象**: 自由模式下发送给 AI 的点评请求中，韵书标签始终写为"平水韵"，未根据用户实际的 `rhymeBook` 设置动态适配。

### N-2. `confirm()` 原生弹窗破坏东方美学统一风格

- **文件**: [Works.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Works.tsx#L29)
- **现象**: 删除诗词时使用了 `window.confirm()`，弹出的是浏览器原生的灰色方框弹窗，与应用精心打造的"朱砂红 + 宣纸白"东方美学体系格格不入。

### N-3. 详情弹窗缺乏键盘无障碍支持

- **文件**: [Works.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Works.tsx#L199-L240)
- **现象**: 弹窗没有监听 `Escape` 按键关闭，也没有 Focus Trap（焦点陷阱），Tab 键会穿透到背景元素。

### N-4. 移动端 (< 768px) 导航完全不可用

- **文件**: [index.css](file:///Users/quantumrose/Documents/Emberois/ou-cheng/index.css)
- **现象**: 响应式媒体查询直接 `display: none` 隐藏侧边栏，没有提供替代的移动端底部导航或汉堡菜单。用户在手机上只能看到当前默认路由页面，无法切换到其他页面。

### N-5. `ci_lin`（词林正韵）无差异化处理

- **文件**: [rhymeData.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/rhymeData.ts)
- **现象**: 三种韵书（新韵/平水韵/词林正韵）选择后的实际处理逻辑几乎一致。词林正韵和新韵走的是相同的 `XIN_YUN_MAP`，仅平水韵有少量额外的入声字映射。
- **影响**: 用户选择不同韵书后，体验差异微乎其微，有虚假宣传之嫌。

### N-6. 字符覆盖范围不足 (~300 字)

- **文件**: [rhymeData.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/rhymeData.ts)
- **现象**: `XIN_YUN_MAP` 仅覆盖约 300 个高频汉字的平仄分类。对于古典诗词中常见的"涧"、"磬"、"霰"等字，会返回 `unknown`，导致大量字被标记为"无法判定"的灰色状态。

---

## ⚪ 五、 死代码与冗余检测 (Dead Code)

| 编号 | 位置 | 死代码描述 |
| :--- | :--- | :--- |
| D-1 | [geminiService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/geminiService.ts) | `chatWithPoet()` 和 `generatePoemImage()` 两个函数已定义但**从未被任何页面或组件导入调用**。 |
| D-2 | [exportService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/exportService.ts#L14-L26) | `drawBrandStamp()` 函数（Canvas 绘制品牌印章）已被 DOM innerHTML 方案替代，但原函数未删除。 |
| D-3 | [contributionService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/contributionService.ts) | 整个服务仅被 `ClassicReader.tsx` 导入使用于纠错弹窗，但纠错功能实际上只是打开一个 GitHub Issue URL 并复制 JSON——功能极其边缘且未完成闭环。 |
| D-4 | [constants.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/constants.ts) | `BACKGROUND_STYLES` 数组（4 个纸色样式）——已被 `PaperBackground.tsx` 中的独立样式系统完全取代，此处为残留物。`TEMPLATES` 中的律诗条目使用 `"..."` 占位，从未被格律引擎消费。 |
| D-5 | [Settings.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Settings.tsx#L201) | "关于"标签页声称技术栈包含 Tailwind CSS，但实际项目 CSS 未使用任何 Tailwind 类，存在文档与实际的不一致。 |

---

## 🔵 六、 功能缺失清单 (Missing Features)

> [!IMPORTANT]
> 以下功能缺失项均为用户明确提出或产品核心竞争力所必须的关键模块。

### F-1. 一键导入外部文稿

- **需求描述**: 用户需要将已有的诗词文稿（纯文本/剪贴板）一键导入至系统中。系统应智能识别诗词类型（五绝/七律/词牌等），自动匹配对应的格律模板，生成标准化的 `Poem` 数据对象并存入作品库。
- **当前状态**: 完全缺失。用户只能通过创作页面从零开始手动输入。

### F-2. 词云意象连线（联想网络）

- **需求描述**: 在 3D 词云中，点击一个意象词（如"明月"）后，应当用可视化的连线或高亮效果，牵连出与之在古典诗词中高频共现的关联意象词（如"相思"、"离愁"、"清酒"），形成一个发散性的灵感联想网络。
- **当前状态**: 点击后仅展示"包含该词的诗词列表"，无任何意象间的关联关系展示。

### F-3. 个人文集管理增强

- **需求描述**: 作品库需支持：编辑已有诗词、按类型/日期排序、按自定义文集分组、全量 JSON 导出/导入备份、批量选择操作。
- **当前状态**: 仅有基础的列表展示 + 搜索 + 单首删除/导出海报。

### F-4. 已保存诗词的编辑功能

- **需求描述**: 用户进入作品库详情后，应能"再次编辑"并保存更新。
- **当前状态**: 诗词保存后即为只读，无法修改。用户如需改稿，只能删除原作并重新创作。

---

## 🟢 七、 优化建议 (Enhancements)

### E-1. localStorage 容量溢出保护

- **风险**: 印章（Seal）的 `dataUrl` 为 Base64 编码图片，单个可达数十 KB。加上大量诗词正文，极有可能触及浏览器 ~5MB 的 localStorage 上限。
- **建议**: 在 `storageService.ts` 中增加写入前的容量预检逻辑。当剩余空间不足时，提示用户导出备份并清理旧数据。

### E-2. 诗词列表虚拟滚动

- **风险**: `Library.tsx` 中 `filtered.slice(0, 500)` 硬编码截断。随着语料库增长至 33,000 首，DOM 一次性渲染 500 个复杂诗词卡片仍然会造成帧率骤降。
- **建议**: 引入虚拟滚动（如 `react-window`）或分页懒加载机制。

### E-3. Settings 页缺少纸色/布局/字体的默认值配置入口

- **文件**: [Settings.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Settings.tsx)
- **现象**: `UserSettings` 类型定义了 `defaultPaperStyle`、`defaultLayout`、`globalFont` 等字段，但 Settings 页面仅暴露了笔名和韵书的管理 UI。纸色、布局和字体只能在创作页面逐次切换，无法设为全局默认值。

### E-4. 诗词预览导出的字体加载时序

- **文件**: [exportService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/exportService.ts)
- **风险**: 离屏 DOM 容器渲染后立即调用 `html2canvas` 截图，但自定义字体（LXGW WenKai 等）可能尚未加载完毕。
- **建议**: 在截图前使用 `document.fonts.ready` Promise 等待字体加载完成。

### E-5. 意象词库应基于本地 33,000 首诗词库自动统计生成

- **现状**: `imagery.json` 为 20 个手写 mock 词条。
- **建议**: 编写离线统计脚本，从 `poetry.json` 的 33,000 首诗词中自动提取高频二字/三字意象词组，统计共现矩阵，生成权威的意象词频数据和关联网络。这是词云质量和"意象连线"功能的数据根基。

---

## 🗂️ 八、 审计涉及文件完整清单

### 页面层 (Pages)
| 文件 | 行数 | 状态 |
| :--- | :--- | :--- |
| [Create.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Create.tsx) | 586 | 🔴 C-1, C-2 / 🟡 N-1 |
| [Works.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Works.tsx) | 249 | 🟠 M-5 / 🟡 N-2, N-3 |
| [Library.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Library.tsx) | 203 | 🟠 M-2, M-4 |
| [Settings.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Settings.tsx) | 237 | 🟢 E-3 / ⚪ D-5 |

### 组件层 (Components)
| 文件 | 行数 | 状态 |
| :--- | :--- | :--- |
| [WordCloud3D.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/library/WordCloud3D.tsx) | 314 | 🟠 M-4 |
| [ClassicReader.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/library/ClassicReader.tsx) | 415 | ⚪ D-3 |
| [StructuredInput.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/creator/StructuredInput.tsx) | 200 | ✅ 无缺陷 |
| [CipaiSelector.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/creator/CipaiSelector.tsx) | ~200 | ✅ 无缺陷 |
| [MeterGrid.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/creator/MeterGrid.tsx) | ~200 | ✅ 无缺陷 |

### 引擎层 (Engine)
| 文件 | 行数 | 状态 |
| :--- | :--- | :--- |
| [meterChecker.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/meterChecker.ts) | 430 | 🟠 M-3 |
| [rhymeData.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/src/engine/rhymeData.ts) | 181 | 🟠 M-1 / 🟡 N-5, N-6 |

### 服务层 (Services)
| 文件 | 行数 | 状态 |
| :--- | :--- | :--- |
| [storageService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/storageService.ts) | 104 | 🟢 E-1 |
| [geminiService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/geminiService.ts) | 87 | ⚪ D-1 |
| [exportService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/exportService.ts) | 204 | ⚪ D-2 / 🟢 E-4 |
| [contributionService.ts](file:///Users/quantumrose/Documents/Emberois/ou-cheng/services/contributionService.ts) | 72 | ⚪ D-3 |

### 数据资产 (Data Assets)
| 文件 | 大小 | 状态 |
| :--- | :--- | :--- |
| [poetry.json](file:///Users/quantumrose/Documents/Emberois/ou-cheng/public/data/poetry.json) | 827 KB | ✅ 33,000 首诗词语料 |
| [cipai.json](file:///Users/quantumrose/Documents/Emberois/ou-cheng/public/data/cipai.json) | 32 KB | ✅ 词牌格律数据 |
| [imagery.json](file:///Users/quantumrose/Documents/Emberois/ou-cheng/public/data/imagery.json) | 2 KB | 🟠 仅 20 个 mock 词条 |

---

> [!CAUTION]
> **优先级排序建议**: 先修复 C-1、C-2 两个致命缺陷 → 再实现 F-1（导入文稿）、F-2（意象连线）、F-3（文集增强）三大功能 → 最后清理死代码和处理优化建议。
