# 交付记录：oucheng-app 能力回流开源版（v5.1）

**日期**：2026-11-19
**来源**：私有仓库 `oucheng-app` main `72a2db5`（v1.0.0 App 版）
**范围原则**：只迁移格律引擎、数据、存储、导出逻辑、脚本、开源许可与测试；**不迁移** App 的 UI 设计系统（`src/styles/*`、`components/ui`、古籍装帧层）、iOS / 小程序等移动端适配（Capacitor 原生备份、iOS 离线字体包、键盘适配）、以及上架与商业化内容（App Store 元数据、隐私/支持页、截图脚本、版本一致性校验）。开源版继续按 Option B 保留自带 API Key 的 AI 点评。

## 一、格律引擎
- `meterChecker.ts`：对仗检测（颔联 / 颈联，`ParallelismResult`）、换韵分组（`rhymeGroups` / `rhymeTones`）、词林相邻韵通押、首句借邻韵、逗号拆合句对齐。
- 新增 `sonnetChecker.ts`：十四行诗（莎翁体、彼特拉克体 CDE/CDC、现代汉语 10–13 字）韵式自动识别，每行给出韵式字母与音节/字数提示。
- 新增 `cipaiPatterns.ts` / `couyunProsody.ts`：三叠、四叠词牌不再压扁成“双调”，按段读取谱式。
- `rhymeData.ts` / `rhymeGroupData.ts`：补齐缺失韵目，用平水韵补全词林正韵（约 8.8k 字）。
- `importParser.ts`：文稿导入识别标题、作者朝代、韵书标记、四种位置的序/导语、注与后记、译文赏析、落款日期；阕间空行在匹配词牌时不再误拆。

## 二、数据
- 经典语料 1941 → **5118** 首（新增 Werneror/Poetry、open-chinese/poetry-collection，OpenCC 规范化，过滤残缺字符）。
- 词谱 2092 → **2280** 体（813 个词牌，经结构校验，来源 couyun / 钦定词谱 Kanripo）。
- 意象词典与共现、字频同步重建；`data/` 目录收录构建用原始韵书与词谱源文件。
- 新增 `docs/data/CORPUS_SOURCES.md`、`THIRD_PARTY_NOTICES.md`、`public/licenses/`，逐一注明开源来源与许可证。

## 三、存储与导出
- `storageService.ts`：IndexedDB 连接按需打开并缓存，监听 `versionchange` / `close`，连接被关闭时自动重开重试一次（修复多标签页保存/删除失败）；V2 备份完整性校验与版本校验。
- `schemaValidator.ts`：设置、草稿、自定义体式的枚举与类型校验更严格；Option B 的 `aiComment`、`apiKey/apiBaseUrl/apiModel` 保留。
- `exportService.ts`：海报按内容自适应尺寸、乌丝栏横竖两向、无句读、题目与导语可选、绘制前预载字体。
- 新增 `utils/fontReady.ts`：印章与海报绘制前用 `document.fonts.load` 预载字体（3 秒兜底），避免首次生成退回系统字体。
- 新增 `utils/punctuation.ts`（统一句读规则）、`prefaceColumns.ts`、`ciLines.ts`、`script.ts`（西文识别）、`textNormalize.ts`、`repeatClickGuard.ts`。

## 四、功能级修复（沿用开源版原有界面，只改行为）
- 横排预览支持「无句读」（此前只对竖排生效）；预览的版式与句读选择刷新后保持。
- 横排西文（十四行诗）取消汉字字距、悬挂缩进。
- 墨迹为空时导出给出提示；删除失败时关闭确认框并说明作品仍在。
- 词牌详情：按段展示平仄谱式，三叠/四叠正确显示，隐藏内部数据编号；词牌选择器文案更新为 2280 体。
- 从词牌详情进入创作：`?cipai=` 只处理一次并从地址栏移除，刷新不再覆盖草稿。
- 字格输入：输入法组字期间不跳行、不截断（`VerseRow`、`StructuredInput`）。
- 弹窗挂到 `body`，不再被祖先 transform 困住；韵镜选韵改为 click 触发。
- 十四行诗格律标注显示韵式字母与音节数。

## 五、验证
- `npx tsc --noEmit`：0 错误。
- `npx vitest run`：25 个测试文件 / 184 项全部通过（迁移前 10 / 36）。
- `npm run build`：通过；`verify:local-only`、`verify:smoke` 通过。
- 未做：真实浏览器端到端测试（沙箱无法安装 Chromium）；GitHub Pages 部署后需人工过一遍创作、导入、词牌详情、导出。

## 六、刻意未迁移
- App UI 重构（纸上琉璃设计系统、古籍装帧层、新版 Works / Settings / Create 面板、意象云图纯 DOM 重写）。
- 移动端：Capacitor 原生备份分享、iOS 离线字体包、`useComposeKeyboard`、iOS 构建校验更新。
- 商业化/上架：App Store 元数据、隐私与支持页、截图脚本、致谢页、版本一致性测试。
