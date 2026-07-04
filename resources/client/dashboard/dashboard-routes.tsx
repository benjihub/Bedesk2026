import {aiAgentRoutes} from '@ai/ai-agent/ai-agent-routes';
import {cannedRepliesRoutes} from '@app/canned-replies/canned-replies-routes';
import {customersRoutes} from '@app/dashboard/contacts/customers-routes';
import {getConversationListLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {helpdeskReportRoutes} from '@app/dashboard/reports/helpdesk-reports-routes';
import {teamRoutes} from '@app/dashboard/team-routes';
import {viewsRoutes} from '@app/dashboard/views/views-routes';
import {hcManagerRoutes} from '@app/help-center/manager/hc-manager-routes';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {PageErrorMessage} from '@common/errors/page-error-message';
import {queryClient} from '@common/http/query-client';
import {notificationSubscriptionsQueryOptions} from '@common/notifications/subscriptions/requests/notification-subscriptions';
import {authGuard} from '@common/auth/guards/auth-route';
import {campaignsRoutes} from '@livechat/dashboard/campaigns/campaigns-routes';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {Navigate, Outlet, redirect, RouteObject} from 'react-router';

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    lazy: () =>
      import('@app/dashboard/dashboard-layout/helpdesk-dashboard-layout'),
    children: [
      ...hcManagerRoutes,
      ...helpdeskReportRoutes,
      {
        path: 'overview',
        lazy: () => import('@app/dashboard/overview/dashboard-overview-page'),
        loader: () =>
          queryClient.ensureQueryData(helpdeskQueries.dashboard.stats),
      },
      {
        path: 'notifications',
        lazy: () => import('@app/dashboard/agent-notification-settings-page'),
        loader: () =>
          queryClient.ensureQueryData(notificationSubscriptionsQueryOptions),
      },
      {
        path: 'billing',
        lazy: () => import('@app/dashboard/billing/billing-page'),
      },
      {
        path: 'livechat',
        handle: {customDashboardLayout: true},
        lazy: () => import('@livechat/admin/settings/livechat-settings'),
        loader: () => authGuard({permission: 'livechat.update'}),
      },
      {
        index: true,
        element: <Navigate to="conversations" />,
      },
      {
        path: 'conversations/new',
        handle: {customDashboardLayout: true},
        lazy: () =>
          import('@app/dashboard/conversations/new-conversation-page/new-conversation-page'),
        loader: async () =>
          Promise.allSettled([
            queryClient.ensureQueryData(
              helpdeskQueries.statuses.dropdownList('agent'),
            ),
            queryClient.ensureQueryData(
              helpdeskQueries.attributes.normalizedList({
                type: 'conversation',
                for: 'agent',
              }),
            ),
          ]),
      },
      {
        path: 'conversations/search',
        lazy: () =>
          import('@app/dashboard/conversations/conversations-search-page'),
        shouldRevalidate: shouldRevalidateDatatableLoader,
        loader: ({request}) => {
          const searchParams = searchParamsFromUrl(request.url);
          const promises: Promise<any>[] = [
            queryClient.ensureQueryData(
              helpdeskQueries.attributes.normalizedList({
                type: 'conversation',
                for: 'agent',
              }),
            ),
          ];

          // only load data if we have filters or search query in the url
          if (searchParams.filters || searchParams.query) {
            promises.push(
              queryClient.ensureQueryData(
                helpdeskQueries.conversations.search(searchParams),
              ),
            );
          }

          return Promise.allSettled(promises);
        },
      },
      {
        handle: {customDashboardLayout: true},
        loader: async ({request, params}) => {
          const url = new URL(request.url);
          const selectedLayout = getConversationListLayout();

          // fetch views and list of conversations for active view
          const data = await Promise.allSettled([
            queryClient.ensureQueryData(
              helpdeskQueries.conversations.inboxViews,
            ),
            queryClient.ensureQueryData(
              helpdeskQueries.conversations.index(
                Object.fromEntries(url.searchParams),
              ),
            ),
          ]);

          // if there's an error loading data, show error page
          if (data[0].status === 'rejected' || data[1].status === 'rejected') {
            return <PageErrorMessage />;
          }

          const firstConversation = data[1].value.pagination.data[0];
          let redirectUrl: URL | null = null;

          // default to "all" view
          if (!url.searchParams.has('viewId')) {
            url.searchParams.append('viewId', 'all');
            redirectUrl = url;
          }

          // if layout is set to chat, and we are on index route, redirect to first conversation
          // this will also override redirectUrl set above, while keeping added viewId in params
          if (
            selectedLayout === 'chat' &&
            !params.conversationId &&
            firstConversation
          ) {
            url.pathname = `/dashboard/conversations/${firstConversation.id}`;
            redirectUrl = url;
          }

          if (redirectUrl) {
            return redirect(redirectUrl.toString());
          }

          return data;
        },
        element: <Outlet />,
        children: [
          {
            path: 'conversations',
            shouldRevalidate: shouldRevalidateDatatableLoader,
            lazy: () =>
              import('@app/dashboard/conversations/conversations-table/conversations-table-page'),
            loader: () =>
              queryClient.ensureQueryData(
                helpdeskQueries.attributes.normalizedList({
                  type: 'conversation',
                  for: 'agent',
                }),
              ),
          },
          {
            path: 'conversations/:conversationId',
            lazy: () =>
              import('@app/dashboard/conversations/conversation-page/conversation-page'),
            loader: async ({params}) => {
              return Promise.allSettled([
                queryClient.ensureQueryData(
                  helpdeskQueries.statuses.dropdownList('agent'),
                ),
                queryClient.ensureQueryData(
                  helpdeskQueries.conversations.get(params.conversationId!),
                ),
                queryClient.ensureInfiniteQueryData(
                  helpdeskQueries.conversations.messages(
                    params.conversationId!,
                  ),
                ),
              ]);
            },
          },
        ],
      },

      ...customersRoutes,
      ...viewsRoutes,
      ...campaignsRoutes,
      ...teamRoutes,
      ...cannedRepliesRoutes(true),
      ...aiAgentRoutes,
    ],
  },
];
