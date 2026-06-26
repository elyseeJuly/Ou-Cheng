# 偶成 (Ou-Cheng) 迭代修复方案与重构计划

> **制定日期**: 2026-06-24
> **关联审计**: AUDIT_20260624_CTO_HOLISTIC_AUDIT.md

为了解决 CTO 审计中指出的架构畸形与可维护性问题，特制定以下分阶段的迭代修复方案。此方案不仅作为本地归档文档，同时也作为即将执行的重构蓝图。

---

## 阶段一：物理架构拨乱反正（优先级：最高，耗时：1-2天）

**目标**：解决根目录堆砌业务代码的反模式，恢复标准的现代前端工程结构。

**具体行动**：
1. **文件迁移**：将根目录下的以下文件和文件夹移入 `src/` 目录：
   - `components/`
   - `pages/`
   - `services/`
   - `App.tsx`
   - `index.tsx`
   - `constants.ts`
   - `types.ts`
2. **路径修复**：全局检索并更新所有相关的 `import` 路径。由于目录层级发生变化，许多 `../` 和 `./` 的相对路径需要修正。
3. **配置更新**：修改 `index.html` 中的 `<script type="module" src="/index.tsx"></script>` 为 `/src/index.tsx`。
4. **验证**：运行 `npm run verify` (类型检查 + 单元测试 + 构建打包) 确保迁移后系统能够正常运行。

---

## 阶段二：Create.tsx 巨石组件拆解（优先级：高，耗时：3-5天）

**目标**：将 `Create.tsx` (600+行) 这一核心高频修改页面的视图逻辑与业务状态剥离，提升可读性和可扩展性。

**具体行动**：
1. **引入轻量状态管理**：引入 Zustand（`npm install zustand`）来管理 `Create` 页面的表单状态、模式切换（自由/专业）、十四行诗/词牌配置等。这能将数十个 `useState` 从组件内部抽离。
2. **拆分子面板组件**：
   - 提取 `ModeToggleBar`：负责顶部模式切换和导入按钮。
   - 提取 `FreeCreationPanel`：负责自由挥毫和十四行诗的输入逻辑。
   - 提取 `ProMeterPanel`：负责近体诗和词牌的专业格律配置及结构化输入。
   - 提取 `ActionBottomBar`：负责保存、AI 点评、清空按钮。
3. **上下文抽离**：将 `meterResult` 和 `aiComment` 的副作用（Effect）逻辑提取为 Custom Hooks，例如 `useMeterCheck` 和 `useAIReview`。

---

## 阶段三：存储安全与 API 风险熔断（优先级：中，耗时：3天）

**目标**：解决单机数据极易丢失的问题，并修复 API Key 可能泄露的雷区。

**具体行动**：
1. **API Key 泄露防护**：
   - 检查并修改 `services/geminiService.ts`，彻底移除 `import.meta.env.VITE_GEMINI_API_KEY` 的 fallback 逻辑。
   - 在未配置本地 Key 的情况下，向用户展示优雅的提示文案，引导其前往“印匣（Settings）”配置。
2. **防丢策略增强**：
   - 增强本地缓存机制：调研将 LocalStorage 升级为 IndexedDB（如使用 Dexie.js）。
   - 增强定期自动备份提示：如果作品超过一定数量或距离上次导出超过一定时间，提示用户下载 JSON 备份。

---

## 结语

本次重构是“偶成”从一个实验性项目向生产级工具迈进的必经之路。**优先执行阶段一**，在结构理顺后，将大幅降低后续新特性的开发难度与维护成本。
