import { parseSvg } from '@toolbox/svg-core';
import { describe, expect, it } from 'vitest';
import { layerStylingMayOverride } from './css-notice';

function sceneAndFirstId(svg: string) {
  const scene = parseSvg(svg).scene!;
  return { scene, id: scene.root.children[0]!.id };
}

describe('layerStylingMayOverride', () => {
  it('flags a layer whose shapes are styled by a <style> class', () => {
    const { scene, id } = sceneAndFirstId(
      '<svg viewBox="0 0 10 10"><g id="L"><style>.s0{fill:#404447}</style><path class="s0" d="M0 0h1v1z" /></g></svg>'
    );
    expect(layerStylingMayOverride(scene, id)).toBe(true);
  });

  it('flags a layer with an inline style attribute', () => {
    const { scene, id } = sceneAndFirstId(
      '<svg viewBox="0 0 10 10"><rect id="R" style="fill:red" width="10" height="10" /></svg>'
    );
    expect(layerStylingMayOverride(scene, id)).toBe(true);
  });

  it('does not flag a plain attribute-only layer', () => {
    const { scene, id } = sceneAndFirstId(
      '<svg viewBox="0 0 10 10"><rect id="R" fill="red" width="10" height="10" /></svg>'
    );
    expect(layerStylingMayOverride(scene, id)).toBe(false);
  });

  it('does not flag a class when the document has no <style>', () => {
    const { scene, id } = sceneAndFirstId(
      '<svg viewBox="0 0 10 10"><rect id="R" class="x" width="10" height="10" /></svg>'
    );
    expect(layerStylingMayOverride(scene, id)).toBe(false);
  });
});
