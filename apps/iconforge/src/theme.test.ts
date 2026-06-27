import { describe, expect, it } from 'vitest';
import { defaultTheme, getNextTheme, parseStoredTheme } from './theme';

describe('theme helpers', () => {
  it('defaults to dark mode', () => {
    expect(defaultTheme).toBe('dark');
    expect(parseStoredTheme(null)).toBe('dark');
  });

  it('toggles between dark and light mode', () => {
    expect(getNextTheme('dark')).toBe('light');
    expect(getNextTheme('light')).toBe('dark');
  });

  it('uses stored light or dark values and ignores invalid persisted values', () => {
    expect(parseStoredTheme('light')).toBe('light');
    expect(parseStoredTheme('dark')).toBe('dark');
    expect(parseStoredTheme('system')).toBe('dark');
    expect(parseStoredTheme('')).toBe('dark');
  });
});
