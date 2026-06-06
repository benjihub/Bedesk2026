import {CrupdateGroupFormContent} from '@app/dashboard/groups/crupdate-group-form/crupdate-group-form-content';
import {
  CreateGroupPayload,
  useCreateGroup,
} from '@app/dashboard/groups/requests/use-create-group';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';

export function Component() {
  const form = useForm<CreateGroupPayload>({
    defaultValues: {
      assignment_mode: 'auto',
      users: [],
    },
  });
  const createGroup = useCreateGroup(form);

  return (
    <CrupdateResourceLayout
      form={form}
      onSubmit={values => {
        createGroup.mutate(values);
      }}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../groups">
            <Trans message="Groups" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="New" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={createGroup.isPending}
      submitButtonText={<Trans message="Create" />}
    >
      <CrupdateGroupFormContent />
    </CrupdateResourceLayout>
  );
}
