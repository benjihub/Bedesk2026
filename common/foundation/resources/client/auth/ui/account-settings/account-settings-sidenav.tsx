import {useAllSocialLoginsDisabled} from '@common/auth/ui/use-all-social-logins-disabled';
import {useAuth} from '@common/auth/use-auth';
import {Trans} from '@ui/i18n/trans';
import {ApiIcon} from '@ui/icons/material/Api';
import {DangerousIcon} from '@ui/icons/material/Dangerous';
import {DevicesIcon} from '@ui/icons/material/Devices';
import {LanguageIcon} from '@ui/icons/material/Language';
import {LockIcon} from '@ui/icons/material/Lock';
import {LoginIcon} from '@ui/icons/material/Login';
import {PersonIcon} from '@ui/icons/material/Person';
import {PhonelinkLockIcon} from '@ui/icons/material/PhonelinkLock';
import {List, ListItem} from '@ui/list/list';
import {useSettings} from '@ui/settings/use-settings';
import {ReactNode} from 'react';

export enum AccountSettingsId {
  AccountDetails = 'account-details',
  SocialLogin = 'social-login',
  Password = 'password',
  TwoFactor = 'two-factor',
  LocationAndLanguage = 'location-and-language',
  Developers = 'developers',
  DeleteAccount = 'delete-account',
  Sessions = 'sessions',
}

interface Props {
  items: ReactNode;
}
export function AccountSettingsSidenav({items}: Props) {
  const p = AccountSettingsId;

  const {hasPermission} = useAuth();
  const {api} = useSettings();

  const allSocialsDisabled = useAllSocialLoginsDisabled();

  return (
    <aside className="sticky top-[74px] hidden flex-shrink-0 lg:block">
      <List padding="p-0">
        {items}
        <AccountSettingsSidenavItem
          icon={<PersonIcon />}
          panel={p.AccountDetails}
        >
          <Trans message="Account details" />
        </AccountSettingsSidenavItem>
        {!allSocialsDisabled && (
          <AccountSettingsSidenavItem
            icon={<LoginIcon />}
            panel={p.SocialLogin}
          >
            <Trans message="Social login" />
          </AccountSettingsSidenavItem>
        )}
        <AccountSettingsSidenavItem icon={<LockIcon />} panel={p.Password}>
          <Trans message="Password" />
        </AccountSettingsSidenavItem>
        <AccountSettingsSidenavItem
          icon={<PhonelinkLockIcon />}
          panel={p.TwoFactor}
        >
          <Trans message="Two factor authentication" />
        </AccountSettingsSidenavItem>
        <AccountSettingsSidenavItem icon={<DevicesIcon />} panel={p.Sessions}>
          <Trans message="Active sessions" />
        </AccountSettingsSidenavItem>
        <AccountSettingsSidenavItem
          icon={<LanguageIcon />}
          panel={p.LocationAndLanguage}
        >
          <Trans message="Location and language" />
        </AccountSettingsSidenavItem>
        {api?.integrated && hasPermission('api.access') ? (
          <AccountSettingsSidenavItem icon={<ApiIcon />} panel={p.Developers}>
            <Trans message="Developers" />
          </AccountSettingsSidenavItem>
        ) : null}
        <AccountSettingsSidenavItem
          icon={<DangerousIcon />}
          panel={p.DeleteAccount}
        >
          <Trans message="Delete account" />
        </AccountSettingsSidenavItem>
      </List>
    </aside>
  );
}

interface ItemProps {
  children: ReactNode;
  icon: ReactNode;
  isLast?: boolean;
  panel: string;
}
export function AccountSettingsSidenavItem({
  children,
  icon,
  isLast,
  panel,
}: ItemProps) {
  return (
    <ListItem
      startIcon={icon}
      className={isLast ? undefined : 'mb-10'}
      onSelected={() => {
        const panelEl = document.querySelector(`#${panel}`);
        if (panelEl) {
          panelEl.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }}
    >
      {children}
    </ListItem>
  );
}
