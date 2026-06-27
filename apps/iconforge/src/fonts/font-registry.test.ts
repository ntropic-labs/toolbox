import { describe, expect, it } from 'vitest';
import type { LoadedFont } from '@toolbox/svg-ops';
import { getLoadedFont, registerFont } from './font-registry';

const stub = (familyName: string): LoadedFont => ({
  familyName,
  unitsPerEm: 1000,
  ascent: 800,
  descent: -200,
  capHeight: 700,
  hasGlyph: () => true,
  outlinePath: () => null,
  layout: () => ({ glyphs: [] }),
});

describe('font registry family-name normalization', () => {
  it('matches quoted and comma-stacked font-family values', () => {
    const font = stub('Roboto Mono');
    registerFont(font);
    expect(getLoadedFont('Roboto Mono')).toBe(font);
    expect(getLoadedFont("'Roboto Mono'")).toBe(font);
    expect(getLoadedFont('"Roboto Mono", monospace')).toBe(font);
    expect(getLoadedFont('roboto mono')).toBe(font);
    expect(getLoadedFont('Nonexistent')).toBeNull();
  });
});
