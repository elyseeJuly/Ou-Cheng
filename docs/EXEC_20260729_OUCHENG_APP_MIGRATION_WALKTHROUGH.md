# 偶成 — oucheng-app 迭代修复迁移完成报告

**日期**：2026-07-29  
**版本**：v0.5.1  
**任务**：将 `oucheng-app` 相对 `ou-cheng` 积累的全部迭代修复与架构升级迁入本项目，UI/UX 视觉差异除外，AI 能力按 **Option B（保留）** 策略保留。

---

## 验收门禁 ✅

| 门禁 | 结果 |
|------|------|
| `tsc --noEmit` 严格模式编译 | ✅ 0 errors |
| Vitest 单元测试 | ✅ **36/36 passed**（10 个测试文件） |
| `node scripts/verify-smoke.cjs` | ✅ passed |
| `node scripts/verify-local-only.cjs` | ✅ passed（62 files scanned） |

### 单元测试明细

```
✓ src/components/common/ModalDialog.test.tsx      (1 test)   —— 焦点陷阱 / Escape 关闭
✓ src/services/storageStartup.test.ts             (3 tests)  —— IndexedDB block 超时回退
✓ src/services/storageService.test.ts             (9 tests)  —— AI 字段留存 / 数据清洗 / 备份
✓ src/engine/meterChecker.test.ts                 (8 tests)  —— 平仄格律 / 安全 JSON 解析
✓ src/pages/CipaiDetail.test.tsx                  (3 tests)  —— 词牌详情加载 / 变体选择
✓ src/components/creator/ImportModal.test.tsx     (2 tests)  —— 焦点恢复 / 变体校验
✓ src/services/poemSave.test.ts                   (1 test)   —— 保存事务封装
✓ src/smoke.test.tsx                              (1 test)   —— Create 页挂载烟雾
✓ src/components/creator/VerseRow.test.tsx        (1 test)   —— 行组件渲染
✓ src/engine/importParser.test.ts                 (7 tests)  —— 解析 / 变体检测 / 格律比对

Test Files  10 passed (10)
Tests       36 passed (36)
```

---

## 迁移内容概述

### 1. 构建与配置

| 文件 | 变更 |
|------|------|
| `package.json` | 新增 `vitest`、`@vitest/coverage-v8`、`@playwright/test`、`wrangler`、`zustand`、`@capacitor/*` 等；保留 `@google/genai` |
| `tsconfig.json` | `"strict": true`；`"vite/client"` 类型 |
| `vite.config.ts` | iOS `base: './'`；PWA 运行时缓存；Vitest coverage |
| `playwright.config.ts` | 新增 E2E 配置 |

### 2. 类型与 Schema（Option B 适配）

- **`src/types.ts`**：迁移判别联合 `Poem` 类型（Free / Sonnet / Jinti / Cipai）；保留 `PoemBase.aiComment`、`UserSettings.apiKey/apiBaseUrl/apiModel`；新增 `CreateDraft.aiComment` 支持草稿 AI 点评持久化
- **`src/services/schemaValidator.ts`**：`validatePoem` 保留 `aiComment`；`validateDraft` 透传 `aiComment`；`sanitizeSettings` 透传 AI 配置

### 3. 存储层（IndexedDB v2）

- **`storageService.ts`**：主仓从 LocalStorage 迁至 IndexedDB（`oucheng_vault`）；`rehydrateStorage()` 实现冷启动容灾与旧数据迁移；AI 字段完整序列化
- **`storageStartup.test.ts`**：验证 IndexedDB `open` 被阻塞时 1.5 秒超时回退机制
- **`pouchStore.ts`**：Zustand 拼贴词囊本地 Store

### 4. 导出服务

- **`exportService.ts`** — 重大升级：
  - Capacitor iOS 原生 `Filesystem.writeFile` + `Share.share`（平台自动路由）
  - 像素上限自适应降级（Web: 40 MP / iOS: 20 MP）
  - 内容驱动的自适应画布尺寸（非固定 3:4）
  - 乌丝栏（wusilan）纸本背景渲染
  - 句读标点剥离（`stripPunct`）
  - 英文字体推断（十四行诗）
  - 字体与印章图片就绪等待（`document.fonts.ready` + `img.decode()`）
  - 结构化错误返回 `{ success, error? }`
- **`ExportModal.tsx`** — UI 同步：纸本信笺选择器（素笺/乌丝栏）、句读标点选项、错误状态展示、`ModalDialog` 无障碍包装、进度条
- **`VerticalLayout.tsx` / `PoemPreview.tsx`** — `template` / `stripPunct` prop 全链路打通

### 5. 格律引擎

