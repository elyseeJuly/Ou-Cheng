// @vitest-environment happy-dom
import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import VerseRow from './VerseRow';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
});

describe('VerseRow Unicode input', () => {
  it('renders and limits CJK extension characters by visible character instead of UTF-16 unit', async () => {
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        <VerseRow
          pattern="XX"
          value="𠮷山"
          charStates={['neutral', 'neutral']}
          punctuation="。"
          inputRef={() => {}}
          onChange={onChange}
          onKeyDown={() => {}}
          onCaretOnRhyme={() => {}}
        />
      );
    });

    expect(Array.from(document.querySelectorAll('.verse-char')).map(node => node.textContent)).toEqual(['𠮷', '山']);

    const input = document.querySelector('input')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    await act(async () => {
      setter?.call(input, '𠮷山川');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onChange).toHaveBeenLastCalledWith('𠮷山');
  });
});
