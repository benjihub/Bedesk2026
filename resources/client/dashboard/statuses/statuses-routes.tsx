import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const statusesRoutes: RouteObject[] = [
  {
    path: 'statuses',
    children: [
      {
        index: true,
        lazy: () =>
          import('@app/dashboard/statuses/datatable/statuses-datatable-page'),
        loader: ({request}) => {
          queryClient.ensureQueryData(
            helpdeskQueries.statuses.index(searchParamsFromUrl(request.url)),
          );
        },
      },
    ],
  },
];
