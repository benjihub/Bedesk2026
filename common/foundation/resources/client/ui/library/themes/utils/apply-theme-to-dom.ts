import {themeEl} from '@ui/root-el';
import {CssTheme} from '@ui/themes/css-theme';
import {setThemeValue} from '@ui/themes/utils/set-theme-value';

export function applyThemeToDom(theme: CssTheme) {
  Object.entries(theme.values).forEach(([key, value]) => {
    setThemeValue(key, value);
  });
  if (theme.is_dark) {
    themeEl.classList.add('dark');
  } else {
    themeEl.classList.remove('dark');
  }
  themeEl.dataset.themeId = `${theme.id}`;
}
