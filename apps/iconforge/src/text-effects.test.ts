import { describe, expect, it } from 'vitest';
import { parseSvg, serializeSvg } from '@toolbox/svg-core';
import { getTextShadow, setTextShadow } from './text-effects';

function textScene() {
  return parseSvg('<svg viewBox="0 0 24 24"><text x="2" y="20">Hi</text></svg>').scene!;
}

describe('text shadow', () => {
  it('adds a feDropShadow filter in defs and references it from the node', () => {
    const base = textScene();
    const id = base.root.children[0]!.id;
    const next = setTextShadow(base, id, { dx: 1, dy: 1, blur: 2, color: '#000000' });

    const serialized = serializeSvg(next);
    expect(serialized).toContain('<defs');
    expect(serialized).toContain('feDropShadow');
    expect(serialized).toContain('filter="url(#');
    expect(getTextShadow(next, id)).toEqual({ dx: 1, dy: 1, blur: 2, color: '#000000' });
  });

  it('removes the filter reference and the filter when shadow is cleared', () => {
    const base = textScene();
    const id = base.root.children[0]!.id;
    const withShadow = setTextShadow(base, id, { dx: 1, dy: 1, blur: 2, color: '#000000' });
    const cleared = setTextShadow(withShadow, id, null);

    expect(serializeSvg(cleared)).not.toContain('feDropShadow');
    expect(getTextShadow(cleared, id)).toBeNull();
  });
});
