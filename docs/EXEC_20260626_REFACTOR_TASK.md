# 偶成 (Ou Cheng) 架构重构任务归档 (Task List)

## 📌 重构进度跟踪表

本文件是对 2026-06-24 至 2026-06-26 期间执行的架构重构工作（第一、二、三阶段）任务列表的本地归档。

### 阶段一：物理架构拨乱反正（已完成）
- [x] **物理搬迁文件到 `src/` 目录**
  - [x] 移动 `components/` 文件夹到 `src/components/`
  - [x] 移动 `pages/` 文件夹到 `src/pages/`
  - [x] 移动 `services/` 文件夹到 `src/services/`
  - [x] 移动 `App.tsx` 到 `src/App.tsx`
  - [x] 移动 `index.tsx` 到 `src/index.tsx`
  - [x] 移动 `types.ts` 到 `src/types.ts`
  - [x] 移动 `constants.ts` 到 `src/constants.ts`
  - [x] 移动 `index.css` 到 `src/index.css`
- [x] **修正配置文件**
  - [x] 修改 `index.html` 中的入口 script 路径为 `/src/index.tsx`
  - [x] 修改 `tsconfig.json` 中的编译范围（扫描 `src` 文件夹）
- [x] **修复全局的 import 相对路径**
  - [x] 修复 `src/index.tsx` 内的引用路径
  - [x] 修复 `src/App.tsx` 内的引用路径
  - [x] 修复 `src/components/` 和 `src/pages/` 内文件之间的相对引用
  - [x] 修复 `src/engine/` 内文件对 `types` 和 `constants` 的引用
  - [x] 修复 `src/services/` 内文件的引用路径

---

### 阶段二：Create.tsx 巨石组件拆解（已完成）
- [x] **物理目录创建与文件重命名**
  - [x] 创建目录 `src/pages/Create/`
  - [x] 将 `src/pages/Create.tsx` 移至 `src/pages/Create/index.tsx`
- [x] **建立 `CreateContext.tsx` 状态上下文**
  - [x] 移动所有状态声明、派生 Memo 和逻辑校验 Effect
  - [x] 移动 `handleSave` 与 `handleAIReview` 逻辑
  - [x] 导出 `CreateProvider` 与 `useCreate` 钩子
- [x] **拆分提取各个子面板组件**
  - [x] 编写 `src/pages/Create/ModeToggle.tsx`
  - [x] 编写 `src/pages/Create/FreePanel.tsx`
  - [x] 编写 `src/pages/Create/ProPanel.tsx`
  - [x] 编写 `src/pages/Create/ActionBottomBar.tsx`
- [x] **组装并精简 `src/pages/Create/index.tsx`**
  - [x] 在 `index.tsx` 中整合子面板，完成布局组装
  - [x] 确保对外 default 导出不变

---

### 阶段三：存储安全与 API 风险熔断（已完成）
- [x] **API 风险防范与安全熔断**
  - [x] 修改 `src/services/geminiService.ts`，去除环境变量 Fallback，未配置 Key 抛出 API_KEY_MISSING 异常
  - [x] 修改 `src/pages/Create/CreateContext.tsx`，捕获 API_KEY_MISSING 异常，向用户优雅展示配置提示
- [x] **原生 IndexedDB 镜像备份实现**
  - [x] 在 `src/services/storageService.ts` 中编写 IndexedDB 读写工具类
  - [x] 对 `savePoem`, `deletePoem`, `saveSettings`, `saveSeal`, `deleteSeal` 进行镜像写入改写
  - [x] 编写 `rehydrateStorage` 反填函数，支持从 IndexedDB 找回丢失的 LocalStorage 数据
- [x] **启动层双向镜像对齐**
  - [x] 修改 `src/index.tsx`，在渲染 App 前进行异步 `rehydrateStorage`

---

## 🧪 验证结果
- **类型检查 (`typecheck`)**: **PASS**
- **单元测试 (`test`)**: **PASS**
- **静态构建 (`build`)**: **PASS**
