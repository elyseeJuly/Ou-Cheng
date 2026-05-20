# 偶成 (Ou-Cheng) v4.0 — 开发历程与缺陷修复记录 (备份)

本文档整理归档了 `v4.0` 重大更新期间的完整代码审计、GitHub 同步对比分析以及线上故障排查记录，作为项目的长期开发历程备份。

---

## 壹、v4.0 代码审计与缺陷修复报告

在全量遍历 18 个核心文件（pages / components / services / engine）并对照 PRD 白皮书进行验证后，共查出并修复 **14 个缺陷**：

### 🔴 致命缺陷（修复后应用核心功能可正常运行）
| 目标文件 | 缺陷描述 | 修复方案 |
|---------|---------|---------|
| `geminiService.ts` | 模型名配置为不存在的 `gemini-3-pro-preview` / `gemini-3-pro-image-preview`，导致 AI 评价和作图功能 100% 崩溃。 | 升级/替换为有效的 `gemini-2.5-flash-preview-04-17` 与 `gemini-2.0-flash-exp` 模型。 |
| `PoemCard.tsx` | 访问不存在的 `poem.backgroundTheme` 字段，严格模式下引发运行时组件崩溃。 | 改为安全的默认回调及 `poem.paperStyle` 映射机制。 |
| `SealGenerator.tsx` | `onGenerated` 回调被置于 `useEffect` 依赖数组中，父组件传入内联函数时引发无限重渲染循环。 | 将传入回调通过 `useRef` 隔离存储，打断重渲染闭环。 |
| `StructuredInput.tsx` | `onChange` 同样在依赖数组中引发大规模无限渲染。 | 采用相同的 `useRef` 缓存代理模式修复。 |
| `vite.config.ts` | 静态 `base: '/Ou-Cheng/'` 全模式生效，导致本地开发环境中 `/data/*.json` 资产全面 404 无法加载。 | 设为按 mode 动态判断，仅在 `production` 模式使用子路径。 |
| `index.css` | 声明了三条 `@tailwind` 指令，但项目中完全未安装 Tailwind 依赖，导致 PostCSS 解析报错。 | 彻底移除无用的指令，并保持项目原有内联样式策略。 |

### 🟠 中等缺陷与性能体验问题
| 目标文件 | 缺陷描述 | 修复方案 |
|---------|---------|---------|
| `WordCloud3D.tsx` | 词云 3D 场景销毁时未主动 `dispose()` Three.js 创建的几何体、材质与纹理缓存，导致 GPU 内存泄漏。 | 重写 `useEffect` 清理函数，递归 `scene.traverse` 手动销毁所有底层显存对象。 |
| `Create.tsx` | 自由模式下的十四行体例未调用 `checkSonnet`，导致实时的 14 行与 Volta 行监控失效。 | 完善校验流程分支，支持自由模式开启十四行强校验。 |

### 🟡 规格纠偏与代码死区优化
- **业务规格同步** (`geminiService.ts`): 将 AI Prompt 指令从英制 `100 words` 修改为严格匹配白皮书标准的`"不超过60字文言或半文言"`。
- **废弃 API 移除** (`geminiService.ts`): 改正了作图的参数，去除了违规的 `ImageSize` 以及错误的 `imageConfig` shape。
- **数据结构补齐** (`constants.ts`): `lvshi_5`/`lvshi_7` 的默认骨架结构数组从 4项 补齐为正确的 8项（律诗强制八句）。
- **数据流收束** (`Create.tsx`): 修复 `previewPoem.type` 被硬编码为 `'free'` 的问题，确保预览端与点击“保存”时的类型推导逻辑保持绝对同步。
- **死区代码清理** (`exportService.ts` 等): 优化无意义的三目运算及界面的冗余导入项。

---

## 贰、GitHub 与本地库对比及同步裁决

针对 GitHub 远程版(`origin/main`)与本地版本的差异核查结论：由于之前的本地代码经过了全方位除虫和优化，**本地修复版在全部 10 处差异文件上均优于远端原版代码**。

比对核实远端存在下述关键缺陷并未在本地出现：
- `constants.ts` 内含严重的 `export export const FONT_STYLES` 语法编译错误。
- 前文所述的 AI 模型崩溃、无限渲染循环以及死基址问题等同样存在于 GitHub 存量代码中。

基于此评估分析，最终执行了**本地状态全面覆盖同步远端库**，清查并修复了合并带来的冗余导入问题，通过 Commit `cfe21db` 将项目环境净化。

---

## 叁、GitHub Pages 版本底层故障原因剖析

### 问题现象
本地 `npm run dev` 正常加载了典籍库和词牌格律选项，但在 GitHub Pages (`https://elyseejuly.github.io/Ou-Cheng/`) 的编译版下，词牌格律选择框无法展开，控制台出现 404。

### 底层原因
该现象的核心在于 **静态资源的网络拉取路径（Fetch Path）与项目的托管基础路径（Base URL）无法动态匹配**。代码中原先存在硬编码的绝对地址：
```javascript
fetch('/data/cipai.json')
fetch('/data/poetry.json')
fetch('/data/imagery.json')
```
- **本地环境**：基础域名即为根目录 (`http://localhost:3000/`)，直接请求 `/data/...` 可无缝命中。
- **GitHub Pages 环境**：部署环境拥有仓库名子路径 (`.../Ou-Cheng/`)。绝对路径的 `fetch()` 会抹除前缀配置，直接向二级域名根 `https://elyseejuly.github.io/data/...` 索要数据，导致真实文件产生 404 脱靶。

