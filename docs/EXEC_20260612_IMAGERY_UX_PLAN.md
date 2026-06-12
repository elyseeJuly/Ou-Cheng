# 意象词云与诗词赏读功能重构计划

## 背景与目标
当前词云的古典意象数量较少，且词云与诗词赏读之间的互动不足。
本次重构的目标是：
1. **丰富意象库**：通过脚本提取诗词库中的新意象，扩充 `imagery.json`。
2. **双向联动导航**：
    - 在诗词赏读页（`ClassicReader.tsx`）展示当前诗词涉及的意象标签。
    - 点击意象标签，能够跳转到词云视图（`WordCloud3D.tsx`）并聚焦于该意象，同时展示其他包含该意象的诗词。
    - 在词云视图中点击包含该意象的具体诗词，能够跳转到赏读页并定位到该首诗词。
3. **UI/UX 优化**：美化词云的选中态面板，优化标签的视觉呈现。

## Proposed Changes

### 数据层

#### [MODIFY] public/data/imagery.json
使用上方的 Python 脚本读取 `poetry.json`，自动提取如“月亮”、“长剑”、“归鸿”、“寒梅”等约 60 多个古典意象种子词，统计其词频、朝代及共现词，并将结果追加合并至 `imagery.json` 中，丰富意象库。

---

### 组件层

#### [MODIFY] src/types.ts
如果需要，调整组件传递的 Props 类型，或者新增用于处理意象点击的事件回调类型。

#### [MODIFY] components/library/ClassicReader.tsx
- **新增意象解析逻辑**：接收全量 `imageryItems` 数据，根据当前 `poem.content` 和 `poem.title` 匹配出该诗词中包含的意象列表。
- **UI 渲染**：在作者与诗词正文之间，或者正文底部，新增一个「涉及意象」的标签展示区。
- **事件交互**：为意象标签添加点击事件 `onImageryClick(word)`，用于触发顶层的视图切换。

#### [MODIFY] components/library/WordCloud3D.tsx
- **优化展示面板**：美化点击意象后弹出的相关诗词列表。
- **事件交互**：为弹出的相关诗词列表项添加点击事件，将对应的诗词对象通过回调函数抛出，如 `onPoemClick(poem)`。

---

### 页面层

#### [MODIFY] pages/Library.tsx
作为顶层容器，需要管理全局的联动状态：
- 引入全局选中的意象状态（目前已有 `selectedWord`，需从 `ClassicReader` 也能改变此状态）。
- 处理 `ClassicReader` 抛出的 `onImageryClick`：
    1. 将当前视图 `view` 切换为 `'cloud'`。
    2. 设置 `selectedWord` 为点击的意象，并触发计算包含该意象的诗词列表。
- 处理 `WordCloud3D` 弹出的相关诗词点击：
    1. 将当前视图 `view` 切换为 `'read'`。
    2. 找到该诗词在 `filtered`（或 `allPoems`）中的索引。
    3. 更新 `ClassicReader` 的 `currentIdx`（这需要将 `currentIdx` 的 state 提升到 `Library.tsx` 中，或者通过某种方式控制 `ClassicReader` 定位）。

## Open Questions
- **状态提升**：为了让点击词云中的诗词能在 `ClassicReader` 中直接定位，是否同意将 `ClassicReader` 内部的 `currentIdx` 状态提升到 `Library.tsx` 中进行管理？
- **意象匹配性能**：在 `ClassicReader` 中实时去遍历全量意象库匹配当前诗词包含的意象，由于意象只有几百个，性能应该没问题。

## Verification Plan
1. 运行 Python 脚本扩充意象数据，检查 `imagery.json` 的更新结果。
2. 启动项目，进入「寻章摘句」页面，查看 3D 词云是否显示了更丰富的意象。
3. 切换至「经典赏读」，检查诗词下方是否正确渲染了意象标签。
4. 点击某意象标签，验证是否成功跳转至词云并聚焦该意象。
5. 在词云中点击展开的相关诗词，验证是否跳转回「经典赏读」并定位到了所选诗词。
