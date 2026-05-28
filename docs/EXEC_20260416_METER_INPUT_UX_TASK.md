# 偶成 (Ou Cheng) — 专业格律穿插填字与长调格律补全任务进度清单
> **文档类别**: 阶段执行清单 (`EXEC_TASK`)  
> **关联会话**: 专业格律穿插录入改造与长调截断缺陷修复  
> **真实时间**: 2026-04-16  
> **设计依据**: [/Users/quantumrose/Documents/Emberois/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md)

---

## 🎯 一、 任务完成状态概述

本会话旨在通过重写受控录入结构组件、升级双轨排版体验，以及清洗和覆写长调词牌数据库，全面提升“专业创作”界面的深度交互和视觉底蕴。截至 2026-04-16，所有核心及次要任务均已全部开发完成并通过本地验证。

---

## 📋 二、 任务执行清单 (Task Items)

### 🏗️ P1 — 结构化录入组件 (`StructuredInput.tsx`) 开发
- [x] 新建 [StructuredInput.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/components/creator/StructuredInput.tsx)，定义 `StructuredInputProps` 接口与受控模式。 *(2026-04-16 05:45)*
- [x] 智能结算句读函数：对单句末尾是否为韵脚（`R`/`r`）或段落末尾进行精准判定，对应自动渲染 `，` 与 `。` 符号。 *(2026-04-16 05:55)*
- [x] 结合 `patterns` 行长为每个独立 Input 元素强绑定 `maxLength` 字数阻隔，并在右下方呈现当前字数计数（如 `6/6`）。 *(2026-04-16 06:05)*
- [x] 键盘快捷导航设计：基于 `inputRefs` 对 `Enter`、`ArrowDown`、`ArrowUp` 以及 `Backspace` 按键进行劫持和焦点动态传递。 *(2026-04-16 06:20)*

### 🎨 P2 — Create 页面深度集成与双轨布局
- [x] 在 [Create.tsx](file:///Users/quantumrose/Documents/Emberois/ou-cheng/pages/Create.tsx#L495-L503) 中重构逻辑，从原有大文本框中抽离为用 `proLines` 二维数组和 `currentPatterns` 驱动状态。 *(2026-04-16 06:12)*
- [x] 新增并持久化 `proInputMode: 'split' | 'interleaved'` 状态切换开关。 *(2026-04-16 06:18)*
- [x] “分栏模式”下，仅在上方展示文本，下方展示整体格律 `<MeterGrid>`。 *(2026-04-16 06:25)*
- [x] “穿插模式”下，把每一行格律点阵逐一解构渲染在独立文本框上方，并在 `StructuredInput` 中动态匹配 `meterResult` 红绿灯进行点对点高亮。 *(2026-04-16 06:30)*

### 💾 P3 — 保存流程重构与打包测试
- [x] 升级 `handleSave()` 动作：保存或预览时，在后台自动拼接 input 文字与对应句读，转换为极富古典美感的排版文本输出，并自动过滤多余空格与空白字符。 *(2026-04-16 06:32)*
- [x] 解决因切换自由创作/专业格律/切换词牌时带来的状态重置与多行数组重构的抖动缺陷。 *(2026-04-16 06:35)*
- [x] 全面排查 TypeScript 编译器，消除所有的显式、隐式 Any 类型漏洞，达到零编译报错（TS Zero-Error）。 *(2026-04-16 06:40)*

### 🛢️ P4 — 长调词牌显示不全底层缺陷修复 (2026-04-16)
- [x] 排查发现底层原 `cipai.json` 的长调词牌（字数 > 91，如《莺啼序》、《望海潮》、《六州歌头》等）由于早期 Mock 残留导致被腰斩，仅剩前二阙。 *(2026-04-16 06:45)*
- [x] 编写并执行 Python 数据清洗重塑脚本 [fix_long_cipai.py](file:///Users/quantumrose/Documents/Emberois/ou-cheng/scratch/fix_long_cipai.py)，将长调的完整多阕数据拼接、转译成标准 XPZR 格式。 *(2026-04-16 07:14)*
- [x] 无损重写 `cipai.json` 数据，重构并恢复高难长调词牌的权威格律。 *(2026-04-16 07:15)*
- [x] 在 `StructuredInput` 中注入 **“· 换阕 ·”** 虚线渲染逻辑，解决多阕合并展示时的视觉割裂感。 *(2026-04-16 07:18)*

---

## 🏁 三、 阶段合格判定标准

- **功能无损度**：绝句、律诗、中调、小令等原本功能在改造后 100% 运行正常。
- **极限格律呈现**：240 字最大词牌《莺啼序》四阕全部呈现，没有出现字数截断、格子渲染不齐等任何缺陷。
- **编译健壮性**：执行 Vite 构建指令，编译产物打包无任何报错。
