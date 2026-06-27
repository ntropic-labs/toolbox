export interface SvgScene {
  readonly root: SvgRoot;
}

export interface SvgRoot {
  readonly viewBox: readonly [number, number, number, number];
  readonly width?: string;
  readonly height?: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly SvgNode[];
}

export interface SvgNode {
  readonly id: string;
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly SvgNode[];
  readonly content?: readonly SvgContent[];
  readonly text?: string;
}

export type SvgContent = SvgTextContent | SvgNode;

export interface SvgTextContent {
  readonly type: 'text';
  readonly value: string;
}

export interface SvgDiagnostic {
  readonly message: string;
}

export interface ParseSvgResult {
  readonly scene?: SvgScene;
  readonly diagnostics: readonly SvgDiagnostic[];
}

export interface SvgHistory<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
}

export type AttributePatch = Readonly<Record<string, string | null | undefined>>;

export function nodeText(node: SvgNode): string {
  if (node.content) {
    return node.content
      .map((item) => ('type' in item && item.type === 'text' ? item.value : ''))
      .join('');
  }
  return node.text ?? '';
}

let generatedId = 0;

export function parseSvg(svgText: string): ParseSvgResult {
  const diagnostics: SvgDiagnostic[] = [];
  const invalidEntity = findInvalidNumericEntity(svgText);
  if (invalidEntity) {
    return { diagnostics: [{ message: `Invalid numeric XML entity ${invalidEntity}.` }] };
  }
  const tokens = tokenizeSvg(svgText);
  const stack: MutableElement[] = [];
  let root: MutableElement | undefined;
  let skipTag: string | undefined;

  for (const token of tokens) {
    if (skipTag) {
      if (isClosingToken(token, skipTag)) {
        skipTag = undefined;
      }
      continue;
    }

    if (token.startsWith('<!--') || token.startsWith('<?') || /^<!doctype/i.test(token)) {
      continue;
    }

    if (token.startsWith('</')) {
      const tag = token.slice(2, -1).trim();
      const current = stack.pop();
      if (!current || current.tag !== tag) {
        diagnostics.push({ message: `Expected closing tag for ${current?.tag ?? 'none'}, received ${tag}.` });
        break;
      }
      continue;
    }

    if (token.startsWith('<')) {
      const parsed = parseOpenToken(token);
      if (!parsed) {
        diagnostics.push({ message: `Could not parse SVG token ${token}.` });
        break;
      }

      if (parsed.tag.toLowerCase() === 'script') {
        if (!parsed.selfClosing) {
          skipTag = parsed.tag;
        }
        continue;
      }

      const element: MutableElement = {
        id: nextId(),
        tag: parsed.tag,
        attributes: stripUnsafeAttributes(parsed.attributes),
        children: [],
        content: [],
      };

      if (stack.length === 0) {
        if (root) {
          diagnostics.push({ message: 'SVG text contains more than one root element.' });
          break;
        }
        root = element;
      } else {
        const parent = stack[stack.length - 1]!;
        parent.children.push(element);
        parent.content.push(element);
      }

      if (!parsed.selfClosing) {
        stack.push(element);
      }
      continue;
    }

    const text = unescapeText(token);
    if ((text.trim().length > 0 || isTextContainer(stack[stack.length - 1]?.tag)) && stack.length > 0) {
      const current = stack[stack.length - 1]!;
      current.content.push({ type: 'text', value: text });
      current.text = `${current.text ?? ''}${text}`;
    }
  }

  if (stack.length > 0 && diagnostics.length === 0) {
    diagnostics.push({ message: `Unclosed tag ${stack[stack.length - 1]!.tag}.` });
  }

  if (!root && diagnostics.length === 0) {
    diagnostics.push({ message: 'SVG text does not contain an <svg> root.' });
  }

  if (root?.tag.toLowerCase() !== 'svg' && diagnostics.length === 0) {
    diagnostics.push({ message: 'SVG text must start with an <svg> root.' });
  }

  if (!root || diagnostics.length > 0) {
    return { diagnostics };
  }

  return { scene: { root: toSvgRoot(root) }, diagnostics };
}

export function serializeSvg(scene: SvgScene, options: { readonly pretty?: boolean } = {}): string {
  const pretty = options.pretty ?? false;
  return serializeRoot(scene.root, pretty);
}

export function createElementNode(tag: string, attributes: AttributePatch = {}): SvgNode {
  return createNode(tag, compactPatch(attributes));
}

