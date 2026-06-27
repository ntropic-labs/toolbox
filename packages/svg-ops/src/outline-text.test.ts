import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseSvg, serializeSvg, type SvgNode, type SvgScene } from '@toolbox/svg-core';
import { loadFromBuffer } from './parse-font';
import type { LoadedFont } from './loaded-font';
import { outlineSvgSceneText } from './index';
import { requireScene } from './test-support';

let font: LoadedFont;

beforeAll(async () => {
  const bytes = readFileSync(
    new URL('../test-fixtures/LiberationSans-Regular.ttf', import.meta.url)
  );
  font = await loadFromBuffer(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    'LiberationSans-Regular.ttf'
  );
});

function textNodeId(scene: SvgScene): string {
  const node = scene.root.children.find((child) => child.tag === 'text');
  if (!node) throw new Error('No text node in scene.');
  return node.id;
}

function pathNumbers(group: SvgNode): { xs: number[]; ys: number[] } {
  const numbers = group.children.flatMap((path) =>
    ((path.attributes.d ?? '').match(/-?\d+(?:\.\d+)?/gu) ?? []).map(Number)
  );
  return {
    xs: numbers.filter((_, index) => index % 2 === 0),
    ys: numbers.filter((_, index) => index % 2 === 1)
  };
}

describe('outlineSvgSceneText', () => {
  it('replaces the target text node in place with a group of outlined paths', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><rect width="4" height="4" /><text x="2" y="20" font-size="16">Hi</text></svg>'
    );

    const result = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font });

    expect(result.scene.root.children.map((node) => node.tag)).toEqual(['rect', 'g']);
    const group = result.scene.root.children[1]!;
    expect(group.children.length).toBeGreaterThan(0);
    expect(
      group.children.every((child) => child.tag === 'path' && (child.attributes.d ?? '').length > 0)
    ).toBe(true);
    expect(serializeSvg(result.scene)).not.toContain('<text');
  });

  it('carries paint and presentation attributes onto the group and emits self-contained SVG', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><text x="2" y="20" font-size="16" font-family="Inter" fill="#e8b84a" stroke="#050609" stroke-width="2" paint-order="stroke" transform="rotate(3)">Hi</text></svg>'
    );

    const result = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font });

    const group = result.scene.root.children[0]!;
    expect(group.attributes.fill).toBe('#e8b84a');
    expect(group.attributes.stroke).toBe('#050609');
    expect(group.attributes['stroke-width']).toBe('2');
    expect(group.attributes['paint-order']).toBe('stroke');
    expect(group.attributes.transform).toBe('rotate(3)');
    const serialized = serializeSvg(result.scene);
    expect(serialized).not.toContain('font-family');
    expect(serialized).not.toContain('@font-face');
  });

  it('scales glyph geometry with font-size and anchors it on the baseline at y', () => {
    const small = requireScene(
      '<svg viewBox="0 0 64 64"><text x="4" y="40" font-size="16">HH</text></svg>'
    );
    const large = requireScene(
      '<svg viewBox="0 0 64 64"><text x="4" y="40" font-size="32">HH</text></svg>'
    );

    const smallGroup = outlineSvgSceneText(small, { nodeId: textNodeId(small), font }).scene.root
      .children[0]!;
    const largeGroup = outlineSvgSceneText(large, { nodeId: textNodeId(large), font }).scene.root
      .children[0]!;

    const smallBounds = pathNumbers(smallGroup);
    const largeBounds = pathNumbers(largeGroup);
    const smallSpan = Math.max(...smallBounds.xs) - Math.min(...smallBounds.xs);
    const largeSpan = Math.max(...largeBounds.xs) - Math.min(...largeBounds.xs);
    expect(largeSpan / smallSpan).toBeGreaterThan(1.9);
    expect(largeSpan / smallSpan).toBeLessThan(2.1);
    expect(Math.max(...smallBounds.ys)).toBeLessThanOrEqual(40.5);
    expect(Math.min(...smallBounds.ys)).toBeGreaterThan(40 - 16);
  });

  it('shifts middle-anchored text by half the distance of end-anchored text', () => {
    const build = (anchor: string) =>
      requireScene(
        `<svg viewBox="0 0 64 64"><text x="32" y="40" font-size="16" text-anchor="${anchor}">Hi</text></svg>`
      );

    const minX = (anchor: string) => {
      const scene = build(anchor);
      const group = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font }).scene.root
        .children[0]!;
      return Math.min(...pathNumbers(group).xs);
    };

    const start = minX('start');
    const middle = minX('middle');
    const end = minX('end');
    expect(start - middle).toBeCloseTo((start - end) / 2, 1);
    expect(start).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(end);
  });

  it('positions glyphs with kerning from the font layout run', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 64 64"><text x="4" y="40" font-size="16">AV</text></svg>'
    );
    const scale = 16 / font.unitsPerEm;
    const standaloneAdvanceA = font.layout('A').glyphs[0]!.advance;

    const group = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font }).scene.root
      .children[0]!;

    const vPath = group.children[1]!;
    const vNumbers = ((vPath.attributes.d ?? '').match(/-?\d+(?:\.\d+)?/gu) ?? []).map(Number);
    const vMinX = Math.min(...vNumbers.filter((_, index) => index % 2 === 0));
    expect(vMinX).toBeLessThan(4 + standaloneAdvanceA * scale);
  });

  it('normalizes XML whitespace before outlining', () => {
    const messy = requireScene(
      '<svg viewBox="0 0 64 64"><text x="4" y="40" font-size="16">\n  Hi\n  there\n</text></svg>'
    );
    const clean = requireScene(
      '<svg viewBox="0 0 64 64"><text x="4" y="40" font-size="16">Hi there</text></svg>'
    );

    const messyResult = outlineSvgSceneText(messy, { nodeId: textNodeId(messy), font });
    const cleanResult = outlineSvgSceneText(clean, { nodeId: textNodeId(clean), font });

    expect(messyResult.warnings).toHaveLength(0);
    const messyGroup = messyResult.scene.root.children[0]!;
    const cleanGroup = cleanResult.scene.root.children[0]!;
    expect(messyGroup.children).toHaveLength(cleanGroup.children.length);
    expect(Math.min(...pathNumbers(messyGroup).xs)).toBeCloseTo(
      Math.min(...pathNumbers(cleanGroup).xs),
      1
    );
  });

  it('warns when unsupported text positioning attributes are present', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><text x="2" y="20" font-size="16" dx="2" dominant-baseline="middle">Hi</text></svg>'
    );

    const result = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font });

    expect(result.warnings.some((warning) => warning.includes('dx'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('dominant-baseline'))).toBe(true);
  });

  it('warns and falls back when numeric attributes cannot be parsed', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><text x="2" y="20" font-size="16" letter-spacing="2px">Hi</text></svg>'
    );

    const result = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font });

    expect(result.warnings.some((warning) => warning.includes('letter-spacing'))).toBe(true);
  });

  it('adds letter-spacing between glyphs', () => {
    const plain = requireScene(
      '<svg viewBox="0 0 64 64"><text x="4" y="40" font-size="16">HH</text></svg>'
    );
    const spaced = requireScene(
      '<svg viewBox="0 0 64 64"><text x="4" y="40" font-size="16" letter-spacing="4">HH</text></svg>'
    );

    const plainGroup = outlineSvgSceneText(plain, { nodeId: textNodeId(plain), font }).scene.root
      .children[0]!;
    const spacedGroup = outlineSvgSceneText(spaced, { nodeId: textNodeId(spaced), font }).scene.root
      .children[0]!;

    const plainSpan =
      Math.max(...pathNumbers(plainGroup).xs) - Math.min(...pathNumbers(plainGroup).xs);
    const spacedSpan =
      Math.max(...pathNumbers(spacedGroup).xs) - Math.min(...pathNumbers(spacedGroup).xs);
    expect(spacedSpan - plainSpan).toBeGreaterThan(3.5);
    expect(spacedSpan - plainSpan).toBeLessThan(4.5);
  });

  it('returns the scene unchanged with a warning for empty text', () => {
    const scene = requireScene('<svg viewBox="0 0 24 24"><text x="2" y="20"> </text></svg>');

    const result = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font });

    expect(result.scene).toBe(scene);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('empty');
  });

  it('skips characters without glyphs, warns by name, and outlines the rest', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><text x="2" y="20" font-size="16">A�</text></svg>'
    );

    const result = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font });

    const group = result.scene.root.children[0]!;
    expect(group.children).toHaveLength(1);
    expect(
      result.warnings.some(
        (warning) => warning.includes('�') && warning.includes('spacing was adjusted')
      )
    ).toBe(true);
  });

  it('round-trips the outlined scene through serialize and parse', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><text x="2" y="20" font-size="16" fill="#fff">Hi</text></svg>'
    );

    const result = outlineSvgSceneText(scene, { nodeId: textNodeId(scene), font });
    const reparsed = parseSvg(serializeSvg(result.scene));

    expect(reparsed.scene).toBeDefined();
    const group = reparsed.scene!.root.children[0]!;
    expect(group.tag).toBe('g');
    expect(group.children.filter((child) => child.tag === 'path')).toHaveLength(2);
  });

  it('throws for ids that do not name a text element', () => {
    const scene = requireScene('<svg viewBox="0 0 24 24"><rect width="4" height="4" /></svg>');
    const rectId = scene.root.children[0]!.id;

    expect(() => outlineSvgSceneText(scene, { nodeId: rectId, font })).toThrow(
      'not a <text> element'
    );
    expect(() => outlineSvgSceneText(scene, { nodeId: 'missing', font })).toThrow(
      'No node with id'
    );
  });
});
