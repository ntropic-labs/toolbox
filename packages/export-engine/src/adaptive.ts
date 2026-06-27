import type { SvgNode, SvgScene } from '@toolbox/svg-core';

const adaptiveRoleAttribute = 'data-adaptive-role';

export function getAdaptiveBackgroundScene(scene: SvgScene): SvgScene | null {
  if (!hasExplicitAdaptiveRoles(scene)) {
    return null;
  }
  return filterRootChildren(
    scene,
    (node) => node.attributes[adaptiveRoleAttribute] === 'background'
  );
}

export function getAdaptiveForegroundScene(scene: SvgScene): SvgScene | null {
  if (!hasExplicitAdaptiveRoles(scene)) {
    return null;
  }
  return filterRootChildren(
    scene,
    (node) => node.attributes[adaptiveRoleAttribute] !== 'background'
  );
}

function hasExplicitAdaptiveRoles(scene: SvgScene): boolean {
  return scene.root.children.some((node) => {
    const role = node.attributes[adaptiveRoleAttribute];
    return role === 'background' || role === 'foreground';
  });
}

function filterRootChildren(scene: SvgScene, keep: (node: SvgNode) => boolean): SvgScene {
  return {
    root: {
      ...scene.root,
      children: scene.root.children.filter((node) => isNonRenderingRootNode(node) || keep(node))
    }
  };
}

function isNonRenderingRootNode(node: SvgNode): boolean {
  const tag = node.tag.toLowerCase();
  return tag === 'defs' || tag === 'title' || tag === 'desc' || tag === 'metadata';
}
