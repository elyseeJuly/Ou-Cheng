// @vitest-environment happy-dom
import React, { act, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import ImportModal from './ImportModal';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const clickButton = (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(item => item.textContent?.includes(label));
  if (!button) throw new Error(`button not found: ${label}`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const changeTextarea = (textarea: HTMLTextAreaElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('ImportModal cipai resolution', () => {
  it('closes on Escape and restores focus to the trigger', async () => {
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>导入文稿</button>
          {open && <ImportModal onClose={() => setOpen(false)} onImport={() => {}} />}
        </>
      );
    };

    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(<Harness />);
    });

    const trigger = document.querySelector('button')!;
    trigger.focus();
    await act(async () => {
      trigger.click();
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('关闭导入文稿');

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('invalidates the selected variant when reviewed content no longer matches it', async () => {
    const variants = [{
      id: 'test_exact', name: '试调', aliases: [], charCount: 4,
      category: 'xiao_ling', upperPattern: ['XX', 'XX'], variantLabel: '正体',
    }];
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => variants })));
    vi.stubGlobal('alert', vi.fn());

    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(<ImportModal onClose={() => {}} onImport={() => {}} />);
    });

    const input = document.querySelector('textarea')!;
    await act(async () => {
      changeTextarea(input, '《试调·春日》\n某甲\n春风，江山。');
    });
    await act(async () => {
      clickButton('本地解析并复核');
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const variantSelect = Array.from(document.querySelectorAll('select')).find(select =>
      Array.from(select.options).some(option => option.value === 'test_exact')
    );
    expect(variantSelect?.value).toBe('test_exact');

    const reviewedContent = document.querySelector('textarea')!;
    await act(async () => {
      changeTextarea(reviewedContent, '春风，江山，归舟。');
    });
    expect(variantSelect?.value).toBe('');
    expect(document.body.textContent).toContain('尚未形成唯一匹配');
  });
});
