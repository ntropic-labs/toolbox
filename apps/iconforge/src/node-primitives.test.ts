import { describe, expect, it } from 'vitest';
import { createTextNode, parseSvg, type SvgNode } from '@toolbox/svg-core';
import {
  addablePrimitives,
  composeTransform,
  createNodeOfKind,
  getNodeFields,
  parseTransform,
} from './node-primitives';

function node(svg: string): SvgNode {
  const parsed = parseSvg(svg);
  if (!parsed.scene) throw new Error('parse failed');
  return parsed.scene.root.children[0]!;
}

describe('transform parts', () => {
  it('reads a rotation angle from the transform, alongside translate and scale', () => {
    expect(parseTransform('translate(10 20) scale(2) rotate(45)').rotate).toBe(45);
    expect(parseTransform('rotate(-90)').rotate).toBe(-90);
  });

  it('defaults rotation to 0 when absent', () => {
    expect(parseTransform('translate(3 4)').rotate).toBe(0);
    expect(parseTransform(undefined).rotate).toBe(0);
  });

  it('emits rotation last so it pivots in local space, and omits it at 0', () => {
    expect(composeTransform({ tx: 10, ty: 20, scale: 2, rotate: 45 })).toBe(
      'translate(10 20) scale(2) rotate(45)'
    );
    expect(composeTransform({ tx: 0, ty: 0, scale: 1, rotate: 0 })).toBe('');
    expect(composeTransform({ tx: 0, ty: 0, scale: 1, rotate: 30 })).toBe('rotate(30)');
  });

  it('round-trips translate, scale, and rotation', () => {
    const parts = parseTransform('translate(5 6) scale(3) rotate(15)');
    expect(parseTransform(composeTransform(parts))).toEqual(parts);
  });
});

describe('node primitives', () => {
  it('surfaces only addable, kinded primitives in the add menu, in declaration order', () => {
    expect(addablePrimitives).toEqual([
      { kind: 'rect', label: 'Rectangle' },
      { kind: 'circle', label: 'Circle' },
      { kind: 'text', label: 'Text' },
    ]);
  });

  it('creates a node for an addable kind and rejects unknown kinds', () => {
    expect(createNodeOfKind('circle').tag).toBe('circle');
    expect(() => createNodeOfKind('hexagon')).toThrow();
  });

  it('falls back to the group primitive for unregistered tags', () => {
    const fields = getNodeFields(node('<svg viewBox="0 0 24 24"><path d="M0 0" /></svg>'));
    expect(fields.map((field) => field.name)).toContain('translateX');
  });

  it('builds rect inspector fields in order', () => {
    const fields = getNodeFields(node('<svg viewBox="0 0 24 24"><rect x="2" width="8" height="9" fill="#abc" /></svg>'));
    expect(fields.map((field) => field.name)).toEqual(['id', 'x', 'y', 'width', 'height', 'rx', 'fill', 'opacity']);
  });
});

describe('createNodeOfKind sizes new shapes to the scene viewBox', () => {
  const big = [0, 0, 1024, 1024] as const;

  it('adds visible, roughly-centered text rather than a corner speck', () => {
    const text = createNodeOfKind('text', big);
    expect(Number(text.attributes['font-size'])).toBeGreaterThan(100);
    expect(Number(text.attributes.x)).toBeGreaterThan(200);
    expect(Number(text.attributes.x)).toBeLessThan(824);
    expect(Number(text.attributes.y)).toBeGreaterThan(200);
    expect(Number(text.attributes.y)).toBeLessThan(824);
  });

  it('adds a centered rect scaled to the viewBox', () => {
    const rect = createNodeOfKind('rect', big);
    expect(Number(rect.attributes.width)).toBeGreaterThan(256);
    expect(Number(rect.attributes.x)).toBeGreaterThan(0);
  });

  it('adds a centered circle scaled to the viewBox', () => {
    const circle = createNodeOfKind('circle', big);
    expect(Number(circle.attributes.r)).toBeGreaterThan(128);
    expect(Number(circle.attributes.cx)).toBeCloseTo(512, 0);
  });

  it('gives new shapes a concrete hex fill the colour picker can show, not currentColor', () => {
    for (const kind of ['rect', 'circle', 'text']) {
      expect(createNodeOfKind(kind, big).attributes.fill).toBe('#000000');
    }
  });
});

describe('text inspector fields', () => {
  it('exposes outline (stroke) colour and width fields', () => {
    const node = createTextNode('Hi', { stroke: '#050609', 'stroke-width': '2' });
    const fields = getNodeFields(node);
    const names = fields.map((field) => field.name);
    expect(names).toContain('stroke');
    expect(names).toContain('stroke-width');
    expect(fields.find((field) => field.name === 'stroke')!.kind).toBe('color');
    expect(fields.find((field) => field.name === 'stroke-width')!.value).toBe('2');
  });
});
