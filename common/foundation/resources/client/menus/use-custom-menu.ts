import {MenuConfig, MenuItemConfig} from '@common/menus/menu-config';
import {useSettings} from '@ui/settings/use-settings';
import {User} from '@ui/types/user';
import dot from 'dot-object';
import {useMemo} from 'react';
import {useAuth} from '../auth/use-auth';

export function useCustomMenu(menuOrPosition?: string | MenuConfig) {
  const settings = useSettings();
  const {user, hasPermission} = useAuth();

  return useMemo(() => {
    if (!menuOrPosition) {
      return null;
    }

    const menu =
      typeof menuOrPosition === 'string'
        ? settings.menus?.find(s => s.positions?.includes(menuOrPosition))
        : menuOrPosition;

    const menuItems: MenuItemConfig[] = [];

    if (menu) {
      for (const item of menu.items) {
        const hasRoles = (item.roles || []).every(a =>
          user?.roles?.find(b => b.id === a),
        );
        const hasPermissions = (item.permissions || []).every(a =>
          hasPermission(a),
        );
        const hasSettings =
          !item.settings ||
          Object.entries(item.settings).every(([key, value]) => {
            return dot.pick(key, settings) == value;
          });

        if (
          !item.action ||
          !hasRoles ||
          !hasPermissions ||
          !hasSettings ||
          !subscriptionStatusMatches(item, user)
        ) {
          continue;
        }

        if (user?.id) {
          item.action = item.action.replace(/{currentUser}/g, `${user.id}`);
        }

        menuItems.push(item);
      }
      menu.items = menuItems;
    }

    return menu;
  }, [hasPermission, settings, menuOrPosition, user]);
}

function subscriptionStatusMatches(
  item: MenuItemConfig,
  user?: User | null,
): boolean {
  if (!item.subscriptionStatus) {
    return true;
  }
  const hasActiveSubscription = !!user?.subscriptions?.find(sub => sub.active);
  if (item.subscriptionStatus === 'subscribed') {
    return hasActiveSubscription;
  }
  return !hasActiveSubscription;
}
function hasExactPermission(
  user: User | null | undefined,
  permissionName: string,
): boolean {
  return user?.permissions?.some(permission => permission.name === permissionName) ?? false;
}
