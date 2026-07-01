export function googleCss2Url(family: string): string {
  const name = family.trim().replace(/\s+/gu, '+');
  return `https://fonts.googleapis.com/css2?family=${name}:wght@100..900&display=swap`;
}

// Fallback for single-weight (non-variable) families, which Google's API rejects
// when asked for a weight range.
export function googleCss2UrlForWeight(family: string, weight: number): string {
  const name = family.trim().replace(/\s+/gu, '+');
  return `https://fonts.googleapis.com/css2?family=${name}:wght@${weight}&display=swap`;
}
