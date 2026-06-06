import {useSettings} from '@ui/settings/use-settings';

type ModuleName = 'ai' | 'envato' | 'livechat';

export function useIsModuleInstalled(name: ModuleName): boolean {
  const {modules} = useSettings();
  return modules[name].installed;
}

export function useIsModuleInstalledAndSetup(name: ModuleName): boolean {
  const {modules} = useSettings();
  return modules[name].setup && modules[name].installed;
}
