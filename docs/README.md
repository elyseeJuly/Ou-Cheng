# 偶成 (Ou Cheng) — 项目文档注册中心 (Documentation Register)
> **版本号 (Version)**: V1.1.0  
> **生效日期 (Effective Date)**: 2026-07-03  
> **设计依据**: [/Users/quantumrose/Documents/Emberois/emberois-dev-standards/specifications/SPEC_20260626_GLOBAL_DEVELOPMENT_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/emberois-dev-standards/specifications/SPEC_20260626_GLOBAL_DEVELOPMENT_STANDARDS.md)  
> **适用对象**: AI 协同智能体、项目主程及版本管理员

---

## 📖 一、 概述

为了确保多项目并行开发以及大模型多轮接力协作时的“上下文无缝传递”，偶成项目严格遵循 **“分类+日期”双重命名公式** 对本地 `docs/` 目录下的所有开发文档进行统一注册管理。

> [!IMPORTANT]
> 任何后续协同开发 AI 或人类开发者在创建新文档时，**必须第一时间**将新文档的绝对文件链接与简要描述登记在下方的「文档注册表」中，以保持主索引的绝对同步。

---

## 📂 二、 全局文档注册表 (Document Registry)

| 分类大写前缀 | 文档文件链接 (Absolute Path Link) | 文档核心内容简要说明 | 关联会话日期 |
| :--- | :--- | :--- | :--- |
| **`PLAN_`** | [PLAN_20260415.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260415.md) | 唐诗宋词离线语料库集成实施方案书。定义拉取清洗管道，并在「卷帙」模块建立懒加载逻辑与 Loading 骨架屏。 | 2026-04-15 |
| **`EXEC_`** | [EXEC_20260415_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260415_TASK.md) | 唐诗宋词离线语料库集成任务进度清单。追踪爬虫设计、工程集成和 UI 懒加载适配 TODO。 | 2026-04-15 |
| **`EXEC_`** | [EXEC_20260415_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260415_WALKTHROUGH.md) | 唐诗宋词离线语料库集成交付验证汇报。包含爬虫脚本执行、静态服务性能及样本字节对比审计。 | 2026-04-15 |
| **`HIST_`** | [HIST_20260416_CHINESE_POETRY_AND_FONT_SYSTEM.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/HIST_20260416_CHINESE_POETRY_AND_FONT_SYSTEM.md) | 诗词语料库大集成与动态抗生僻字字库重构历史纪实大编年史。记录 2026年4月中旬两次重大迭代历程。 | 2026-04-16 |
| **`HIST_`** | [HIST_20260416_VISUAL_UPGRADE_AND_FONT_REFACTOR_CHRONICLE.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/HIST_20260416_VISUAL_UPGRADE_AND_FONT_REFACTOR_CHRONICLE.md) | 东方美学视觉重构与全局字体渲染管线深度修复历史大编年史。 | 2026-04-16 |
| **`PLAN_`** | [PLAN_20260416.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260416.md) | 专业格律穿写与长调格律补全实施方案书。 | 2026-04-16 |
| **`EXEC_`** | [EXEC_20260416_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260416_TASK.md) | 专业格律穿写与长调格律补全任务进度清单。 | 2026-04-16 |
| **`EXEC_`** | [EXEC_20260416_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260416_WALKTHROUGH.md) | 专业格律穿写与长调格律补全交付验证汇报。 | 2026-04-16 |
| **`PLAN_`** | [PLAN_20260416_METER_INPUT_UX.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260416_METER_INPUT_UX.md) | 专业格律穿插填字与长调格律补全额外实施方案书。 | 2026-04-16 |
| **`EXEC_`** | [EXEC_20260416_METER_INPUT_UX_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260416_METER_INPUT_UX_TASK.md) | 专业格律穿插填字与长调格律补全任务进度清单。追踪 TODO 状态。 | 2026-04-16 |
| **`EXEC_`** | [EXEC_20260416_METER_INPUT_UX_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260416_METER_INPUT_UX_WALKTHROUGH.md) | 专业格律穿插填字与长调格律补全交付验证汇报。 | 2026-04-16 |
| **`AUDIT_`** | [AUDIT_20260519_LOCAL_AUDIT_TESTING_SPEC.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/AUDIT_20260519_LOCAL_AUDIT_TESTING_SPEC.md) | 本地代码审计与测试体系设计规格。包含了核心业务模块剖析、单元测试脚本建议及测试用例大纲。 | 2026-05-19 |
| **`HIST_`** | [HIST_20260519_V4_AUDIT_AND_FIXES_RECORD.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/HIST_20260519_V4_AUDIT_AND_FIXES_RECORD.md) | v4.0 重大更新里程碑全量审计与缺陷修复纪实。 | 2026-05-19 |
| **`PLAN_`** | [PLAN_20260520.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260520.md) | 本地项目文档规范化重组与同步实施方案书（本会话启动）。 | 2026-05-20 |
| **`EXEC_`** | [EXEC_20260520_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260520_TASK.md) | 本地项目文档规范化与同步进度清单。追踪 TODO 待办任务流。 | 2026-05-20 |
| **`EXEC_`** | [EXEC_20260520_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260520_WALKTHROUGH.md) | 交付验证汇报与 GitHub 远端同步历史记录。证明代码与文档的稳定性。 | 2026-05-20 |
| **`AUDIT_`** | [AUDIT_20260602_FULL_SYSTEM_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/AUDIT_20260602_FULL_SYSTEM_AUDIT.md) | v4.0 全系统深度审计报告。覆盖 2 项致命缺陷、5 项重大缺陷、6 项一般缺陷等。 | 2026-06-02 |
| **`PLAN_`** | [PLAN_20260602.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260602.md) | v5.0 文稿导入·意象连线·文集增强实施方案书。包含 5 阶段技术方案与验证计划。 | 2026-06-02 |
| **`EXEC_`** | [EXEC_20260602_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260602_TASK.md) | v5.0 导入、词云与文集增强开发任务进度清单。 | 2026-06-02 |
| **`EXEC_`** | [EXEC_20260602_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260602_WALKTHROUGH.md) | v5.0 开发交付验证汇报，包含数据重构、导入组件、意象交互与文集链路增强。 | 2026-06-02 |
| **`PLAN_`** | [PLAN_20260612_IMAGERY_UX.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260612_IMAGERY_UX.md) | 意象连线优化实施方案书。 | 2026-06-12 |
| **`EXEC_`** | [EXEC_20260612_IMAGERY_UX_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260612_IMAGERY_UX_TASK.md) | 意象连线优化任务清单。 | 2026-06-12 |
| **`EXEC_`** | [EXEC_20260612_IMAGERY_UX_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260612_IMAGERY_UX_WALKTHROUGH.md) | 意象连线优化验证报告。 | 2026-06-12 |
| **`AUDIT_`** | [AUDIT_20260624_CTO_HOLISTIC_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/AUDIT_20260624_CTO_HOLISTIC_AUDIT.md) | CTO 全局架构与系统健康审查报告。对代码物理隔离和存储进行风险摸底。 | 2026-06-24 |
| **`PLAN_`** | [PLAN_20260624_REFACTOR.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260624_REFACTOR.md) | 架构隔离与 React 状态解耦重构方案书。 | 2026-06-24 |
| **`EXEC_`** | [EXEC_20260626_REFACTOR_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260626_REFACTOR_TASK.md) | 架构隔离与 React 状态解耦重构任务清单。 | 2026-06-26 |
| **`EXEC_`** | [EXEC_20260626_REFACTOR_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260626_REFACTOR_WALKTHROUGH.md) | 架构隔离与 React 状态解耦重构交付验证。 | 2026-06-26 |
| **`PLAN_`** | [PLAN_20260701_IMPORT_SYSTEM.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/PLAN_20260701_IMPORT_SYSTEM.md) | 自动识别多首诗词导入与文集管理系统设计实施方案书。包含拼音引擎集成方案。 | 2026-07-01 |
| **`EXEC_`** | [EXEC_20260701_IMPORT_SYSTEM_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260701_IMPORT_SYSTEM_TASK.md) | 批量导入与文集功能开发任务清单。 | 2026-07-01 |
| **`EXEC_`** | [EXEC_20260701_IMPORT_SYSTEM_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260701_IMPORT_SYSTEM_WALKTHROUGH.md) | 批量导入与文集功能开发交付汇报。包含 100% 通过测试纪实。 | 2026-07-01 |

---

> [!TIP]
> 检索或调用具体文档时，在支持 Markdown 预览的 IDE/编辑器中直接双击上述表内的蓝色链接，即可秒级跳转定位到对应的文档源文件。
