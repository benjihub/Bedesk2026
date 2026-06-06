import {adminQueries} from '@app/admin/admin-queries';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const adminCustomPagesRoutes: Record<string, RouteObject> = {
  index: {
    path: 'custom-pages',
    lazy: () => import('@common/admin/custom-pages/custom-page-datable'),
    shouldRevalidate: shouldRevalidateDatatableLoader,
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'custom_pages.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        commonAdminQueries.customPages.index(searchParamsFromUrl(request.url)),
      );
    },
  },
  create: {
    path: 'custom-pages/new',
    loader: () => authGuard({permission: 'custom_pages.update'}),
    handle: {customDashboardLayout: true},
    lazy: () => import('@common/admin/custom-pages/create-custom-page'),
  },
  update: {
    path: 'custom-pages/:pageId/edit',
    lazy: () => import('@common/admin/custom-pages/edit-custom-page'),
    handle: {customDashboardLayout: true},
    loader: async ({params}) => {
      const redirect = authGuard({permission: 'custom_pages.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        adminQueries.customPages.get(params.pageId!),
      );
    },
  },
};
