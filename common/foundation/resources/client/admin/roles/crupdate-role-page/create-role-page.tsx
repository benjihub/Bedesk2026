import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {useSearchParams} from 'react-router';
import {CrupdateResourceLayout} from '../../crupdate-resource-layout';
import {CreateRolePayload, useCreateRole} from '../requests/user-create-role';
import {Component as SettingsPanel} from './crupdate-role-settings-panel';

export function Component() {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') ?? 'users';
  const form = useForm<CreateRolePayload>({defaultValues: {type: defaultType}});
  const createRole = useCreateRole(form);
  const navigate = useNavigate();

  return (
    <CrupdateResourceLayout
      form={form}
      onSubmit={values => {
        createRole.mutate(values, {
          onSuccess: response => {
            navigate(`/admin/roles/${response.role.id}/edit`);
          },
        });
      }}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="/admin/roles">
            <Trans message="Roles" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="New" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={createRole.isPending}
    >
      <SettingsPanel />
    </CrupdateResourceLayout>
  );
}
