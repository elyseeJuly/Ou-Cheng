// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { getSettings, saveSettings, getSeals, saveSeal, getCustomFormsFromStorage, saveCustomFormToStorage } from './storageService';

describe('Storage Test Residue Sanitization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('filters out residual test pen name and resets defaultPenName', () => {
    localStorage.setItem('oucheng_settings_v4', JSON.stringify({
      penNames: ['测试笔名', '居士', '散人'],
      defaultPenName: '测试笔名',
    }));

    const settings = getSettings();
    expect(settings.penNames).not.toContain('测试笔名');
    expect(settings.defaultPenName).toBe('居士');
  });

  it('filters out residual test seals and resets defaultSealId', () => {
    localStorage.setItem('oucheng_seals_v4', JSON.stringify([
      { id: 'seal_test_1', name: '测试印', dataUrl: 'data:image/png;base64,...' },
      { id: 'seal_real_1', name: '采菊东篱', dataUrl: 'data:image/png;base64,...' },
    ]));
    localStorage.setItem('oucheng_settings_v4', JSON.stringify({
      penNames: ['居士'],
      defaultPenName: '居士',
      defaultSealId: 'seal_test_1',
    }));

    const seals = getSeals();
    expect(seals.length).toBe(1);
    expect(seals[0].name).toBe('采菊东篱');

    const settings = getSettings();
    expect(settings.defaultSealId).toBeUndefined();
  });

  it('filters out residual test custom form', () => {
    localStorage.setItem('oucheng_custom_forms', JSON.stringify([
      { id: 'cf_test', name: '测试自定体', builtin: false, lineCount: 4, charsPerLine: 5 },
      { id: 'cf_real', name: '五言八句', builtin: false, lineCount: 8, charsPerLine: 5 },
    ]));

    const forms = getCustomFormsFromStorage();
    expect(forms.length).toBe(1);
    expect(forms[0].name).toBe('五言八句');
  });
});
