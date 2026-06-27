import type { SvgScene } from '@toolbox/svg-core';
import type { ExportFile } from '../types';
import type { ExportTarget } from '../registry';
import { framedScene, renderSceneToPngBlob, sortedPngSizes } from '../render';
import { getAdaptiveBackgroundScene, getAdaptiveForegroundScene } from '../adaptive';

export const pngTrioTarget: ExportTarget = {
  id: 'png',
  isSelected: (selection) => sortedPngSizes(selection.pngSizes).length > 0,
  planPaths: (selection, scene) => {
    const split = hasAdaptiveSplit(scene);
    return sortedPngSizes(selection.pngSizes).flatMap((size) =>
      split
        ? [`icon-${size}.png`, `icon-background-${size}.png`, `icon-foreground-${size}.png`]
        : [`icon-${size}.png`]
    );
  },
  buildFiles: async ({ scene, inset, selection }) => {
    const sizes = sortedPngSizes(selection.pngSizes);
    const background = getAdaptiveBackgroundScene(scene);
    const foreground = getAdaptiveForegroundScene(scene);
    const files: ExportFile[] = [];
    for (const size of sizes) {
      files.push({
        path: `icon-${size}.png`,
        data: await renderSceneToPngBlob(framedScene(scene, inset), { size })
      });
      if (background && foreground) {
        files.push({
          path: `icon-background-${size}.png`,
          data: await renderSceneToPngBlob(framedScene(background, inset), { size })
        });
        files.push({
          path: `icon-foreground-${size}.png`,
          data: await renderSceneToPngBlob(framedScene(foreground, inset), {
            size,
            background: 'rgba(0,0,0,0)'
          })
        });
      }
    }
    return files;
  }
};

function hasAdaptiveSplit(scene: SvgScene | undefined): boolean {
  return scene !== undefined && getAdaptiveBackgroundScene(scene) !== null;
}
