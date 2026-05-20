# 偶成本地审计与测试规范

审计日期：2026-05-19  
审计范围：本地仓库源码、配置、脚本、数据样例与现有文档。  
执行边界：本次只读审计并生成文档；未修改业务代码，未运行构建、测试、依赖安装、数据抓取或浏览器验证。

## 一、项目现状

- 技术栈：Vite 6 + React 19 + TypeScript，核心页面在 `pages/`，组件在 `components/`，业务服务在 `services/`，格律引擎在 `src/engine/`。
- 本地脚本：`package.json` 仅提供 `dev`、`build`、`preview`、`fetch-data`，没有 `typecheck`、`lint`、`test`、`e2e`。
- 测试文件：未发现 Vitest、Jest、Testing Library、Playwright 等测试配置或测试用例。
- 文档状态：`docs/v4_audit_and_fixes_record.md` 已存在且当前 `docs/` 目录处于未跟踪状态，接手方提交前应确认这是预期文档变更。

## 二、必须先建立的测试规范

### 2.1 推荐脚本

建议接手方先补齐以下脚本，再进入修复：

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "verify": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

若暂不引入 ESLint，至少必须有 `typecheck`、`test`、`build` 三道门。

### 2.2 单元测试范围

- `src/engine/meterChecker.ts`：近体诗、词牌、十四行诗的行数、字数、平仄、韵脚、缺字、多音字、未知字。
- `src/engine/rhymeData.ts`：三种韵书的分支行为、传统字/简化字映射、未知字策略。
- `services/storageService.ts`：正常 JSON、损坏 JSON、旧 key 迁移、默认值合并、删除默认印章后的设置一致性。
- `services/contributionService.ts`：Issue URL 编码、JSON 输出字段完整性、原文和修正文是否可区分。

### 2.3 组件测试范围

- `pages/Create.tsx`：自由模式保存、专业模式空内容拦截、清空按钮同时清空 `content/proLines/aiComment/meterResult`、词牌上下阕校验颜色对齐。
- `components/creator/StructuredInput.tsx`：行数扩展、换阕分隔、键盘上下移动、最大字数、缺字状态。
- `components/creator/CipaiSelector.tsx`：`BASE_URL` 路径加载、分类筛选、别名搜索、加载失败提示。
- `components/preview/PoemPreview.tsx`：字体兜底、无效 `paperStyle/fontStyle` 的容错。
- `components/library/ClassicReader.tsx`：基于 `category` 的体裁识别、纠错 JSON 必须包含用户修正内容。

### 2.4 E2E 测试范围

推荐 Playwright 覆盖：

- 首页加载：无控制台 error，侧边栏图标在本地 `/` 和生产子路径 `/Ou-Cheng/` 都能加载。
- 自由创作：输入诗句，保存后进入“我的墨迹”，列表出现新作品。
- 专业格律：空白近体诗不得保存，不得触发 AI 点评；输入完整五绝后能保存。
- 词牌：选择带下阕的词牌，输入上下阕，校验点阵与录入行颜色一一对应。
- 典籍：`poetry.json`、`imagery.json` 加载后，搜索、翻页、审计按钮行为正常。
- 导出：导出弹窗可打开，模拟 `html2canvas` 后确认下载文件名、格式、比例。
- 响应式：390px 宽移动视口无横向空白主边距，核心内容可触达。

### 2.5 数据校验规范

必须对 `public/data/*.json` 增加 schema 或轻量校验：

- `cipai.json`：`charCount` 必须等于 `upperPattern + lowerPattern` 字符总数；`category` 必须属于类型枚举；上下阕 pattern 仅允许 `P/Z/R/X/r`。
- `poetry.json`：`title/author/content/category/dynasty` 必填；正文不得为空；繁简策略需明确。
- `imagery.json`：`word` 非空、`frequency` 为正数；当所有 frequency 相等时 3D 归一化不得产生 `NaN`。

## 三、问题清单与修复建议

### P0 阻断项

