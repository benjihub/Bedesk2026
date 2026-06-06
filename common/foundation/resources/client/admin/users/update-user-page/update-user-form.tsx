import {DirtyFormSaveDrawer} from '@common/admin/crupdate-resource-layout';
import {
  UpdateUserPayload,
  useUpdateUser,
} from '@common/admin/users/requests/user-update-user';
import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {Form} from '@ui/forms/form';
import {ReactNode} from 'react';
import {UseFormReturn} from 'react-hook-form';
import {useOutletContext} from 'react-router';

interface Props {
  form: UseFormReturn<Partial<UpdateUserPayload>>;
  children: ReactNode;
}
export function UpdateUserForm({form, children}: Props) {
  const user = useOutletContext() as UpdateUserPageUser;
  const updateUser = useUpdateUser(user.id, form);
  return (
    <Form
      onSubmit={values => {
        updateUser.mutate(values);
      }}
      onBeforeSubmit={() => form.clearErrors()}
      form={form}
    >
      {children}
      <DirtyFormSaveDrawer isLoading={updateUser.isPending} />
    </Form>
  );
}
