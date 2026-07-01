import { setAttributes, type SvgNode, type SvgScene } from '@toolbox/svg-core';
import type { FontAxis } from '@toolbox/svg-ops';

function findNode(nodes: readonly SvgNode[], id: string): SvgNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function reconcileTextAxes(
  scene: SvgScene,
  id: string,
  axes: readonly FontAxis[]
): SvgScene {
  const node = findNode(scene.root.children, id);
  if (!node) return scene;
  const updates: Record<string, string | null> = {};

  const wght = axes.find((axis) => axis.tag === 'wght');
  const weightAttr = node.attributes['font-weight'];
  if (wght && weightAttr !== undefined) {
    const weight = Number(weightAttr);
    if (Number.isFinite(weight)) {
      const clamped = clamp(weight, wght.min, wght.max);
      if (clamped !== weight) updates['font-weight'] = String(clamped);
    }
  }

  const wdth = axes.find((axis) => axis.tag === 'wdth');
  const stretchAttr = node.attributes['font-stretch'];
  if (wdth && stretchAttr !== undefined) {
    const stretch = Number(stretchAttr.replace(/%$/u, ''));
    if (Number.isFinite(stretch)) {
      const clamped = clamp(stretch, wdth.min, wdth.max);
      if (clamped !== stretch) updates['font-stretch'] = `${clamped}%`;
    }
  }

  return Object.keys(updates).length > 0 ? setAttributes(scene, id, updates) : scene;
}
