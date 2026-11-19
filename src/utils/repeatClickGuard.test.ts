import { describe, it, expect } from 'vitest';
import { createRepeatClickGuard } from './repeatClickGuard';

describe('createRepeatClickGuard', () => {
  it('treats the second click of a desktop double-click (detail=2) as a repeat', () => {
    const guard = createRepeatClickGuard(400, () => 0);
    expect(guard('月', { detail: 1 })).toBe(false);
    expect(guard('月', { detail: 2 })).toBe(true);
  });

  it('treats a quick second tap on the same key as a repeat (touch, no detail)', () => {
    let t = 1000;
    const guard = createRepeatClickGuard(400, () => t);
    expect(guard('月', { detail: 0 })).toBe(false);
    t += 250;
    expect(guard('月', { detail: 0 })).toBe(true);
  });

  it('does not treat slow clicks or clicks on another key as repeats', () => {
    let t = 0;
    const guard = createRepeatClickGuard(400, () => t);
    expect(guard('月', { detail: 1 })).toBe(false);
    t += 600;
    expect(guard('月', { detail: 1 })).toBe(false);
    t += 100;
    expect(guard('风', { detail: 1 })).toBe(false);
  });
});
