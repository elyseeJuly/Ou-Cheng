# 任务清单 — oucheng-app 迭代修复迁移（Option B：保留 AI）

**日期**：2026-07-29  
**负责人**：Antigravity (AGY)  
**范围**：将 `oucheng-app` 相对 `ou-cheng` 的全部迭代修复与架构升级迁移到本项目，UI/UX 视觉差异除外，AI 能力按 Option B 保留。

---

## 一、构建与配置

- [x] 升级 `package.json`：补充 `vitest`、`@vitest/coverage-v8`、`@playwright/test`、`wrangler`、`zustand`、`@capacitor/*`（core/filesystem/haptics/ios/share/cli）等 devDependencies，保留 `@google/genai`
- [x] 开启 `tsconfig.json` 严格模式（`"strict": true`），添加 `"vite/client"` 类型
- [x] 升级 `vite.config.ts`：iOS base path 模式、PWA 运行时缓存策略、Vitest coverage 配置

## 二、类型与 Schema（Option B 适配）

- [x] 升级 `src/types.ts`：迁移判别联合类型（`FreePoem | SonnetPoem | JintiPoem | CipaiPoem`）；保留 `PoemBase.aiComment`、`UserSettings.apiKey/apiBaseUrl/apiModel`；新增 `CreateDraft.aiComment`
- [x] 升级 `src/services/schemaValidator.ts`：`validatePoem` 保留 `aiComment`；`validateDraft` 透传 `aiComment`；`sanitizeSettings` 透传 AI 配置项
- [x] 新增 `src/global.d.ts`（全局类型声明）

## 三、存储层

- [x] 升级 `src/services/storageService.ts`：IndexedDB v2 主存储（`oucheng_vault`）+ LocalStorage 缓存；`rehydrateStorage()` 容灾；AI 字段完整序列化
- [x] 新增 `src/services/storageStartup.test.ts`：IndexedDB block 超时回退测试
- [x] 升级 `src/services/storageService.test.ts`：断言 Option B AI 字段留存
- [x] 新增 `src/stores/pouchStore.ts`（Zustand 拼贴词囊 Store）

## 四、导出服务

- [x] 升级 `src/services/exportService.ts`：Capacitor iOS 原生保存/分享、自适应画布尺寸（内容驱动，非固定 3:4）、乌丝栏（wusilan）纸本模板、句读剥离（stripPunct）、英文字体推断、字体/印章就绪等待、结构化错误返回
- [x] 升级 `src/components/ExportModal.tsx`：纸本信笺选择器（素笺/乌丝栏）、句读标点选项、`exportError` 状态展示取代 `alert()`、`ModalDialog` 无障碍包装、导出进度条（`role="progressbar"`）、按诗型推断默认排版方向
- [x] 升级 `src/components/preview/VerticalLayout.tsx`：`template` / `stripPunct` prop 传递链
- [x] 升级 `src/components/preview/PoemPreview.tsx`：暴露 `template` / `stripPunct` 用户选项

## 五、格律引擎

- [x] 升级 `src/engine/meterChecker.ts`：Unicode 安全拆字（`[...str]`）、离线韵组校验（`checkRhymeGroups`）、`checkJintiShi`/`checkCipai` 双重计数 bug 修复
- [x] 升级 `src/engine/rhymeData.ts`：最新韵书底表
- [x] 升级 `src/engine/importParser.ts`：补充 `resolveCipaiVariant`、`clausesToProLines`、`getCipaiEditorPatterns`、`normalizePoemClauses`
- [x] 新增 `src/engine/rhymeGroupData.ts`（韵组数据分离）
- [x] 新增 `src/engine/importParser.test.ts`（7 个解析单元测试）
- [x] 升级 `src/engine/meterChecker.test.ts`（8 个格律单元测试）

## 六、AI 服务（Option B 保留）

- [x] 升级 `src/services/geminiService.ts`：修复 strict-mode `any` 类型；保留 Gemini SDK + OpenAI 兼容路由
- [x] 新增 `src/services/poemSave.ts` / `src/services/poemSave.test.ts`（保存事务封装）

## 七、创作核心（CreateContext 重构）

