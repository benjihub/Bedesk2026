import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {useAllSocialLoginsDisabled} from '@common/auth/ui/use-all-social-logins-disabled';
import {queryClient} from '@common/http/query-client';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {EnvatoIcon} from '@ui/icons/social/envato';
import {FacebookIcon} from '@ui/icons/social/facebook';
import {GoogleIcon} from '@ui/icons/social/google';
import {TwitterIcon} from '@ui/icons/social/twitter';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {useSettings} from '@ui/settings/use-settings';
import {toast} from '@ui/toast/toast';
import {User} from '@ui/types/user';
import clsx from 'clsx';
import {cloneElement, ReactElement} from 'react';
import {SocialService, useSocialLogin} from '../../requests/use-social-login';
import {AccountSettingsPanel} from './account-settings-panel';

interface PartialUser {
  id: number;
  social_profiles?: User['social_profiles'];
}

interface Props {
  user: PartialUser;
}
export function SocialLoginPanel({user}: Props) {
  if (useAllSocialLoginsDisabled()) {
    return null;
  }

  return (
    <AccountSettingsPanel
      id={AccountSettingsId.SocialLogin}
      title={<Trans message="Manage social login" />}
    >
      <SocialLoginPanelRow
        icon={
          <EnvatoIcon
            viewBox="0 0 50 50"
            className="border-envato bg-envato text-white"
          />
        }
        service="envato"
        user={user}
      />
      <SocialLoginPanelRow
        icon={<GoogleIcon viewBox="0 0 48 48" />}
        service="google"
        user={user}
      />
      <SocialLoginPanelRow
        icon={<FacebookIcon className="text-facebook" />}
        service="facebook"
        user={user}
      />
      <SocialLoginPanelRow
        icon={<TwitterIcon className="text-twitter" />}
        service="twitter"
        user={user}
      />
      <div className="pb-6 pt-16 text-sm text-muted">
        <Trans message="If you disable social logins, you'll still be able to log in using your email and password." />
      </div>
    </AccountSettingsPanel>
  );
}

interface SocialLoginPanelRowProps {
  service: SocialService;
  user: PartialUser;
  className?: string;
  icon: ReactElement<SvgIconProps>;
}

function SocialLoginPanelRow({
  service,
  user,
  className,
  icon,
}: SocialLoginPanelRowProps) {
  const {social} = useSettings();
  const {connectSocial, disconnectSocial} = useSocialLogin();
  const username = user?.social_profiles?.find(
    s => s.service_name === service,
  )?.username;

  if (!social?.[service]?.enable) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-14 border-b px-10 py-20',
        className,
      )}
    >
      {cloneElement(icon, {
        size: 'xl',
        className: clsx(icon.props.className, 'border p-8 rounded'),
      })}
      <div className="mr-auto overflow-hidden text-ellipsis whitespace-nowrap">
        <div className="overflow-hidden text-ellipsis text-sm font-bold first-letter:capitalize">
          <Trans message=":service account" values={{service}} />
        </div>
        <div className="mt-2 text-xs">
          {username || <Trans message="Disabled" />}
        </div>
      </div>
      <Button
        disabled={disconnectSocial.isPending}
        size="xs"
        variant="outline"
        color={username ? 'danger' : 'primary'}
        onClick={async () => {
          if (username) {
            disconnectSocial.mutate(
              {service},
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({queryKey: ['users']});
                  toast(
                    message('Disabled :service account', {values: {service}}),
                  );
                },
              },
            );
          } else {
            const e = await connectSocial(service);
            if (e?.status === 'SUCCESS') {
              queryClient.invalidateQueries({queryKey: ['users']});
              toast(message('Enabled :service account', {values: {service}}));
            }
          }
        }}
      >
        {username ? <Trans message="Disable" /> : <Trans message="Enable" />}
      </Button>
    </div>
  );
}
