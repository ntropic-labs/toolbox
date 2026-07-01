export function googleCss2Url(family: string): string {
  const name = family.trim().replace(/\s+/gu, '+');
  return `https://fonts.googleapis.com/css2?family=${name}:wght@100..900&display=swap`;
}
