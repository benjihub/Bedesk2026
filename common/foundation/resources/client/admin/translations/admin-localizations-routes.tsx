import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {RouteObject} from 'react-router';

export const adminLocalizationsRoutes: Record<string, RouteObject> = {
  index: {
    path: 'localizations',
    shouldRevalidate: shouldRevalidateDatatableLoader,
    lazy: () => import('@common/admin/translations/localization-index'),
    loader: () => {
      const redirect = authGuard({permission: 'localizations.update'});
      if (redirect) return redirect;
      return queryClient.ensureQueryData(
        commonAdminQueries.localizations.index(),
      );
    },
  },
  updateLines: {
    path: 'localizations/:localeId/translate',
    lazy: () =>
      import('@common/admin/translations/translation-management-page'),
    loader: ({params}) => {
      const redirect = authGuard({permission: 'localizations.update'});
      if (redirect) return redirect;
      return queryClient.ensureQueryData(
        commonAdminQueries.localizations.get(params.localeId!),
      );
    },
  },
};
