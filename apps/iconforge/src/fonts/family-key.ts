export function familyKey(family: string): string {
  const first = family.split(',')[0] ?? family;
  return first.trim().replace(/^['"]|['"]$/gu, '').trim().replace(/\s+/gu, ' ').toLowerCase();
}
