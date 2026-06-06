import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {redirect, RouteObject} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export const adminUsersRoutes: Record<string, RouteObject> = {
  index: {
    path: 'users',
    lazy: () => import('@common/admin/users/user-datatable'),
    shouldRevalidate: shouldRevalidateDatatableLoader,
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'users.update'});
      if (redirect) return redirect;
      return queryClient.ensureQueryData(
        commonAdminQueries.users.index(searchParamsFromUrl(request.url)),
      );
    },
  },
  update: {
    path: 'users/:userId',
    lazy: () => import('@common/admin/users/update-user-page/update-user-page'),
    loader: async ({params}) => {
      const redirect = authGuard({permission: 'users.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        commonAdminQueries.users.get(params.userId!),
      );
    },
    children: [
      {
        index: true,
        loader: () => redirect('details'),
        element: <Fragment />,
      },
      {
        path: 'details',
        lazy: () =>
          import(
            '@common/admin/users/update-user-page/update-user-details-tab'
          ),
      },
      {
        path: 'permissions',
        lazy: () =>
          import(
            '@common/admin/users/update-user-page/update-user-permissions-tab'
          ),
      },
      {
        path: 'security',
        lazy: () =>
          import(
            '@common/admin/users/update-user-page/update-user-security-tab'
          ),
      },
      {
        path: 'date',
        lazy: () =>
          import(
            '@common/admin/users/update-user-page/update-user-datetime-tab'
          ),
      },
      {
        path: 'api',
        lazy: () =>
          import('@common/admin/users/update-user-page/update-user-api-tab'),
      },
    ],
  },
};
