import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SvgNode } from '@toolbox/svg-core';
import type { FontAxis } from '@toolbox/svg-ops';
import { TextTypeControls } from './text-type-controls';

const textNode = (attributes: Record<string, string> = {}): SvgNode => ({
  id: 't1',
  tag: 'text',
  attributes,
  children: [],
  text: 'Hi'
});

const wghtAxis: FontAxis = { tag: 'wght', name: 'Weight', min: 200, default: 400, max: 700 };
const wdthAxis: FontAxis = { tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 };
const slntAxis: FontAxis = { tag: 'slnt', name: 'Slant', min: -10, default: 0, max: 0 };

const noop = () => {};

function markup(node: SvgNode, axes: readonly FontAxis[]): string {
  return renderToStaticMarkup(
    <TextTypeControls node={node} axes={axes} onUpdateField={noop} onSetTextTransform={noop} />
  );
}

describe('TextTypeControls', () => {
  it('shows a weight slider (not the Regular/Bold fallback) when the font has a wght axis', () => {
    const html = markup(textNode(), [wghtAxis]);
    expect(html).toContain('Weight');
    expect(html).not.toContain('>Bold<');
  });

  it('falls back to a Regular/Bold control and a hint when there are no axes', () => {
    const html = markup(textNode(), []);
    expect(html).toContain('>Regular<');
    expect(html).toContain('>Bold<');
    expect(html).toContain('Load a variable font');
  });

  it('does not show a Width control when the font lacks a wdth axis', () => {
    expect(markup(textNode(), [wghtAxis])).not.toContain('Width');
    expect(markup(textNode(), [wghtAxis, wdthAxis])).toContain('Width');
  });

  it('shows Slant for a slnt axis and an Italic toggle otherwise', () => {
    expect(markup(textNode(), [slntAxis])).toContain('Slant');
    expect(markup(textNode(), [slntAxis])).not.toContain('Italic');
    expect(markup(textNode(), [wghtAxis])).toContain('Italic');
  });

  it('always offers case, decoration, and spacing controls', () => {
    const html = markup(textNode(), [wghtAxis]);
    expect(html).toContain('Case');
    expect(html).toContain('UPPERCASE');
    expect(html).toContain('Decoration');
    expect(html).toContain('Underline');
    expect(html).toContain('Letter spacing');
    expect(html).toContain('Word spacing');
  });

  it('reflects the current weight value from the node', () => {
    const html = markup(textNode({ 'font-weight': '700' }), [wghtAxis]);
    expect(html).toContain('>700<');
  });
});