export function createRectNode(attributes: AttributePatch = {}): SvgNode {
  return createNode('rect', { x: '0', y: '0', width: '24', height: '24', fill: 'currentColor', ...compactPatch(attributes) });
}

export function createCircleNode(attributes: AttributePatch = {}): SvgNode {
  return createNode('circle', { cx: '12', cy: '12', r: '10', fill: 'currentColor', ...compactPatch(attributes) });
}

export function createTextNode(text: string, attributes: AttributePatch = {}): SvgNode {
  return { ...createNode('text', { x: '0', y: '0', fill: 'currentColor', ...compactPatch(attributes) }), text };
}

export function setAttributes(scene: SvgScene, nodeId: string, patch: AttributePatch): SvgScene {
  return mapSceneNode(scene, nodeId, (node) => ({ ...node, attributes: patchAttributes(node.attributes, patch) }));
}

export function setText(scene: SvgScene, nodeId: string, text: string): SvgScene {
  return mapSceneNode(scene, nodeId, (node) => ({
    ...node,
    children: [],
    content: text.length === 0 ? [] : [{ type: 'text', value: text }],
    text,
  }));
}

export function removeNode(scene: SvgScene, nodeId: string): SvgScene {
  return { ...scene, root: { ...scene.root, children: removeNodeFromList(scene.root.children, nodeId) } };
}

export function duplicateNode(scene: SvgScene, nodeId: string): SvgScene {
  return { ...scene, root: { ...scene.root, children: duplicateNodeInList(scene.root.children, nodeId) } };
}

export function addNode(scene: SvgScene, parentId: string | null, index: number, node: SvgNode): SvgScene {
  if (parentId === null) {
    const children = [...scene.root.children];
    children.splice(clampIndex(index, children.length), 0, node);
    return { ...scene, root: { ...scene.root, children } };
  }

  const children = insertNode(scene.root.children, parentId, node, index);
  if (children === scene.root.children) {
    return scene;
  }
  return { ...scene, root: { ...scene.root, children } };
}

export function reorderNode(scene: SvgScene, nodeId: string, direction: -1 | 1): SvgScene {
  return { ...scene, root: { ...scene.root, children: reorderInList(scene.root.children, nodeId, direction) } };
}

export function commitHistory<T>(history: SvgHistory<T>, present: T): SvgHistory<T> {
  if (Object.is(history.present, present)) {
    return history;
  }
  return { past: [...history.past, history.present], present, future: [] };
}

