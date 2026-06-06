import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {AccessTokenPanel} from '@common/auth/ui/account-settings/access-token-panel/access-token-panel';
import {useOutletContext} from 'react-router';

export function Component() {
  const user = useOutletContext() as UpdateUserPageUser;
  return <AccessTokenPanel user={user} />;
}
