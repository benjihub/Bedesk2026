import {adminQueries} from '@app/admin/admin-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const adminTagsRoutes: Record<string, RouteObject> = {
  index: {
    path: 'tags',
    lazy: () => import('@common/admin/tags/tag-index-page'),
    shouldRevalidate: shouldRevalidateDatatableLoader,
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'tags.update'});
      if (redirect) return redirect;
      return await queryClient.ensureQueryData(
        adminQueries.tags.index(searchParamsFromUrl(request.url)),
      );
    },
  },
};
