import {authDropdownIcons} from '@app/auth/auth-dropdown-icons';
import {useLogout} from '@common/auth/requests/logout';
import {useAuth} from '@common/auth/use-auth';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {useCustomMenu} from '@common/menus/use-custom-menu';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Placement} from '@floating-ui/react-dom';
import {ListboxItemProps} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {createSvgIconFromTree} from '@ui/icons/create-svg-icon';
import {AccountCircleIcon} from '@ui/icons/material/AccountCircle';
import {DarkModeIcon} from '@ui/icons/material/DarkMode';
import {ExitToAppIcon} from '@ui/icons/material/ExitToApp';
import {LightModeIcon} from '@ui/icons/material/LightMode';
import {NotificationsIcon} from '@ui/icons/material/Notifications';
import {PaymentsIcon} from '@ui/icons/material/Payments';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {useThemeSelector} from '@ui/themes/theme-selector-context';
import {ReactElement, useContext} from 'react';

interface Props {
  children: ReactElement;
  items?: ReactElement<ListboxItemProps>[];
  placement?: Placement;
  accountSettingsLink?: string;
}
export function NavbarAuthMenu({
  children,
  items,
  placement,
  accountSettingsLink,
}: Props) {
  const {auth} = useContext(SiteConfigContext);
  const logout = useLogout();
  const menu = useCustomMenu('auth-dropdown');
  const {notifications, themes} = useSettings();
  const {user, isSubscribed} = useAuth();
  const navigate = useNavigate();
  const {selectedTheme, selectTheme} = useThemeSelector();
  if (!selectedTheme || !user) return null;
  const hasUnreadNotif = !!user.unread_notifications_count;

  const hasAccountSettingsItem = !!menu?.items?.some(item => {
    const label = item.label?.toLowerCase?.();
    return (
      item.action === '/account-settings' ||
      (accountSettingsLink && item.action === accountSettingsLink) ||
      label === 'account settings'
    );
  });

  const notifMenuItem = (
    <MenuItem
      className="md:hidden"
      value="notifications"
      startIcon={<NotificationsIcon />}
      onSelected={() => {
        navigate('/notifications');
      }}
    >
      <Trans message="Notifications" />
      {hasUnreadNotif ? ` (${user.unread_notifications_count})` : undefined}
    </MenuItem>
  );

  const billingMenuItem = (
    <MenuItem
      value="billing"
      startIcon={<PaymentsIcon />}
      onSelected={() => {
        navigate('/billing');
      }}
    >
      <Trans message="Billing" />
    </MenuItem>
  );

  return (
    <MenuTrigger placement={placement}>
      {children}
      <Menu>
        {menu &&
          menu.items.map(item => {
            let icon: ReactElement<SvgIconProps> | null = null;

            if (item.icon) {
              const IconCmp = createSvgIconFromTree(item.icon);
              icon = IconCmp && <IconCmp size="sm" />;
            } else {
              const IconCmp = authDropdownIcons[item.action.split('?')[0]];
              icon = IconCmp && <IconCmp size="sm" />;
            }

            let action = item.action;

            if (action === '/account-settings' && accountSettingsLink) {
              action = accountSettingsLink;
            }

            return (
              <MenuItem
                value={item.id}
                key={item.id}
                startIcon={icon}
                onSelected={() => {
                  if (item.type === 'link') {
                    window.open(action, '_blank');
                  } else {
                    navigate(action);
                  }
                }}
              >
                <Trans message={item.label} />
              </MenuItem>
            );
          })}
        {!hasAccountSettingsItem && (
          <MenuItem
            value="account-settings"
            startIcon={<AccountCircleIcon size="sm" />}
            onSelected={() => {
              navigate(accountSettingsLink || '/account-settings');
            }}
          >
            <Trans message="Account settings" />
          </MenuItem>
        )}
        {auth?.getUserProfileLink && (
          <MenuItem
            value="profile"
            startIcon={<AccountCircleIcon size="sm" />}
            onSelected={() => {
              navigate(auth.getUserProfileLink!(user));
            }}
          >
            <Trans message="Profile page" />
          </MenuItem>
        )}
        {items?.map(item => item)}
        {notifications?.integrated ? notifMenuItem : undefined}
        {isSubscribed && billingMenuItem}
        {themes?.user_change && !selectedTheme.is_dark && (
          <MenuItem
            value="light"
            startIcon={<DarkModeIcon size="sm" />}
            onSelected={() => {
              selectTheme('dark');
            }}
          >
            <Trans message="Dark mode" />
          </MenuItem>
        )}
        {themes?.user_change && selectedTheme.is_dark && (
          <MenuItem
            value="dark"
            startIcon={<LightModeIcon size="sm" />}
            onSelected={() => {
              selectTheme('light');
            }}
          >
            <Trans message="Light mode" />
          </MenuItem>
        )}
        <MenuItem
          value="logout"
          startIcon={<ExitToAppIcon size="sm" />}
          onSelected={() => {
            logout.mutate();
          }}
        >
          <Trans message="Log out" />
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
