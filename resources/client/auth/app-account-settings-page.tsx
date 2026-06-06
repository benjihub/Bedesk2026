import {AccountSettingsPurchasesPanel} from '@envato/account-settings-purchases-panel/account-settings-purchases-panel';
import {AccountSettingsPage} from '@common/auth/ui/account-settings/account-settings-page';
import {AccountSettingsSidenavItem} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {Trans} from '@ui/i18n/trans';
import {EnvatoIcon} from '@ui/icons/social/envato';
import {useSettings} from '@ui/settings/use-settings';

export function Component() {
  const {envato} = useSettings();
  const envatoEnabled = envato?.enable;
  return (
    <AccountSettingsPage
      panels={
        envatoEnabled
          ? user => <AccountSettingsPurchasesPanel user={user} />
          : undefined
      }
      sidenavItems={
        envatoEnabled ? (
          <AccountSettingsSidenavItem icon={<EnvatoIcon />} panel="purchases">
            <Trans message="Your purchases" />
          </AccountSettingsSidenavItem>
        ) : null
      }
    />
  );
}
