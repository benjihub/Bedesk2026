import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {AuthRoute} from '@common/auth/guards/auth-route';
import {auth} from '@common/auth/use-auth';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {Navigate, redirect, RouteObject} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export const teamRoutes: RouteObject[] = [
  {
    path: 'team',
    element: <AuthRoute />,
    loader: () => {
      if (!auth.hasPermission('agents.update')) {
        return redirect('/404');
      }
      return null;
    },
    children: [
      {
        index: true,
        loader: () => redirect('members'),
        element: <Fragment />,
      },
      // agents
      {
        path: 'members',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () =>
          import('@app/dashboard/agents/agent-index-page/agents-index-page'),
        loader: async ({request}) =>
          await queryClient.ensureQueryData(
            helpdeskQueries.agents.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'invites',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () =>
          import('@app/dashboard/agents/invites/agent-invites-index-page'),
        loader: async ({request}) =>
          queryClient.ensureQueryData(
            helpdeskQueries.agentInvites.index(
              searchParamsFromUrl(request.url),
            ),
          ),
      },
      {
        path: 'members/:agentId',
        lazy: () =>
          import('@app/dashboard/agents/edit-agent-page/edit-agent-page'),
        loader: async ({params}) =>
          await queryClient.ensureQueryData(
            helpdeskQueries.agents.get(params.agentId!),
          ),
        children: [
          {
            index: true,
            element: <Navigate to="details" replace />,
          },
          {
            path: 'details',
            lazy: () =>
              import(
                '@app/dashboard/agents/edit-agent-page/tabs/agent-details-tab'
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
            path: 'conversations',
            lazy: () =>
              import(
                '@app/dashboard/agents/edit-agent-page/tabs/agent-conversations-tab'
              ),
            loader: async ({params}) =>
              await queryClient.ensureInfiniteQueryData(
                helpdeskQueries.conversations.agentConversationList(
                  params.agentId!,
                ),
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
              import(
                '@common/admin/users/update-user-page/update-user-api-tab'
              ),
          },
        ],
      },

      // groups
      {
        path: 'groups',
        loader: ({request}) => {
          if (!auth.hasPermission('admin.access')) {
            return redirect('/404');
          }
          return queryClient.ensureQueryData(
            helpdeskQueries.groups.index(searchParamsFromUrl(request.url)),
          );
        },
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () =>
          import('@app/dashboard/groups/groups-index-page/groups-index-page'),
      },
      {
        path: 'groups/new',
        lazy: () => import('@app/dashboard/groups/create-group-page'),
      },
      {
        path: 'groups/:groupId/edit',
        loader: ({params}) => {
          if (!auth.hasPermission('admin.access')) {
            return redirect('/404');
          }
          return queryClient.ensureQueryData(
            helpdeskQueries.groups.get(params.groupId!),
          );
        },
        lazy: () => import('@app/dashboard/groups/edit-group-page'),
        children: [
          {
            index: true,
            element: <Navigate to="details" replace />,
          },
          {
            path: 'details',
            lazy: () =>
              import('@app/dashboard/groups/tabs/group-details-tab'),
          },
          {
            path: 'promotions',
            lazy: () =>
              import('@app/dashboard/groups/tabs/group-promotions-tab'),
          },
          {
            path: 'settings',
            lazy: () => import('./groups/tabs/group-settings-tab'),
          },
          {
            path: 'ai-rules',
            lazy: () => import('./groups/tabs/group-ai-rules-tab'),
          },
        ],
      },
    ],
  },
];
