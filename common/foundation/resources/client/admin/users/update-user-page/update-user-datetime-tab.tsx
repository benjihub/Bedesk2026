import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {LocalizationPanel} from '@common/auth/ui/account-settings/localization-panel';
import {useOutletContext} from 'react-router';

export function Component() {
  const user = useOutletContext() as UpdateUserPageUser;
  return <LocalizationPanel user={user} />;
}
