import type { SvgScene } from '@toolbox/svg-core';
import type { ExportFile, ExportSelection } from './types';
import { svgTarget } from './targets/svg';
import { pngTrioTarget } from './targets/png-trio';
import { faviconTarget } from './targets/favicon';

export interface ExportContext {
  readonly scene: SvgScene;
  readonly framed: SvgScene;
  readonly inset: number;
  readonly selection: ExportSelection;
}

// `planPaths` is pure (given the scene) so the UI can show a live file count;
// `buildFiles` must render exactly those same paths.
export interface ExportTarget {
  readonly id: string;
  isSelected(selection: ExportSelection): boolean;
  planPaths(selection: ExportSelection, scene: SvgScene): readonly string[];
  buildFiles(context: ExportContext): Promise<readonly ExportFile[]>;
}

export const exportTargets: readonly ExportTarget[] = [svgTarget, pngTrioTarget, faviconTarget];
