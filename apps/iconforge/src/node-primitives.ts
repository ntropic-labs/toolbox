import {
  createCircleNode,
  createElementNode,
  createRectNode,
  createTextNode,
  nodeText,
  type SvgNode
} from '@toolbox/svg-core';

export type NodeFieldKind = 'number' | 'color' | 'select' | 'content' | 'text';

export interface NodeFieldOption {
  readonly value: string;
  readonly label: string;
}

export interface NodeField {
  readonly name: string;
  readonly label: string;
  readonly kind: NodeFieldKind;
  readonly value: string;
  readonly options?: readonly NodeFieldOption[];
}

export interface TransformParts {
  readonly tx: number;
  readonly ty: number;
  readonly scale: number;
  readonly rotate: number;
}

export function parseTransform(transform: string | undefined): TransformParts {
  const translate = /translate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/u.exec(transform ?? '');
  const scale = /scale\(\s*(-?[\d.]+)/u.exec(transform ?? '');
  const rotate = /rotate\(\s*(-?[\d.]+)/u.exec(transform ?? '');
  return {
    tx: translate ? Number(translate[1]) : 0,
    ty: translate && translate[2] !== undefined ? Number(translate[2]) : 0,
    scale: scale ? Number(scale[1]) : 1,
    rotate: rotate ? Number(rotate[1]) : 0
  };
}

// Order matters: translate then scale then rotate. With rotation last (innermost), it
// pivots in the element's own coordinate space; callers re-derive the translate to hold
// the layer's visual centre fixed, so no pivot needs to be stored on the rotate().
export function composeTransform({ tx, ty, scale, rotate }: TransformParts): string {
  const fx = formatNumber(tx);
  const fy = formatNumber(ty);
  const fs = formatNumber(scale);
  const fr = formatNumber(rotate);
  const parts: string[] = [];
  if (fx !== '0' || fy !== '0') parts.push(`translate(${fx} ${fy})`);
  if (fs !== '1') parts.push(`scale(${fs})`);
  if (fr !== '0') parts.push(`rotate(${fr})`);
  return parts.join(' ');
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(3)));
}

function nameField(node: SvgNode): NodeField {
  return { name: 'id', label: 'Name', kind: 'text', value: node.attributes.id ?? '' };
}

function transformFields(node: SvgNode): readonly NodeField[] {
  const { tx, ty, scale } = parseTransform(node.attributes.transform);
  return [
    { name: 'translateX', label: 'X', kind: 'number', value: formatNumber(tx) },
    { name: 'translateY', label: 'Y', kind: 'number', value: formatNumber(ty) },
    { name: 'scale', label: 'Scale', kind: 'number', value: formatNumber(scale) }
  ];
}

function numberFields(
  node: SvgNode,
  entries: readonly (readonly [string, string])[]
): readonly NodeField[] {
  return entries.map(([name, label]) => numberField(node, name, label));
}

function numberField(node: SvgNode, name: string, label: string): NodeField {
  return { name, label, kind: 'number', value: node.attributes[name] ?? '' };
}

function colorField(node: SvgNode, name: string, label: string): NodeField {
  return { name, label, kind: 'color', value: node.attributes[name] ?? '' };
}

type ViewBox = readonly [number, number, number, number];
const defaultDesignViewBox: ViewBox = [0, 0, 24, 24];

function canvasGeometry(viewBox: ViewBox): {
  readonly cx: number;
  readonly cy: number;
  readonly span: number;
} {
  const [minX, minY, width, height] = viewBox;
  const span = Math.min(width, height);
  return { cx: minX + width / 2, cy: minY + height / 2, span };
}

function num(value: number): string {
  return String(Number(value.toFixed(2)));
}

// New shapes get a concrete colour instead of svg-core's `currentColor` default. The colour
// picker can only represent a real hex: `currentColor` paints black on the canvas but, in the
// inspector swatch (`background: currentColor`), resolves to the themed UI foreground — so a
// freshly added layer read as e.g. white in dark mode while actually painting black. Black
// keeps the existing on-canvas appearance while making the picker honest and editable.
const newShapeFill = '#000000';

interface NodePrimitive {
  readonly tag: string;
  readonly kind?: string;
  readonly label: string;
  readonly addable: boolean;
  create(viewBox: ViewBox): SvgNode;
  getFields(node: SvgNode): readonly NodeField[];
}

const textAnchorOptions: readonly NodeFieldOption[] = [
  { value: 'start', label: 'Start' },
  { value: 'middle', label: 'Middle' },
  { value: 'end', label: 'End' }
];

