import { describe, expect, it } from 'vitest';
import { Poem } from '../types';
import { mergePoemForSave } from './poemSave';

const existing: Poem = {
  id: 'p1', title: '旧题', author: '山客', content: '旧句。', heartNote: '',
  type: 'free', layout: 'horizontal', horizontalSubMode: 'letter', paperStyle: 'meihua',
  rhymeBook: 'ping_shui', sealId: 'seal-1', collectionName: '春集', backgroundImage: 'legacy.png',
  createdAt: 100,
};

describe('mergePoemForSave', () => {
  it('preserves identity and non-editor metadata when an existing poem is revised', () => {
    const result = mergePoemForSave(existing, {
      id: 'p1', title: '新题', author: '山客', content: '新句。', heartNote: '',
      type: 'free', layout: 'vertical', paperStyle: 'xuan', rhymeBook: 'ci_lin', createdAt: 999,
    }, 200);
    expect(result).toMatchObject({
      id: 'p1', title: '新题', content: '新句。', createdAt: 100, updatedAt: 200,
      collectionName: '春集', sealId: 'seal-1', horizontalSubMode: 'letter', backgroundImage: 'legacy.png',
    });
  });
});
