import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {validateUserIndexSearch} from '@common/admin/users/validate-user-index-search';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const adminRolesRoutes: Record<string, RouteObject> = {
  index: {
    path: 'roles',
    lazy: () => import('@common/admin/roles/roles-index-page'),
    shouldRevalidate: shouldRevalidateDatatableLoader,
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'roles.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        commonAdminQueries.roles.index(searchParamsFromUrl(request.url)),
      );
    },
  },
  create: {
    path: 'roles/new',
    lazy: () =>
      import('@common/admin/roles/crupdate-role-page/create-role-page'),
    loader: () => {
      const redirect = authGuard({permission: 'roles.update'});
      if (redirect) return redirect;
      return queryClient.ensureQueryData(
        commonAdminQueries.permissions.index(),
      );
    },
  },
  update: {
    path: 'roles/:roleId/edit',
    loader: async ({params}) => {
      const redirect = authGuard({permission: 'roles.update'});
      if (redirect) return redirect;
      return await Promise.allSettled([
        queryClient.ensureQueryData(
          commonAdminQueries.roles.get(params.roleId!),
        ),
        queryClient.ensureQueryData(commonAdminQueries.permissions.index()),
      ]);
    },
    lazy: () => import('@common/admin/roles/crupdate-role-page/edit-role-page'),
    children: [
      {
        index: true,
        lazy: () =>
          import(
            '@common/admin/roles/crupdate-role-page/crupdate-role-settings-panel'
          ),
      },
      {
        path: 'users',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        loader: ({params, request}) =>
          queryClient.ensureQueryData(
            commonAdminQueries.users.index({
              ...validateUserIndexSearch(searchParamsFromUrl(request.url)),
              roleId: `${params.roleId}`,
            }),
          ),
        lazy: () =>
          import(
            '@common/admin/roles/crupdate-role-page/edit-role-page-users-panel'
          ),
      },
    ],
  },
};
