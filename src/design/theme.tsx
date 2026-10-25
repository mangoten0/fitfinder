import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './palette';

export type ColorScheme = 'light' | 'dark';
/** What the user picked. "system" follows the phone's setting. */
export type Appearance = 'system' | ColorScheme;

type ThemeValue = {
  palette: Palette;
  scheme: ColorScheme;
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [appearance, setAppearance] = useState<Appearance>('system');

  const scheme: ColorScheme =
    appearance === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : appearance;

  const value = useMemo<ThemeValue>(
    () => ({
      palette: scheme === 'dark' ? darkPalette : lightPalette,
      scheme,
      appearance,
      setAppearance,
    }),
    [scheme, appearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return value;
}
