// @vitest-environment happy-dom
import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import StructuredInput from './StructuredInput';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

const renderInput = async () => {
  vi.useFakeTimers();
  const onCaretCell = vi.fn();
  const host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(<StructuredInput
    patterns={[['X', 'X', 'X', 'X', 'X'], [], ['X', 'X', 'X', 'X', 'X']]}
    lines={['', '', '']} onChange={() => {}} onCaretCell={onCaretCell}
  />));
  return { inputs: Array.from(host.querySelectorAll('input')), onCaretCell };
};

describe('StructuredInput IME navigation', () => {
  it('keeps candidate navigation on the current row throughout composition', async () => {
    const { inputs, onCaretCell } = await renderInput();
    await act(async () => {
      inputs[1].focus();
      inputs[1].dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    });
    onCaretCell.mockClear();
    for (const key of ['Enter', 'ArrowDown', 'ArrowUp', 'Backspace']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      await act(async () => {
        inputs[1].dispatchEvent(event);
        inputs[1].dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      });
      expect(document.activeElement).toBe(inputs[1]);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(onCaretCell).not.toHaveBeenCalled();
  });

  it.each([
    { key: 'Enter', isComposing: true, keyCode: 13 },
    { key: 'ArrowUp', isComposing: true, keyCode: 38 },
    { key: 'Backspace', isComposing: true, keyCode: 8 },
    { key: 'Enter', isComposing: false, keyCode: 229 },
    { key: 'ArrowUp', isComposing: false, keyCode: 229 },
  ])('preserves native candidate handling for $key (composing=$isComposing, keyCode=$keyCode)', async options => {
    const { inputs } = await renderInput();
    await act(async () => inputs[1].focus());
    const event = new KeyboardEvent('keydown', { ...options, bubbles: true, cancelable: true });
    await act(async () => inputs[1].dispatchEvent(event));
    expect(document.activeElement).toBe(inputs[1]);
    expect(event.defaultPrevented).toBe(false);
  });

  it('still navigates between real rows after the candidate is committed', async () => {
    const { inputs } = await renderInput();
    await act(async () => {
      inputs[0].focus();
      inputs[0].dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      inputs[0].dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    expect(document.activeElement).toBe(inputs[1]);
    await act(async () => inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(inputs[0]);
  });
});
