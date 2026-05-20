# 偶成 (Ou Cheng) — 项目文档注册中心 (Documentation Register)
> **版本号 (Version)**: V1.0.0  
> **生效日期 (Effective Date)**: 2026-05-20  
> **设计依据**: [/Users/quantumrose/Documents/Emberois/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md)  
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
| **`AUDIT_`** | [AUDIT_20260519_LOCAL_AUDIT_TESTING_SPEC.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/AUDIT_20260519_LOCAL_AUDIT_TESTING_SPEC.md) | 本地代码审计与测试体系设计规格。包含了核心业务模块剖析、单元测试脚本建议及测试用例大纲。 | 2026-05-19 |
| **`HIST_`** | [HIST_20260519_V4_AUDIT_AND_FIXES_RECORD.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/HIST_20260519_V4_AUDIT_AND_FIXES_RECORD.md) | v4.0 重大更新里程碑全量审计与缺陷修复纪实。详细记录了包括 Gemini 密钥接入、自适应 PC/移动端布局问题等在内的 14 项缺陷修复。 | 2026-05-19 |
| **`EXEC_`** | [EXEC_20260520_PLAN.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260520_PLAN.md) | 本地项目文档规范化重组与同步实施方案书（本会话启动）。 | 2026-05-20 |
| **`EXEC_`** | [EXEC_20260520_TASK.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260520_TASK.md) | 本地项目文档规范化与同步进度清单。追踪 TODO 待办任务流。 | 2026-05-20 |
| **`EXEC_`** | [EXEC_20260520_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/ou-cheng/docs/EXEC_20260520_WALKTHROUGH.md) | 交付验证汇报与 GitHub 远端同步历史记录。证明代码与文档的稳定性。 | 2026-05-20 |

---

> [!TIP]
> 检索或调用具体文档时，在支持 Markdown 预览的 IDE/编辑器中直接双击上述表内的蓝色链接，即可秒级跳转定位到对应的文档源文件。
