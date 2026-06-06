import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {useLogoutOtherSessions} from '@common/auth/ui/account-settings/sessions-panel/requests/use-logout-other-sessions';
import {
  UserSession,
  useUserSessions,
} from '@common/auth/ui/account-settings/sessions-panel/requests/use-user-sessions';
import {usePasswordConfirmedAction} from '@common/auth/ui/confirm-password/use-password-confirmed-action';
import {Button} from '@ui/buttons/button';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ComputerIcon} from '@ui/icons/material/Computer';
import {SmartphoneIcon} from '@ui/icons/material/Smartphone';
import {TabletIcon} from '@ui/icons/material/Tablet';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {toast} from '@ui/toast/toast';
import {Fragment, ReactNode} from 'react';
import {AccountSettingsPanel} from '../account-settings-panel';

export function SessionsPanel() {
  const {data, isLoading} = useUserSessions();
  const logoutOther = useLogoutOtherSessions();
  const {withConfirmedPassword, isLoading: checkingPasswordStatus} =
    usePasswordConfirmedAction({needsPassword: true});

  const sessionList = (
    <div className="max-h-400 overflow-y-auto">
      {data?.sessions?.map(session => (
        <SessionItem key={session.id} session={session} />
      ))}
    </div>
  );

  return (
    <AccountSettingsPanel
      id={AccountSettingsId.Sessions}
      title={<Trans message="Sessions" />}
    >
      <p className="text-sm">
        <Trans message="If necessary, you may log out of all of your other browser sessions across all of your devices. Your recent sessions are listed below. If you feel your account has been compromised, you should also update your password." />
      </p>
      <div className="my-30">
        {isLoading ? (
          <div className="min-h-60">
            <ProgressCircle isIndeterminate />
          </div>
        ) : (
          sessionList
        )}
      </div>
      <Button
        variant="outline"
        color="primary"
        disabled={checkingPasswordStatus || logoutOther.isPending}
        onClick={() => {
          withConfirmedPassword(password => {
            logoutOther.mutate(
              {password: password!},
              {
                onSuccess: () => {
                  toast(message('Logged out other sessions.'));
                },
              },
            );
          });
        }}
      >
        <Trans message="Logout other sessions" />
      </Button>
    </AccountSettingsPanel>
  );
}

interface SessionItemProps {
  session: UserSession;
}
function SessionItem({session}: SessionItemProps) {
  return (
    <div className="mb-14 flex items-start gap-14 text-sm">
      <div className="flex-shrink-0 text-muted">
        <DeviceIcon device={session.device} size="lg" />
      </div>
      <div className="flex-auto">
        <div>
          <ValueOrUnknown>{session.platform}</ValueOrUnknown> -{' '}
          <ValueOrUnknown>{session.browser}</ValueOrUnknown>
        </div>
        <div className="my-4 text-xs">
          {session.city}, {session.country}
        </div>
        <div className="text-xs">
          <IpAddress session={session} /> - <LastActive session={session} />
        </div>
      </div>
    </div>
  );
}

interface DeviceIconProps {
  device: UserSession['device'];
  size: SvgIconProps['size'];
}
function DeviceIcon({device, size}: DeviceIconProps) {
  switch (device) {
    case 'mobile':
      return <SmartphoneIcon size={size} />;
    case 'tablet':
      return <TabletIcon size={size} />;
    default:
      return <ComputerIcon size={size} />;
  }
}

interface LastActiveProps {
  session: UserSession;
}
function LastActive({session}: LastActiveProps) {
  if (session.is_current_device) {
    return (
      <span className="text-positive">
        <Trans message="This device" />
      </span>
    );
  }

  return <FormattedRelativeTime date={session.updated_at} />;
}

interface IpAddressProps {
  session: UserSession;
}
function IpAddress({session}: IpAddressProps) {
  if (session.ip_address) {
    return <span>{session.ip_address}</span>;
  } else if (session.token) {
    return <Trans message="API Token" />;
  }
  return <Trans message="Unknown IP" />;
}

interface ValueOrUnknownProps {
  children: ReactNode;
}
function ValueOrUnknown({children}: ValueOrUnknownProps) {
  return children ? (
    <Fragment>{children}</Fragment>
  ) : (
    <Trans message="Unknown" />
  );
}
