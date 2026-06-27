import { describe, expect, it } from 'vitest';
import { parseSvg } from '@toolbox/svg-core';
import type { LoadedFont } from '@toolbox/svg-ops';
import { bakeTextToShapes } from './bake-text';

const fakeFont: LoadedFont = {
  familyName: 'Demo',
  unitsPerEm: 1000,
  ascent: 800,
  descent: -200,
  capHeight: 700,
  hasGlyph: () => true,
  outlinePath: () => ({ d: 'M0 0', advance: 500 }),
  layout: (text) => ({
    glyphs: [...text].map((char) => ({
      advance: 500,
      codePoints: [char.codePointAt(0)!],
      mapped: true,
      outline: ({ x, y }) => `M${x} ${y}`
    }))
  })
};

function scene(svg: string) {
  return parseSvg(svg).scene!;
}

describe('bakeTextToShapes', () => {
  it('outlines a text node whose font is loaded into a group of paths', () => {
    const base = scene(
      '<svg viewBox="0 0 24 24"><text font-family="Demo" x="2" y="20" font-size="16">Hi</text></svg>'
    );
    const result = bakeTextToShapes(base, () => fakeFont);

    expect(result.scene.root.children.map((node) => node.tag)).toEqual(['g']);
    expect(result.scene.root.children[0]!.children.every((c) => c.tag === 'path')).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('leaves text untouched and warns when no font is loaded', () => {
    const base = scene(
      '<svg viewBox="0 0 24 24"><text font-family="Nope" x="2" y="20">Hi</text></svg>'
    );
    const result = bakeTextToShapes(base, () => null);

    expect(result.scene.root.children[0]!.tag).toBe('text');
    expect(result.warnings.some((w) => w.includes('no loaded font'))).toBe(true);
  });

  it('bakes a <text> nested inside a <g>, inheriting the group font-family', () => {
    const base = scene(
      '<svg viewBox="0 0 24 24"><g font-family="Demo"><text x="2" y="20" font-size="16">Hi</text></g></svg>'
    );
    const result = bakeTextToShapes(base, () => fakeFont);

    const group = result.scene.root.children[0]!;
    expect(group.tag).toBe('g');
    const baked = group.children[0]!;
    expect(baked.tag).toBe('g');
    expect(baked.children.every((c) => c.tag === 'path')).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