export function undoHistory<T>(history: SvgHistory<T>): SvgHistory<T> {
  const present = history.past.at(-1);
  if (!present) {
    return history;
  }
  return {
    past: history.past.slice(0, -1),
    present,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: SvgHistory<T>): SvgHistory<T> {
  const present = history.future[0];
  if (!present) {
    return history;
  }
  return {
    past: [...history.past, history.present],
    present,
    future: history.future.slice(1),
  };
}

interface MutableTextContent {
  type: 'text';
  value: string;
}

type MutableContent = MutableTextContent | MutableElement;

interface MutableElement {
  id: string;
  tag: string;
  attributes: Record<string, string>;
  children: MutableElement[];
  content: MutableContent[];
  text?: string;
}

interface ParsedOpenToken {
  tag: string;
  attributes: Record<string, string>;
  selfClosing: boolean;
}

function createNode(tag: string, attributes: Record<string, string>): SvgNode {
  return { id: nextId(), tag, attributes, children: [] };
}

function nextId(): string {
  generatedId += 1;
  return `fid-${generatedId}`;
}

function isClosingToken(token: string, tag: string): boolean {
  return token.startsWith('</') && token.slice(2, -1).trim().toLowerCase() === tag.toLowerCase();
}

function tokenizeSvg(source: string): string[] {
  const tokens: string[] = [];
  let index = 0;

  while (index < source.length) {
    if (source[index] !== '<') {
      const nextTag = source.indexOf('<', index);
      const end = nextTag === -1 ? source.length : nextTag;
      tokens.push(source.slice(index, end));
      index = end;
      continue;
    }

    if (source.startsWith('<!--', index)) {
      const end = source.indexOf('-->', index + 4);
      if (end === -1) {
        tokens.push(source.slice(index));
        break;
      }
      tokens.push(source.slice(index, end + 3));
      index = end + 3;
      continue;
    }

    let quote: '"' | "'" | null = null;
    let end = index + 1;
    for (; end < source.length; end += 1) {
      const char = source[end];
      if ((char === '"' || char === "'") && quote === null) {
        quote = char;
      } else if (char === quote) {
        quote = null;
      } else if (char === '>' && quote === null) {
        end += 1;
        break;
      }
    }

    tokens.push(source.slice(index, end));
    index = end;
  }

  return tokens;
}

function parseOpenToken(token: string): ParsedOpenToken | undefined {
  const body = token.slice(1, -1).trim();
  const selfClosing = body.endsWith('/');
  const normalized = selfClosing ? body.slice(0, -1).trim() : body;
  const match = /^(\S+)(.*)$/s.exec(normalized);
  if (!match) {
    return undefined;
  }

  const attributeSource = match[2] ?? '';
  if (hasUnbalancedQuotes(attributeSource) || hasMalformedAttributes(attributeSource)) {
    return undefined;
  }

  return { tag: match[1]!, attributes: parseAttributes(attributeSource), selfClosing };
}

function hasUnbalancedQuotes(source: string): boolean {
  let singleQuoted = false;
  let doubleQuoted = false;

  for (const char of source) {
    if (char === "'" && !doubleQuoted) {
      singleQuoted = !singleQuoted;
    } else if (char === '"' && !singleQuoted) {
      doubleQuoted = !doubleQuoted;
    }
  }

  return singleQuoted || doubleQuoted;
}

function hasMalformedAttributes(source: string): boolean {
  const pattern = /\s+[^\s=]+=(?:"[^"]*"|'[^']*')/gy;
  let index = 0;
  while (index < source.length) {
    pattern.lastIndex = index;
    const match = pattern.exec(source);
    if (!match) {
      return source.slice(index).trim().length > 0;
    }
    index = pattern.lastIndex;
  }
  return false;
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /\s+([^\s=]+)=(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const name = match[1];
    if (!name) {
      continue;
    }
    attributes[name] = unescapeText(match[2] ?? match[3] ?? '');
  }
  return attributes;
}

function stripUnsafeAttributes(attributes: Record<string, string>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (!/^on/i.test(name)) {
      safe[name] = value;
    }
  }
  return safe;
}

function toSvgRoot(element: MutableElement): SvgRoot {
  const { viewBox: viewBoxText, width, height, ...attributes } = element.attributes;
  const root = {
    viewBox: parseViewBox(viewBoxText),
    attributes,
    children: element.children.map(toSvgNode),
  } satisfies Omit<SvgRoot, 'width' | 'height'>;

  return {
    ...root,
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
  };
}

function toSvgNode(element: MutableElement): SvgNode {
  const children = element.children.map(toSvgNode);
  const byId = new Map(children.map((child) => [child.id, child]));
  const content = element.content.map((item): SvgContent => {
    if ('value' in item) {
      return { type: 'text', value: item.value };
    }
    return byId.get(item.id)!;
  });

  return {
    id: element.id,
    tag: element.tag,
    attributes: element.attributes,
    children,
    ...(content.length === 0 ? {} : { content }),
    ...(element.text === undefined ? {} : { text: element.text }),
  };
}

function parseViewBox(viewBox: string | undefined): readonly [number, number, number, number] {
  if (!viewBox) {
    return [0, 0, 1024, 1024];
  }
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return [0, 0, 1024, 1024];
  }
  return [parts[0]!, parts[1]!, parts[2]!, parts[3]!];
}

function serializeRoot(root: SvgRoot, pretty: boolean): string {
  const attributes = serializeAttributes({
    viewBox: root.viewBox.join(' '),
    ...(root.width === undefined ? {} : { width: root.width }),
    ...(root.height === undefined ? {} : { height: root.height }),
    ...root.attributes,
  });
  const children = root.children.map((child) => serializeNode(child, pretty, 1));
  if (children.length === 0) {
    return `<svg${attributes}></svg>`;
  }
  if (!pretty) {
    return `<svg${attributes}>${children.join('')}</svg>`;
  }
  return `<svg${attributes}>\n${children.join('\n')}\n</svg>`;
}

