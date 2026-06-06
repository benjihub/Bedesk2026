import {AuthRoute} from '@common/auth/guards/auth-route';
import {AccountSettingsSidenav} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {SessionsPanel} from '@common/auth/ui/account-settings/sessions-panel/sessions-panel';
import {TwoFactorPanel} from '@common/auth/ui/account-settings/two-factor-panel';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {User} from '@ui/types/user';
import {ReactNode} from 'react';
import {useUser} from '../use-user';
import {AccessTokenPanel} from './access-token-panel/access-token-panel';
import {BasicInfoPanel} from './basic-info-panel/basic-info-panel';
import {ChangePasswordPanel} from './change-password-panel/change-password-panel';
import {DangerZonePanel} from './danger-zone-panel/danger-zone-panel';
import {LocalizationPanel} from './localization-panel';
import {SocialLoginPanel} from './social-login-panel';

interface Props {
  panels?: (user: User) => ReactNode;
  sidenavItems?: ReactNode;
}
export function AccountSettingsPage({panels, sidenavItems}: Props) {
  const {data, isLoading} = useUser('me', {
    with: ['roles', 'social_profiles', 'tokens'],
  });
  return (
    <AuthRoute>
      <div className="min-h-screen bg">
        <StaticPageTitle>
          <Trans message="Account Settings" />
        </StaticPageTitle>
        <Navbar
          menuPosition="account-settings-page"
          color="bg"
          className="sticky top-0 z-10"
        />
        <div>
          <div className="container mx-auto px-24 py-24">
            <h1 className="text-3xl">
              <Trans message="Account settings" />
            </h1>
            <div className="mb-40 text-base text-muted">
              <Trans message="View and update your account details, profile and more." />
            </div>
            {isLoading || !data ? (
              <ProgressCircle
                className="my-80"
                aria-label="Loading user.."
                isIndeterminate
              />
            ) : (
              <div className="flex items-start gap-24">
                <AccountSettingsSidenav items={sidenavItems} />
                <main className="flex-auto">
                  {panels ? panels(data.user) : null}
                  <BasicInfoPanel user={data.user} />
                  <SocialLoginPanel user={data.user} />
                  <ChangePasswordPanel />
                  <TwoFactorPanel user={data.user} />
                  <SessionsPanel />
                  <LocalizationPanel user={data.user} />
                  <AccessTokenPanel user={data.user} />
                  <DangerZonePanel />
                </main>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthRoute>
  );
}
