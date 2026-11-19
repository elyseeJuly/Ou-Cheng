// @vitest-environment happy-dom
import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import VerseRow from './VerseRow';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

const changeInput = (input: HTMLInputElement, value: string, isComposing = false) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing }));
};

const renderControlledRow = async (initialValue = '', pattern = 'XXXXX') => {
  const onChange = vi.fn();
  const onCaretCell = vi.fn();
  const onCaretOnRhyme = vi.fn();
  const Row = () => {
    const [value, setValue] = React.useState(initialValue);
    return <VerseRow
      pattern={pattern} value={value} charStates={[]} punctuation="。"
      inputRef={() => {}} onKeyDown={() => {}} onCaretOnRhyme={onCaretOnRhyme}
      onCaretCell={onCaretCell}
      onChange={next => { onChange(next); setValue(next); }}
    />;
  };
  const host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(<Row />));
  return { input: host.querySelector('input')!, onChange, onCaretCell, onCaretOnRhyme, rerender: () => root!.render(<Row />) };
};

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-compose-keyboard');
  vi.useRealTimers();
});

describe('VerseRow Unicode input', () => {
  it('syncs a native selection change after focus without requiring a key or text change', async () => {
    const { input, onChange, onCaretCell, onCaretOnRhyme } = await renderControlledRow('𠮷白日山河', 'XXXXR');
    await act(async () => {
      input.focus();
      input.setSelectionRange(0, 0);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await act(async () => {
      input.setSelectionRange(5, 5);
      document.dispatchEvent(new Event('selectionchange'));
    });
    expect(onCaretCell).toHaveBeenLastCalledWith(4);
    expect(onCaretOnRhyme).toHaveBeenLastCalledWith(true);
    expect(document.querySelectorAll('.verse-cell')[4].classList.contains('has-caret')).toBe(true);

    await act(async () => {
      input.setSelectionRange(2, 2);
      document.dispatchEvent(new Event('selectionchange'));
    });
    expect(onCaretCell).toHaveBeenLastCalledWith(1);
    expect(onCaretOnRhyme).toHaveBeenLastCalledWith(false);
    expect(document.querySelectorAll('.verse-cell')[1].classList.contains('has-caret')).toBe(true);
    expect(input.value).toBe('𠮷白日山河');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores native selection changes during composition and syncs the committed candidate', async () => {
    const { input, onChange, onCaretCell, onCaretOnRhyme } = await renderControlledRow('白日山河尽', 'XXXXR');
    await act(async () => {
      input.focus();
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    });
    onCaretCell.mockClear();
    onCaretOnRhyme.mockClear();
    await act(async () => {
      changeInput(input, '白日hai河尽', true);
      input.setSelectionRange(5, 5);
      document.dispatchEvent(new Event('selectionchange'));
    });
    expect(onCaretCell).not.toHaveBeenCalled();
    expect(onCaretOnRhyme).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(document.querySelector('.verse-cell.has-caret')).toBeNull();

    await act(async () => {
      changeInput(input, '白日海河尽', true);
      input.setSelectionRange(3, 3);
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '海' }));
    });
    expect(onChange).toHaveBeenLastCalledWith('白日海河尽');
    expect(onCaretCell).toHaveBeenLastCalledWith(3);
    expect(onCaretOnRhyme).toHaveBeenLastCalledWith(false);
    expect(input.selectionStart).toBe(3);
  });

  it('keeps long pinyin local until the five-character candidate is committed', async () => {
    const { input, onChange, rerender } = await renderControlledRow();
    await act(async () => {
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    });
    for (const pinyin of ['h', 'hu', 'huang', 'huanghe', 'huangheruhailiu']) {
      await act(async () => changeInput(input, pinyin, true));
      expect(input.value).toBe(pinyin);
      expect(onChange).not.toHaveBeenCalled();
      expect(document.querySelector('[role="alert"]')).toBeNull();
    }
    await act(async () => rerender());
    expect(input.value).toBe('huangheruhailiu');
    expect(input.hasAttribute('maxlength')).toBe(false);
    expect(document.querySelectorAll('.verse-char')).toHaveLength(0);

    await act(async () => {
      changeInput(input, '黄河入海流', true);
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '黄河入海流' }));
    });
    expect(onChange).toHaveBeenLastCalledWith('黄河入海流');
    expect(input.value).toBe('黄河入海流');
    expect(Array.from(document.querySelectorAll('.verse-char')).map(node => node.textContent).join('')).toBe('黄河入海流');

    // WebKit may send a final input after compositionend; the committed text must stay unchanged.
    await act(async () => changeInput(input, '黄河入海流'));
    expect(input.value).toBe('黄河入海流');
    expect(onChange.mock.calls.every(([value]) => value === '黄河入海流')).toBe(true);
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('limits already committed CJK text and clears overflow when a new composition starts', async () => {
    const { input, onChange } = await renderControlledRow();
    await act(async () => changeInput(input, '黄河入海流山'));
    expect(onChange).toHaveBeenLastCalledWith('黄河入海流');
    expect(input.value).toBe('黄河入海流');
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('超出格数');

    onChange.mockClear();
    await act(async () => {
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      changeInput(input, 'huangheruhailiu', true);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('preserves the caret when an IME candidate replaces a character in the middle', async () => {
    const { input, onChange, onCaretCell } = await renderControlledRow('白日山河尽');
    await act(async () => {
      input.focus();
      input.setSelectionRange(2, 3);
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      changeInput(input, '白日hai河尽', true);
    });
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => {
      changeInput(input, '白日海河尽', true);
      input.setSelectionRange(3, 3);
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '海' }));
    });
    expect(onChange).toHaveBeenLastCalledWith('白日海河尽');
    expect(input.selectionStart).toBe(3);
    expect(onCaretCell).toHaveBeenLastCalledWith(3);
  });

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

  it('keeps the focused input reference for delayed mobile scrolling', async () => {
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        <VerseRow
          pattern="XXXXX"
          value="白日"
          charStates={[]}
          punctuation="。"
          inputRef={() => {}}
          onChange={() => {}}
          onKeyDown={() => {}}
          onCaretOnRhyme={() => {}}
        />
      );
    });

    const input = document.querySelector('input')!;
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;

    await act(async () => {
      input.focus();
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it.each(['keyboard-managed', 'blurred'])('does not run delayed scrolling for a %s input', async state => {
    vi.useFakeTimers();
    const { input } = await renderControlledRow('白日');
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;

    await act(async () => {
      input.focus();
      if (state === 'keyboard-managed') document.documentElement.dataset.composeKeyboard = 'open';
      else input.blur();
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
