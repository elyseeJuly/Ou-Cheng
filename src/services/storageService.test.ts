// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPoems, getSettings, importPoems, migrateRemovedProductData, savePoem, deletePoem, exportAllPoems, getDraft, saveDraft, deleteDraft } from './storageService';

describe('storage cleanup and import boundaries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes retired remote-service settings and generated annotations without touching poem metadata', async () => {
    localStorage.setItem('oucheng_settings_v4', JSON.stringify({
      penNames: ['偶成君', '山客'],
      defaultPenName: '偶成君',
      rhymeBook: 'ping_shui',
      defaultPaperStyle: 'meihua',
      defaultLayout: 'horizontal',
      apiKey: 'secret',
      apiBaseUrl: 'https://example.invalid/v1',
      apiModel: 'remote-model',
    }));
    localStorage.setItem('oucheng_poems_v4', JSON.stringify([{
      id: 'p1', title: '春日', author: '山客', content: '春风。', heartNote: '',
      type: 'free', layout: 'horizontal', paperStyle: 'meihua', rhymeBook: 'ping_shui',
      createdAt: 123, collectionName: '春集', sealId: 'seal-1', aiComment: 'retired annotation',
    }]));
    localStorage.setItem('oucheng_create_draft_v1', JSON.stringify({ title: '草稿', content: '未完', aiComment: 'retired annotation' }));

    await migrateRemovedProductData();

    const rawSettings = JSON.parse(localStorage.getItem('oucheng_settings_v4') || '{}');
    const rawPoems = JSON.parse(localStorage.getItem('oucheng_poems_v4') || '[]');
    const rawDraft = JSON.parse(localStorage.getItem('oucheng_create_draft_v1') || '{}');
    expect(rawSettings).toHaveProperty('apiKey', 'secret');
    expect(rawSettings).toHaveProperty('apiBaseUrl', 'https://example.invalid/v1');
    expect(rawSettings).toHaveProperty('apiModel', 'remote-model');
    expect(rawPoems[0]).toHaveProperty('aiComment', 'retired annotation');
    expect(rawDraft).toHaveProperty('aiComment', 'retired annotation');
    expect(getSettings().defaultPenName).toBe('山客');
    expect(getPoems()[0]).toMatchObject({ collectionName: '春集', sealId: 'seal-1', createdAt: 123 });
  });

  it('sanitizes retired fields when importing an old backup', async () => {
    const res = await importPoems(JSON.stringify({ poems: [{
      id: 'legacy', title: '旧稿', author: '旧人', content: '旧句。', heartNote: '',
      type: 'free', layout: 'vertical', paperStyle: 'xuan', rhymeBook: 'ci_lin',
      createdAt: 456, aiComment: 'retired annotation',
    }] }));
    expect(res.addedCount).toBe(1);
    expect(res.isV2).toBe(false);
    expect(JSON.parse(localStorage.getItem('oucheng_poems_v4') || '[]')[0]).toHaveProperty('aiComment', 'retired annotation');
  });

  it('imports V2 backup package and restores custom forms, seals, and pouch items', async () => {
    const v2Backup = {
      schemaVersion: 2,
      exportedAt: 12345678,
      poems: [{
        id: 'v2p1', title: 'V2作品', author: '作者', content: '佳句', heartNote: '',
        type: 'free', layout: 'vertical', paperStyle: 'xuan', rhymeBook: 'ci_lin',
        createdAt: 100,
      }],
      settings: { penNames: ['测试笔名'], defaultPenName: '测试笔名', rhymeBook: 'ci_lin', defaultPaperStyle: 'xuan', defaultLayout: 'vertical' },
      seals: [{ id: 's1', name: '印章1', style: 'yang_yuan', dataUrl: 'data:image/png;base64,xxx', isCustom: true, createdAt: 100 }],
      customForms: [{ id: 'custom_1', name: '自定义杂言', builtin: false }],
      pouch: [{ word: '东风', category: '天文', freq: 10, tone: '平', timestamp: 100 }],
    };

    const res = await importPoems(JSON.stringify(v2Backup));
    expect(res.addedCount).toBe(1);
    expect(res.isV2).toBe(true);
    expect(getPoems()).toHaveLength(1);
    expect(getPoems()[0].title).toBe('V2作品');
    expect(JSON.parse(localStorage.getItem('oucheng_custom_forms') || '[]')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('oucheng_pouch') || '[]')).toHaveLength(1);
  });

  describe('savePoem and deletePoem error handling & export', () => {
    const samplePoem = {
      id: 'test_save_1',
      title: '测试画作',
      author: '居士',
      content: '明月几时有',
      heartNote: '',
      type: 'free' as const,
      layout: 'vertical' as const,
      paperStyle: 'xuan' as const,
      rhymeBook: 'ci_lin' as const,
      createdAt: Date.now(),
    };

    it('returns { ok: true } on successful save and updates storage', async () => {
      const saveRes = await savePoem(samplePoem);
      expect(saveRes).toEqual({ ok: true });
      expect(getPoems()).toHaveLength(1);
      expect(getPoems()[0].title).toBe('测试画作');
    });

    it('catches QuotaExceededError and returns ok: false with informative error', async () => {
      const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      });

      try {
        const saveRes = await savePoem(samplePoem);
        expect(saveRes.ok).toBe(false);
        expect(saveRes.error).toContain('QuotaExceededError');
      } finally {
        spy.mockRestore();
      }
    });

    it('returns { ok: true } on deletePoem and removes item', async () => {
      await savePoem(samplePoem);
      expect(getPoems()).toHaveLength(1);

      const delRes = await deletePoem('test_save_1');
      expect(delRes).toEqual({ ok: true });
      expect(getPoems()).toHaveLength(0);
    });

    it('exportAllPoems produces a valid V2 backup package', async () => {
      await savePoem(samplePoem);
      await saveDraft('exported_draft', { title: '待续', content: '一半春风' });
      const jsonStr = exportAllPoems();
      const parsed = JSON.parse(jsonStr);

      expect(parsed.schemaVersion).toBe(2);
      expect(parsed.poems).toHaveLength(1);
      expect(parsed.poems[0].id).toBe('test_save_1');
      expect(parsed).toHaveProperty('settings');
      expect(parsed).toHaveProperty('seals');
      expect(parsed).toHaveProperty('customForms');
      expect(parsed).toHaveProperty('pouch');
      expect(parsed.drafts).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'oucheng_create_draft_v1:exported_draft', data: expect.objectContaining({ title: '待续' }) }),
      ]));
    });

    it('rejects illegal cross-genre fields from V2 imports', async () => {
      const result = await importPoems(JSON.stringify({
        schemaVersion: 2,
        exportedAt: Date.now(),
        poems: [{
          ...samplePoem,
          id: 'invalid_union',
          type: 'free',
          cipaiName: '如梦令',
          cipaiVariantId: 'rumengling_1',
        }],
        settings: { penNames: ['居士'], defaultPenName: '居士', rhymeBook: 'ci_lin', defaultPaperStyle: 'xuan', defaultLayout: 'vertical' },
        seals: [], customForms: [], pouch: [], drafts: [],
      }));
      expect(result.isV2).toBe(true);
      expect(result.addedCount).toBe(0);
      expect(getPoems()).toEqual([]);
    });

    it('supports draft save, get, and delete operations', async () => {
      const draftPayload = { title: '草稿', content: '明月几时有' };
      await saveDraft('draft_1', draftPayload);
      const retrieved = getDraft('draft_1');
      expect(retrieved).toMatchObject(draftPayload);

      await deleteDraft('draft_1');
      expect(getDraft('draft_1')).toBeNull();
    });
  });
});
