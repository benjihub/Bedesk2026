import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {CreateRolePayload} from '@common/admin/roles/requests/user-create-role';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {useForm} from 'react-hook-form';
import {Link, Outlet, useMatch} from 'react-router';
import {CrupdateResourceLayout} from '../../crupdate-resource-layout';
import {useUpdateRole} from '../requests/use-update-role';

const tabConfig = [
  {uri: '', label: {message: 'Settings'}},
  {uri: 'users', label: {message: 'Users'}},
];

export function Component() {
  const {roleId} = useRequiredParams(['roleId']);
  const query = useSuspenseQuery(commonAdminQueries.roles.get(roleId));
  const form = useForm<Partial<CreateRolePayload>>({
    defaultValues: {
      name: query.data.role.name,
      type: query.data.role.type,
      description: query.data.role.description,
      permissions: query.data.role.permissions,
    },
  });
  const updateRole = useUpdateRole();
  const match = useMatch('admin/roles/:roleId/edit/*');
  const activeTab = match?.pathname.endsWith('users') ? 1 : 0;

  return (
    <CrupdateResourceLayout
      isLoading={updateRole.isPending}
      form={form}
      onSubmit={values => {
        updateRole.mutate(values);
      }}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="/admin/roles">
            <Trans message="Roles" />
          </BreadcrumbItem>
          <BreadcrumbItem>{query.data.role.name}</BreadcrumbItem>
        </Breadcrumb>
      }
      tabs={
        <Tabs selectedTab={activeTab}>
          <TabList className="px-24">
            {tabConfig.map(tab => (
              <Tab
                key={tab.uri}
                elementType={Link}
                to={`/admin/roles/${roleId}/edit${
                  tab.uri ? `/${tab.uri}` : ''
                }`}
              >
                <Trans {...tab.label} />
              </Tab>
            ))}
          </TabList>
        </Tabs>
      }
    >
      <Outlet />
    </CrupdateResourceLayout>
  );
}
