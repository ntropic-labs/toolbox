import type { SvgNode, SvgScene } from '@toolbox/svg-core';

function walk(node: SvgNode, predicate: (node: SvgNode) => boolean): boolean {
  return predicate(node) || node.children.some((child) => walk(child, predicate));
}

function documentHasStyleElement(scene: SvgScene): boolean {
  return scene.root.children.some((node) => walk(node, (n) => n.tag.toLowerCase() === 'style'));
}

export function layerStylingMayOverride(scene: SvgScene, nodeId: string): boolean {
  const layer = scene.root.children.find((node) => node.id === nodeId);
  if (!layer) return false;
  const hasStyleElement = documentHasStyleElement(scene);
  return walk(layer, (node) => {
    if (node.tag.toLowerCase() === 'style') return true;
    if (node.attributes.style !== undefined) return true;
    return hasStyleElement && node.attributes.class !== undefined;
  });
}
