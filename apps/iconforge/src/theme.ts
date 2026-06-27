export type ThemeMode = 'dark' | 'light';

export const themeStorageKey = 'iconforge.theme.v1';
export const defaultTheme: ThemeMode = 'dark';

export function getNextTheme(theme: ThemeMode): ThemeMode {
  return theme === 'dark' ? 'light' : 'dark';
}

export function parseStoredTheme(value: string | null): ThemeMode {
  return value === 'light' || value === 'dark' ? value : defaultTheme;
}
