import { serializeSvg, type SvgContent, type SvgNode, type SvgScene } from '@toolbox/svg-core';

export interface RenderMarkupOptions {
  readonly nodeIds?: boolean;
}

export interface SceneRenderOptions {
  readonly size: number;
  readonly background?: string;
  readonly fontFaceCss?: string;
}

export function renderToMarkup(scene: SvgScene, options: RenderMarkupOptions = {}): string {
  const nodeIds = options.nodeIds ?? true;
  return serializeSvg({
    root: {
      ...scene.root,
      attributes: stripExternalResourceAttributes(scene.root.attributes),
      children: scene.root.children.map((node) => toRenderNode(node, nodeIds)).filter(isSvgNode)
    }
  });
}

const svgNamespace = 'http://www.w3.org/2000/svg';

export function renderSceneToSvgText(
  scene: SvgScene,
  options: { readonly size?: number; readonly fontFaceCss?: string } = {}
): string {
  const attributes = scene.root.attributes.xmlns
    ? scene.root.attributes
    : { xmlns: svgNamespace, ...scene.root.attributes };

  const renderScene = {
    root: {
      ...scene.root,
      attributes,
      ...(options.size === undefined
        ? {}
        : { width: String(options.size), height: String(options.size) })
    }
  };

  const markup = renderToMarkup(renderScene, { nodeIds: false });
  if (!options.fontFaceCss) return markup;
  return markup.replace(/^(<svg[^>]*>)/u, `$1<style>${options.fontFaceCss}</style>`);
}

export async function renderSceneToImage(
  scene: SvgScene,
  options: { readonly size: number; readonly fontFaceCss?: string }
): Promise<HTMLImageElement> {
  return svgToImage(
    renderSceneToSvgText(scene, {
      size: options.size,
      ...(options.fontFaceCss === undefined ? {} : { fontFaceCss: options.fontFaceCss })
    })
  );
}

export async function renderSceneToCanvas(
  context: CanvasRenderingContext2D,
  scene: SvgScene,
  options: SceneRenderOptions
): Promise<void> {
  const image = await renderSceneToImage(scene, {
    size: options.size,
    ...(options.fontFaceCss === undefined ? {} : { fontFaceCss: options.fontFaceCss })
  });
  context.clearRect(0, 0, options.size, options.size);
  if (options.background) {
    context.save();
    context.fillStyle = options.background;
    context.fillRect(0, 0, options.size, options.size);
    context.restore();
  }
  context.drawImage(image, 0, 0, options.size, options.size);
}

function svgToImage(svgText: string): Promise<HTMLImageElement> {
  const image = new Image();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG rasterization failed.'));
    };
    image.src = url;
  });
}

function toRenderNode(node: SvgNode, nodeIds: boolean): SvgNode | null {
  if (isUnsafePreviewElement(node.tag)) {
    return null;
  }

  const children = node.children.map((child) => toRenderNode(child, nodeIds)).filter(isSvgNode);
  const content = node.content
    ?.map((item): SvgContent | null => ('type' in item ? item : toRenderNode(item, nodeIds)))
    .filter(isSvgContent);

  return {
    ...node,
    attributes: {
      ...stripExternalResourceAttributes(node.attributes),
      ...(nodeIds ? { 'data-fid': node.id } : {})
    },
    children,
    ...(content === undefined ? {} : { content })
  };
}

function isSvgNode(node: SvgNode | null): node is SvgNode {
  return node !== null;
}

function isSvgContent(content: SvgContent | null): content is SvgContent {
  return content !== null;
}

function stripExternalResourceAttributes(
  attributes: Readonly<Record<string, string>>
): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (hasFetchableResourceReference(name, value)) {
      continue;
    }
    safe[name] = value;
  }
  return safe;
}

function isUnsafePreviewElement(tag: string): boolean {
  switch (tag.toLowerCase()) {
    case 'foreignobject':
    case 'iframe':
    case 'object':
    case 'embed':
    case 'script':
    case 'style':
    case 'link':
    case 'meta':
      return true;
    default:
      return false;
  }
}

function hasFetchableResourceReference(name: string, value: string): boolean {
  if (isResourceAttribute(name) && isFetchableResourceReference(value)) {
    return true;
  }

  const urlPattern = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(value)) !== null) {
    if (isFetchableResourceReference(match[2] ?? '')) {
      return true;
    }
  }

  return false;
}

function isResourceAttribute(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized === 'href' || normalized === 'xlink:href' || normalized === 'src';
}

function isFetchableResourceReference(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    !trimmed.startsWith('#') &&
    !/^data:/i.test(trimmed) &&
    !/^blob:/i.test(trimmed)
  );
}
