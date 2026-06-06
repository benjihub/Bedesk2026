import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {CrupdateResourceHeader} from '@common/admin/crupdate-resource-layout';
import {UpdateUserPageActions} from '@common/admin/users/update-user-page/update-user-page-actions';
import {UpdateUserPageHeader} from '@common/admin/users/update-user-page/update-user-page-header';
import {
  updateUserPageTabs,
  UpdateUserPageTabs,
} from '@common/admin/users/update-user-page/update-user-page-tabs';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';

export function Component() {
  const {userId} = useRequiredParams(['userId']);
  const query = useSuspenseQuery(commonAdminQueries.users.get(userId));
  const user = query.data.user;

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Edit user" />
      </StaticPageTitle>
      <CrupdateResourceHeader
        endActions={<UpdateUserPageActions user={user} />}
      >
        <Breadcrumb size="xl">
          <BreadcrumbItem to=".." relative="path">
            <Trans message="Users" />
          </BreadcrumbItem>
          <BreadcrumbItem>{user.name}</BreadcrumbItem>
        </Breadcrumb>
      </CrupdateResourceHeader>
      <UpdateUserPageHeader user={user} />
      <UpdateUserPageTabs tabs={updateUserPageTabs} user={user} />
    </Fragment>
  );
}