1. `services/geminiService.ts:38` 存在未转义双引号，源码无法被 TypeScript 正常解析。  
   建议：改为模板字符串或中文引号，例如 `systemInstruction: \`...你的名字叫“偶成君”...\``。修复后立即运行 `npm run typecheck` 和 `npm run build`。

2. 项目没有测试体系，当前无法判断后续修复是否引入回归。  
   建议：先引入 Vitest + React Testing Library，至少覆盖格律引擎和 `Create` 的专业模式保存逻辑；再补 Playwright 端到端测试。

3. `pages/Create.tsx:90-99` 在专业模式会为每一行空输入自动拼接标点，导致 `activeContent.trim()` 非空；`pages/Create.tsx:149-171` 因此允许保存只有标点的空作品，`pages/Create.tsx:461-470` 也可能允许空内容 AI 点评。  
   建议：专业模式 `activeContent` 只拼接非空诗句；保存前基于 `proLines.some(line => line.trim())` 和必填行完整度判断；空白行不得生成标点。

4. 词牌上下阕校验结果与 UI 行号错位。`pages/Create.tsx:82-85`、`components/creator/MeterGrid.tsx:76-78` 为 UI 插入空行分隔，但 `src/engine/meterChecker.ts:156-159` 的校验结果不包含分隔行；`MeterGrid.tsx:134` 直接用 UI 行号读取 `meterResult.lines[ri]`，下阕会偏移。  
   建议：统一引入 `patternLineIndex -> resultLineIndex` 映射，或让校验结果也带 separator 占位；`StructuredInput` 同理处理。

5. 七言绝句展示模板与实际校验模板不一致。`src/engine/meterChecker.ts:67` 默认使用 `jueju_7_ping_yes`，但 `components/creator/MeterGrid.tsx:30-37` 展示的是仄起首句入韵。  
   建议：将展示模板、输入模板、校验模板收敛为同一数据源，并支持用户选择“平起/仄起、首句入韵/不入韵”。

### P1 高优先级

6. 格律引擎未把缺字、少行、超行计为错误。`src/engine/meterChecker.ts:94-97` 和 `173-176` 将缺字设为 neutral，`isValid` 只看 `error` 数。  
   建议：缺字/少行/超行应进入 `violationCount`，保存前要求结构完整；可把缺字状态设为 `warn` 或新增 `missing`。

7. 韵脚没有真正校验。`src/engine/meterChecker.ts:105-112` 和 `183-184` 只把韵位标成 `rhyme`，没有比较韵部一致性。  
   建议：建立韵部表，至少实现同一作品内韵脚归部一致；无韵部数据时 UI 应显示“未校验韵部”，避免误称合规。

8. 韵书实现与产品文案不一致。`src/engine/rhymeData.ts:7-8` 是约 200 字新韵核心表，`ci_lin` 实际走同一新韵表，`ping_shui` 仅补充少量入声字；`src/engine/rhymeData.ts:112` 未知字默认平声。  
   建议：三种韵书分别建表；未知字返回 `unknown` 并在校验中提示“未收录”，不得默认为合律。对 `public/data/poetry.json` 中大量繁体字需做繁简映射或繁体韵表。

9. 典籍审计按钮对当前数据基本失效。`components/library/ClassicReader.tsx:28` 只检查 `poem.genre`，但 `public/data/poetry.json` 样例使用 `category` 而非 `genre`。  
   建议：体裁识别同时读取 `genre/category`，并对唐诗、宋词、元曲分别走不同规则；非近体诗不要显示近体诗审计结论。

10. GitHub Pages 子路径下侧边栏图标会丢失。`components/Layout.tsx:4-8` 使用 `/icons/...` 绝对路径，生产环境 `base` 是 `/Ou-Cheng/`。  
    建议：用 `${import.meta.env.BASE_URL}icons/...` 或导入静态资源；增加生产 base 的 E2E 资产加载检查。