- **`meterChecker.ts`**：Unicode 安全拆字（`[...str]` 代替 `.split('')`）；离线韵组一致性校验；修复 `checkJintiShi`/`checkCipai` 双重错误计数 bug
- **`importParser.ts`**：补入 `resolveCipaiVariant`（词牌变体解析）、`clausesToProLines`、`getCipaiEditorPatterns`、`normalizePoemClauses`
- **`rhymeGroupData.ts`**：韵组数据模块独立分离

### 6. AI 能力（Option B 完整保留）

- **`geminiService.ts`**：修复 strict-mode `any` 类型；保留 Gemini SDK + OpenAI 兼容 `/v1/chat/completions` 双路由
- **`CreateContext.tsx`**：`handleAIReview` 回调、`aiComment`/`aiLoading` 状态、Mock 点评降级
- **`ActionBottomBar.tsx`**：AI 点评触发按钮 + 点评卡片展示
- **`Settings.tsx`**："AI 接入" Tab（apiKey / apiBaseUrl / apiModel）
- **`verify-local-only.cjs`**：改为扫描硬编码 secret（`AIzaSy…`/`sk-…`），不再误判合法 AI 导入

### 7. CreateContext 细粒度重构

将原单一 Context 拆分为 5 个独立 Provider，避免无关状态触发全量重渲染：

| Provider | 状态域 |
|----------|--------|
| `DocumentContext` | title / author / content / heartNote / proLines / activeContent |
| `FormContext` | mode / proTab / poemType / sonnetType / formId / cipai / rhymeBook / layout |
| `CaretContext` | caretLine / caretColumn |
| `PresentationContext` | paperStyle / fontStyle |
| `WorkflowContext` | settings / editId / showImport / meterResult / handleSave / AI 相关 |

### 8. 新增页面与组件

| 新增文件 | 说明 |
|----------|------|
| `src/pages/CipaiGallery.tsx` | 词牌大观索引页 |
| `src/pages/CipaiDetail.tsx` | 词牌详情与变体示例 |
| `src/pages/Preview.tsx` | 独立预览页（含心声 + AI 点评卡片） |
| `src/components/common/ModalDialog.tsx` | 通用无障碍 Modal（焦点陷阱 + Escape） |
| `src/components/creator/VerseRow.tsx` | 单行格律行组件 |
| `src/components/creator/ForagePouch.tsx` | 词囊浮层组件 |
| `src/components/creator/RhymeMirror.tsx` | 韵脚镜像提示 |
| `src/components/creator/SidePanel.tsx` | 创作侧边工具面板 |
| `src/services/imageryService.ts` | 意象检索服务 |
| `src/utils/elegantDate.ts` | 雅体日期格式化 |
| `src/utils/theme.ts` | 主题切换工具（day/night） |
| `src/utils/HapticsEngine.ts` | Capacitor 触觉反馈封装 |

### 9. 导航功能修复

**`Layout.tsx`**：
- `isActive()` — 主路由 `/` 同时高亮 `/cipai/*` 下的所有词牌子页
- 侧栏夜/昼切换按钮，并调用 `saveSettings()` 持久化偏好

### 10. 文档与脚本

- `docs/ARCHITECTURE.md`、`DOMAIN_RULES.md`、`DATA_SCHEMA.md`、`RELEASE_GATES.md` 迁入
- 新增验证脚本：`verify-smoke.cjs`、`verify-local-only.cjs`、`verify-cloudflare-build.cjs`、`verify-ios-build.cjs`
- 新增构建脚本：`build-cipai-data.cjs`、`build-rhyme-data.cjs`、`build-rhyme-freq.cjs`、`convert-dict.cjs`、`extract-char-tone.cjs`、`fetch-poetry.js`
- 新增设计审计脚本：`color-audit.mjs`、`radius-audit.mjs`、`design-audit-common.mjs`、`run-design-audit.mjs`、`screenshot-routes.mjs`

---

## 排除项（UI/UX 视觉差异，有意保留）

- `Layout.tsx`：本地使用图标图片导航（`/icons/*.png`），app 使用汉字字形（`char: '挥'`）
- `Layout.tsx`：app 有底部移动导航栏（`.bottom-nav`），本地暂无（PWA 侧栏模式）
- 各组件 CSS token：本地使用设计变量（`var(--border)`），app 部分使用硬编码色值（`#e0e0e0`）
- `Settings.tsx` 等：因 Option B 本地主动增设 AI 接入 Tab，app 版本无此 Tab（app 已独立移除 AI）
- `UpdatePrompt.tsx`：CSS 变量名差异

---

## 参考文件

- [EXEC_20260729_OUCHENG_APP_MIGRATION_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260729_OUCHENG_APP_MIGRATION_TASK.md)
- [ARCHITECTURE.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/ARCHITECTURE.md)
- [RELEASE_GATES.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/RELEASE_GATES.md)
