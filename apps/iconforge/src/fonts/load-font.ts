import { loadFromBuffer, type LoadedFont } from '@toolbox/svg-ops';
import { parseGoogleFontsLink } from './google-link';
import { googleCss2Url, googleCss2UrlForWeight } from './css2-url';
import { findFontUrl } from './find-font-url';
import { getCachedFont, putCachedFont } from './font-cache';
import { registerFont } from './font-registry';
import { embedFontSource } from './font-embed';

export interface LoadGoogleFontOptions {
  readonly fetchImpl?: (url: string) => Promise<Response>;
}

export async function loadGoogleFont(
  input: string,
  options: LoadGoogleFontOptions = {}
): Promise<LoadedFont> {
  const fetchImpl = options.fetchImpl ?? ((url: string) => globalThis.fetch(url));

  let family: string;
  let cssUrls: string[];
  let weight = 400;
  if (/^https?:\/\//iu.test(input.trim())) {
    const parsed = parseGoogleFontsLink(input);
    family = parsed.family;
    weight = parsed.weights[0] ?? 400;
    cssUrls = [parsed.cssUrl];
  } else {
    family = input.trim();
    cssUrls = [googleCss2Url(family), googleCss2UrlForWeight(family, weight)];
  }

  const cacheKey = family.toLowerCase();
  let bytes = await getCachedFont(cacheKey);
  if (!bytes) {
    bytes = await fetchFontBytes(cssUrls, family, weight, fetchImpl);
    await putCachedFont(cacheKey, bytes);
  }

  const font = await loadFromBuffer(bytes, family);
  registerFont(font);
  embedFontSource(font.familyName, bytes, font.variationAxes);
  await registerFontFace(font.familyName, bytes);
  return font;
}

async function fetchFontBytes(
  cssUrls: readonly string[],
  family: string,
  weight: number,
  fetchImpl: (url: string) => Promise<Response>
): Promise<ArrayBuffer> {
  let lastError: Error = new Error('The Google Fonts CSS could not be fetched.');
  for (const cssUrl of cssUrls) {
    try {
      const cssResponse = await fetchImpl(cssUrl);
      if (!cssResponse.ok) throw new Error('The Google Fonts CSS could not be fetched.');
      const fontUrl = findFontUrl(await cssResponse.text(), family, weight);
      const fontResponse = await fetchImpl(fontUrl);
      if (!fontResponse.ok) throw new Error('The font file could not be downloaded.');
      return await fontResponse.arrayBuffer();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError;
}

export async function loadFontFromFile(file: File): Promise<LoadedFont> {
  const bytes = await file.arrayBuffer();
  const font = await loadFromBuffer(bytes, file.name);
  registerFont(font);
  embedFontSource(font.familyName, bytes, font.variationAxes);
  await registerFontFace(font.familyName, bytes);
  return font;
}

async function registerFontFace(family: string, bytes: ArrayBuffer): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    const face = new FontFace(family, bytes);
    await face.load();
    (document as Document & { fonts: FontFaceSet }).fonts.add(face);
  } catch {}
}
