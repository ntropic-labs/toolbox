import { describe, expect, it } from 'vitest';
import { parseSvg, type SvgScene } from '@toolbox/svg-core';
import { pngTrioTarget } from './png-trio';

const untagged = (): SvgScene =>
  parseSvg('<svg viewBox="0 0 24 24"><rect width="24" height="24" /></svg>').scene!;

const tagged = (): SvgScene =>
  parseSvg(
    '<svg viewBox="0 0 24 24"><rect data-adaptive-role="background" width="24" height="24" /><circle r="6" cx="12" cy="12" /></svg>',
  ).scene!;

const selection = (pngSizes: number[]) => ({ svg: false, pngSizes, favicon: false });

describe('pngTrioTarget.planPaths', () => {
  it('emits one combined PNG per size for an untagged scene', () => {
    expect(pngTrioTarget.planPaths(selection([512, 192]), untagged())).toEqual([
      'icon-512.png',
      'icon-192.png',
    ]);
  });

  it('emits combined + background + foreground per size for a tagged scene', () => {
    expect(pngTrioTarget.planPaths(selection([512]), tagged())).toEqual([
      'icon-512.png',
      'icon-background-512.png',
      'icon-foreground-512.png',
    ]);
  });

  it('is unselected when no sizes are chosen', () => {
    expect(pngTrioTarget.isSelected(selection([]))).toBe(false);
  });
});
