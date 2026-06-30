import {
  addNode,
  createElementNode,
  duplicateNode,
  removeNode,
  reorderNode,
  setAttributes,
  setText,
  type SvgNode,
  type SvgScene
} from '@toolbox/svg-core';
import {
  composeTransform,
  createNodeOfKind,
  parseTransform,
  type TransformParts
} from './node-primitives';
import { layerStylingMayOverride } from './css-notice';

export { getNodeFields } from './node-primitives';

export type SceneNodeKind = 'rect' | 'circle' | 'text';

export type AdaptiveRole = 'background' | 'foreground';

const adaptiveRoleAttribute = 'data-adaptive-role';

export interface SceneLayer {
  readonly id: string;
  readonly label: string;
  readonly status: string;
  readonly hidden: boolean;
  readonly selected: boolean;
  readonly adaptiveRole: AdaptiveRole;
  readonly hasCss: boolean;
}

const tagLabels: Record<string, string> = {
  rect: 'Rectangle',
  circle: 'Circle',
  ellipse: 'Ellipse',
  path: 'Path',
  text: 'Text',
  g: 'Group',
  line: 'Line',
  polygon: 'Polygon',
  polyline: 'Polyline'
};

export function listLayers(scene: SvgScene, selectedId: string): readonly SceneLayer[] {
  return [...scene.root.children].reverse().map((node) => {
    const hidden = isHidden(node);
    const adaptiveRole = getAdaptiveRole(node);
    return {
      id: node.id,
      label: layerLabel(node),
      status: [
        tagLabels[node.tag.toLowerCase()] ?? node.tag,
        ...(hidden ? ['hidden'] : []),
        ...(adaptiveRole === 'background' ? ['background'] : [])
      ].join(' · '),
      hidden,
      selected: node.id === selectedId,
      adaptiveRole,
      hasCss: layerStylingMayOverride(scene, node.id)
    };
  });
}

export function getAdaptiveRole(node: SvgNode): AdaptiveRole {
  return node.attributes[adaptiveRoleAttribute] === 'background' ? 'background' : 'foreground';
}

export function setAdaptiveRole(scene: SvgScene, id: string, role: AdaptiveRole): SvgScene {
  return setAttributes(scene, id, {
    [adaptiveRoleAttribute]: role === 'background' ? 'background' : null
  });
}

export function getSelectedNode(scene: SvgScene, selectedId: string): SvgNode | null {
  return scene.root.children.find((node) => node.id === selectedId) ?? null;
}

export function addLayer(
  scene: SvgScene,
  kind: SceneNodeKind
): { readonly scene: SvgScene; readonly selectedId: string } {
  const node = createNodeOfKind(kind, scene.root.viewBox);
  return { scene: addNode(scene, null, scene.root.children.length, node), selectedId: node.id };
}

export function removeLayer(scene: SvgScene, id: string): SvgScene {
  return removeNode(scene, id);
}

export function reorderLayer(scene: SvgScene, id: string, direction: -1 | 1): SvgScene {
  return reorderNode(scene, id, direction);
}

export function duplicateLayer(
  scene: SvgScene,
  id: string
): { readonly scene: SvgScene; readonly selectedId: string } {
  const beforeIds = new Set(scene.root.children.map((node) => node.id));
  const duplicated = duplicateNode(scene, id);
  const newNode = duplicated.root.children.find((node) => !beforeIds.has(node.id));
  if (!newNode) {
    return { scene: duplicated, selectedId: id };
  }
  const cleaned =
    newNode.attributes.id === undefined
      ? duplicated
      : setAttributes(duplicated, newNode.id, { id: null });
  return { scene: cleaned, selectedId: newNode.id };
}

export function toggleLayerVisible(scene: SvgScene, id: string): SvgScene {
  const node = getSelectedNode(scene, id);
  if (!node) return scene;
  return setAttributes(scene, id, { display: isHidden(node) ? null : 'none' });
}

const transformFieldKeys = { translateX: 'tx', translateY: 'ty', scale: 'scale' } as const;
type TransformFieldName = keyof typeof transformFieldKeys;

function isTransformField(name: string): name is TransformFieldName {
  return name in transformFieldKeys;
}

export function updateNodeField(
  scene: SvgScene,
  id: string,
  name: string,
  value: string
): SvgScene {
  if (isTransformField(name)) {
    const node = getSelectedNode(scene, id);
    const current = parseTransform(node?.attributes.transform);
    const key = transformFieldKeys[name];
    const numeric = value.trim().length === 0 ? (name === 'scale' ? 1 : 0) : Number(value);
    const parsed = Number.isFinite(numeric) ? numeric : current[key];
    const next: TransformParts = { ...current, [key]: parsed };
    const transform = composeTransform(next);
    return setAttributes(scene, id, { transform: transform.length === 0 ? null : transform });
  }
  return setAttributes(scene, id, { [name]: value.trim().length === 0 ? null : value });
}

export interface LayerBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function rotatePoint(
  x: number,
  y: number,
  degrees: number
): { readonly x: number; readonly y: number } {
  if (degrees === 0) return { x, y };
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

export function layerCenter(
  node: SvgNode,
  bbox: LayerBox
): { readonly x: number; readonly y: number } {
  const { tx, ty, scale, rotate } = parseTransform(node.attributes.transform);
  const r = rotatePoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, rotate);
  return { x: scale * r.x + tx, y: scale * r.y + ty };
}

