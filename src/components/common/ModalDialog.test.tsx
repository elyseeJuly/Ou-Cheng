// @vitest-environment happy-dom
import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import ModalDialog from './ModalDialog';

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
});

describe('ModalDialog', () => {
  it('traps focus, closes on Escape, and restores prior focus', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    await act(async () => {
      root!.render(
        <ModalDialog label="测试弹窗" onClose={onClose}>
          <button>第一项</button>
          <button>末项</button>
        </ModalDialog>
      );
    });
    expect((document.activeElement as HTMLElement).textContent).toBe('第一项');

    const buttons = Array.from(document.querySelectorAll('button'));
    buttons[2].focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).textContent).toBe('第一项');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).textContent).toBe('末项');

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledOnce();

    await act(async () => root?.unmount());
    root = undefined;
    expect(document.activeElement).toBe(trigger);
  });
});
