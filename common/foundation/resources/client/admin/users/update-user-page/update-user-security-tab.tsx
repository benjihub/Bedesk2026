import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {ChangePasswordPanel} from '@common/auth/ui/account-settings/change-password-panel/change-password-panel';
import {SessionsPanel} from '@common/auth/ui/account-settings/sessions-panel/sessions-panel';
import {SocialLoginPanel} from '@common/auth/ui/account-settings/social-login-panel';
import {TwoFactorPanel} from '@common/auth/ui/account-settings/two-factor-panel';
import {useOutletContext} from 'react-router';

export function Component() {
  const user = useOutletContext() as UpdateUserPageUser;
  return (
    <div>
      <ChangePasswordPanel />
      <TwoFactorPanel user={user} />
      <SocialLoginPanel user={user} />
      <SessionsPanel />
    </div>
  );
}