export interface AffineMatrix {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

export function centerFromMatrix(
  matrix: AffineMatrix,
  bbox: LayerBox
): { readonly x: number; readonly y: number } {
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  return {
    x: matrix.a * cx + matrix.c * cy + matrix.e,
    y: matrix.b * cx + matrix.d * cy + matrix.f
  };
}

export function setLayerCenter(
  scene: SvgScene,
  id: string,
  bbox: LayerBox,
  axis: 'x' | 'y',
  value: number
): SvgScene {
  const node = getSelectedNode(scene, id);
  if (!node) return scene;
  const { tx, ty, scale, rotate } = parseTransform(node.attributes.transform);
  const r = rotatePoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, rotate);
  const rotated = axis === 'x' ? r.x : r.y;
  const translate = value - scale * rotated;
  const next: TransformParts =
    axis === 'x' ? { tx: translate, ty, scale, rotate } : { tx, ty: translate, scale, rotate };
  const transform = composeTransform(next);
  return setAttributes(scene, id, { transform: transform.length === 0 ? null : transform });
}

export function setLayerCenterPoint(
  scene: SvgScene,
  id: string,
  bbox: LayerBox,
  x: number,
  y: number
): SvgScene {
  const node = getSelectedNode(scene, id);
  if (!node) return scene;
  const { scale, rotate } = parseTransform(node.attributes.transform);
  const r = rotatePoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, rotate);
  const transform = composeTransform({ tx: x - scale * r.x, ty: y - scale * r.y, scale, rotate });
  return setAttributes(scene, id, { transform: transform.length === 0 ? null : transform });
}

export function setLayerRotation(
  scene: SvgScene,
  id: string,
  bbox: LayerBox,
  degrees: number
): SvgScene {
  const node = getSelectedNode(scene, id);
  if (!node) return scene;
  const { tx, ty, scale, rotate } = parseTransform(node.attributes.transform);
  const bcx = bbox.x + bbox.width / 2;
  const bcy = bbox.y + bbox.height / 2;
  const before = rotatePoint(bcx, bcy, rotate);
  const cx = scale * before.x + tx;
  const cy = scale * before.y + ty;
  const after = rotatePoint(bcx, bcy, degrees);
  const transform = composeTransform({
    tx: cx - scale * after.x,
    ty: cy - scale * after.y,
    scale,
    rotate: degrees
  });
  return setAttributes(scene, id, { transform: transform.length === 0 ? null : transform });
}

export function centerLayer(scene: SvgScene, id: string, bbox: LayerBox): SvgScene {
  const node = getSelectedNode(scene, id);
  if (!node) return scene;
  const [vx, vy, vw, vh] = scene.root.viewBox;
  const { scale, rotate } = parseTransform(node.attributes.transform);
  const r = rotatePoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, rotate);
  const tx = vx + vw / 2 - scale * r.x;
  const ty = vy + vh / 2 - scale * r.y;
  const transform = composeTransform({ tx, ty, scale, rotate });
  return setAttributes(scene, id, { transform: transform.length === 0 ? null : transform });
}

export function fitTransform(
  host: readonly [number, number, number, number],
  uploaded: readonly [number, number, number, number]
): string {
  const [hostX, hostY, hostW, hostH] = host;
  const [upX, upY, upW, upH] = uploaded;
  if (upW <= 0 || upH <= 0) return '';
  const scale = Math.min(hostW / upW, hostH / upH);
  return composeTransform({ tx: hostX - scale * upX, ty: hostY - scale * upY, scale, rotate: 0 });
}

export function setNodeText(scene: SvgScene, id: string, text: string): SvgScene {
  return setText(scene, id, text);
}

export function getBackgroundColor(scene: SvgScene): string {
  const back = scene.root.children[firstRenderingIndex(scene)];
  if (back && isFullBleedRect(scene, back)) {
    return back.attributes.fill ?? 'transparent';
  }
  return 'transparent';
}

export function setBackgroundColor(scene: SvgScene, color: string): SvgScene {
  const index = firstRenderingIndex(scene);
  const first = scene.root.children[index];
  const existing = first && isFullBleedRect(scene, first) ? first : null;

  if (color === 'transparent') {
    return existing ? removeNode(scene, existing.id) : scene;
  }

  if (existing) {
    return setAttributes(scene, existing.id, { fill: color });
  }

  const [minX, minY, width, height] = scene.root.viewBox;
  const rect = createElementNode('rect', {
    x: String(minX),
    y: String(minY),
    width: String(width),
    height: String(height),
    fill: color
  });
  return addNode(scene, null, index, rect);
}

// Leading non-rendering nodes (e.g. a <defs> the text-shadow feature inserts at the front)
// don't paint, so the background rect lives at the first RENDERING child. Mirror the export
// engine's isNonRenderingRootNode so detection and insertion stay in sync.
function isNonRenderingRootNode(node: SvgNode): boolean {
  const tag = node.tag.toLowerCase();
  return tag === 'defs' || tag === 'title' || tag === 'desc' || tag === 'metadata';
}

function firstRenderingIndex(scene: SvgScene): number {
  const index = scene.root.children.findIndex((node) => !isNonRenderingRootNode(node));
  return index === -1 ? scene.root.children.length : index;
}

function isFullBleedRect(scene: SvgScene, node: SvgNode): boolean {
  if (node.tag.toLowerCase() !== 'rect') return false;
  const [minX, minY, width, height] = scene.root.viewBox;
  return (
    Number(node.attributes.x ?? '0') === minX &&
    Number(node.attributes.y ?? '0') === minY &&
    Number(node.attributes.width) === width &&
    Number(node.attributes.height) === height
  );
}

function layerLabel(node: SvgNode): string {
  const authoredId = node.attributes.id;
  return authoredId ? `${node.tag}#${authoredId}` : node.tag;
}

function isHidden(node: SvgNode): boolean {
  if (node.attributes.display?.trim().toLowerCase() === 'none') return true;
  const style = node.attributes.style ?? '';
  return /(?:^|;)\s*display\s*:\s*none/iu.test(style);
}
