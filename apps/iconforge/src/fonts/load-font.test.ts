import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadFontFromFile, loadGoogleFont } from './load-font';
import { getLoadedFont } from './font-registry';

const fontBytes = readFileSync(
  new URL('../../../../packages/svg-ops/test-fixtures/LiberationSans-Regular.ttf', import.meta.url)
);
const fontArrayBuffer = fontBytes.buffer.slice(
  fontBytes.byteOffset,
  fontBytes.byteOffset + fontBytes.byteLength
);

const css = `@font-face {
  font-family: 'Demo';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/demo/v1/demo-latin.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}`;

function fakeFetch(cssText: string, bytes: ArrayBuffer) {
  return (url: string): Promise<Response> => {
    if (url.includes('css2') || url.includes('/css?')) {
      return Promise.resolve(new Response(cssText, { status: 200 }));
    }
    return Promise.resolve(new Response(bytes, { status: 200 }));
  };
}

describe('loadGoogleFont', () => {
  it('resolves a family name, parses the font, and registers it', async () => {
    const font = await loadGoogleFont('Demo', {
      fetchImpl: fakeFetch(css, fontArrayBuffer)
    });

    expect(font.familyName.length).toBeGreaterThan(0);
    expect(font.layout('Hi').glyphs.length).toBe(2);
    expect(getLoadedFont(font.familyName)).toBe(font);
  });
});

describe('loadFontFromFile', () => {
  it('parses an uploaded font file and registers it for convert/bake', async () => {
    const file = new File([fontArrayBuffer], 'LiberationSans-Regular.ttf');

    const font = await loadFontFromFile(file);

    expect(font.familyName.length).toBeGreaterThan(0);
    expect(font.hasGlyph('H')).toBe(true);
    expect(getLoadedFont(font.familyName)).toBe(font);
  });
});
