import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const adminFileEntriesRoutes: Record<string, RouteObject> = {
  index: {
    path: 'files',
    shouldRevalidate: shouldRevalidateDatatableLoader,
    lazy: () => import('@common/admin/file-entry/file-entry-index-page'),
    loader: ({request}) => {
      const redirect = authGuard({permission: 'files.update'});
      if (redirect) return redirect;
      return queryClient.ensureQueryData(
        commonAdminQueries.fileEntries.index(searchParamsFromUrl(request.url)),
      );
    },
  },
};
