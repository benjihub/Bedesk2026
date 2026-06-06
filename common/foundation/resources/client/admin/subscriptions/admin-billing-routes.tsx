import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const adminBillingRoutes: Record<string, RouteObject> = {
  indexSubscriptions: {
    path: 'subscriptions',
    shouldRevalidate: shouldRevalidateDatatableLoader,
    lazy: () => import('@common/admin/subscriptions/subscriptions-index-page'),
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'subscriptions.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        commonAdminQueries.subscriptions.index(
          searchParamsFromUrl(request.url),
        ),
      );
    },
  },
  indexPlans: {
    path: 'plans',
    lazy: () => import('@common/admin/plans/plans-index-page'),
    shouldRevalidate: shouldRevalidateDatatableLoader,
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'plans.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        commonAdminQueries.products.index(searchParamsFromUrl(request.url)),
      );
    },
  },
  createPlan: {
    path: 'plans/new',
    loader: () => authGuard({permission: 'plans.update'}),
    lazy: () =>
      import('@common/admin/plans/crupdate-plan-page/create-plan-page'),
  },
  updatePlan: {
    path: 'plans/:productId/edit',
    lazy: () => import('@common/admin/plans/crupdate-plan-page/edit-plan-page'),
    loader: async ({params}) => {
      const redirect = authGuard({permission: 'plans.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        commonAdminQueries.products.get(params.productId!),
      );
    },
  },
};
