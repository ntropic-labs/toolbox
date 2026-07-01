import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadFromBuffer } from './parse-font';
import type { LoadedFont } from './loaded-font';

function fixture(name: string): ArrayBuffer {
  const bytes = readFileSync(new URL(`../test-fixtures/${name}`, import.meta.url));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

let oswald: LoadedFont;
let liberation: LoadedFont;

beforeAll(async () => {
  oswald = await loadFromBuffer(fixture('Oswald-Variable.ttf'), 'Oswald-Variable.ttf');
  liberation = await loadFromBuffer(fixture('LiberationSans-Regular.ttf'), 'Liberation');
});

describe('loadFromBuffer variation axes', () => {
  it('exposes a variable font’s axes with names and ranges', () => {
    const wght = oswald.variationAxes.find((axis) => axis.tag === 'wght');
    expect(wght).toEqual({ tag: 'wght', name: 'Weight', min: 200, default: 400, max: 700 });
  });

  it('reports no axes for a static font', () => {
    expect(liberation.variationAxes).toEqual([]);
  });

  it('variant() changes glyph advance when an axis moves', () => {
    const light = oswald.variant({ wght: 200 }).layout('H').glyphs[0]!.advance;
    const heavy = oswald.variant({ wght: 700 }).layout('H').glyphs[0]!.advance;
    expect(heavy).toBeGreaterThan(light);
  });

  it('variant() ignores axes the font does not have (graceful no-op)', () => {
    const base = oswald.layout('H').glyphs[0]!.advance;
    const widened = oswald.variant({ wdth: 25 }).layout('H').glyphs[0]!.advance;
    expect(widened).toBe(base);
  });
});
