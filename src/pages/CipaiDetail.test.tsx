// @vitest-environment happy-dom
import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CipaiDetail, { matchesCipaiVariant } from './CipaiDetail';
import { CipaiData } from '../types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sampleCipai: CipaiData = {
  id: 'qdc_test',
  name: '庆春泽',
  aliases: [],
  charCount: 66,
  category: 'zhong_diao',
  upperPattern: ['PZPPXR', 'PZZPP'],
  lowerPattern: ['PPZZPR', 'PPZPP'],
  representative: '张先',
  variantLabel: '正体',
  sourceAuthor: '张先',
  sourceText: '春水满江南\n归舟过远山\n月明人未眠\n风起落花前',
  sourceBook: '《御定词谱》（四库全书本）',
  description: '双调六十六字前后段各七句四仄韵',
};

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('CipaiDetail', () => {
  it('only accepts complete example poems with the selected variant structure', () => {
    const poem = { title: '庆春泽', author: '某甲', content: '春风吹满柳岸，归鸟入云端。\n明月照遍江水，清光满故园。', category: '宋词', dynasty: '宋代' };
    expect(matchesCipaiVariant(poem, sampleCipai)).toBe(true);
    expect(matchesCipaiVariant({ ...poem, content: poem.content.replace('清光', '□□') }, sampleCipai)).toBe(false);
    expect(matchesCipaiVariant({ ...poem, content: `${poem.content}多一字` }, sampleCipai)).toBe(false);
  });

  it('loads cipai detail even when example poetry data fails', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('cipai.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([sampleCipai]),
        });
      }
      return Promise.reject(new Error('poetry offline'));
    }));

    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(
        <MemoryRouter initialEntries={['/cipai/qdc_test']}>
          <Routes>
            <Route path="/cipai/:variantId" element={<CipaiDetail />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.querySelector('.cipai-vertical-name strong')?.textContent).toBe('庆春泽');
    expect(document.body.textContent).toContain('66 字');
    expect(document.body.textContent).toContain('定格词作');
    expect(document.body.textContent).toContain('春水满江南');
    expect(document.body.textContent).not.toContain('正在展卷');
  });

  it('shows the newly selected variant source poem immediately', async () => {
    const variant = {
      ...sampleCipai,
      id: 'qdc_variant',
      variantLabel: '又一体 1',
      sourceAuthor: '周邦彦',
      sourceText: '新体第一句\n新体第二句\n新体第三句\n新体第四句',
      sourceRef: 'Kanripo KR4j0086 卷二',
    };
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(String(input).includes('cipai.json') ? [sampleCipai, variant] : []),
    })));

    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(<MemoryRouter initialEntries={['/cipai/qdc_test']}><Routes><Route path="/cipai/:variantId" element={<CipaiDetail />} /></Routes></MemoryRouter>);
      await Promise.resolve();
      await Promise.resolve();
    });

    const select = document.querySelector('.variant-block select') as HTMLSelectElement;
    await act(async () => {
      select.value = 'qdc_variant';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(document.body.textContent).toContain('又一体 1');
    expect(document.body.textContent).toContain('新体第一句');
    expect(document.body.textContent).toContain('周邦彦 · Kanripo KR4j0086 卷二');
    expect(document.body.textContent).not.toContain('春水满江南');
  });
});