- [x] 升级 `src/pages/Create/CreateContext.tsx`：拆分为 5 个细粒度 Context（Document / Form / Caret / Presentation / Workflow），还原 `handleAIReview` 回调及 AI 状态（`aiComment`、`aiLoading`）
- [x] 升级 `src/pages/Create/ActionBottomBar.tsx`：AI 点评按钮 + 点评结果卡片
- [x] 升级 `src/pages/Create/FreePanel.tsx`、`ProPanel.tsx`、`ModeToggle.tsx`：适配细粒度 Context API
- [x] 升级 `src/pages/Create/index.tsx`：适配多首导入闭环
- [x] 新增 `src/components/creator/VerseRow.tsx` / `VerseRow.test.tsx`
- [x] 升级 `src/components/creator/StructuredInput.tsx`：`onRhymeFocus` prop 对齐
- [x] 升级 `src/components/creator/ImportModal.tsx`：使用 `resolveCipaiVariant` 词牌变体解析
- [x] 新增 `src/components/creator/ImportModal.test.tsx`（2 个组件测试）
- [x] 新增 `src/components/creator/ForagePouch.tsx`、`RhymeMirror.tsx`、`SidePanel.tsx`
- [x] 新增 `src/components/common/ModalDialog.tsx` / `ModalDialog.test.tsx`

## 八、其他页面组件

- [x] 升级 `src/components/Layout.tsx`：`isActive()` cipai 前缀识别；夜/昼切换按钮持久化（`saveSettings`）
- [x] 升级 `src/pages/Settings.tsx`：恢复 "AI 接入" Tab（apiKey / apiBaseUrl / apiModel 表单）
- [x] 升级 `src/pages/Works.tsx`：更新卡片布局、文集操作（改名/删除）、导入错误汇报
- [x] 升级 `src/pages/Preview.tsx`：心声 + AI 点评卡片展示
- [x] 新增 `src/pages/CipaiGallery.tsx`、`src/pages/CipaiDetail.tsx`（词牌大观与详情）
- [x] 新增 `src/pages/CipaiDetail.test.tsx`（3 个组件测试）
- [x] 升级 `src/pages/Library.tsx`
- [x] 升级 `src/App.tsx`：懒加载路由，含 `/preview/:poemId`、`/cipai/*`
- [x] 升级 `src/components/library/WordCloud3D.tsx`、`ClassicReader.tsx`、`DualNavBar.tsx`
- [x] 升级 `src/components/seals/SealManager.tsx`、`SealGenerator.tsx`
- [x] 升级 `src/components/preview/PaperBackground.tsx`
- [x] 新增 `src/services/imageryService.ts`
- [x] 新增 `src/utils/`（elegantDate.ts / theme.ts / HapticsEngine.ts）
- [x] 升级 `src/constants.ts`、`src/index.tsx`、`src/index.css`

## 九、静态数据

- [x] 新增 `public/data/charFreq.json`（字频数据）
- [x] 升级 `public/data/cipai.json`、`public/data/imagery.json`
- [x] 新增 `public/data/imagery/`（意象图片资源）
- [x] 新增 `src/data/`（poemForms.ts 等本地数据）

## 十、脚本与文档

- [x] 新增 `scripts/build-cipai-data.cjs`、`build-rhyme-data.cjs`、`build-rhyme-freq.cjs`、`convert-dict.cjs`、`extract-char-tone.cjs`、`fetch-poetry.js`
- [x] 新增 `scripts/verify-cloudflare-build.cjs`、`verify-ios-build.cjs`、`verify-local-only.cjs`、`verify-smoke.cjs`
- [x] 新增 `scripts/color-audit.mjs`、`design-audit-common.mjs`、`radius-audit.mjs`、`run-design-audit.mjs`、`screenshot-routes.mjs`
- [x] 升级 `scripts/build-imagery.cjs`
- [x] 新增 `playwright.config.ts` 及 `tests/` 目录（E2E 测试配置）
- [x] 新增 `docs/ARCHITECTURE.md`、`DOMAIN_RULES.md`、`DATA_SCHEMA.md`、`RELEASE_GATES.md`
- [x] 归档本文件 `EXEC_20260729_OUCHENG_APP_MIGRATION_TASK.md`
- [x] 归档 `EXEC_20260729_OUCHENG_APP_MIGRATION_WALKTHROUGH.md`
