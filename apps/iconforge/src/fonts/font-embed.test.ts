import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseSvg } from '@toolbox/svg-core';
import { embedFontSource, previewFontFaceCss } from './font-embed';

const fontBytes = readFileSync(
  new URL('../../../../packages/svg-ops/test-fixtures/LiberationSans-Regular.ttf', import.meta.url),
);
const buffer = fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength);

const scene = (svg: string) => parseSvg(svg).scene!;

describe('preview font embedding', () => {
  it('returns empty CSS when no referenced font is embedded', () => {
    expect(previewFontFaceCss(scene('<svg viewBox="0 0 24 24"><text font-family="Nope">Hi</text></svg>'))).toBe('');
  });

  it('embeds an @font-face data-URI rule for a referenced, embedded font', () => {
    embedFontSource('Liberation Sans', buffer);

    const css = previewFontFaceCss(
      scene('<svg viewBox="0 0 24 24"><g><text font-family="Liberation Sans">Hi</text></g></svg>'),
    );

    expect(css).toContain('@font-face');
    expect(css).toContain("font-family:'Liberation Sans'");
    expect(css).toContain('src:url(data:font/ttf;base64,');
    expect(css).toContain("format('truetype')");
  });

  it('only emits rules for families actually used by text nodes', () => {
    embedFontSource('Liberation Sans', buffer);
    expect(previewFontFaceCss(scene('<svg viewBox="0 0 24 24"><rect width="4" height="4" /></svg>'))).toBe('');
  });

  it('emits variable-font weight/stretch ranges in the @font-face', () => {
    embedFontSource('Demo', buffer, [
      { tag: 'wght', name: 'Weight', min: 200, default: 400, max: 700 },
      { tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 },
    ]);

    const css = previewFontFaceCss(
      scene('<svg viewBox="0 0 24 24"><text font-family="Demo">Hi</text></svg>'),
    );

    expect(css).toContain('font-weight:200 700');
    expect(css).toContain('font-stretch:75% 125%');
  });
});
