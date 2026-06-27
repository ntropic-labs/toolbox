export interface ParsedGoogleFontsLink {
  readonly family: string;
  readonly weights: readonly number[];
  readonly cssUrl: string;
}

interface FamilyEntry {
  readonly family: string;
  readonly weights: readonly number[];
}

export function parseGoogleFontsLink(
  link: string,
  requestedFamily?: string
): ParsedGoogleFontsLink {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    throw new Error('Only fonts.googleapis.com links are supported.');
  }
  if (url.hostname !== 'fonts.googleapis.com') {
    throw new Error('Only fonts.googleapis.com links are supported.');
  }

  const familyParams = url.searchParams
    .getAll('family')
    .flatMap((param) => param.split('|'))
    .filter((param) => param.trim().length > 0);
  if (familyParams.length === 0) {
    throw new Error('The link does not name a font family.');
  }

  const entries = familyParams.map(parseFamilyEntry);
  const target = requestedFamily
    ? entries.find((entry) => entry.family.toLowerCase() === requestedFamily.toLowerCase())
    : entries[0];
  if (!target) {
    throw new Error(`The link does not include the "${requestedFamily}" family.`);
  }

  return { family: target.family, weights: target.weights, cssUrl: url.toString() };
}

function parseFamilyEntry(entry: string): FamilyEntry {
  const separatorIndex = entry.indexOf(':');
  if (separatorIndex === -1) {
    return { family: entry.trim(), weights: [400] };
  }

  const family = entry.slice(0, separatorIndex).trim();
  const axisPart = entry.slice(separatorIndex + 1);

  const wghtMatch = /wght@([^&]*)/u.exec(axisPart);
  if (wghtMatch) {
    return { family, weights: parseWeightTokens(wghtMatch[1]!.split(';')) };
  }

  return { family, weights: parseWeightTokens(axisPart.split(',')) };
}

const standardWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

function parseWeightTokens(tokens: readonly string[]): readonly number[] {
  const weights = tokens.flatMap((token) => {
    const value = token.split(',').at(-1) ?? '';
    const rangeMatch = /^(\d+)\.\.(\d+)$/u.exec(value.trim());
    if (rangeMatch) {
      const min = Number.parseInt(rangeMatch[1]!, 10);
      const max = Number.parseInt(rangeMatch[2]!, 10);
      return standardWeights.filter((weight) => weight >= min && weight <= max);
    }
    const weight = Number.parseInt(value, 10);
    return Number.isFinite(weight) ? [weight] : [];
  });
  return weights.length > 0 ? [...new Set(weights)].sort((a, b) => a - b) : [400];
}