function serializeNode(node: SvgNode, pretty: boolean, depth: number): string {
  const indent = pretty ? '  '.repeat(depth) : '';
  const attributes = serializeAttributes(node.attributes);
  const contentHasText = node.content?.some((item) => 'value' in item) ?? false;
  const body =
    node.content && node.content.length > 0
      ? node.content
          .map((item) => ('value' in item ? escapeText(item.value) : serializeNode(item, contentHasText ? false : pretty, depth + 1)))
          .join(contentHasText ? '' : pretty ? '\n' : '')
      : `${node.text === undefined ? '' : escapeText(node.text)}${node.children.map((child) => serializeNode(child, pretty, depth + 1)).join(pretty ? '\n' : '')}`;

  if (body.length === 0) {
    return `${indent}<${node.tag}${attributes} />`;
  }

  const usesContent = node.content !== undefined && node.content.length > 0;
  const isBlock =
    pretty && (usesContent ? !contentHasText : node.text === undefined && node.children.length > 0);
  if (isBlock) {
    return `${indent}<${node.tag}${attributes}>\n${body}\n${indent}</${node.tag}>`;
  }

  return `${indent}<${node.tag}${attributes}>${body}</${node.tag}>`;
}

function serializeAttributes(attributes: Readonly<Record<string, string>>): string {
  return Object.keys(attributes)
    .filter((name) => attributes[name] !== undefined)
    .sort()
    .map((name) => ` ${name}="${escapeAttribute(attributes[name]!)}"`)
    .join('');
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function findInvalidNumericEntity(source: string): string | undefined {
  const numericEntityPattern = /&#([^;]*);/g;
  let match: RegExpExecArray | null;
  while ((match = numericEntityPattern.exec(source)) !== null) {
    const raw = match[1]!;
    const isHex = raw.startsWith('x') || raw.startsWith('X');
    if ((isHex && !/^x[0-9a-f]+$/i.test(raw)) || (!isHex && !/^[0-9]+$/.test(raw))) {
      return match[0];
    }
    const codepoint = isHex ? Number.parseInt(raw.slice(1), 16) : Number.parseInt(raw, 10);
    if (!Number.isInteger(codepoint) || codepoint === 0 || (codepoint >= 0xd800 && codepoint <= 0xdfff) || codepoint > 0x10ffff) {
      return match[0];
    }
  }
  return undefined;
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function unescapeText(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, codepoint: string) => String.fromCodePoint(Number.parseInt(codepoint, 16)))
    .replace(/&#([0-9]+);/g, (_, codepoint: string) => String.fromCodePoint(Number.parseInt(codepoint, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function compactPatch(patch: AttributePatch): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [name, value] of Object.entries(patch)) {
    if (value !== null && value !== undefined) {
      attributes[name] = value;
    }
  }
  return attributes;
}

function patchAttributes(attributes: Readonly<Record<string, string>>, patch: AttributePatch): Record<string, string> {
  const next = { ...attributes };
  for (const [name, value] of Object.entries(patch)) {
    if (value === null || value === undefined) {
      delete next[name];
    } else {
      next[name] = value;
    }
  }
  return next;
}

function mapSceneNode(scene: SvgScene, nodeId: string, mapper: (node: SvgNode) => SvgNode): SvgScene {
  return { ...scene, root: { ...scene.root, children: mapNodeList(scene.root.children, nodeId, mapper) } };
}

function mapNodeList(nodes: readonly SvgNode[], nodeId: string, mapper: (node: SvgNode) => SvgNode): readonly SvgNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === nodeId) {
      changed = true;
      return mapper(node);
    }
    const children = mapNodeList(node.children, nodeId, mapper);
    if (children !== node.children) {
      changed = true;
      return withChildren(node, children);
    }
    return node;
  });
  return changed ? next : nodes;
}

function removeNodeFromList(nodes: readonly SvgNode[], nodeId: string): readonly SvgNode[] {
  let changed = false;
  const next: SvgNode[] = [];
  for (const node of nodes) {
    if (node.id === nodeId) {
      changed = true;
      continue;
    }
    const children = removeNodeFromList(node.children, nodeId);
    if (children !== node.children) {
      changed = true;
      next.push(withChildren(node, children));
    } else {
      next.push(node);
    }
  }
  return changed ? next : nodes;
}

function duplicateNodeInList(nodes: readonly SvgNode[], nodeId: string): readonly SvgNode[] {
  let changed = false;
  const next: SvgNode[] = [];
  for (const node of nodes) {
    next.push(node);
    if (node.id === nodeId) {
      next.push(cloneWithNewIds(node));
      changed = true;
      continue;
    }
    const children = duplicateNodeInList(node.children, nodeId);
    if (children !== node.children) {
      next[next.length - 1] = withChildren(node, children);
      changed = true;
    }
  }
  return changed ? next : nodes;
}

