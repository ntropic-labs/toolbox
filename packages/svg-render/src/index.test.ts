import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseSvg, serializeSvg } from '@toolbox/svg-core';

import { renderSceneToCanvas, renderSceneToSvgText, renderToMarkup } from './index';

describe('SVG render markup contract', () => {
  it('render markup tags every scene node with its internal fid', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><g><rect width="10" height="10" /><circle r="4" /></g></svg>'
    );
    const scene = parsed.scene!;
    const group = scene.root.children[0]!;
    const rect = group.children[0]!;
    const circle = group.children[1]!;

    const markup = renderToMarkup(scene);

    expect(markup).toContain(`data-fid="${group.id}"`);
    expect(markup).toContain(`data-fid="${rect.id}"`);
    expect(markup).toContain(`data-fid="${circle.id}"`);
  });

  it('render markup does not leak data-fid into user-facing serialization or mutate the scene', () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><rect width="10" height="10" /></svg>');
    const scene = parsed.scene!;
    const before = serializeSvg(scene);

    const markup = renderToMarkup(scene);
    const after = serializeSvg(scene);

    expect(markup).toContain('data-fid=');
    expect(before).toBe(after);
    expect(after).not.toContain('data-fid=');
    expect(scene.root.children[0]?.attributes['data-fid']).toBeUndefined();
  });

  it('render markup strips fetchable resource URLs while serialization preserves authored SVG', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><image href="https://example.com/pixel.png" xlink:href="//example.com/fallback.png" src="/pixel.png" width="1" height="1" /><image href="pixel.png" /><use href="#local-symbol" /><image href="data:image/png;base64,AA==" /></svg>'
    );
    const scene = parsed.scene!;

    const markup = renderToMarkup(scene);

    expect(markup).not.toContain('https://example.com/pixel.png');
    expect(markup).not.toContain('//example.com/fallback.png');
    expect(markup).not.toContain('/pixel.png');
    expect(markup).not.toContain('href="pixel.png"');
    expect(markup).toContain('href="#local-symbol"');
    expect(markup).toContain('href="data:image/png;base64,AA=="');
    expect(serializeSvg(scene)).toContain('https://example.com/pixel.png');
  });

  it('render markup strips style elements and external URL-valued attributes', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><style>@import url(https://example.com/a.css); rect { fill: red; }</style><rect filter="url(https://example.com/f.svg#f)" clip-path="url(#localClip)" style="fill:url(https://example.com/p.svg#p)" width="10" height="10" /></svg>'
    );
    const scene = parsed.scene!;

    const markup = renderToMarkup(scene);

    expect(markup).not.toContain('<style');
    expect(markup).not.toContain('https://example.com');
    expect(markup).not.toContain('filter=');
    expect(markup).not.toContain('style=');
    expect(markup).toContain('clip-path="url(#localClip)"');
    expect(serializeSvg(scene)).toContain('<style>');
    expect(serializeSvg(scene)).toContain('https://example.com');
  });

  it('render markup strips external URL-valued attributes from the root svg element', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24" style="background:url(https://example.com/a.svg)" filter="url(#localFilter)"><rect width="10" height="10" /></svg>'
    );
    const scene = parsed.scene!;

    const markup = renderToMarkup(scene);

    expect(markup).not.toContain('https://example.com');
    expect(markup).not.toContain('style=');
    expect(markup).toContain('filter="url(#localFilter)"');
    expect(serializeSvg(scene)).toContain('https://example.com');
  });

  it('render markup strips foreignObject and active embedded HTML payloads', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><foreignObject><iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;"></iframe></foreignObject><rect width="10" height="10" /></svg>'
    );
    const scene = parsed.scene!;

    const markup = renderToMarkup(scene);

    expect(markup).not.toContain('<foreignObject');
    expect(markup).not.toContain('<iframe');
    expect(markup).not.toContain('srcdoc');
    expect(markup).toContain('<rect');
    expect(serializeSvg(scene)).toContain('<foreignObject>');
  });

  it('render markup preserves defs and gradient nodes with selection mapping', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0" stop-color="#fff" /></linearGradient></defs><rect fill="url(#g)" width="10" height="10" /></svg>'
    );
    const scene = parsed.scene!;
    const defs = scene.root.children[0]!;
    const gradient = defs.children[0]!;
    const stop = gradient.children[0]!;

    const markup = renderToMarkup(scene);

    expect(markup).toContain('<defs');
    expect(markup).toContain('<linearGradient');
    expect(markup).toContain('fill="url(#g)"');
    expect(markup).toContain(`data-fid="${defs.id}"`);
    expect(markup).toContain(`data-fid="${gradient.id}"`);
    expect(markup).toContain(`data-fid="${stop.id}"`);
  });

  it('render markup preserves mixed text content while adding fid attributes', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><text>Hello <tspan>world</tspan>!</text></svg>'
    );
    const scene = parsed.scene!;
    const text = scene.root.children[0]!;
    const tspan = text.children[0]!;

    const markup = renderToMarkup(scene);

    expect(markup).toContain(`data-fid="${text.id}"`);
    expect(markup).toContain(`data-fid="${tspan.id}"`);
    expect(markup).toContain(`Hello <tspan data-fid="${tspan.id}">world</tspan>!</text>`);
  });
});

