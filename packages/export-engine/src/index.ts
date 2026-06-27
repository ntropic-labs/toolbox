import JSZip from 'jszip';
import type { SvgScene } from '@toolbox/svg-core';
import { exportTargets } from './registry';
import { framedScene, mimeForPath } from './render';
import type { ExportFile, ExportOptions, ExportSelection } from './types';

export type { ExportSelection, ExportFile, ExportOptions } from './types';
export type { ExportContext, ExportTarget } from './registry';
export { exportTargets } from './registry';
export { insetViewBox, framedScene, renderSceneToPngBlob } from './render';
export { getAdaptiveBackgroundScene, getAdaptiveForegroundScene } from './adaptive';

export const exportPngSizeChoices = [16, 32, 48, 64, 128, 192, 256, 512, 1024] as const;

export const defaultExportSelection: ExportSelection = {
  svg: true,
  pngSizes: [1024, 512, 192],
  favicon: false
};

export function planExport(selection: ExportSelection, scene: SvgScene): readonly string[] {
  return exportTargets.flatMap((target) =>
    target.isSelected(selection) ? target.planPaths(selection, scene) : []
  );
}

export async function buildExportFiles(
  scene: SvgScene,
  selection: ExportSelection,
  options: ExportOptions = {}
): Promise<readonly ExportFile[]> {
  const framed = framedScene(scene, options.inset ?? 0);
  const context = { scene, framed, inset: options.inset ?? 0, selection };
  const files: ExportFile[] = [];
  for (const target of exportTargets) {
    if (target.isSelected(selection)) {
      files.push(...(await target.buildFiles(context)));
    }
  }
  return files;
}

export function exportDownloadName(paths: readonly string[], name?: string): string {
  const base = name?.trim() ?? '';
  if (paths.length !== 1) return base ? `${base}.zip` : 'iconforge-export.zip';
  const original = paths[0]!.split('/').at(-1) ?? paths[0]!;
  if (!base) return original;
  const stem = /^icon(?=[-.])(.*)$/.exec(original);
  return stem ? `${base}${stem[1]}` : original;
}

export async function exportSelection(
  scene: SvgScene,
  selection: ExportSelection,
  options: ExportOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const files = await buildExportFiles(scene, selection, options);
  if (files.length === 0) {
    throw new Error('Nothing was selected to export.');
  }

  const filename = exportDownloadName(
    files.map((file) => file.path),
    options.name
  );

  if (files.length === 1) {
    const file = files[0]!;
    const blob =
      typeof file.data === 'string'
        ? new Blob([file.data], { type: mimeForPath(filename) })
        : file.data;
    return { blob, filename };
  }

  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.data);
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return { blob, filename };
}
