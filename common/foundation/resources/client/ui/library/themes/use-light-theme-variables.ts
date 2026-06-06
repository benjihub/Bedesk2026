import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';

export function useLightThemeVariables() {
  const data = useBootstrapDataStore(s => s.data);
  return data.themes.find(theme => !theme.is_dark && theme.default_light)
    ?.values;
}
