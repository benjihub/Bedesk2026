import {prefetchConversationsTableFilterValues} from '@app/dashboard/conversations/conversations-table/conversations-table-filters';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {AuthRoute} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const viewsRoutes: RouteObject[] = [
  {
    path: 'views',
    element: <AuthRoute permission="views.update" />,
    children: [
      {
        index: true,
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('@app/dashboard/views/views-datatable-page'),
        loader: ({request}) =>
          queryClient.ensureQueryData(
            helpdeskQueries.views.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'new',
        lazy: () => import('@app/dashboard/views/create-view-page'),
        loader: () => {
          prefetchConversationsTableFilterValues();
          return queryClient.ensureQueryData(
            helpdeskQueries.attributes.normalizedList({
              type: 'conversation',
              for: 'agent',
            }),
          );
        },
      },
      {
        path: ':viewId/update',
        lazy: () => import('@app/dashboard/views/edit-view-page'),
        loader: ({params}) => {
          prefetchConversationsTableFilterValues();
          return Promise.allSettled([
            queryClient.ensureQueryData(
              helpdeskQueries.attributes.normalizedList({
                type: 'conversation',
                for: 'agent',
              }),
            ),
            queryClient.ensureQueryData(
              helpdeskQueries.views.get(params.viewId!),
            ),
          ]);
        },
      },
    ],
  },
];
