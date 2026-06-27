export function googleCss2Url(family: string, weight: number): string {
  const name = family.trim().replace(/\s+/gu, '+');
  return `https://fonts.googleapis.com/css2?family=${name}:wght@${weight}&display=swap`;
}
