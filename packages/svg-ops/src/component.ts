import type { SvgNode, SvgScene } from '@toolbox/svg-core';

export interface ComponentOptions {
  readonly componentName?: string;
  readonly typescript?: boolean;
  readonly native?: boolean;
}

const nativeTags: Record<string, string> = {
  svg: 'Svg',
  g: 'G',
  path: 'Path',
  rect: 'Rect',
  circle: 'Circle',
  ellipse: 'Ellipse',
  line: 'Line',
  polygon: 'Polygon',
  polyline: 'Polyline',
  text: 'Text',
  tspan: 'TSpan',
  defs: 'Defs',
  use: 'Use',
  symbol: 'Symbol',
  lineargradient: 'LinearGradient',
  radialgradient: 'RadialGradient',
  stop: 'Stop',
  clippath: 'ClipPath',
  mask: 'Mask',
  pattern: 'Pattern',
};

export function sceneToComponent(scene: SvgScene, options: ComponentOptions = {}): string {
  const native = options.native ?? false;
  const typescript = options.typescript ?? true;
  const name = options.componentName ?? 'Icon';
  const used = new Set<string>();

  const rootTag = tagName('svg', native, used);
  const rootAttrs = serializeAttributes(rootAttributes(scene, native), native);
  const children = scene.root.children.map((child) => serializeNode(child, native, used, 3));
  const element =
    children.length > 0
      ? `    <${rootTag}${rootAttrs} {...props}>\n${children.join('\n')}\n    </${rootTag}>`
      : `    <${rootTag}${rootAttrs} {...props} />`;

  return native
    ? renderNativeModule(name, typescript, element, used)
    : renderReactModule(name, typescript, element);
}

function serializeNode(node: SvgNode, native: boolean, used: Set<string>, depth: number): string {
  const indent = '  '.repeat(depth);
  const tag = tagName(node.tag, native, used);
  const attrs = serializeAttributes(node.attributes, native);
  const inner = serializeChildren(node, native, used, depth + 1);
  if (inner.length === 0) return `${indent}<${tag}${attrs} />`;
  return `${indent}<${tag}${attrs}>\n${inner}\n${indent}</${tag}>`;
}

function serializeChildren(node: SvgNode, native: boolean, used: Set<string>, depth: number): string {
  const indent = '  '.repeat(depth);
  if (node.content && node.content.length > 0) {
    return node.content
      .map((item) =>
        'value' in item
          ? item.value.trim().length > 0
            ? `${indent}{${JSON.stringify(item.value)}}`
            : ''
          : serializeNode(item, native, used, depth),
      )
      .filter((line) => line.length > 0)
      .join('\n');
  }
  if (node.text !== undefined && node.text.trim().length > 0) {
    return `${indent}{${JSON.stringify(node.text)}}`;
  }
  if (node.children.length > 0) {
    return node.children.map((child) => serializeNode(child, native, used, depth)).join('\n');
  }
  return '';
}

function tagName(tag: string, native: boolean, used: Set<string>): string {
  if (!native) return tag;
  const mapped = nativeTags[tag.toLowerCase()] ?? capitalize(tag);
  used.add(mapped);
  return mapped;
}

function rootAttributes(scene: SvgScene, native: boolean): Record<string, string> {
  return {
    viewBox: scene.root.viewBox.join(' '),
    ...(scene.root.width === undefined ? {} : { width: scene.root.width }),
    ...(scene.root.height === undefined ? {} : { height: scene.root.height }),
    ...(native ? stripNamespaces(scene.root.attributes) : scene.root.attributes),
  };
}

function stripNamespaces(attributes: Readonly<Record<string, string>>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'xmlns' || name.startsWith('xmlns:')) continue;
    next[name] = value;
  }
  return next;
}

function escapeAttributeValue(value: string): string {
  return `"${value
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')}"`;
}

function serializeAttributes(attributes: Readonly<Record<string, string>>, native: boolean): string {
  return Object.keys(attributes)
    .filter((name) => keepAttribute(name, native))
    .sort()
    .map((name) => ` ${jsxAttrName(name, native)}=${escapeAttributeValue(attributes[name]!)}`)
    .join('');
}

function keepAttribute(name: string, native: boolean): boolean {
  if (native && (name === 'class' || name === 'xmlns' || name.startsWith('xmlns:'))) return false;
  return true;
}

function jsxAttrName(name: string, native: boolean): string {
  if (!native && name === 'class') return 'className';
  if (name.startsWith('data-') || name.startsWith('aria-')) return name;
  return name.replace(/[:-]([a-z])/gu, (_, char: string) => char.toUpperCase());
}

function renderReactModule(name: string, typescript: boolean, element: string): string {
  const header = typescript ? "import type { SVGProps } from 'react';\n\n" : '';
  const signature = typescript ? `(props: SVGProps<SVGSVGElement>)` : `(props)`;
  return `${header}export function ${name}${signature} {\n  return (\n${element}\n  );\n}\n\nexport default ${name};\n`;
}

function renderNativeModule(name: string, typescript: boolean, element: string, used: Set<string>): string {
  const components = [...used].join(', ');
  const importLine = `import { ${components} } from 'react-native-svg';\n`;
  const typeImport = typescript ? "import type { SvgProps } from 'react-native-svg';\n" : '';
  const signature = typescript ? `(props: SvgProps)` : `(props)`;
  return `${importLine}${typeImport}\nexport function ${name}${signature} {\n  return (\n${element}\n  );\n}\n\nexport default ${name};\n`;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}
