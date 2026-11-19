# 韵书数据来源

本目录保存生成 `src/engine/rhymeGroupData.ts` 的原始数据。

- 上游项目：[`charlesix59/chinese_word_rhyme`](https://github.com/charlesix59/chinese_word_rhyme)
- 上游提交：`ff0e9c13fb037c43e0eaa5dc929c0fe4fa2ffb18`
- 上游许可：MIT，许可证全文见 `LICENSE.chinese_word_rhyme`
- 引入文件：`Pingshui_Rhyme.json`、`Cilin_Rhyme.json`、`Xinyun_Rhyme.json`

上游平水韵缺少传统 106 部中的“上声三讲”。生成脚本按《平水韵》原典补入以下 9 字：

`讲 港 棒 蚌 项 缿 玤 傋 耩`

补充内容依据：[维基文库《平水韵》](https://zh.wikisource.org/wiki/平水韵)（CC BY-SA 4.0）。

重新生成：

```bash
npm run build:rhyme
```

生成时会强制校验平水韵 106 部、词林正韵 19 部、中华新韵 14 部，避免数据缺部后仍静默进入应用。
