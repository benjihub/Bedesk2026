import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';

export function useDarkThemeVariables() {
  const data = useBootstrapDataStore(s => s.data);
  const isDarkMode = useIsDarkMode();
  // already in dark mode, no need to set variables again
  if (isDarkMode) {
    return undefined;
  }
  return data.themes.find(theme => theme.is_dark && theme.default_dark)?.values;
}
