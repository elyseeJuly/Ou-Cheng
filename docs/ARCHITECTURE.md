# 偶成 (Ou Cheng) — 系统架构指南 (ARCHITECTURE.md)

**版本**：v0.5.1  
**定位**：偶成应用架构当前态统一说明书（面向 AI 与开发者）。

---

## 一、 整体分层架构

应用遵循标准的 React + TypeScript 前端独立分层架构：

```text
src/
├── engine/          // 格律与韵书只读领域计算引擎 (meterChecker, rhymeData)
├── services/        // 存储、导出与网络数据服务 (storageService, schemaValidator, exportService)
├── stores/          // 全局 UI/领域状态管理 (pouchStore, zustand)
├── components/      // 可复用 UI 视图组件与弹窗 (creator, library, common)
├── pages/           // 页面级别路由控制器 (Create, Works, Settings, Imagery)
├── data/            // 体例预设与静态特征库 (poemForms)
└── utils/           // 基础设施工具 (EventBus, HapticsEngine)
```

---

## 二、 核心创作链与状态分级 (Create Chain)

`pages/Create/CreateContext.tsx` 为创作的核心状态容器，按职责拆分为以下子上下文：

1. **`CreateDocumentContext`**：创作正文、标题、作者、笔名及实时文本拆分状态；
2. **`CreateFormContext`**：当前创作模式（自由/专业）、选定体例、近体诗与词牌细分参数及韵书选择；
3. **`CreateCaretContext`**：编辑光标（行/列）、平仄校验请求与韵镜拾字联动；
4. **`CreatePresentationContext`**：宣纸风格、字体选择、排版方向与导出预览对象。
5. **`CreateWorkflowContext`**：导入开关、保存、清空、撤销与格律结果等低频工作流状态。

消费组件只订阅自身所需的子 Context；仓库静态 Smoke 门禁禁止重新引入聚合 `useCreate()`。

---

## 三、 数据持久化与仓储模式 (Storage Architecture)

存储层由 `src/services/storageService.ts` 统一接管：

```text
UI Component / Store
  ↓
storageService (Repository API)
  ├── 1. Schema Validator (schemaValidator.ts)
  ├── 2. IndexedDB v2 `poems` 对象仓（一首作品一条记录，主存储）
  ├── 3. LocalStorage 同步读取缓存（IndexedDB 不可用时降级）
  └── 4. `backup_store`（设置、印章、体例、拾字囊与草稿镜像）
```

应用启动时以已初始化的 IndexedDB 作品仓为准回填同步缓存；旧版整包镜像只用于首次迁移。作品保存、删除与文集批量修改必须等待 IndexedDB 事务完成后再更新缓存。

---

## 四、 离线与 PWA 策略

* **PWA Plugin (Vite)**：核心前端静态资源离线预缓存；
* **按需数据缓存**：大型冷数据（如 `poetry.json`、`cipai.json`）排除在预缓存包外，采用 `StaleWhileRevalidate` 策略动态下载并本地缓存。
