import type { SvgNode, SvgScene } from '@toolbox/svg-core';
import { outlineSvgSceneText, type LoadedFont } from '@toolbox/svg-ops';
import { getLoadedFont } from './font-registry';

export interface BakeTextResult {
  readonly scene: SvgScene;
  readonly warnings: readonly string[];
}

type FontLookup = (familyName: string) => LoadedFont | null;

interface TextTarget {
  readonly id: string;
  readonly family: string | undefined;
}

export function bakeTextToShapes(
  scene: SvgScene,
  lookup: FontLookup = getLoadedFont
): BakeTextResult {
  const warnings: string[] = [];
  let next = scene;
  for (const target of collectTextTargets(scene.root.children, undefined)) {
    const font = target.family ? lookup(target.family) : null;
    if (!font) {
      warnings.push(
        `"${target.family ?? 'Text'}" has no loaded font; the text was exported as-is.`
      );
      continue;
    }
    const result = outlineSvgSceneText(next, { nodeId: target.id, font });
    next = result.scene;
    warnings.push(...result.warnings);
  }
  return { scene: next, warnings };
}

function collectTextTargets(
  nodes: readonly SvgNode[],
  inheritedFamily: string | undefined
): TextTarget[] {
  const targets: TextTarget[] = [];
  for (const node of nodes) {
    const family = node.attributes['font-family'] ?? inheritedFamily;
    if (node.tag.toLowerCase() === 'text') {
      targets.push({ id: node.id, family });
    }
    targets.push(...collectTextTargets(node.children, family));
  }
  return targets;
}
