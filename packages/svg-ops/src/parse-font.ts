import type {
  FontAxis,
  GlyphPlacement,
  GlyphSource,
  LoadFontOptions,
  LoadedFont
} from './loaded-font';

export async function loadFromBuffer(
  buffer: ArrayBuffer,
  name: string,
  options: LoadFontOptions = {}
): Promise<LoadedFont> {
  return parseFontBuffer(buffer, name, options);
}

async function parseFontBuffer(
  buffer: ArrayBuffer,
  name: string,
  options: LoadFontOptions
): Promise<LoadedFont> {
  const fontkit = await import('fontkit');
  const bytes = typeof Buffer === 'undefined' ? new Uint8Array(buffer) : Buffer.from(buffer);
  const parsed = fontkit.create(bytes as Buffer);
  if ('fonts' in parsed) {
    throw new Error(`${name} is a font collection; choose a single font file.`);
  }
  const base = parsed;

  const variationAxes: FontAxis[] = Object.entries(base.variationAxes).map(([tag, axis]) => ({
    tag,
    name: axis!.name,
    min: axis!.min,
    default: axis!.default,
    max: axis!.max
  }));
  const axisTags = new Set(variationAxes.map((axis) => axis.tag));

  const filterVariations = (
    variations: Readonly<Record<string, number>>
  ): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const [tag, value] of Object.entries(variations)) {
      if (axisTags.has(tag) && Number.isFinite(value)) out[tag] = value;
    }
    return out;
  };

  const makeSource = (font: typeof base): GlyphSource => ({
    familyName: font.familyName ?? name,
    unitsPerEm: font.unitsPerEm,
    ascent: font.ascent,
    descent: font.descent,
    capHeight: font.capHeight,
    hasGlyph: (char: string) => {
      const codePoint = char.codePointAt(0);
      return codePoint !== undefined && font.hasGlyphForCodePoint(codePoint);
    },
    outlinePath: (char: string, placement?: GlyphPlacement) => {
      const codePoint = char.codePointAt(0);
      if (codePoint === undefined || !font.hasGlyphForCodePoint(codePoint)) {
        return null;
      }
      const run = font.layout(char);
      const glyph = run.glyphs[0];
      const position = run.positions[0];
      if (!glyph || !position) {
        return null;
      }
      const d =
        placement === undefined
          ? glyph.path.toSVG()
          : placeGlyphPath(glyph.path.commands, placement);
      return { d, advance: position.xAdvance };
    },
    layout: (text: string) => {
      const run = font.layout(text);
      return {
        glyphs: run.glyphs.map((glyph, index) => ({
          advance: run.positions[index]?.xAdvance ?? glyph.advanceWidth,
          codePoints: glyph.codePoints,
          mapped: glyph.id !== 0,
          outline: (placement: GlyphPlacement) => placeGlyphPath(glyph.path.commands, placement)
        }))
      };
    }
  });

  const defaultVariations = filterVariations(
    options.variations ?? (options.weight !== undefined ? { wght: options.weight } : {})
  );
  const defaultSource = makeSource(
    Object.keys(defaultVariations).length > 0 ? base.getVariation(defaultVariations) : base
  );

  const sourceCache = new Map<string, GlyphSource>();
  const variant = (variations: Readonly<Record<string, number>>): GlyphSource => {
    const filtered = filterVariations(variations);
    const keys = Object.keys(filtered).sort();
    if (keys.length === 0) return defaultSource;
    const key = keys.map((tag) => `${tag}:${filtered[tag]}`).join(',');
    const cached = sourceCache.get(key);
    if (cached) return cached;
    const source = makeSource(base.getVariation(filtered));
    sourceCache.set(key, source);
    return source;
  };

  return { ...defaultSource, variationAxes, variant };
}

interface GlyphPathCommand {
  readonly command: string;
  readonly args: readonly number[];
}

const pathCommandLetters: Record<string, string> = {
  moveTo: 'M',
  lineTo: 'L',
  quadraticCurveTo: 'Q',
  bezierCurveTo: 'C',
  closePath: 'Z'
};

function placeGlyphPath(commands: readonly GlyphPathCommand[], placement: GlyphPlacement): string {
  let d = '';
  for (const { command, args } of commands) {
    const letter = pathCommandLetters[command];
    if (letter === undefined) {
      continue;
    }
    const points: string[] = [];
    for (let index = 0; index + 1 < args.length; index += 2) {
      const x = placement.x + args[index]! * placement.scale;
      const y = placement.y - args[index + 1]! * placement.scale;
      points.push(`${formatCoordinate(x)} ${formatCoordinate(y)}`);
    }
    d += letter + points.join(' ');
  }
  return d;
}

function formatCoordinate(value: number): string {
  return String(Number(value.toFixed(3)));
}
