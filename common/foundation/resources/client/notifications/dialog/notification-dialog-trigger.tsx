import {useAuth} from '@common/auth/use-auth';
import {Badge} from '@ui/badge/badge';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {DoneAllIcon} from '@ui/icons/material/DoneAll';
import {NotificationsIcon} from '@ui/icons/material/Notifications';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useSettings} from '@ui/settings/use-settings';
import {Link} from 'react-router';
import {NotificationEmptyStateMessage} from '../empty-state/notification-empty-state-message';
import {NotificationList} from '../notification-list';
import {useMarkNotificationsAsRead} from '../requests/use-mark-notifications-as-read';
import {useUserNotifications} from './requests/user-notifications';

interface NotificationDialogTriggerProps {
  className?: string;
}
export function NotificationDialogTrigger({
  className,
}: NotificationDialogTriggerProps) {
  const {user} = useAuth();
  const hasUnread = !!user?.unread_notifications_count;

  return (
    <DialogTrigger type="popover">
      <IconButton
        size="md"
        className={className}
        badge={
          hasUnread ? (
            <Badge className="max-md:hidden">
              {user?.unread_notifications_count}
            </Badge>
          ) : undefined
        }
      >
        <NotificationsIcon />
      </IconButton>
      <NotificationsDialog />
    </DialogTrigger>
  );
}

interface NotificationsDialogProps {
  settingsLink?: string | null;
}

export function NotificationsDialog({settingsLink}: NotificationsDialogProps) {
  const {user} = useAuth();
  const {notif} = useSettings();
  const query = useUserNotifications();
  const markAsRead = useMarkNotificationsAsRead();
  const hasUnread = !!user?.unread_notifications_count;

  const handleMarkAsRead = () => {
    if (!query.data) return;
    markAsRead.mutate({
      markAllAsUnread: true,
    });
  };

  // "null" means that settings button should be hidden
  if (!settingsLink && settingsLink !== null) {
    settingsLink = '/notifications/settings';
  }

  return (
    <Dialog>
      <DialogHeader
        showDivider
        actions={
          !hasUnread &&
          settingsLink &&
          notif.subs.integrated && (
            <IconButton
              className="text-muted"
              size="sm"
              elementType={Link}
              to={settingsLink}
              target="_blank"
            >
              <SettingsIcon />
            </IconButton>
          )
        }
        rightAdornment={
          hasUnread && (
            <Button
              variant="text"
              color="primary"
              size="xs"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAsRead}
              disabled={markAsRead.isPending}
              className="max-md:hidden"
            >
              <Trans message="Mark all as read" />
            </Button>
          )
        }
      >
        <Trans message="Notifications" />
      </DialogHeader>
      <DialogBody padding="p-0" className="max-h-680">
        <DialogContent settingsLink={settingsLink} />
      </DialogBody>
    </Dialog>
  );
}

interface DialogContentProps {
  settingsLink?: string | null;
}
function DialogContent({settingsLink}: DialogContentProps) {
  const {data, isLoading} = useUserNotifications();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-24 py-20">
        <ProgressCircle aria-label="Loading notifications..." isIndeterminate />
      </div>
    );
  }
  if (!data?.pagination.data.length) {
    return (
      <div className="px-24 py-20">
        <NotificationEmptyStateMessage settingsLink={settingsLink} />
      </div>
    );
  }
  return (
    <div>
      <NotificationList notifications={data.pagination.data} />
    </div>
  );
}
