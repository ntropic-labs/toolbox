import { describe, expect, it } from 'vitest';
import { serializeSvg } from '@toolbox/svg-core';
import { scene } from './test-support';
import {
  addLayer,
  applyMatrix,
  centerFromMatrix,
  centerInUserSpace,
  centerLayer,
  duplicateLayer,
  findParentId,
  fitTransform,
  getAdaptiveRole,
  getBackgroundColor,
  getNodeFields,
  getSelectedNode,
  invertMatrix,
  layerCenter,
  listLayers,
  multiplyMatrix,
  newlyAddedId,
  normalizeCanvas,
  removeLayer,
  reorderLayer,
  setAdaptiveRole,
  setBackgroundColor,
  setLayerCenter,
  setLayerCenterPoint,
  setLayerRotation,
  setNodeText,
  toggleLayerVisible,
  updateNodeField
} from './scene-editor';

describe('scene-editor layer list', () => {
  it('lists top-level nodes topmost-first with friendly labels and selection', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><rect width="8" height="8" /><circle id="dot" r="4" /></svg>'
    );
    const circleId = s.root.children[1]!.id;

    const layers = listLayers(s, circleId);

    expect(layers.map((l) => l.label)).toEqual(['circle#dot', 'rect']);
    expect(layers[0]!.selected).toBe(true);
    expect(layers[1]!.selected).toBe(false);
  });

  it('marks a hidden node (display none) in its status', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect width="8" height="8" display="none" /></svg>');

    expect(listLayers(s, '')[0]!.hidden).toBe(true);
    expect(listLayers(s, '')[0]!.status.toLowerCase()).toContain('hidden');
  });
});

describe('scene-editor adaptive role', () => {
  it('defaults an untagged layer to foreground', () => {
    const s = scene('<svg viewBox="0 0 108 108"><rect width="108" height="108" /></svg>');
    expect(getAdaptiveRole(s.root.children[0]!)).toBe('foreground');
  });

  it('tags a layer as background and reflects it in the layer status', () => {
    const s = scene('<svg viewBox="0 0 108 108"><rect width="108" height="108" /></svg>');
    const id = s.root.children[0]!.id;

    const tagged = setAdaptiveRole(s, id, 'background');

    expect(getAdaptiveRole(getSelectedNode(tagged, id)!)).toBe('background');
    expect(listLayers(tagged, '')[0]!.adaptiveRole).toBe('background');
    expect(listLayers(tagged, '')[0]!.status.toLowerCase()).toContain('background');
  });

  it('persists the background tag through a serialize round-trip', () => {
    const s = scene('<svg viewBox="0 0 108 108"><rect width="108" height="108" /></svg>');
    const id = s.root.children[0]!.id;

    const reparsed = scene(serializeSvg(setAdaptiveRole(s, id, 'background')));

    expect(getAdaptiveRole(reparsed.root.children[0]!)).toBe('background');
  });

  it('clears the attribute when set back to foreground', () => {
    const s = scene(
      '<svg viewBox="0 0 108 108"><rect data-adaptive-role="background" width="108" height="108" /></svg>'
    );
    const id = s.root.children[0]!.id;

    const cleared = setAdaptiveRole(s, id, 'foreground');

    expect(getSelectedNode(cleared, id)!.attributes['data-adaptive-role']).toBeUndefined();
    expect(getAdaptiveRole(getSelectedNode(cleared, id)!)).toBe('foreground');
  });
});

