import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {AuthRoute} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const campaignsRoutes: RouteObject[] = [
  {
    path: 'campaigns',
    element: <AuthRoute permission="campaigns.update" />,
    children: [
      {
        index: true,
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () =>
          import(
            '@livechat/dashboard/campaigns/campaign-index-page/campaign-index-page'
          ),
        loader: async ({request}) =>
          await queryClient.ensureQueryData(
            helpdeskQueries.campaigns.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'templates',
        lazy: () =>
          import(
            '@livechat/dashboard/campaigns/templates/campaign-templates-page'
          ),
        loader: () =>
          queryClient.ensureQueryData(helpdeskQueries.campaigns.templates),
      },
      {
        path: ':campaignId',
        lazy: () =>
          import('@livechat/dashboard/campaigns/campaign-report-page'),
      },
      {
        path: ':campaignId/edit',
        lazy: () =>
          import('@livechat/dashboard/campaigns/update-campaign-page'),
        loader: ({params}) =>
          Promise.allSettled([
            helpdeskQueries.campaigns.get(params.campaignId!),
            helpdeskQueries.attributes.normalizedList({
              for: 'agent',
              type: 'user',
            }),
          ]),
      },
    ],
  },
];
