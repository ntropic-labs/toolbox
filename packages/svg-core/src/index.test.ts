import { describe, expect, it } from 'vitest';

import {
  addNode,
  commitHistory,
  createElementNode,
  createRectNode,
  duplicateNode,
  parseSvg,
  reorderNode,
  redoHistory,
  removeNode,
  serializeSvg,
  setAttributes,
  setText,
  undoHistory
} from './index';

describe('SvgScene source of truth', () => {
  it('round-trip preserves node order, text, and authored attributes', () => {
    const source = `<svg viewBox="0 0 24 24" width="24" height="24" data-name="mark">
      <defs><linearGradient id="g"><stop offset="0" stop-color="#fff" /></linearGradient></defs>
      <g id="shape" transform="translate(2 3)"><path d="M0 0h4v4z" fill="url(#g)" /><text x="6" y="8">Hi</text></g>
    </svg>`;

    const parsed = parseSvg(source);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.scene).toBeDefined();

    const reparsed = parseSvg(serializeSvg(parsed.scene!, { pretty: true }));

    expect(reparsed.diagnostics).toEqual([]);
    expect(reparsed.scene?.root.viewBox).toEqual([0, 0, 24, 24]);
    expect(reparsed.scene?.root.attributes['data-name']).toBe('mark');
    expect(reparsed.scene?.root.children.map((node) => node.tag)).toEqual(['defs', 'g']);
    expect(reparsed.scene?.root.children[1]?.children.map((node) => node.tag)).toEqual([
      'path',
      'text'
    ]);
    expect(reparsed.scene?.root.children[1]?.children[0]?.attributes.fill).toBe('url(#g)');
    expect(reparsed.scene?.root.children[1]?.children[1]?.text).toBe('Hi');
  });

  it('round-trip preserves mixed text content around child tspans', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><text>Hello <tspan fill="#fff">world</tspan>!</text></svg>'
    );

    expect(parsed.diagnostics).toEqual([]);

    const serialized = serializeSvg(parsed.scene!);

    expect(serialized.indexOf('Hello ')).toBeLessThan(serialized.indexOf('<tspan'));
    expect(serialized.indexOf('<tspan')).toBeLessThan(serialized.indexOf('!</text>'));
    expect(parseSvg(serialized).scene?.root.children[0]?.children[0]?.text).toBe('world');
  });

  it('pretty round-trip preserves mixed text content', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><text>Hello <tspan>world</tspan>!</text></svg>'
    );
    const reparsed = parseSvg(serializeSvg(parsed.scene!, { pretty: true }));

    expect(reparsed.diagnostics).toEqual([]);
    expect(serializeSvg(reparsed.scene!)).toContain('Hello <tspan>world</tspan>!</text>');
  });

  it('pretty-prints nested element children on their own indented lines', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><g id="a"><rect width="2" height="2" /><circle r="3" /></g></svg>'
    );
    const pretty = serializeSvg(parsed.scene!, { pretty: true });

    expect(pretty).toContain('<g id="a">\n');
    expect(pretty).toContain('\n    <rect');
    expect(pretty).toContain('\n    <circle');
    expect(pretty).toContain('\n  </g>');

    const reparsed = parseSvg(pretty);
    expect(reparsed.diagnostics).toEqual([]);
    expect(reparsed.scene?.root.children[0]?.children.map((node) => node.tag)).toEqual([
      'rect',
      'circle'
    ]);
  });

  it('round-trip accepts quoted attribute values that contain greater-than characters', () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><text data-label="a > b">ok</text></svg>');

    expect(parsed.diagnostics).toEqual([]);
    expect(serializeSvg(parsed.scene!)).toContain('data-label="a &gt; b"');
    expect(parseSvg(serializeSvg(parsed.scene!)).diagnostics).toEqual([]);
  });

  it('round-trip preserves whitespace-only mixed text between child tspans', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><text><tspan>A</tspan> <tspan>B</tspan></text></svg>'
    );

    expect(parsed.diagnostics).toEqual([]);
    expect(serializeSvg(parsed.scene!)).toContain('</tspan> <tspan');
  });

  it('parse decodes numeric XML entities before serializing text', () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><text>&#65;&#x42;</text></svg>');

    expect(parsed.diagnostics).toEqual([]);
    expect(serializeSvg(parsed.scene!)).toContain('AB</text>');
  });

  it('parse diagnostics prevent malformed SVG from becoming a scene', () => {
    const parsed = parseSvg('<svg><g></svg>');

    expect(parsed.scene).toBeUndefined();
    expect(parsed.diagnostics.length).toBeGreaterThan(0);
  });

  it('parse diagnostics reject malformed attributes without a scene', () => {
    const parsed = parseSvg('<svg viewBox="0 0 10 10"><rect width="10></rect></svg>');

    expect(parsed.scene).toBeUndefined();
    expect(parsed.diagnostics.length).toBeGreaterThan(0);
  });

  it('parse diagnostics reject unquoted and valueless XML attributes', () => {
    const parsed = parseSvg('<svg viewBox="0 0 10 10"><rect width=10 disabled /></svg>');

    expect(parsed.scene).toBeUndefined();
    expect(parsed.diagnostics.length).toBeGreaterThan(0);
  });
  it('parse diagnostics reject invalid numeric XML entities without throwing', () => {
    for (const source of ['&#999999999999;', '&#xZZ;', '&#;', '&#0;']) {
      const parsed = parseSvg(`<svg viewBox="0 0 10 10"><text>${source}</text></svg>`);

      expect(parsed.scene).toBeUndefined();
      expect(parsed.diagnostics.length).toBeGreaterThan(0);
    }
  });

  it('parse strips scripts and event handler attributes before they reach the scene', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 10 10" onclick="alert(1)"><script>alert(1)</script><rect onload="alert(2)" width="10" height="10" /></svg>'
    );

    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.scene?.root.attributes.onclick).toBeUndefined();
    expect(parsed.scene?.root.children).toHaveLength(1);
    expect(parsed.scene?.root.children[0]?.tag).toBe('rect');
    expect(parsed.scene?.root.children[0]?.attributes.onload).toBeUndefined();
    expect(serializeSvg(parsed.scene!)).not.toContain('script');
  });

  it('edit operations return new scenes without mutating the input scene', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 10 10"><rect width="4" height="4" fill="#fff" /></svg>'
    );
    const scene = parsed.scene!;
    const rectId = scene.root.children[0]!.id;

    const withFill = setAttributes(scene, rectId, { fill: '#000', stroke: '#fff' });
    const duplicated = duplicateNode(withFill, rectId);
    const removed = removeNode(duplicated, rectId);

    expect(scene.root.children[0]?.attributes.fill).toBe('#fff');
    expect(withFill.root.children[0]?.attributes.fill).toBe('#000');
    expect(duplicated.root.children).toHaveLength(2);
    expect(duplicated.root.children[1]?.id).not.toBe(rectId);
    expect(removed.root.children.map((node) => node.id)).not.toContain(rectId);
  });

  it('duplicate node preserves trailing mixed text after the duplicated child', () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><text>A<tspan>B</tspan>C</text></svg>');
    const scene = parsed.scene!;
    const tspanId = scene.root.children[0]!.children[0]!.id;

    const duplicated = duplicateNode(scene, tspanId);

    expect(serializeSvg(duplicated)).toContain('<text>A<tspan>B</tspan><tspan>B</tspan>C</text>');
  });

  it('remove node preserves surrounding mixed text content', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><text>Hello <tspan>world</tspan>!</text></svg>'
    );
    const scene = parsed.scene!;
    const tspanId = scene.root.children[0]!.children[0]!.id;

    const removed = removeNode(scene, tspanId);

    expect(serializeSvg(removed)).toContain('<text>Hello !</text>');
  });

  it('add node inserts primitives through a scene transform', () => {
    const parsed = parseSvg('<svg viewBox="0 0 10 10"><g id="target"></g></svg>');
    const scene = parsed.scene!;
    const groupId = scene.root.children[0]!.id;

    const next = addNode(scene, groupId, 0, createRectNode({ width: '2', height: '2' }));

    expect(scene.root.children[0]?.children).toHaveLength(0);
    expect(next.root.children[0]?.children).toHaveLength(1);
    expect(next.root.children[0]?.children[0]?.tag).toBe('rect');
  });

  it('reorder node changes the serialized order for parsed containers', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 10 10"><g><rect width="4" height="4" /><circle r="2" /></g></svg>'
    );
    const scene = parsed.scene!;
    const circleId = scene.root.children[0]!.children[1]!.id;

    const reordered = reorderNode(scene, circleId, -1);
    const serialized = serializeSvg(reordered);

    expect(serialized.indexOf('<circle')).toBeLessThan(serialized.indexOf('<rect'));
  });

  it('reorder node changes serialized order for mixed text children', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 10 10"><text><tspan>A</tspan> <tspan>B</tspan></text></svg>'
    );
    const scene = parsed.scene!;
    const secondTspanId = scene.root.children[0]!.children[1]!.id;

    const reordered = reorderNode(scene, secondTspanId, -1);

    expect(serializeSvg(reordered)).toContain('<tspan>B</tspan> <tspan>A</tspan>');
  });

  it('set text changes the serialized content for parsed text nodes', () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><text>Hi</text></svg>');
    const scene = parsed.scene!;
    const textId = scene.root.children[0]!.id;

    const changed = setText(scene, textId, 'Bye');

    expect(serializeSvg(changed)).toContain('Bye</text>');
    expect(serializeSvg(scene)).toContain('Hi</text>');
  });

  it('history undo and redo move between committed scenes', () => {
    const parsed = parseSvg('<svg viewBox="0 0 10 10"></svg>');
    const scene = parsed.scene!;
    const nextScene = addNode(scene, null, 0, createRectNode({ width: '2', height: '2' }));

    const committed = commitHistory({ past: [], present: scene, future: [] }, nextScene);
    const undone = undoHistory(committed);
    const redone = redoHistory(undone);

    expect(committed.present.root.children).toHaveLength(1);
    expect(undone.present.root.children).toHaveLength(0);
    expect(redone.present.root.children).toHaveLength(1);
  });

  it('creates arbitrary elements with unique internal ids for scene transforms', () => {
    const group = createElementNode('g', { fill: '#fff' });
    const path = createElementNode('path', { d: 'M0 0h2' });

    expect(group.tag).toBe('g');
    expect(group.attributes.fill).toBe('#fff');
    expect(group.children).toHaveLength(0);
    expect(path.id).not.toBe(group.id);
    expect(group.id.length).toBeGreaterThan(0);
  });
});
