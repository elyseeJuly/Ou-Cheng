import { describe, expect, it } from 'vitest';
import { isLatinText } from './script';

describe('isLatinText', () => {
  it('tells western verse from chinese', () => {
    expect(isLatinText('Shall I compare thee to a summer’s day?')).toBe(true);
    expect(isLatinText('床前明月光，疑是地上霜。')).toBe(false);
    expect(isLatinText('我的 iPhone 里有一首诗，写给远方')).toBe(false);
  });
});
