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
  'font-style',
  'text-anchor',
  'letter-spacing',
  'dominant-baseline'
]);

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

  const text = nodeText(target)
    .replace(/[\t\n\r]+/gu, ' ')
    .replace(/ {2,}/gu, ' ')
    .trim();
  if (text.length === 0) {
    return { scene, warnings: [...warnings, 'The text element is empty; nothing to outline.'] };
  }

  const font = options.font;
  const fontSize = readNumericAttribute(
    target,
    'font-size',
    options.defaultFontSize ?? 16,
    warnings
  );
  const x = readNumericAttribute(target, 'x', 0, warnings);
  const y = readNumericAttribute(target, 'y', 0, warnings);
  const letterSpacing = readNumericAttribute(target, 'letter-spacing', 0, warnings);
  const anchor = (target.attributes['text-anchor'] ?? 'start').trim().toLowerCase();
  const scale = fontSize / font.unitsPerEm;

  const glyphs = font.layout(text).glyphs;
  for (const glyph of glyphs) {
    if (!glyph.mapped) {
      const name = String.fromCodePoint(...glyph.codePoints);
      warnings.push(
        `"${name}" has no glyph in ${font.familyName} and was skipped; spacing was adjusted.`
      );
    }
  }

  const mappedGlyphs = glyphs.filter((glyph) => glyph.mapped);
  if (mappedGlyphs.length === 0) {
    return { scene, warnings: [...warnings, 'No characters could be outlined with this font.'] };
  }

  const totalAdvance =
    mappedGlyphs.reduce((sum, glyph) => sum + glyph.advance * scale, 0) +
    letterSpacing * Math.max(0, mappedGlyphs.length - 1);
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
    pen += glyph.advance * scale + letterSpacing;
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
