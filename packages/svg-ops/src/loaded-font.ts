export interface GlyphOutline {
  readonly d: string;
  readonly advance: number;
}

export interface GlyphPlacement {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

export interface RunGlyph {
  readonly advance: number;
  readonly codePoints: readonly number[];
  readonly mapped: boolean;
  outline(placement: GlyphPlacement): string;
}

export interface GlyphRun {
  readonly glyphs: readonly RunGlyph[];
}

export interface FontAxis {
  readonly tag: string;
  readonly name: string;
  readonly min: number;
  readonly default: number;
  readonly max: number;
}

export interface GlyphSource {
  readonly familyName: string;
  readonly unitsPerEm: number;
  readonly ascent: number;
  readonly descent: number;
  readonly capHeight: number;
  hasGlyph(char: string): boolean;
  outlinePath(char: string, placement?: GlyphPlacement): GlyphOutline | null;
  layout(text: string): GlyphRun;
}

export interface LoadedFont extends GlyphSource {
  readonly variationAxes: readonly FontAxis[];
  variant(variations: Readonly<Record<string, number>>): GlyphSource;
}

export interface LoadFontOptions {
  readonly weight?: number;
  readonly variations?: Readonly<Record<string, number>>;
}