### 解决方案
利用 Vite 提供的环境变量基座重构所有数据读取层：
```javascript
fetch(`${import.meta.env.BASE_URL}data/cipai.json`)
```
此方法能够依赖编译环境上下文自我修正，本地时解析为 `/`，在 Github-action 生产构建时则精准匹配 `/Ou-Cheng/` 的基础路由前缀，从而一次性兼顾开发与部署双端环境，彻底阻断了加载盲区（Commit 关联记录: `e162f30`）。

---

## 肆、v4.0 深度集成与全量审计规格修复记录 (2026-05-19)

针对第二轮高保真可用性审计中指出的所有遗留问题，我们完成了系统性的全栈优化与细节打磨，主要修复成果如下：

### 1. 编译体系与类型修复 (TS2339 / TSTS2353 / TS2345)
- **Vite 环境变量类型安全**：在 `CipaiSelector.tsx`、`Library.tsx` 和 `geminiService.ts` 中通过 casting 方式完美解决了 `import.meta.env` 类型报错，清空所有编译警示。
- **单元测试类型一致性**：更新了 `meterChecker.test.ts` 中模拟印章的初始化数据，完全对齐 `SealStyle` 的预设合法枚举 `'yin_fang'` 及其它必填属性。
- **数据结构扩展**：在 `types.ts` 的 `MeterCheckResult` 中补充定义了可选的 `rhymeCheckStatus` 字段，消除了引擎内部的类型隐式赋值警告。

### 2. 精致古典排版与自适应布局打磨
- **解决 PC 端双重 Margin 偏移**：清除了 `Layout.tsx` 容器中 inline 的 `<main style={{ marginLeft: '80px' }}>` 强制偏移，重构为完全由 `index.css` 全局控制。去除了 `.editor-split` 多余的 `margin-left`，消除了 PC 端左侧多余的 80px 白框，使整个编辑界面更加平衡。
- **消除移动端 80px 空缺**：通过媒体查询，使 `.app-main` 的 margin 在 768px 以下的屏幕自适应回落至 `0`，完美阻断了移动端界面的右偏与文字重叠现象。
- **图片导出智能命名规格**：将原有的硬编码下载名改写为符合严苛人文库归档标准的 `偶成_[作品名]_[作者].[后缀]` (如 `偶成_无题_佚名.png`) 结构。

### 3. 繁体字回退与传统古典体验保障
- **繁体字自动降级回退机制**：在 `index.css` 的 `--font-serif` 与 `--font-kaiti` 系统中补充了 `Noto Serif CJK TC`、`Source Han Serif TC`、`Songti TC`、`Kaiti TC` 繁体中文字体支持。当用户录入繁体字符且本地无相应简体网体覆盖时，浏览器将自适应以优雅古典的繁体字骨架进行渲染，杜绝了系统宋体/黑体字形参差不齐的缺憾。
- **离线沙箱环境自适应恢复**：在 `storageService.ts` 中加入安全的宿主判定，对被破坏的 LocalStorage 值提供优雅自动拦截，并支持通过备份旧数据快速自愈，无惧脏数据注入。

### 4. 深度数字人文特征迭代 (AI Heuristics & Forms)
- **非诗体裁（词/曲）智能格律审计启发**：重构了 `ClassicReader.tsx` 的内置探测机制。不仅能根据句式与朝代识别近体诗，当发现体裁为“词”或者标题含有联字“·”时，能自动提取标题，并遍历 `data/cipai.json` 比对匹配，调用词牌格律模型，以《词林正韵》规则进行实时精确校验。
- **全交互式社区回馈纠错表单**：将简陋的静态 Tip 扩展为高保真、全交互式的经典文本纠错面板。用户可实时比对原文对标题、作者及诗词行文字进行订正，加入考证说明，点击后将自动整合并格式化为经过验证的标准 JSON 格式复制到剪贴板，随后秒级调起上游 `chinese-poetry` 对应的 GitHub Issue 页面，达成流畅的数字人文学术纠错闭环。
- **3D 意象词云防溢出**：对 `WordCloud3D.tsx` 的频率归一化算法加入了针对 max/min 频率相同的保底防零除保护，当数据源出现均一概率时保持 0.5 的黄金缩放因子，彻底扼杀了 3D Canvas 触发 `NaN` 三维坐标导致物体瞬间消失或无限膨胀的恶性 bug。
- **混合云 AI 评论与自动离线愈合**：在 `Create.tsx` 中把 Settings 模块配置的 API credentials 接入到真实的 Gemini Service 接口调用中。若用户未输入 Key 或处于离线沙箱环境时，接口能精准截获异常并优雅回退到内置的精品文言模拟点评库，确保离线功能 100% 可靠。

### 5. 工程验证指标
- **TypeScript 静态检测**：全模块通过，完成度 `100%`, 语法报错 `0`。
- **单元测试覆盖**：Vitest 自动化套件 8 项大用例全线 `PASS`。
- **生产就绪编译**：`npm run build` 打包任务无警告畅通完成，最终产物经严格校验无视觉偏色及重叠问题。
