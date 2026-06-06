import {AdminSidebarIcons} from '@app/admin/admin-config';
import {useAuth} from '@common/auth/use-auth';
import {UserAvatar, UserAvatarProps} from '@common/auth/user-avatar';
import {NotificationsDialog} from '@common/notifications/dialog/notification-dialog-trigger';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {
  DashboardLeftSidebar,
  DashboardLeftSidebarItem,
} from '@common/ui/dashboard-layout/dashboard-left-sidebar';
import {DashboardSidenavChildrenProps} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {NavbarAuthMenu} from '@common/ui/navigation/navbar/navbar-auth-menu';
import {Badge} from '@ui/badge/badge';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowUpIcon} from '@ui/icons/material/KeyboardArrowUp';
import {NotificationsIcon} from '@ui/icons/material/Notifications';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Fragment, JSXElementConstructor, useContext} from 'react';

export function AdminSidebar(props: DashboardSidenavChildrenProps) {
  const {isMobileMode, leftSidenavStatus} = useContext(DashboardLayoutContext);
  const isCompactMode = !isMobileMode && leftSidenavStatus === 'compact';

  const bottomContent = (
    <Fragment>
      <AdminSidebarNotificationsItem isCompact={isCompactMode} />
      <AdminSidebarAuthUserItem isCompact={isCompactMode} />
    </Fragment>
  );

  return (
    <DashboardLeftSidebar
      {...props}
      defaultIcons={AdminSidebarIcons}
      matchDescendants={to => to === '/admin'}
      menuName="admin-sidebar"
      bottomContent={bottomContent}
      showToggleSidebarButton={false}
    />
  );
}

interface AdminSidebarNotificationsItemProps {
  isCompact: boolean;
}
export function AdminSidebarNotificationsItem({
  isCompact,
}: AdminSidebarNotificationsItemProps) {
  const {user} = useAuth();
  const hasUnread = !!user?.unread_notifications_count;
  return (
    <DialogTrigger type="popover" placement="top">
      <DashboardLeftSidebarItem isCompact={isCompact} className="relative">
        <NotificationsIcon />
        <Trans message="Notifications" />
        {hasUnread ? (
          <Badge>{user?.unread_notifications_count}</Badge>
        ) : undefined}
      </DashboardLeftSidebarItem>
      <NotificationsDialog settingsLink={null} />
    </DialogTrigger>
  );
}

interface AuthUserItemProps {
  isCompact: boolean;
  avatar?: JSXElementConstructor<UserAvatarProps>;
  accountSettingsLink?: string;
}
export function AdminSidebarAuthUserItem({
  isCompact,
  avatar: propsAvatar,
  accountSettingsLink,
}: AuthUserItemProps) {
  const {user} = useAuth();
  if (!user) return null;

  const ItemAvatar = propsAvatar || UserAvatar;
  const avatar = <ItemAvatar user={user} size="w-32 h-32" />;

  return (
    <NavbarAuthMenu placement="top" accountSettingsLink={accountSettingsLink}>
      {isCompact ? (
        <button
          aria-label="toggle authentication menu"
          className="flex h-48 w-48 items-center justify-center rounded-panel hover:bg-hover"
        >
          {avatar}
        </button>
      ) : (
        <button className="flex w-full items-center rounded-panel px-12 py-8 hover:bg-hover">
          {avatar}
          <span className="ml-8 block min-w-0 overflow-x-hidden overflow-ellipsis whitespace-nowrap text-sm">
            {user.name}
          </span>
          <KeyboardArrowUpIcon size="xs" className="ml-auto block" />
        </button>
      )}
    </NavbarAuthMenu>
  );
}
