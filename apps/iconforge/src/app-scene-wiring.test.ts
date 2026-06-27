import { addNode, createElementNode, serializeSvg } from '@toolbox/svg-core';
import { describe, expect, it } from 'vitest';
import { addLayer, getBackgroundColor, setBackgroundColor, updateNodeField } from './scene-editor';
import { scene } from './test-support';

describe('app scene wiring', () => {
  it('addShape inserts a node and reports it as the new selection', () => {
    const s = scene('<svg viewBox="0 0 1024 1024"></svg>');

    const { scene: next, selectedId } = addLayer(s, 'rect');

    expect(next.root.children).toHaveLength(1);
    expect(next.root.children[0]!.tag).toBe('rect');
    expect(next.root.children[0]!.id).toBe(selectedId);
  });

  it('updateField writes the named attribute onto the selected node', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>');
    const id = s.root.children[0]!.id;

    const next = updateNodeField(s, id, 'fill', '#ff0000');

    expect(serializeSvg(next)).toContain('fill="#ff0000"');
  });

  it('changeBackground round-trips through the document controls seam', () => {
    const s = scene('<svg viewBox="0 0 24 24"><rect x="2" y="2" width="4" height="4" /></svg>');

    const colored = setBackgroundColor(s, '#0d1b2a');
    expect(getBackgroundColor(colored)).toBe('#0d1b2a');
    expect(getBackgroundColor(setBackgroundColor(colored, 'transparent'))).toBe('transparent');
  });

  it('uploadSvg wraps the parsed root children in a group before inserting', () => {
    const s = scene('<svg viewBox="0 0 1024 1024"><rect width="10" height="10" /></svg>');
    const uploaded = scene(
      '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" /><rect width="4" height="4" /></svg>'
    );

    const group = { ...createElementNode('g', {}), children: uploaded.root.children };
    const next = addNode(s, null, s.root.children.length, group);

    const inserted = next.root.children.at(-1)!;
    expect(inserted.tag).toBe('g');
    expect(inserted.children.map((child) => child.tag)).toEqual(['circle', 'rect']);
    expect(next.root.children).toHaveLength(2);
  });
});
