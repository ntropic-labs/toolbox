import type { SvgNode, SvgScene } from '@toolbox/svg-core';
import type { FontAxis } from '@toolbox/svg-ops';
import { familyKey } from './family-key';

// The live preview is a <canvas> that rasterizes the scene as an <img>; an SVG loaded as an
// image runs in an isolated context that can't see the document's @font-face registrations.
// To make the preview show a loaded font, we embed the font bytes as a base64 data-URI
// @font-face inside the SVG markup itself.

const fontFaceRules = new Map<string, string>();

function detectFont(bytes: Uint8Array): { readonly mime: string; readonly format: string } {
  const sig = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
  if (sig === 'wOF2') return { mime: 'font/woff2', format: 'woff2' };
  if (sig === 'wOFF') return { mime: 'font/woff', format: 'woff' };
  if (sig === 'OTTO') return { mime: 'font/otf', format: 'opentype' };
  return { mime: 'font/ttf', format: 'truetype' };
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function embedFontSource(
  family: string,
  buffer: ArrayBuffer,
  axes: readonly FontAxis[] = []
): void {
  const bytes = new Uint8Array(buffer);
  const { mime, format } = detectFont(bytes);
  const dataUrl = `data:${mime};base64,${toBase64(bytes)}`;
  fontFaceRules.set(
    familyKey(family),
    `@font-face{font-family:'${family}';src:url(${dataUrl}) format('${format}');${axisDescriptors(axes)}}`
  );
}

function axisDescriptors(axes: readonly FontAxis[]): string {
  const wght = axes.find((axis) => axis.tag === 'wght');
  const wdth = axes.find((axis) => axis.tag === 'wdth');
  let descriptors = '';
  if (wght) descriptors += `font-weight:${wght.min} ${wght.max};`;
  if (wdth) descriptors += `font-stretch:${wdth.min}% ${wdth.max}%;`;
  return descriptors;
}

export function previewFontFaceCss(scene: SvgScene): string {
  const families = new Set<string>();
  const walk = (nodes: readonly SvgNode[]): void => {
    for (const node of nodes) {
      if (node.tag.toLowerCase() === 'text') {
        const family = node.attributes['font-family'];
        if (family) families.add(familyKey(family));
      }
      walk(node.children);
    }
  };
  walk(scene.root.children);
  return [...families]
    .map((key) => fontFaceRules.get(key))
    .filter((rule): rule is string => rule !== undefined)
    .join('');
}
