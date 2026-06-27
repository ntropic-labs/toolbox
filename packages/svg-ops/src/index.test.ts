import { describe, expect, it, vi } from 'vitest';
import { parseSvg } from '@toolbox/svg-core';
import { formatSvgScene, optimizeSvgScene, optimizeSvgText } from './index';
import { requireScene } from './test-support';

describe('svg optimize and format operations', () => {
  it('formats a scene as readable SVG text without changing scene semantics', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><g id="mark"><path d="M0 0h24v24H0z" fill="#fff" /></g></svg>'
    );

    const formatted = formatSvgScene(scene);
    const reparsed = parseSvg(formatted).scene;

    expect(formatted).toContain('\n  <g');
    expect(reparsed?.root.viewBox).toEqual([0, 0, 24, 24]);
    expect(reparsed?.root.children.map((node) => node.tag)).toEqual(['g']);
  });

  it('optimizes SVG text while preserving the viewBox and removing redundant noise', async () => {
    const optimized = await optimizeSvgText(
      '<svg viewBox="0 0 24 24"><!-- remove me --><metadata>remove me</metadata><path d="M0 0h24v24H0z" fill="#ffffff" /></svg>'
    );
    const reparsed = parseSvg(optimized).scene;

    expect(optimized).not.toContain('remove me');
    expect(reparsed?.root.viewBox).toEqual([0, 0, 24, 24]);
    expect(reparsed?.root.children.map((node) => node.tag)).toEqual(['path']);
  });

  it('keeps hidden (display:none) layers so optimizing never deletes a layer the user hid', async () => {
    const optimized = await optimizeSvgText(
      '<svg viewBox="0 0 24 24"><g display="none"><path d="M0 0h24v24H0z" fill="#fff" /></g><path d="M2 2h20v20H2z" /></svg>'
    );

    expect(optimized).toContain('display="none"');
    expect(optimized).toContain('M0 0h24v24H0z');
  });

  it('strips hidden layers only when removeHidden is opted into', async () => {
    const svg =
      '<svg viewBox="0 0 24 24"><g display="none"><path d="M0 0h24v24H0z" /></g><path d="M2 2h20v20H2z" /></svg>';

    expect(await optimizeSvgText(svg, { removeHidden: true })).not.toContain('M0 0h24v24H0z');
  });

  it('keeps a hidden multi-shape group intact through optimization', async () => {
    const optimized = await optimizeSvgText(
      '<svg viewBox="0 0 24 24"><g id="layer-1" display="none"><path d="M0 0h24v24H0z" /><rect width="4" height="4" /></g></svg>'
    );
    const reparsed = parseSvg(optimized).scene;

    expect(reparsed?.root.children.map((node) => node.tag)).toEqual(['g']);
    expect(reparsed?.root.children.at(0)?.attributes.display).toBe('none');
    expect(reparsed?.root.children.at(0)?.children).toHaveLength(2);
  });

  it('does not emit SVGO preset override warnings during optimization', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      await optimizeSvgText('<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>');

      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('optimizes a scene to SVG text that parses back to the same root and rendered tags', async () => {
    const scene = requireScene(
      '<svg width="48" height="48" viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0" stop-color="#fff" /></linearGradient></defs><rect width="24" height="24" fill="url(#g)" /></svg>'
    );

    const optimized = await optimizeSvgScene(scene);
    const reparsed = parseSvg(optimized).scene;

    expect(reparsed?.root.viewBox).toEqual([0, 0, 24, 24]);
    expect(reparsed?.root.children.at(0)?.tag).toBe('defs');
    expect(reparsed?.root.children.at(1)?.attributes.fill).toBe('url(#g)');
  });
});
