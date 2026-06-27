interface FontFaceBlock {
  readonly family: string | null;
  readonly style: string;
  readonly weightMin: number;
  readonly weightMax: number;
  readonly srcUrl: string | null;
  readonly unicodeRange: string | null;
}

export function findFontUrl(css: string, family: string, weight: number): string {
  const blocks = css
    .split('@font-face')
    .slice(1)
    .map(parseFontFaceBlock)
    .filter((block) => block.srcUrl !== null);
  if (blocks.length === 0) {
    throw new Error('No downloadable font URL found in the Google Fonts CSS.');
  }

  const candidates = blocks.filter(
    (block) =>
      block.style === 'normal' &&
      (block.family === null || block.family.toLowerCase() === family.toLowerCase()) &&
      weight >= block.weightMin &&
      weight <= block.weightMax
  );
  if (candidates.length === 0) {
    throw new Error(`The Google Fonts CSS does not include "${family}" at weight ${weight}.`);
  }

  const latin = candidates.find(
    (block) => block.unicodeRange === null || unicodeRangeCovers(block.unicodeRange, 0x41)
  );
  return (latin ?? candidates[candidates.length - 1]!).srcUrl!;
}

function parseFontFaceBlock(blockText: string): FontFaceBlock {
  const familyMatch = /font-family:\s*['"]?([^;'"]+)['"]?\s*;/u.exec(blockText);
  const styleMatch = /font-style:\s*([^;]+);/u.exec(blockText);
  const weightMatch = /font-weight:\s*(\d+)(?:\s+(\d+))?\s*;/u.exec(blockText);
  const srcMatch = /src:\s*url\(([^)]+)\)/u.exec(blockText);
  const rangeMatch = /unicode-range:\s*([^;]+);/u.exec(blockText);

  const weightMin = weightMatch ? Number.parseInt(weightMatch[1]!, 10) : 1;
  const weightMax = weightMatch ? Number.parseInt(weightMatch[2] ?? weightMatch[1]!, 10) : 1000;

  return {
    family: familyMatch ? familyMatch[1]!.trim() : null,
    style: styleMatch ? styleMatch[1]!.trim().toLowerCase() : 'normal',
    weightMin,
    weightMax,
    srcUrl: srcMatch ? srcMatch[1]!.replace(/['"]/gu, '').trim() : null,
    unicodeRange: rangeMatch ? rangeMatch[1]!.trim() : null
  };
}

function unicodeRangeCovers(range: string, codePoint: number): boolean {
  return range.split(',').some((segment) => {
    const match = /^\s*U\+([0-9a-f]+)(?:-([0-9a-f]+))?\s*$/iu.exec(segment);
    if (!match) return false;
    const start = Number.parseInt(match[1]!, 16);
    const end = match[2] === undefined ? start : Number.parseInt(match[2], 16);
    return codePoint >= start && codePoint <= end;
  });
}
