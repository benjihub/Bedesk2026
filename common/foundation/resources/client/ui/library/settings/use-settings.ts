import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';

export function useSettings() {
  return useBootstrapDataStore(s => s.data.settings);
}
