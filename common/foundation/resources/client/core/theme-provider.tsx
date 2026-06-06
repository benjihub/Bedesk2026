import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';
import {themeEl} from '@ui/root-el';
import {useSettings} from '@ui/settings/use-settings';
import {
  ThemeId,
  ThemeSelectorContext,
  ThemeSelectorContextValue,
} from '@ui/themes/theme-selector-context';
import {usePreferredColorScheme} from '@ui/themes/use-preferred-color-scheme';
import {applyThemeToDom} from '@ui/themes/utils/apply-theme-to-dom';
import {useCookie} from '@ui/utils/hooks/use-cookie';
import {useCallback, useEffect, useMemo, useState} from 'react';

const STORAGE_KEY = 'be-active-theme';

interface ThemeProviderProps {
  children: any;
}
export function ThemeProvider({children}: ThemeProviderProps) {
  const settings = useSettings();
  const preferredColorScheme = usePreferredColorScheme();
  const data = useBootstrapDataStore(s => s.data);
  const allThemes = data.themes;

  const [cookieThemeId, setSelectedThemeId] = useCookie(STORAGE_KEY);
  const [forcedThemeId, setForceThemeId] = useState<ThemeId | null>(null);
  const selectedThemeId = forcedThemeId ?? cookieThemeId;

  const selectThemeTemporarily = useCallback((themeId: ThemeId | null) => {
    setForceThemeId(themeId);
  }, []);

  const resolveTheme = useCallback(
    (themeId: string | number) => {
      // set theme based on user preference
      if (themeId == 0 || themeId === 'system') {
        return allThemes.find(t =>
          preferredColorScheme === 'light' ? t.default_light : t.default_dark,
        );
      }

      if (themeId === 'light' || themeId === 'dark') {
        return allThemes.find(t => t.default_light === (themeId === 'light'));
      }

      return allThemes.find(t => t.id == themeId);
    },
    [allThemes, preferredColorScheme],
  );

  let selectedTheme = selectedThemeId
    ? resolveTheme(selectedThemeId)
    : resolveTheme(settings.themes?.default_id ?? 0);

  if (!selectedTheme) {
    selectedTheme = allThemes[0]!;
  }

  // if selected theme is different then the one that was set
  // with server render, set new css variables, this will only
  // happen if user has not selected theme manually and default theme is set to "system"
  useEffect(() => {
    const currentThemeId = themeEl.dataset.themeId;
    if (selectedTheme && `${selectedTheme.id}` !== `${currentThemeId}`) {
      applyThemeToDom(selectedTheme);
    }
    // only apply theme if id has changed
  }, [selectedTheme.id]);

  const contextValue: ThemeSelectorContextValue = useMemo(() => {
    return {
      allThemes,
      selectedTheme: selectedTheme!,
      selectThemeTemporarily,
      selectTheme: id => {
        const theme = resolveTheme(id);
        if (theme) {
          setSelectedThemeId(`${theme.id}`);
          applyThemeToDom(theme);
        }
      },
    };
  }, [
    allThemes,
    selectedTheme,
    setSelectedThemeId,
    resolveTheme,
    selectThemeTemporarily,
  ]);

  return (
    <ThemeSelectorContext.Provider value={contextValue}>
      {children}
    </ThemeSelectorContext.Provider>
  );
}