describe('scene-editor mutations', () => {
  it('adds a shape on top and returns it as the selection', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>');

    const result = addLayer(s, 'circle');
    const added = result.scene.root.children.at(-1)!;

    expect(added.tag).toBe('circle');
    expect(result.selectedId).toBe(added.id);
  });

  it('removes, reorders, and duplicates by node id', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><rect id="a" width="8" height="8" /><circle id="b" r="4" /></svg>'
    );
    const aId = s.root.children[0]!.id;

    expect(removeLayer(s, aId).root.children.map((n) => n.attributes.id)).toEqual(['b']);
    expect(reorderLayer(s, aId, 1).root.children.map((n) => n.attributes.id)).toEqual(['b', 'a']);

    const dup = duplicateLayer(s, aId);
    expect(dup.scene.root.children).toHaveLength(3);
    expect(dup.selectedId).not.toBe(aId);
  });

  it('toggles visibility via the display attribute', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect id="a" width="8" height="8" /></svg>');
    const id = s.root.children[0]!.id;

    const hidden = toggleLayerVisible(s, id);
    expect(serializeSvg(hidden)).toContain('display="none"');
    const shown = toggleLayerVisible(hidden, id);
    expect(serializeSvg(shown)).not.toContain('display="none"');
  });
});

describe('scene-editor attribute fields', () => {
  it('offers a Name field bound to the node id for every node', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect id="bg" width="8" height="8" /></svg>');
    const name = getNodeFields(s.root.children[0]!).find((f) => f.name === 'id');

    expect(name?.kind).toBe('text');
    expect(name?.label).toBe('Name');
    expect(name?.value).toBe('bg');
  });

  it('offers rect geometry, corner radius, fill, and opacity fields', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="8" height="9" rx="1" fill="#abcdef" /></svg>'
    );
    const node = s.root.children[0]!;

    const fields = getNodeFields(node);
    const byName = Object.fromEntries(fields.map((f) => [f.name, f]));

    expect(byName.x!.kind).toBe('number');
    expect(byName.x!.value).toBe('2');
    expect(byName.rx!.kind).toBe('number');
    expect(byName.rx!.value).toBe('1');
    expect(byName.fill!.kind).toBe('color');
    expect(byName.fill!.value).toBe('#abcdef');
  });

  it('offers translate and scale position fields for a group, reading them from its transform', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><g transform="translate(3 5) scale(2)"><rect width="4" height="4" /></g></svg>'
    );
    const byName = Object.fromEntries(getNodeFields(s.root.children[0]!).map((f) => [f.name, f]));

    expect(byName.translateX!.value).toBe('3');
    expect(byName.translateY!.value).toBe('5');
    expect(byName.scale!.value).toBe('2');
  });

  it('writes a group position and scale through the transform attribute', () => {
    const s = scene('<svg viewBox="0 0 24 24"><g><rect width="4" height="4" /></g></svg>');
    const id = s.root.children[0]!.id;

    const moved = updateNodeField(s, id, 'translateX', '10');
    expect(serializeSvg(moved)).toContain('transform="translate(10 0)"');

    const scaled = updateNodeField(updateNodeField(s, id, 'translateX', '10'), id, 'scale', '3');
    expect(serializeSvg(scaled)).toContain('translate(10 0)');
    expect(serializeSvg(scaled)).toContain('scale(3)');
  });

  it('renames a layer by setting its id, which updates the layer label', () => {
    const s = scene('<svg viewBox="0 0 24 24"><g><rect width="4" height="4" /></g></svg>');
    const id = s.root.children[0]!.id;

    const renamed = updateNodeField(s, id, 'id', 'logo');
    expect(listLayers(renamed, id)[0]!.label).toBe('g#logo');
  });

  it('centers a layer by translating its bounding-box center to the canvas center', () => {
    // fallow-ignore-next-line code-duplication
    const s = scene('<svg viewBox="0 0 100 100"><g><rect width="20" height="20" /></g></svg>');
    const id = s.root.children[0]!.id;

    const centered = centerLayer(s, id, { x: 0, y: 0, width: 20, height: 20 });
    expect(serializeSvg(centered)).toContain('transform="translate(40 40)"');
  });

  it('accounts for an existing scale when centering', () => {
    const s = scene(
      '<svg viewBox="0 0 100 100"><g transform="scale(2)"><rect width="20" height="20" /></g></svg>'
    );
    const id = s.root.children[0]!.id;

    const centered = centerLayer(s, id, { x: 0, y: 0, width: 20, height: 20 });
    expect(serializeSvg(centered)).toContain('translate(30 30)');
    expect(serializeSvg(centered)).toContain('scale(2)');
  });

  it('leaves an already-centered layer without a transform', () => {
    const s = scene('<svg viewBox="0 0 100 100"><g><rect width="20" height="20" /></g></svg>');
    const id = s.root.children[0]!.id;

    const centered = centerLayer(s, id, { x: 40, y: 40, width: 20, height: 20 });
    expect(serializeSvg(centered)).not.toContain('transform=');
  });

  it('reports a layer center in canvas units, accounting for translate and scale', () => {
    const s = scene(
      '<svg viewBox="0 0 100 100"><g transform="translate(10 20) scale(2)"><rect width="10" height="10" /></g></svg>'
    );
    const node = s.root.children[0]!;
    expect(layerCenter(node, { x: 0, y: 0, width: 10, height: 10 })).toEqual({ x: 20, y: 30 });
  });

  it('reports the bbox center directly when there is no transform', () => {
    const s = scene(
      '<svg viewBox="0 0 1024 1024"><rect x="100" y="100" width="200" height="200" /></svg>'
    );
    const node = s.root.children[0]!;
    expect(layerCenter(node, { x: 100, y: 100, width: 200, height: 200 })).toEqual({
      x: 200,
      y: 200
    });
  });

  it('moves a layer so its visual center lands on the typed coordinate', () => {
    const s = scene(
      '<svg viewBox="0 0 1024 1024"><rect x="0" y="0" width="20" height="20" /></svg>'
    );
    const id = s.root.children[0]!.id;
    const moved = setLayerCenter(s, id, { x: 0, y: 0, width: 20, height: 20 }, 'x', 512);
    expect(serializeSvg(moved)).toContain('transform="translate(502 0)"');
  });

  it('preserves scale and the untouched axis when setting one center coordinate', () => {
    const s = scene(
      '<svg viewBox="0 0 1024 1024"><g transform="translate(5 7) scale(2)"><rect width="10" height="10" /></g></svg>'
    );
    const id = s.root.children[0]!.id;
    const moved = setLayerCenter(s, id, { x: 0, y: 0, width: 10, height: 10 }, 'y', 100);
    expect(serializeSvg(moved)).toContain('translate(5 90)');
    expect(serializeSvg(moved)).toContain('scale(2)');
  });

  it('clears the transform when a centered coordinate cancels the translate', () => {
    const s = scene('<svg viewBox="0 0 100 100"><rect x="0" y="0" width="20" height="20" /></svg>');
    const id = s.root.children[0]!.id;
    const x = setLayerCenter(s, id, { x: 0, y: 0, width: 20, height: 20 }, 'x', 10);
    const xy = setLayerCenter(x, id, { x: 0, y: 0, width: 20, height: 20 }, 'y', 10);
    expect(serializeSvg(xy)).not.toContain('transform=');
  });

  it('reports a rotation-aware layer center', () => {
    const s = scene(
      '<svg viewBox="0 0 100 100"><g transform="rotate(90)"><rect width="20" height="20" /></g></svg>'
    );
    const c = layerCenter(s.root.children[0]!, { x: 0, y: 0, width: 20, height: 20 });
    expect(c.x).toBeCloseTo(-10, 6);
    expect(c.y).toBeCloseTo(10, 6);
  });

  // fallow-ignore-next-line code-duplication
  it('rotates a layer in place, holding its visual center fixed', () => {
    const s = scene(
      '<svg viewBox="0 0 100 100"><rect x="40" y="40" width="20" height="20" /></svg>'
    );
    const id = s.root.children[0]!.id;
    const bbox = { x: 40, y: 40, width: 20, height: 20 };

    const rotated = setLayerRotation(s, id, bbox, 90);
    expect(serializeSvg(rotated)).toContain('rotate(90)');

    const center = layerCenter(getSelectedNode(rotated, id)!, bbox);
    expect(center.x).toBeCloseTo(50, 6);
    expect(center.y).toBeCloseTo(50, 6);
  });

  it('rotating in place and back to 0° restores the transform-free layer', () => {
    const s = scene(
      '<svg viewBox="0 0 100 100"><rect x="40" y="40" width="20" height="20" /></svg>'
    );
    const id = s.root.children[0]!.id;
    const bbox = { x: 40, y: 40, width: 20, height: 20 };
    const rotated = setLayerRotation(s, id, bbox, 90);
    const back = setLayerRotation(rotated, id, bbox, 0);
    expect(serializeSvg(back)).not.toContain('transform=');
  });

  it('places a layer center on a point, accounting for scale and rotation', () => {
    const s = scene(
      '<svg viewBox="0 0 100 100"><g transform="scale(2)"><rect width="10" height="10" /></g></svg>'
    );
    const id = s.root.children[0]!.id;
    const bbox = { x: 0, y: 0, width: 10, height: 10 };
    const placed = setLayerCenterPoint(s, id, bbox, 50, 50);
    const c = layerCenter(getSelectedNode(placed, id)!, bbox);
    expect(c.x).toBeCloseTo(50, 6);
    expect(c.y).toBeCloseTo(50, 6);
    expect(serializeSvg(placed)).toContain('scale(2)');
  });

  it('rescaling about the held center keeps the visual center fixed', () => {
    const s = scene(
      '<svg viewBox="0 0 100 100"><g transform="translate(30 30) scale(2)"><rect width="10" height="10" /></g></svg>'
    );
    const id = s.root.children[0]!.id;
    const bbox = { x: 0, y: 0, width: 10, height: 10 };
    const before = layerCenter(s.root.children[0]!, bbox);

    const scaled = updateNodeField(s, id, 'scale', '4');
    const restored = setLayerCenterPoint(scaled, id, bbox, before.x, before.y);

    const after = layerCenter(getSelectedNode(restored, id)!, bbox);
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
    expect(serializeSvg(restored)).toContain('scale(4)');
  });

  it('fits an uploaded viewBox to the host viewBox as a scale transform', () => {
    expect(fitTransform([0, 0, 1024, 1024], [0, 0, 24, 24])).toBe('scale(42.667)');
    expect(fitTransform([0, 0, 100, 100], [10, 10, 50, 50])).toBe('translate(-20 -20) scale(2)');
    expect(fitTransform([0, 0, 100, 100], [0, 0, 100, 100])).toBe('');
  });

  it('offers circle geometry fields', () => {
    const s = scene('<svg viewBox="0 0 24 24"><circle cx="5" cy="6" r="4" /></svg>');

    const names = getNodeFields(s.root.children[0]!).map((f) => f.name);
    expect(names).toContain('cx');
    expect(names).toContain('cy');
    expect(names).toContain('r');
  });

  it('offers text content, size, fill, and anchor fields', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><text x="2" y="9" font-size="6" text-anchor="middle">Hi</text></svg>'
    );

    const byName = Object.fromEntries(getNodeFields(s.root.children[0]!).map((f) => [f.name, f]));
    expect(byName.content!.kind).toBe('content');
    expect(byName.content!.value).toBe('Hi');
    expect(byName['font-size']!.value).toBe('6');
    expect(byName['text-anchor']!.kind).toBe('select');
    expect(byName['text-anchor']!.value).toBe('middle');
  });

  it('writes a numeric attribute and clears it when blank', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>');
    const id = s.root.children[0]!.id;

    expect(serializeSvg(updateNodeField(s, id, 'x', '5'))).toContain('x="5"');
    const withX = updateNodeField(s, id, 'x', '5');
    expect(serializeSvg(updateNodeField(withX, id, 'x', ''))).not.toContain('x="5"');
  });

  it('edits text content through setNodeText', () => {
    const s = scene('<svg viewBox="0 0 24 24"><text x="0" y="9">Hi</text></svg>');
    const id = s.root.children[0]!.id;

    expect(serializeSvg(setNodeText(s, id, 'Bye'))).toContain('>Bye</text>');
  });

  it('getSelectedNode falls back to null when the id is gone', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>');
    expect(getSelectedNode(s, 'missing')).toBeNull();
    expect(getSelectedNode(s, s.root.children[0]!.id)?.tag).toBe('rect');
  });
});

