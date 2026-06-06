import {SettingsNavConfig} from '@common/admin/settings/settings-nav-config';
import {useMemo} from 'react';

export function useAdminSettingsPageNavConfig() {
  return useMemo(() => {
    return SettingsNavConfig.sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
  }, []);
}
