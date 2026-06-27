import { describe, expect, it } from 'vitest';
import { parseSvg } from '@toolbox/svg-core';
import { framedScene } from '../render';
import { svgTarget } from './svg';

function scene() {
  return parseSvg('<svg viewBox="0 0 100 100"><rect width="100" height="100" /></svg>').scene!;
}

describe('svgTarget', () => {
  it('serializes the framed (trimmed) scene so the inset crops the SVG viewBox', async () => {
    const base = scene();
    const inset = 0.1;
    const files = await svgTarget.buildFiles({
      scene: base,
      framed: framedScene(base, inset),
      inset,
      selection: { svg: true, pngSizes: [], favicon: false }
    });

    expect(files).toHaveLength(1);
    expect(files[0]!.path).toBe('icon.svg');
    expect(files[0]!.data as string).toContain('viewBox="10 10 80 80"');
  });
});
