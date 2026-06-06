import {createContext, useContext} from 'react';
import {CssTheme} from '@ui/themes/css-theme';

export type ThemeId = 'light' | 'dark' | 'system' | number | string;

export interface ThemeSelectorContextValue {
  allThemes: CssTheme[];
  selectedTheme: CssTheme;
  selectTheme: (themeId: ThemeId) => void;
  selectThemeTemporarily: (themeId: ThemeId | null) => void;
}

export const ThemeSelectorContext = createContext<ThemeSelectorContextValue>(
  null!,
);

export function useThemeSelector() {
  return useContext(ThemeSelectorContext);
}