describe('SVG render raster text contract', () => {
  it('raster svg text uses the safe preview serializer instead of raw scene serialization', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><style>@import url(https://example.com/a.css);</style><foreignObject><iframe srcdoc="&lt;script&gt;1&lt;/script&gt;"></iframe></foreignObject><rect filter="url(https://example.com/f.svg#f)" width="10" height="10" /></svg>'
    );

    const svgText = renderSceneToSvgText(parsed.scene!);

    expect(svgText).not.toContain('https://example.com');
    expect(svgText).not.toContain('@import');
    expect(svgText).not.toContain('<foreignObject');
    expect(svgText).not.toContain('filter=');
  });

  it('omits internal preview ids from raster svg text without rewriting user text', () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><text x="0" y="12">label data-fid="name"</text></svg>'
    );

    const svgText = renderSceneToSvgText(parsed.scene!);

    expect(svgText).toContain('label data-fid="name"');
    expect(svgText).not.toContain('<text data-fid=');
  });

  it('sizes raster svg text to the requested output while preserving the source viewBox', () => {
    const parsed = parseSvg('<svg viewBox="0 0 108 108"><path d="M0 0h108v108H0z" /></svg>');

    const svgText = renderSceneToSvgText(parsed.scene!, { size: 512 });

    expect(svgText).toContain('viewBox="0 0 108 108"');
    expect(svgText).toContain('width="512"');
    expect(svgText).toContain('height="512"');
  });

  it('adds the SVG namespace so the markup rasterizes as a standalone image', () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>');

    expect(renderSceneToSvgText(parsed.scene!)).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(renderSceneToSvgText(parsed.scene!, { size: 64 })).toContain(
      'xmlns="http://www.w3.org/2000/svg"'
    );
  });

  it('does not duplicate an authored xmlns', () => {
    const parsed = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="8" height="8" /></svg>'
    );

    const occurrences =
      renderSceneToSvgText(parsed.scene!).match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/gu) ?? [];
    expect(occurrences).toHaveLength(1);
  });
});

function installRasterImageEnvironment({ failImageLoad = false } = {}) {
  const objectUrlBlobs: Blob[] = [];
  let revokeCount = 0;

  class TestImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      if (failImageLoad) this.onerror?.();
      else this.onload?.();
    }
  }

  vi.stubGlobal('Image', TestImage);
  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      objectUrlBlobs.push(blob);
      return 'blob:svg-render-test';
    },
    revokeObjectURL: () => {
      revokeCount += 1;
    }
  });

  return {
    objectUrlBlobs,
    getRevokeCount: () => revokeCount
  };
}