11. 布局存在双重左边距和移动端残留边距。`components/Layout.tsx:33` 给 `main` 加 `marginLeft: 80px`，`index.css:76-80` 又给 `.editor-split` 加 `margin-left: 80px`；移动端 `index.css:392-401` 隐藏侧边栏但没有清掉 `main` 的内联左边距。  
    建议：只在全局布局层处理侧边栏预留空间；移动端用 class + media query 控制，避免内联样式。

12. AI 设置、文案和实际调用不一致。`pages/Create.tsx:12-25` 与 `141-147` 使用 mock 点评；`pages/Settings.tsx` 保存的 `apiKey/apiBaseUrl` 没有被 `services/geminiService.ts:5-8` 使用。  
    建议：明确 MVP 是否只保留 mock；若接入真实 AI，应从本地设置读取 key/baseUrl，并处理无 key、网络失败、模型不可用、超时和隐私提示。

13. `storageService` 对本地存储损坏没有容错。`services/storageService.ts:18-19`、`48-49`、`58-59` 直接 `JSON.parse`，任一 key 损坏会导致应用启动或页面渲染崩溃。  
    建议：加 `safeParse`、schema 校验、损坏数据备份与恢复默认值；测试覆盖坏 JSON。

14. 纠错回馈会复制“未修正”的内容。`components/library/ClassicReader.tsx:256-259` 中 `corrected: poem`，没有用户修订入口。  
    建议：增加纠错编辑表单；只有 `corrected.content !== original.content` 或 notes 明确时才允许打开 Issue。

### P2 中优先级

15. `components/library/WordCloud3D.tsx` 频率归一化在 `maxFreq === minFreq` 时会产生 `NaN`。  
    建议：分母为 0 时使用默认权重，例如 `0.5`。

16. 删除默认印章后设置会留下悬空 `defaultSealId`。  
    建议：`deleteSeal` 时如果删除的是默认印章，应清空默认值或切换到下一个可用印章。

17. 文档和 UI 文案存在规格漂移。README 与设置页仍声明 Tailwind CSS、Gemini Pro、典籍 33,000 首，但 `package.json` 无 Tailwind，当前 AI 点评为 mock，数据脚本默认每类最多 500 条。  
    建议：修复实现或修正文案，测试规范中加入“文案与能力一致性”检查。

18. `index.html` 依赖外部字体 CDN，但页面描述写“完全离线可用”。  
    建议：若坚持离线可用，应内置字体或提供字体加载失败兜底；若不离线，应修正文案。

## 四、接手修复顺序建议

1. 修复 `geminiService.ts` 语法阻断。
2. 补 `typecheck/test/build` 基础脚本与最小测试框架。
3. 修复 `Create` 专业模式空内容保存、清空按钮和结构完整度校验。
4. 收敛格律模板数据源，修复七绝模板不一致与词牌下阕错位。
5. 改造韵书/韵脚/未知字策略，先把“未校验”与“合规”区分开。
6. 修复部署路径、移动端布局、典籍审计数据字段。
7. 再处理 AI 接入、纠错回馈、文案一致性和 3D 词云边界。

## 五、验收门槛

每次修复 PR 至少满足：

- `npm run typecheck` 通过。
- `npm run test` 覆盖新增或变更逻辑。
- `npm run build` 通过。
- 涉及页面交互时运行 E2E 场景。
- 涉及视觉/导出/3D 时提供桌面与移动截图，确认无明显遮挡、空白画布或布局偏移。
- 涉及本地存储时手动或自动覆盖旧数据、坏 JSON、空数据三类场景。

## 六、操作边界给下一位 AI

- 不要直接运行 `scripts/fetch-poetry.js`，除非用户明确允许联网更新数据；该脚本会覆盖 `public/data/poetry.json`。
- 修复前先确认 `docs/` 未跟踪内容是否要保留，避免覆盖已有审计记录。
- 不要删除用户本地 `localStorage` 数据；测试本地存储时使用浏览器隔离上下文或 mock。
- 修改格律模板时不要只改 UI 或只改引擎；必须保证展示、录入、校验来自同一来源。
- 上线前需在生产 base `/Ou-Cheng/` 下验证静态资产路径。
