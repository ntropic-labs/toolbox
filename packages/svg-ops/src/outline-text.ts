import { createElementNode, nodeText, type SvgNode, type SvgScene } from '@toolbox/svg-core';
import type { LoadedFont } from './loaded-font';

export interface OutlineSvgSceneTextOptions {
  readonly nodeId: string;
  readonly font: LoadedFont;
  readonly defaultFontSize?: number;
}

export interface OutlineSvgSceneTextResult {
  readonly scene: SvgScene;
  readonly warnings: readonly string[];
}

const consumedTextAttributes = new Set([
  'x',
  'y',
  'dx',
  'dy',
  'font-size',
  'font-family',
  'font-weight',
  'font-stretch',
  'font-style',
  'text-anchor',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'text-decoration',
  'style',
  'dominant-baseline'
]);

export function parseTextVariations(
  attributes: Readonly<Record<string, string>>
): Record<string, number> {
  const variations: Record<string, number> = {};
  if (attributes['font-weight'] !== undefined) {
    const weight = Number(attributes['font-weight'].trim());
    if (Number.isFinite(weight)) variations.wght = weight;
  }
  if (attributes['font-stretch'] !== undefined) {
    const stretch = Number(attributes['font-stretch'].trim().replace(/%$/u, ''));
    if (Number.isFinite(stretch)) variations.wdth = stretch;
  }
  const oblique = /oblique\s+(-?[\d.]+)deg/iu.exec(attributes['font-style'] ?? '');
  if (oblique) variations.slnt = -Number(oblique[1]);
  return variations;
}

function readTextTransform(attributes: Readonly<Record<string, string>>): string | null {
  const styleMatch = /text-transform\s*:\s*([a-z-]+)/iu.exec(attributes.style ?? '');
  const value = (styleMatch?.[1] ?? attributes['text-transform'] ?? '').toLowerCase();
  return value.length > 0 ? value : null;
}

function applyTextTransform(text: string, transform: string | null): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\p{L}/gu, (char) => char.toUpperCase());
    default:
      return text;
  }
}

function isSpaceGlyph(glyph: { readonly codePoints: readonly number[] }): boolean {
  return glyph.codePoints.length === 1 && glyph.codePoints[0] === 0x20;
}

export function outlineSvgSceneText(
  scene: SvgScene,
  options: OutlineSvgSceneTextOptions
): OutlineSvgSceneTextResult {
  const target = findNodeById(scene.root.children, options.nodeId);
  if (!target) {
    throw new Error(`No node with id "${options.nodeId}" exists in the scene.`);
  }
  if (target.tag.toLowerCase() !== 'text') {
    throw new Error(`Node "${options.nodeId}" is not a <text> element.`);
  }

  const warnings: string[] = [];
  for (const child of target.children) {
    warnings.push(`Nested <${child.tag}> content is not outlined and was dropped.`);
  }
  for (const name of ['dx', 'dy', 'dominant-baseline']) {
    if (target.attributes[name] !== undefined) {
      warnings.push(`The ${name} attribute is not supported by outlining and was ignored.`);
    }
  }

  const text = applyTextTransform(
    nodeText(target)
      .replace(/[\t\n\r]+/gu, ' ')
      .replace(/ {2,}/gu, ' ')
      .trim(),
    readTextTransform(target.attributes)
  );
  if (text.length === 0) {
    return { scene, warnings: [...warnings, 'The text element is empty; nothing to outline.'] };
  }

  if (target.attributes['text-decoration'] !== undefined) {
    warnings.push('text-decoration is not drawn as an outline and was dropped.');
  }

  const source = options.font.variant(parseTextVariations(target.attributes));
  const fontSize = readNumericAttribute(
    target,
    'font-size',
    options.defaultFontSize ?? 16,
    warnings
  );
  const x = readNumericAttribute(target, 'x', 0, warnings);
  const y = readNumericAttribute(target, 'y', 0, warnings);
  const letterSpacing = readNumericAttribute(target, 'letter-spacing', 0, warnings);
  const wordSpacing = readNumericAttribute(target, 'word-spacing', 0, warnings);
  const anchor = (target.attributes['text-anchor'] ?? 'start').trim().toLowerCase();
  const scale = fontSize / source.unitsPerEm;

  const glyphs = source.layout(text).glyphs;
  for (const glyph of glyphs) {
    if (!glyph.mapped) {
      const name = String.fromCodePoint(...glyph.codePoints);
      warnings.push(
        `"${name}" has no glyph in ${source.familyName} and was skipped; spacing was adjusted.`
      );
    }
  }

  const mappedGlyphs = glyphs.filter((glyph) => glyph.mapped);
  if (mappedGlyphs.length === 0) {
    return { scene, warnings: [...warnings, 'No characters could be outlined with this font.'] };
  }

  const spaceCount = mappedGlyphs.filter(isSpaceGlyph).length;
  const totalAdvance =
    mappedGlyphs.reduce((sum, glyph) => sum + glyph.advance * scale, 0) +
    letterSpacing * Math.max(0, mappedGlyphs.length - 1) +
    wordSpacing * spaceCount;
  const startX =
    anchor === 'middle' ? x - totalAdvance / 2 : anchor === 'end' ? x - totalAdvance : x;

  const paths: SvgNode[] = [];
  let pen = startX;
  for (const glyph of glyphs) {
    if (!glyph.mapped) {
      continue;
    }
    const d = glyph.outline({ scale, x: pen, y });
    if (d.length > 0) {
      paths.push(createElementNode('path', { d }));
    }
    pen += glyph.advance * scale + letterSpacing + (isSpaceGlyph(glyph) ? wordSpacing : 0);
  }

  const carriedAttributes = Object.fromEntries(
    Object.entries(target.attributes).filter(
      ([name]) => !consumedTextAttributes.has(name.toLowerCase())
    )
  );
  const group: SvgNode = { ...createElementNode('g', carriedAttributes), children: paths };

  return {
    scene: {
      root: { ...scene.root, children: replaceNodeById(scene.root.children, options.nodeId, group) }
    },
    warnings
  };
}

function findNodeById(nodes: readonly SvgNode[], nodeId: string): SvgNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findNodeById(node.children, nodeId);
    if (child) return child;
  }
  return null;
}

function replaceNodeById(
  nodes: readonly SvgNode[],
  nodeId: string,
  replacement: SvgNode
): readonly SvgNode[] {
  return nodes.map((node) =>
    node.id === nodeId
      ? replacement
      : node.children.length > 0
        ? { ...node, children: replaceNodeById(node.children, nodeId, replacement) }
        : node
  );
}

function readNumericAttribute(
  node: SvgNode,
  name: string,
  fallback: number,
  warnings: string[]
): number {
  const value = node.attributes[name];
  if (value === undefined) return fallback;
  const parsed = Number(value.trim());
  if (Number.isFinite(parsed)) return parsed;
  warnings.push(`The ${name} value "${value}" is not a plain number and was ignored.`);
  return fallback;
}