describe('centerFromMatrix', () => {
  const bbox = { x: 0, y: 0, width: 10, height: 10 };

  it('returns the bbox centre under the identity matrix', () => {
    expect(centerFromMatrix({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, bbox)).toEqual({ x: 5, y: 5 });
  });

  it('reads a pure translate expressed as matrix() — the case the transform-string parser misses', () => {
    expect(centerFromMatrix({ a: 1, b: 0, c: 0, d: 1, e: 200, f: 200 }, bbox)).toEqual({
      x: 205,
      y: 205
    });
  });

  it('agrees with layerCenter for a canonical translate + scale + rotate', () => {
    const matrix = { a: 0, b: 2, c: -2, d: 0, e: 100, f: 50 };
    const fromMatrix = centerFromMatrix(matrix, bbox);
    const s = scene(
      '<svg viewBox="0 0 1024 1024"><g transform="translate(100 50) scale(2) rotate(90)"><rect width="10" height="10" /></g></svg>'
    );
    const fromTransform = layerCenter(s.root.children[0]!, bbox);
    expect(fromMatrix.x).toBeCloseTo(fromTransform.x, 6);
    expect(fromMatrix.y).toBeCloseTo(fromTransform.y, 6);
    expect(fromMatrix).toEqual({ x: 90, y: 60 });
  });
});

describe('centerInUserSpace', () => {
  const bbox = { x: 100, y: 100, width: 200, height: 200 };

  it('recovers the user-space centre regardless of the viewBox->viewport scale', () => {
    const userTransform = { a: 0.7, b: 0, c: 0, d: 0.7, e: 50, f: -30 };
    const expected = centerFromMatrix(userTransform, bbox);

    const svgCtm = { a: 0.25, b: 0, c: 0, d: 0.25, e: 1, f: -200 };
    const elementCtm = {
      a: 0.25 * 0.7,
      b: 0,
      c: 0,
      d: 0.25 * 0.7,
      e: 0.25 * 50 + 1,
      f: 0.25 * -30 - 200
    };

    const recovered = centerInUserSpace(svgCtm, elementCtm, bbox);
    expect(recovered).not.toBeNull();
    expect(recovered!.x).toBeCloseTo(expected.x, 6);
    expect(recovered!.y).toBeCloseTo(expected.y, 6);

    expect(centerFromMatrix(elementCtm, bbox).x).not.toBeCloseTo(expected.x, 6);
  });

  it('is the identity when the root svg renders 1:1 (the default-project case)', () => {
    const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    const elementCtm = { a: 1, b: 0, c: 0, d: 1, e: 200, f: 200 };
    expect(centerInUserSpace(identity, elementCtm, bbox)).toEqual(
      centerFromMatrix(elementCtm, bbox)
    );
  });
});

describe('scene-editor background', () => {
  it('reports transparent when there is no full-bleed back rect', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect x="4" y="4" width="8" height="8" /></svg>');
    expect(getBackgroundColor(s)).toBe('transparent');
  });

  it('round-trips a color through set then get', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect x="4" y="4" width="8" height="8" /></svg>');

    const withBg = setBackgroundColor(s, '#112233');
    expect(getBackgroundColor(withBg)).toBe('#112233');
  });

  it('inserts the background rect first so it paints behind everything', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><rect id="content" x="4" y="4" width="8" height="8" /></svg>'
    );

    const withBg = setBackgroundColor(s, '#112233');
    const first = withBg.root.children[0]!;
    expect(first.tag).toBe('rect');
    expect(first.attributes.fill).toBe('#112233');
    expect(first.attributes.width).toBe('24');
    expect(first.attributes.height).toBe('24');
    expect(withBg.root.children).toHaveLength(2);
    expect(withBg.root.children[1]!.attributes.id).toBe('content');
  });

  it('updates the existing back rect rather than stacking a new one', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect x="4" y="4" width="8" height="8" /></svg>');

    const once = setBackgroundColor(s, '#112233');
    const twice = setBackgroundColor(once, '#445566');
    expect(twice.root.children.filter((n) => n.attributes.width === '24')).toHaveLength(1);
    expect(getBackgroundColor(twice)).toBe('#445566');
  });

  it('removes the back rect when set to transparent', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect x="4" y="4" width="8" height="8" /></svg>');

    const withBg = setBackgroundColor(s, '#112233');
    const cleared = setBackgroundColor(withBg, 'transparent');
    expect(getBackgroundColor(cleared)).toBe('transparent');
    expect(cleared.root.children).toHaveLength(1);
  });

  it('detects the back rect past a leading <defs> (e.g. a text shadow)', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><defs><filter id="shadow" /></defs><rect width="24" height="24" fill="#ff0000" /></svg>'
    );

    expect(getBackgroundColor(s)).toBe('#ff0000');
  });

  it('edits the existing back rect in place past a leading <defs> instead of stacking a new one', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><defs><filter id="shadow" /></defs><rect width="24" height="24" fill="#ff0000" /></svg>'
    );

    const recolored = setBackgroundColor(s, '#00ff00');

    const fullBleed = recolored.root.children.filter((n) => n.attributes.width === '24');
    expect(fullBleed).toHaveLength(1);
    expect(fullBleed[0]!.attributes.fill).toBe('#00ff00');
    expect(recolored.root.children.some((n) => n.tag.toLowerCase() === 'defs')).toBe(true);
    expect(getBackgroundColor(recolored)).toBe('#00ff00');
  });

  it('inserts a new back rect after a leading <defs> so the defs stays first', () => {
    const s = scene(
      '<svg viewBox="0 0 24 24"><defs><filter id="shadow" /></defs><rect x="4" y="4" width="8" height="8" /></svg>'
    );

    const withBg = setBackgroundColor(s, '#123456');

    expect(withBg.root.children[0]!.tag.toLowerCase()).toBe('defs');
    const back = withBg.root.children[1]!;
    expect(back.tag).toBe('rect');
    expect(back.attributes.fill).toBe('#123456');
    expect(back.attributes.width).toBe('24');
    expect(getBackgroundColor(withBg)).toBe('#123456');
  });
});

