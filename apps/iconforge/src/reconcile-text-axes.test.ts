import { describe, expect, it } from 'vitest';
import type { FontAxis } from '@toolbox/svg-ops';
import { scene } from './test-support';
import { reconcileTextAxes } from './reconcile-text-axes';

const textScene = (attrs: string) =>
  scene(`<svg viewBox="0 0 24 24"><text ${attrs}>Hi</text></svg>`);
const wght: FontAxis = { tag: 'wght', name: 'Weight', min: 200, default: 400, max: 700 };

describe('reconcileTextAxes', () => {
  it('clamps an out-of-range weight into the new axis range', () => {
    const s = textScene('font-weight="900"');
    const id = s.root.children[0]!.id;
    const next = reconcileTextAxes(s, id, [wght]);
    expect(next.root.children[0]!.attributes['font-weight']).toBe('700');
  });

  it('leaves weight untouched when the value is within range', () => {
    const s = textScene('font-weight="500"');
    const id = s.root.children[0]!.id;
    expect(reconcileTextAxes(s, id, [wght])).toBe(s);
  });

  it('does not add a weight to a node that has none', () => {
    const s = textScene('x="2" y="20"');
    const id = s.root.children[0]!.id;
    const next = reconcileTextAxes(s, id, [wght]);
    expect(next).toBe(s);
    expect(next.root.children[0]!.attributes['font-weight']).toBeUndefined();
  });

  it('does not touch attributes for axes the font lacks', () => {
    const s = textScene('font-stretch="150%"');
    const id = s.root.children[0]!.id;
    expect(reconcileTextAxes(s, id, [wght])).toBe(s);
  });
});