function cloneWithNewIds(node: SvgNode): SvgNode {
  const children = node.children.map(cloneWithNewIds);
  return {
    ...node,
    id: nextId(),
    children,
    ...(node.content === undefined ? {} : { content: contentForChildren(node.content, children) }),
  };
}

function insertNode(nodes: readonly SvgNode[], parentId: string, nodeToInsert: SvgNode, index: number): readonly SvgNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === parentId) {
      const children = [...node.children];
      children.splice(clampIndex(index, children.length), 0, nodeToInsert);
      changed = true;
      return withChildren(node, children);
    }
    const children = insertNode(node.children, parentId, nodeToInsert, index);
    if (children !== node.children) {
      changed = true;
      return withChildren(node, children);
    }
    return node;
  });
  return changed ? next : nodes;
}

function reorderInList(nodes: readonly SvgNode[], nodeId: string, direction: -1 | 1): readonly SvgNode[] {
  const index = nodes.findIndex((node) => node.id === nodeId);
  if (index >= 0) {
    const target = index + direction;
    if (target < 0 || target >= nodes.length) {
      return nodes;
    }
    const next = [...nodes];
    const [node] = next.splice(index, 1);
    next.splice(target, 0, node!);
    return next;
  }

  let changed = false;
  const next = nodes.map((node) => {
    const children = reorderInList(node.children, nodeId, direction);
    if (children !== node.children) {
      changed = true;
      return withChildren(node, children);
    }
    return node;
  });
  return changed ? next : nodes;
}

function isTextContainer(tag: string | undefined): boolean {
  return tag === 'text' || tag === 'tspan' || tag === 'textPath';
}

function withChildren(node: SvgNode, children: readonly SvgNode[]): SvgNode {
  return {
    ...node,
    children,
    ...(node.content === undefined ? {} : { content: contentForChildren(node.content, children) }),
  };
}

function contentForChildren(content: readonly SvgContent[], children: readonly SvgNode[]): readonly SvgContent[] {
  if (!content.some((item) => 'value' in item)) {
    return children;
  }

  const originalIds = content.filter((item): item is SvgNode => !('value' in item)).map((item) => item.id);
  const nextIds = children.map((child) => child.id);
  if (originalIds.length === nextIds.length && originalIds.every((id, index) => id === nextIds[index])) {
    const byId = new Map(children.map((child) => [child.id, child]));
    return content.map((item): SvgContent => ('value' in item ? item : byId.get(item.id)!));
  }

  if (isSubsequence(originalIds, nextIds)) {
    const byId = new Map(children.map((child) => [child.id, child]));
    const originalIdSet = new Set(originalIds);
    const next: SvgContent[] = [];
    let childIndex = 0;

    for (const item of content) {
      if ('value' in item) {
        next.push(item);
        continue;
      }

      while (childIndex < children.length && children[childIndex]!.id !== item.id) {
        next.push(children[childIndex]!);
        childIndex += 1;
      }

      const child = byId.get(item.id);
      if (child) {
        next.push(child);
        childIndex += 1;
      }

      while (childIndex < children.length && !originalIdSet.has(children[childIndex]!.id)) {
        next.push(children[childIndex]!);
        childIndex += 1;
      }
    }

    while (childIndex < children.length) {
      next.push(children[childIndex]!);
      childIndex += 1;
    }

    return next;
  }

  const textSlots: string[] = [''];
  let slot = 0;
  for (const item of content) {
    if ('value' in item) {
      textSlots[slot] = `${textSlots[slot] ?? ''}${item.value}`;
    } else {
      slot += 1;
      textSlots[slot] = textSlots[slot] ?? '';
    }
  }

  const next: SvgContent[] = [];
  for (const [index, child] of children.entries()) {
    const leadingText = textSlots[index] ?? '';
    if (leadingText.length > 0) {
      next.push({ type: 'text', value: leadingText });
    }
    next.push(child);
  }

  const trailingText = textSlots.slice(children.length).join('');
  if (trailingText.length > 0) {
    next.push({ type: 'text', value: trailingText });
  }

  return next;
}


function isSubsequence(source: readonly string[], target: readonly string[]): boolean {
  let sourceIndex = 0;
  for (const id of target) {
    if (id === source[sourceIndex]) {
      sourceIndex += 1;
    }
  }
  return sourceIndex === source.length;
}
function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(0, index), length);
}