function createRecordingContext() {
  const operations: string[] = [];
  let fillStyle = '';
  const context = {
    set fillStyle(value: string) {
      fillStyle = value;
    },
    save: () => undefined,
    restore: () => undefined,
    clearRect: () => operations.push('clearRect'),
    fillRect: () => operations.push(`fillRect:${fillStyle}`),
    drawImage: () => operations.push('drawImage')
  };

  return { operations, context: context as unknown as CanvasRenderingContext2D };
}

describe('SVG render scene-to-canvas contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws the scene through the safe sized markup path without internal ids', async () => {
    const parsed = parseSvg(
      '<svg viewBox="0 0 24 24"><foreignObject><div>unsafe</div></foreignObject><rect width="10" height="10" /></svg>'
    );
    const env = installRasterImageEnvironment();
    const { operations, context } = createRecordingContext();

    await renderSceneToCanvas(context, parsed.scene!, { size: 256 });

    expect(operations).toEqual(['clearRect', 'drawImage']);
    const markup = await env.objectUrlBlobs[0]!.text();
    expect(markup).not.toContain('foreignObject');
    expect(markup).not.toContain('data-fid=');
    expect(markup).toContain('width="256"');
    expect(env.getRevokeCount()).toBe(1);
  });

  it('fills the requested background before drawing the scene', async () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><rect width="10" height="10" /></svg>');
    installRasterImageEnvironment();
    const { operations, context } = createRecordingContext();

    await renderSceneToCanvas(context, parsed.scene!, { size: 64, background: '#102030' });

    expect(operations).toEqual(['clearRect', 'fillRect:#102030', 'drawImage']);
  });

  it('rejects and releases the object URL when the scene image cannot be loaded', async () => {
    const parsed = parseSvg('<svg viewBox="0 0 24 24"><rect width="10" height="10" /></svg>');
    const env = installRasterImageEnvironment({ failImageLoad: true });
    const { context } = createRecordingContext();

    await expect(renderSceneToCanvas(context, parsed.scene!, { size: 64 })).rejects.toThrow(
      'SVG rasterization failed.'
    );
    expect(env.getRevokeCount()).toBe(1);
  });
});

describe('renderSceneToSvgText font embedding', () => {
  it('injects an embedded @font-face <style> just inside the root only when fontFaceCss is given', () => {
    const scene = parseSvg(
      '<svg viewBox="0 0 24 24"><text font-family="Demo">Hi</text></svg>'
    ).scene!;
    const css =
      "@font-face{font-family:'Demo';src:url(data:font/ttf;base64,AAA) format('truetype');}";

    const withFont = renderSceneToSvgText(scene, { size: 64, fontFaceCss: css });
    expect(withFont).toMatch(/^<svg[^>]*><style>@font-face/u);
    expect(withFont).toContain(css);

    expect(renderSceneToSvgText(scene, { size: 64 })).not.toContain('<style>');
  });
});

describe('faithful <style> rendering for raster output', () => {
  it('keeps a <style> block so embedded CSS still applies when rasterized', () => {
    const scene = parseSvg(
      '<svg viewBox="0 0 10 10"><g fill="#e4a82c"><style>.s0{fill:#404447}</style><path class="s0" d="M0 0h1v1z" /></g></svg>'
    ).scene!;

    const svgText = renderSceneToSvgText(scene);

    expect(svgText).toContain('<style>');
    expect(svgText).toContain('.s0{fill:#404447}');
  });

  it('strips @import and external url() from kept <style> CSS but keeps internal refs', () => {
    const scene = parseSvg(
      '<svg viewBox="0 0 10 10"><style>@import url(https://evil.test/x.css);.a{fill:url(http://evil.test/i.png)}.b{fill:url(#grad)}</style><rect width="10" height="10" /></svg>'
    ).scene!;

    const svgText = renderSceneToSvgText(scene);

    expect(svgText).not.toContain('@import');
    expect(svgText).not.toContain('evil.test');
    expect(svgText).toContain('url(#grad)');
  });
});
