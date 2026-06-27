import {
  addNode,
  createElementNode,
  removeNode,
  setAttributes,
  type SvgNode,
  type SvgScene
} from '@toolbox/svg-core';

export interface TextShadow {
  readonly dx: number;
  readonly dy: number;
  readonly blur: number;
  readonly color: string;
}

const filterIdFor = (nodeId: string) => `if-shadow-${nodeId}`;

export function getTextShadow(scene: SvgScene, nodeId: string): TextShadow | null {
  const node = scene.root.children.find((child) => child.id === nodeId);
  const ref = node?.attributes.filter;
  if (!ref) return null;
  const match = /^url\(#(.+)\)$/u.exec(ref.trim());
  if (!match) return null;
  const filter = findFilter(scene, match[1]!);
  const drop = filter?.children.find((child) => child.tag.toLowerCase() === 'fedropshadow');
  if (!drop) return null;
  return {
    dx: Number(drop.attributes.dx ?? '0'),
    dy: Number(drop.attributes.dy ?? '0'),
    blur: Number(drop.attributes.stdDeviation ?? '0'),
    color: drop.attributes['flood-color'] ?? '#000000'
  };
}

export function setTextShadow(
  scene: SvgScene,
  nodeId: string,
  shadow: TextShadow | null
): SvgScene {
  const filterId = filterIdFor(nodeId);
  const cleared = removeFilter(scene, filterId);

  if (shadow === null) {
    return setAttributes(cleared, nodeId, { filter: null });
  }

  const drop = createElementNode('feDropShadow', {
    dx: String(shadow.dx),
    dy: String(shadow.dy),
    stdDeviation: String(shadow.blur),
    'flood-color': shadow.color
  });
  const filterNode: SvgNode = {
    ...createElementNode('filter', { id: filterId, 'color-interpolation-filters': 'sRGB' }),
    children: [drop]
  };
  const withDefs = appendToDefs(cleared, filterNode);
  return setAttributes(withDefs, nodeId, { filter: `url(#${filterId})` });
}

function findFilter(scene: SvgScene, id: string): SvgNode | null {
  const defs = scene.root.children.find((child) => child.tag.toLowerCase() === 'defs');
  return (
    defs?.children.find(
      (child) => child.tag.toLowerCase() === 'filter' && child.attributes.id === id
    ) ?? null
  );
}

function removeFilter(scene: SvgScene, filterId: string): SvgScene {
  const defs = scene.root.children.find((child) => child.tag.toLowerCase() === 'defs');
  const existing = defs?.children.find(
    (child) => child.tag.toLowerCase() === 'filter' && child.attributes.id === filterId
  );
  if (!defs || !existing) return scene;
  if (defs.children.length === 1) return removeNode(scene, defs.id);
  return removeNode(scene, existing.id);
}

function appendToDefs(scene: SvgScene, node: SvgNode): SvgScene {
  const defs = scene.root.children.find((child) => child.tag.toLowerCase() === 'defs');
  if (!defs) {
    const newDefs: SvgNode = { ...createElementNode('defs', {}), children: [node] };
    return addNode(scene, null, 0, newDefs);
  }
  return addNode(scene, defs.id, defs.children.length, node);
}
