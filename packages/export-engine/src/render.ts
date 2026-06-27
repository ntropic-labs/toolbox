import type { SvgScene } from '@toolbox/svg-core';
import { renderSceneToCanvas, type SceneRenderOptions } from '@toolbox/svg-render';
import { encodeIco } from './favicon';

const maxExportInset = 0.45;
const faviconSizes = [16, 32, 48] as const;

export function insetViewBox(
  viewBox: readonly [number, number, number, number],
  inset: number
): readonly [number, number, number, number] {
  const fraction = Math.min(Math.max(inset, 0), maxExportInset);
  const [x, y, width, height] = viewBox;
  return [
    x + width * fraction,
    y + height * fraction,
    width * (1 - 2 * fraction),
    height * (1 - 2 * fraction)
  ];
}

export function framedScene(scene: SvgScene, inset: number): SvgScene {
  if (inset <= 0) return scene;
  return { root: { ...scene.root, viewBox: insetViewBox(scene.root.viewBox, inset) } };
}

export function sortedPngSizes(sizes: readonly number[]): number[] {
  return [...new Set(sizes)].sort((a, b) => b - a);
}

export async function renderSceneToPngBlob(
  scene: SvgScene,
  options: SceneRenderOptions
): Promise<Blob> {
  const canvas = globalThis.document.createElement('canvas');
  canvas.width = options.size;
  canvas.height = options.size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable.');

  await renderSceneToCanvas(context, scene, options);
  const { promise, resolve, reject } = Promise.withResolvers<Blob>();
  canvas.toBlob((blob) => {
    if (!blob) reject(new Error('Canvas PNG export failed.'));
    else resolve(blob);
  }, 'image/png');
  return promise;
}

export async function renderFavicon(scene: SvgScene): Promise<Blob> {
  const frames = await Promise.all(
    faviconSizes.map(async (size) => {
      const blob = await renderSceneToPngBlob(scene, { size });
      return { size, png: new Uint8Array(await blob.arrayBuffer()) };
    })
  );
  return new Blob([encodeIco(frames)], { type: 'image/x-icon' });
}

export function mimeForPath(path: string): string {
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.xml')) return 'application/xml';
  return 'application/octet-stream';
}