describe('normalizeCanvas', () => {
  const bbox = { x: 0, y: 0, width: 10, height: 10 };

  it('rewrites an off-origin, non-square viewBox to a centred square and remaps layers', () => {
    const s = scene(
      '<svg width="400" height="208" viewBox="-100 -200 2000 1000"><g transform="translate(300 100) scale(2)"><rect width="10" height="10" /></g></svg>'
    );

    const fitted = normalizeCanvas(s, 1000);

    expect(fitted.root.viewBox).toEqual([0, 0, 1000, 1000]);
    expect(fitted.root.width).toBeUndefined();
    expect(fitted.root.height).toBeUndefined();

    const before = layerCenter(s.root.children[0]!, bbox);
    const after = layerCenter(fitted.root.children[0]!, bbox);
    expect(after.x).toBeCloseTo(0.5 * before.x + 50, 6);
    expect(after.y).toBeCloseTo(0.5 * before.y + 350, 6);
    expect(after).toEqual({ x: 205, y: 405 });
  });

  it('preserves a layer rotation while refitting', () => {
    const s = scene(
      '<svg viewBox="-100 -200 2000 1000"><g transform="translate(300 100) scale(2) rotate(90)"><rect width="10" height="10" /></g></svg>'
    );

    const fitted = normalizeCanvas(s, 1000);

    expect(serializeSvg(fitted)).toContain('rotate(90)');
    const after = layerCenter(fitted.root.children[0]!, bbox);
    expect(after.x).toBeCloseTo(195, 6);
    expect(after.y).toBeCloseTo(405, 6);
  });

  it('is a no-op for a canvas that is already the target square', () => {
    const s = scene(
      '<svg viewBox="0 0 1024 1024"><g transform="translate(100 50)"><rect width="10" height="10" /></g></svg>'
    );

    const fitted = normalizeCanvas(s);

    expect(fitted.root.viewBox).toEqual([0, 0, 1024, 1024]);
    expect(serializeSvg(fitted)).toContain('translate(100 50)');
  });
});

