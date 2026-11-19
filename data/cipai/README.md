# 词牌与变体数据

应用使用 `hulbji/couyun` 的《钦定词谱》结构化数据作为可执行谱式底表，固定于提交 `1744e87f850c2205bc231bfdd858256036c0e4db`。该数据明确保留“中（可平可仄）”、平仄、句读、换韵、叶韵和叠韵，避免从一首示例词的实际声调反推整份词谱。

同一固定提交中的括注清理、句读规范化及五七言律句候选规则，也以 MIT 条款适配到 `src/engine/couyunProsody.ts`。完整第三方说明见根目录 `THIRD_PARTY_NOTICES.md`。

- 上游：<https://github.com/hulbji/couyun>
- 许可：MIT，见 `LICENSE.couyun`
- 固定快照：`couyun-snapshot.json`
- 构建脚本：`scripts/build-cipai-data.cjs`
- 生成目标：`public/data/cipai.json`

重新生成应用数据：

```bash
npm run build:cipai
```

如需从新的上游检出目录更新快照，先人工审阅差异，再运行：

```bash
npm run import:cipai-source -- /path/to/couyun
```

原先的 Kanripo《御定词谱》40 卷文本仍保存在 `kanripo/`，作为原文互校底本，不再由正则直接反推谱式。殆知阁 `daizhige-org/daizhigev20` 用于异文与简繁转换风险抽查；它是持续修订的综合文献库，不作为格律规则来源，也未整体打包进应用。

构建器会同时校验谱式字数、例词字数、句数和四个基准词牌（《菩萨蛮》《如梦令》《水调歌头》《忆江南》）。结构不自洽的条目会被拒绝，不能再靠“总量超过阈值”冒充正确。
