import {SiteConfigContextValue} from '@common/core/settings/site-config-context';
import {WorkspaceInviteNotificationRenderer} from '@common/workspace/notifications/workspace-invite-notification-renderer';
import {message} from '@ui/i18n/message';

const workspaceInviteNotif =
  'Common\\Workspaces\\Notifications\\WorkspaceInvitation';

export const BaseSiteConfig: SiteConfigContextValue = {
  tags: {
    types: [{name: 'custom'}],
  },
  customPages: {
    types: [{type: 'default', label: message('Default')}],
  },
  notifications: {
    renderMap: {
      [workspaceInviteNotif]: WorkspaceInviteNotificationRenderer,
    },
  },
  admin: {
    ads: [],
  },
};