const nested = () =>
  scene(
    '<svg viewBox="0 0 24 24"><g id="grp"><rect width="4" height="4" /><circle r="2" /></g><path d="M0 0h4" /></svg>'
  );

describe('scene-editor nested layers', () => {
  it('reveals an expanded group\'s children indented and topmost-first', () => {
    const s = nested();
    const grpId = s.root.children[0]!.id;

    const layers = listLayers(s, '', new Set([grpId]));

    expect(layers.map((l) => [l.label, l.depth])).toEqual([
      ['path', 0],
      ['g#grp', 0],
      ['circle', 1],
      ['rect', 1]
    ]);
    const group = layers.find((l) => l.label === 'g#grp')!;
    expect(group.expandable).toBe(true);
    expect(group.expanded).toBe(true);
    expect(layers.find((l) => l.label === 'circle')!.parentId).toBe(grpId);
  });

  it('hides a collapsed group\'s children but still marks it expandable', () => {
    const s = nested();

    const layers = listLayers(s, '', new Set());

    expect(layers.map((l) => l.label)).toEqual(['path', 'g#grp']);
    const group = layers.find((l) => l.label === 'g#grp')!;
    expect(group.expandable).toBe(true);
    expect(group.expanded).toBe(false);
  });

  it('defaults to fully collapsed when no expanded set is given', () => {
    const s = nested();
    expect(listLayers(s, '').map((l) => l.label)).toEqual(['path', 'g#grp']);
  });

  it('resolves a nested node id through getSelectedNode', () => {
    const s = nested();
    const circleId = s.root.children[0]!.children[1]!.id;

    expect(getSelectedNode(s, circleId)!.tag).toBe('circle');
  });

  it('finds the parent group of a nested node, and null for a top-level node', () => {
    const s = nested();
    const grpId = s.root.children[0]!.id;
    const rectId = s.root.children[0]!.children[0]!.id;

    expect(findParentId(s, rectId)).toBe(grpId);
    expect(findParentId(s, grpId)).toBe(null);
  });

  it('reports the id newly introduced between two scenes', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect width="4" height="4" /></svg>');
    const { scene: next, selectedId } = addLayer(s, 'circle');

    expect(newlyAddedId(s, next)).toBe(selectedId);
    expect(newlyAddedId(s, s)).toBe(null);
  });

  it('duplicates an inner layer next to it inside the same group and selects the copy', () => {
    const s = nested();
    const grpId = s.root.children[0]!.id;
    const rectId = s.root.children[0]!.children[0]!.id;

    const { scene: next, selectedId } = duplicateLayer(s, rectId);

    const group = next.root.children.find((n) => n.id === grpId)!;
    expect(group.children.map((c) => c.tag)).toEqual(['rect', 'rect', 'circle']);
    expect(selectedId).not.toBe(rectId);
    expect(group.children.some((c) => c.id === selectedId && c.tag === 'rect')).toBe(true);
  });
});

describe('scene-editor affine helpers', () => {
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

  it('applies a matrix to a point', () => {
    expect(applyMatrix(identity, 5, 7)).toEqual({ x: 5, y: 7 });
    // canvas->parent for a parent placed at translate(10,0) scale(2): parent = (canvas-10)/2
    const canvasToParent = { a: 0.5, b: 0, c: 0, d: 0.5, e: -5, f: 0 };
    const p = applyMatrix(canvasToParent, 10, 4);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(2, 6);
  });

  it('inverts and composes matrices back to identity', () => {
    const m = { a: 2, b: 0, c: 0, d: 0.5, e: 30, f: -10 };
    const composed = multiplyMatrix(m, invertMatrix(m)!);
    expect(composed.a).toBeCloseTo(1, 6);
    expect(composed.d).toBeCloseTo(1, 6);
    expect(composed.e).toBeCloseTo(0, 6);
    expect(composed.f).toBeCloseTo(0, 6);
  });
});
