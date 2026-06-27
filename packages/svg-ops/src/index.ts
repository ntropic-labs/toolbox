import { serializeSvg, type SvgScene } from '@toolbox/svg-core';

export { sceneToComponent } from './component';
export type { ComponentOptions } from './component';
export { outlineSvgSceneText } from './outline-text';
export type { OutlineSvgSceneTextOptions, OutlineSvgSceneTextResult } from './outline-text';
export { loadFromBuffer } from './parse-font';
export type {
  LoadedFont,
  LoadFontOptions,
  GlyphRun,
  RunGlyph,
  GlyphPlacement,
  GlyphOutline
} from './loaded-font';
import type { Config } from 'svgo';

export interface OptimizeSvgOptions {
  readonly pretty?: boolean;
  readonly removeHidden?: boolean;
}

export function formatSvgScene(scene: SvgScene): string {
  return serializeSvg(scene, { pretty: true });
}

export async function optimizeSvgScene(
  scene: SvgScene,
  options: OptimizeSvgOptions = {}
): Promise<string> {
  return optimizeSvgText(serializeSvg(scene), options);
}

export async function optimizeSvgText(
  svgText: string,
  options: OptimizeSvgOptions = {}
): Promise<string> {
  const { optimize } = await import('svgo/browser');
  const config: Config = {
    multipass: true,
    js2svg: {
      pretty: options.pretty ?? false,
      indent: 2
    },
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupIds: false,
            ...(options.removeHidden ? {} : { removeHiddenElems: false })
          }
        }
      }
    ]
  };

  return optimize(svgText, config).data;
}