const primitives: readonly NodePrimitive[] = [
  {
    tag: 'rect',
    kind: 'rect',
    label: 'Rectangle',
    addable: true,
    create: (viewBox) => {
      const { cx, cy, span } = canvasGeometry(viewBox);
      const size = span * 0.5;
      return createRectNode({
        fill: newShapeFill,
        x: num(cx - size / 2),
        y: num(cy - size / 2),
        width: num(size),
        height: num(size)
      });
    },
    getFields: (node) => [
      nameField(node),
      ...numberFields(node, [
        ['x', 'X'],
        ['y', 'Y'],
        ['width', 'W'],
        ['height', 'H'],
        ['rx', 'Radius']
      ]),
      colorField(node, 'fill', 'Fill'),
      numberField(node, 'opacity', 'Opacity')
    ]
  },
  {
    tag: 'circle',
    kind: 'circle',
    label: 'Circle',
    addable: true,
    create: (viewBox) => {
      const { cx, cy, span } = canvasGeometry(viewBox);
      return createCircleNode({
        fill: newShapeFill,
        cx: num(cx),
        cy: num(cy),
        r: num(span * 0.25)
      });
    },
    getFields: (node) => [
      nameField(node),
      ...numberFields(node, [
        ['cx', 'CX'],
        ['cy', 'CY'],
        ['r', 'R']
      ]),
      colorField(node, 'fill', 'Fill'),
      numberField(node, 'opacity', 'Opacity')
    ]
  },
  {
    tag: 'ellipse',
    label: 'Ellipse',
    addable: false,
    create: () => createElementNode('ellipse', {}),
    getFields: (node) => [
      nameField(node),
      ...numberFields(node, [
        ['cx', 'CX'],
        ['cy', 'CY'],
        ['rx', 'RX'],
        ['ry', 'RY']
      ]),
      colorField(node, 'fill', 'Fill'),
      numberField(node, 'opacity', 'Opacity')
    ]
  },
  {
    tag: 'text',
    kind: 'text',
    label: 'Text',
    addable: true,
    create: (viewBox) => {
      const { cx, cy, span } = canvasGeometry(viewBox);
      const fontSize = span * 0.15;
      return createTextNode('Text', {
        fill: newShapeFill,
        'font-size': num(fontSize),
        'text-anchor': 'middle',
        x: num(cx),
        y: num(cy + fontSize * 0.34)
      });
    },
    getFields: (node) => [
      nameField(node),
      { name: 'content', label: 'Text', kind: 'content', value: nodeText(node) },
      ...numberFields(node, [
        ['x', 'X'],
        ['y', 'Y'],
        ['font-size', 'Size']
      ]),
      colorField(node, 'fill', 'Fill'),
      colorField(node, 'stroke', 'Outline'),
      numberField(node, 'stroke-width', 'Outline width'),
      {
        name: 'text-anchor',
        label: 'Align',
        kind: 'select',
        value: node.attributes['text-anchor'] ?? 'start',
        options: textAnchorOptions
      }
    ]
  }
];

const groupPrimitive: NodePrimitive = {
  tag: 'g',
  label: 'Group',
  addable: false,
  create: () => createElementNode('g', {}),
  getFields: (node) => [
    nameField(node),
    ...transformFields(node),
    colorField(node, 'fill', 'Fill'),
    numberField(node, 'opacity', 'Opacity')
  ]
};

function getNodePrimitive(tag: string): NodePrimitive {
  return primitives.find((primitive) => primitive.tag === tag.toLowerCase()) ?? groupPrimitive;
}

export function getNodeFields(node: SvgNode): readonly NodeField[] {
  return getNodePrimitive(node.tag).getFields(node);
}

export function createNodeOfKind(kind: string, viewBox: ViewBox = defaultDesignViewBox): SvgNode {
  const primitive = primitives.find((entry) => entry.kind === kind);
  if (!primitive) throw new Error(`Unknown primitive kind: ${kind}`);
  return primitive.create(viewBox);
}

export interface AddablePrimitive {
  readonly kind: string;
  readonly label: string;
}

export const addablePrimitives: readonly AddablePrimitive[] = primitives
  .filter(
    (primitive): primitive is NodePrimitive & { kind: string } =>
      primitive.addable && primitive.kind !== undefined
  )
  .map((primitive) => ({ kind: primitive.kind, label: primitive.label }));
