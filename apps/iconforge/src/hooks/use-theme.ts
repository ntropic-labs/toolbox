import { useCallback, useEffect, useState } from 'react';
import { getNextTheme, parseStoredTheme, themeStorageKey, type ThemeMode } from '../theme';

export function useTheme(): { readonly theme: ThemeMode; readonly toggleTheme: () => void } {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    parseStoredTheme(localStorage.getItem(themeStorageKey))
  );

  useEffect(() => {
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((current) => getNextTheme(current)), []);

  return { theme, toggleTheme };
}
