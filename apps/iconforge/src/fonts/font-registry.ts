import type { LoadedFont } from '@toolbox/svg-ops';
import { familyKey } from './family-key';

const registry = new Map<string, LoadedFont>();

export function registerFont(font: LoadedFont): void {
  registry.set(familyKey(font.familyName), font);
}

export function getLoadedFont(familyName: string): LoadedFont | null {
  return registry.get(familyKey(familyName)) ?? null;
}
