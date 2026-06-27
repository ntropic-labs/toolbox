import { parseSvg, type SvgScene } from '@toolbox/svg-core';

export function requireScene(svgText: string): SvgScene {
  const parsed = parseSvg(svgText);
  if (!parsed.scene) throw new Error(parsed.diagnostics.map((d) => d.message).join('\n'));
  return parsed.scene;
}
