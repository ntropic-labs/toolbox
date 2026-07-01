import {
  addNode,
  createElementNode,
  duplicateNode,
  removeNode,
  reorderNode,
  setAttributes,
  setText,
  type SvgNode,
  type SvgRoot,
  type SvgScene
} from '@toolbox/svg-core';
import {
  composeTransform,
  createNodeOfKind,
  parseTransform,
  type TransformParts
} from './node-primitives';
import { layerStylingMayOverride } from './css-notice';
import { writeStyleProperty } from './style-attr';

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
  readonly depth: number;
  readonly parentId: string | null;
  readonly expandable: boolean;
  readonly expanded: boolean;
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

export function listLayers(
  scene: SvgScene,
  selectedId: string,
  expanded: ReadonlySet<string> = new Set()
): readonly SceneLayer[] {
  const layers: SceneLayer[] = [];
  collectLayers(scene, scene.root.children, selectedId, expanded, 0, null, layers);
  return layers;
}

function collectLayers(
  scene: SvgScene,
  nodes: readonly SvgNode[],
  selectedId: string,
  expanded: ReadonlySet<string>,
  depth: number,
  parentId: string | null,
  out: SceneLayer[]
): void {
  for (const node of [...nodes].reverse()) {
    const hidden = isHidden(node);
    const adaptiveRole = getAdaptiveRole(node);
    const expandable = node.tag.toLowerCase() === 'g' && node.children.length > 0;
    const isExpanded = expandable && expanded.has(node.id);
    out.push({
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
      hasCss: layerStylingMayOverride(scene, node.id),
      depth,
      parentId,
      expandable,
      expanded: isExpanded
    });
    if (isExpanded) {
      collectLayers(scene, node.children, selectedId, expanded, depth + 1, node.id, out);
    }
  }
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
  if (!selectedId) return null;
  return findNodeById(scene.root.children, selectedId);
}

function findNodeById(nodes: readonly SvgNode[], id: string): SvgNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

export function findParentId(scene: SvgScene, id: string): string | null {
  return findParentIdIn(scene.root.children, id, null);
}

function findParentIdIn(
  nodes: readonly SvgNode[],
  id: string,
  parentId: string | null
): string | null {
  for (const node of nodes) {
    if (node.id === id) return parentId;
    const found = findParentIdIn(node.children, id, node.id);
    if (found !== null) return found;
  }
  return null;
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
  const beforeIds = collectIds(scene.root.children);
  const duplicated = duplicateNode(scene, id);
  const newId = firstNewId(duplicated.root.children, beforeIds);
  if (!newId) {
    return { scene: duplicated, selectedId: id };
  }
  const newNode = findNodeById(duplicated.root.children, newId);
  const cleaned =
    newNode && newNode.attributes.id !== undefined
      ? setAttributes(duplicated, newId, { id: null })
      : duplicated;
  return { scene: cleaned, selectedId: newId };
}

export function newlyAddedId(before: SvgScene, after: SvgScene): string | null {
  return firstNewId(after.root.children, collectIds(before.root.children));
}

function collectIds(nodes: readonly SvgNode[]): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    ids.add(node.id);
    for (const id of collectIds(node.children)) ids.add(id);
  }
  return ids;
}

function firstNewId(nodes: readonly SvgNode[], before: ReadonlySet<string>): string | null {
  for (const node of nodes) {
    if (!before.has(node.id)) return node.id;
    const nested = firstNewId(node.children, before);
    if (nested) return nested;
  }
  return null;
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

export function setStyleProperty(
  scene: SvgScene,
  id: string,
  prop: string,
  value: string
): SvgScene {
  const node = getSelectedNode(scene, id);
  const next = writeStyleProperty(node?.attributes.style, prop, value.length === 0 ? null : value);
  return setAttributes(scene, id, { style: next.length === 0 ? null : next });
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

export function applyMatrix(
  m: AffineMatrix,
  x: number,
  y: number
): { readonly x: number; readonly y: number } {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}

export function invertMatrix(m: AffineMatrix): AffineMatrix | null {
  const det = m.a * m.d - m.b * m.c;
  if (det === 0 || !Number.isFinite(det)) return null;
  const inv = 1 / det;
  return {
    a: m.d * inv,
    b: -m.b * inv,
    c: -m.c * inv,
    d: m.a * inv,
    e: (m.c * m.f - m.d * m.e) * inv,
    f: (m.b * m.e - m.a * m.f) * inv
  };
}

export function multiplyMatrix(m: AffineMatrix, n: AffineMatrix): AffineMatrix {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f
  };
}

export function centerInUserSpace(
  svgCtm: AffineMatrix,
  elementCtm: AffineMatrix,
  bbox: LayerBox
): { readonly x: number; readonly y: number } | null {
  const svgInverse = invertMatrix(svgCtm);
  if (!svgInverse) return null;
  return centerFromMatrix(multiplyMatrix(svgInverse, elementCtm), bbox);
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

export function normalizeCanvas(scene: SvgScene, size = 1024): SvgScene {
  const [vx, vy, vw, vh] = scene.root.viewBox;
  if (vw <= 0 || vh <= 0) return scene;
  const s = Math.min(size / vw, size / vh);
  const tfx = (size - s * vw) / 2 - s * vx;
  const tfy = (size - s * vh) / 2 - s * vy;
  
  const refit = scene.root.children.reduce((acc, node) => {
    const { tx, ty, scale, rotate } = parseTransform(node.attributes.transform);
    const transform = composeTransform({ tx: tfx + s * tx, ty: tfy + s * ty, scale: s * scale, rotate });
    return setAttributes(acc, node.id, { transform: transform.length === 0 ? null : transform });
  }, scene);

  const root: SvgRoot = {
    viewBox: [0, 0, size, size],
    attributes: refit.root.attributes,
    children: refit.root.children
  };
  return { root };
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
