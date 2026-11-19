// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportPoem } from './exportService';
import type { Poem } from '../types';

const html2canvasMock = vi.hoisted(() => vi.fn());

vi.mock('html2canvas', () => ({ default: html2canvasMock }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@capacitor/filesystem', () => ({ Filesystem: {}, Directory: { Cache: 'CACHE' } }));
vi.mock('@capacitor/share', () => ({ Share: {} }));

describe('exportPoem', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createImageData: () => ({ data: new Uint8ClampedArray(128 * 128 * 4) }),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AA==');
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    html2canvasMock.mockReset();
    document.body.innerHTML = '';
  });

  it('resets the off-screen position in the cloned document before rasterizing', async () => {
    let clonedStyle: CSSStyleDeclaration | undefined;
    html2canvasMock.mockImplementation(async (_element, options) => {
      const clonedDoc = document.implementation.createHTMLDocument();
      const cloned = clonedDoc.createElement('div');
      cloned.id = 'oucheng-export-container';
      Object.assign(cloned.style, { position: 'fixed', top: '-9999px', left: '-9999px' });
      clonedDoc.body.appendChild(cloned);
      options.onclone(clonedDoc);
      clonedStyle = cloned.style;
      return {
        toBlob: (callback: BlobCallback) => callback(new Blob(['image'], { type: 'image/png' })),
      };
    });

    const poem: Poem = {
      id: 'export-test',
      title: '测试',
      author: '偶成',
      content: '春眠不觉晓\n处处闻啼鸟',
      heartNote: '',
      layout: 'vertical',
      paperStyle: 'xuan',
      rhymeBook: 'ping_shui',
      createdAt: 0,
      type: 'free',
    };

    const result = await exportPoem(poem, {
      direction: 'vertical',
      scale: 1,
      format: 'png',
    });

    expect(result).toEqual({ success: true });
    expect(html2canvasMock).toHaveBeenCalledOnce();
    expect(clonedStyle?.position).toBe('static');
    expect(clonedStyle?.top).toBe('0px');
    expect(clonedStyle?.left).toBe('0px');
    expect(document.getElementById('oucheng-export-container')).toBeNull();
  });
});
