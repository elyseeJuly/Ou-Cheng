# 偶成 (Ou Cheng) — 数据 Schema 与备份格式规范 (DATA_SCHEMA.md)

**版本**：v0.5.1  
**定位**：作品、设置、印章、拾字囊及 V2 打包格式标准。

---

## 一、 作品模型 Discriminated Union (`Poem`)

所有作品对象共享公共基础属性 `PoemBase`：

```typescript
export interface PoemBase {
  id: string;
  title: string;
  author: string;
  content: string;
  heartNote: string;
  layout: 'vertical' | 'horizontal';
  paperStyle: 'xuan' | 'meihua' | 'yunwen' | 'zhu' | 'lianhua';
  rhymeBook: 'ci_lin' | 'ping_shui' | 'xin_yun';
  createdAt: number;
  updatedAt?: number;
  favorite?: boolean;
  draft?: boolean;
  fontStyle?: 'lxgw_wenkai' | 'noto_serif' | 'ma_shan_zheng' | 'none';
  sealId?: string;
  collectionName?: string;
}
```

其变体类型包括：
* `FreePoem`: `type: 'free'`, 可带 `formId` 与 `formName`；
* `SonnetPoem`: `type: 'sonnet'`, 必须带非 `none` 的 `sonnetType`，可带 `formId` 与 `formName`；
* `JintiPoem`: `type: 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7'`, 可带 `jintiVariant`；
* `CipaiPoem`: `type: 'cipai'`, 必须带非空 `cipaiName` 与 `cipaiVariantId`。

各变体字段互斥：自由诗/十四行诗不得携带词牌或近体诗字段，近体诗不得携带词牌、十四行或自由体例字段。

---

## 二、 V2 打包导出格式 (`OuchengBackupV2`)

全量全资产导出 JSON 结构：

```json
{
  "schemaVersion": 2,
  "exportedAt": 1784700000000,
  "poems": [ /* Poem 数组 */ ],
  "settings": { /* UserSettings */ },
  "seals": [ /* Seal 数组 */ ],
  "customForms": [ /* PoemForm 数组 */ ],
  "pouch": [ /* PouchItem 数组 */ ],
  "drafts": [
    { "key": "oucheng_create_draft_v1:作品ID", "data": { "title": "待续", "content": "..." } }
  ]
}
```

---

## 三、 运行时 Schema 校验与回退机制

任何来自外部导入或本地存储的数据，在反序列化时均由 `src/services/schemaValidator.ts` 强校验：
* `validatePoem(data)`
* `validateUserSettings(data)`
* `validateCustomForm(data)`
* `validatePouchItem(data)`
* `validateBackupV2(data)`
* `validateDraft(data)`

损坏字段会被丢弃或补齐合法默认值；违反作品判别联合的外部对象会被拒绝，不能通过导入或清洗路径绕过体裁边界。

## 四、IndexedDB v2 作品主仓

数据库 `oucheng_vault` 的 `poems` 对象仓以 `id` 为 keyPath，一首作品一条记录。LocalStorage 的 `oucheng_poems_v4` 是同步读取缓存，不再是存在 IndexedDB 时的权威数据源。
