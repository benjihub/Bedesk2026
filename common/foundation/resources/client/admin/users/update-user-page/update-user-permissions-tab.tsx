import {CrupdateResourceSection} from '@common/admin/crupdate-resource-layout';
import {UpdateUserPayload} from '@common/admin/users/requests/user-update-user';
import {UpdateUserForm} from '@common/admin/users/update-user-page/update-user-form';
import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {UserRoleSection} from '@common/admin/users/update-user-page/user-role-section';
import {FormPermissionSelector} from '@common/auth/ui/permission-selector';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';

export function Component() {
  const user = useOutletContext() as UpdateUserPageUser;
  const form = useForm<UpdateUserPayload>({
    defaultValues: {
      permissions: user.permissions,
      roles: user.roles,
    },
  });
  return (
    <UpdateUserForm form={form}>
      <UserRoleSection />
      <CrupdateResourceSection label={<Trans message="Permissions" />}>
        <FormPermissionSelector name="permissions" />
      </CrupdateResourceSection>
    </UpdateUserForm>
  );
}
