import {aiAgentRoutes} from '@ai/ai-agent/ai-agent-routes';
import {adminQueries} from '@app/admin/admin-queries';
import {cannedRepliesRoutes} from '@app/canned-replies/canned-replies-routes';
import {customersRoutes} from '@app/dashboard/contacts/customers-routes';
import {helpdeskReportRoutes} from '@app/dashboard/reports/helpdesk-reports-routes';
import {statusesRoutes} from '@app/dashboard/statuses/statuses-routes';
import {teamRoutes} from '@app/dashboard/team-routes';
import {viewsRoutes} from '@app/dashboard/views/views-routes';
import {hcManagerRoutes} from '@app/help-center/manager/hc-manager-routes';
import {adminCustomPagesRoutes} from '@common/admin/custom-pages/admin-custom-pages-routes';
import {adminFileEntriesRoutes} from '@common/admin/file-entry/admin-file-entries-routes';
import {adminLogsRoutes} from '@common/admin/logging/admin-logs-routes';
import {adminRolesRoutes} from '@common/admin/roles/admin-roles-routes';
import {commonAdminSettingsRoutes} from '@common/admin/settings/common-admin-settings-routes';
import {adminTagsRoutes} from '@common/admin/tags/admin-tags-routes';
import {adminLocalizationsRoutes} from '@common/admin/translations/admin-localizations-routes';
import {authGuard} from '@common/auth/guards/auth-route';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {campaignsRoutes} from '@livechat/dashboard/campaigns/campaigns-routes';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {redirect, RouteObject} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    loader: () => authGuard({permission: 'admin.access'}),
    lazy: () => import('@common/admin/admin-layout'),
    children: [
      {
        index: true,
        loader: () => redirect('settings'),
        element: <Fragment />,
      },
      ...helpdeskReportRoutes,
      ...teamRoutes,
      ...customersRoutes,
      ...campaignsRoutes,
      ...viewsRoutes,
      ...statusesRoutes,
      ...hcManagerRoutes,
      ...cannedRepliesRoutes(false),
      ...aiAgentRoutes,

      ...Object.values(adminRolesRoutes),
      ...Object.values(adminCustomPagesRoutes),
      ...Object.values(adminTagsRoutes),
      ...Object.values(adminLocalizationsRoutes),
      ...Object.values(adminFileEntriesRoutes),
      ...Object.values(adminLogsRoutes),

      {
        path: 'billing',
        lazy: () => import('@app/admin/billing/admin-billing-page'),
      },

      commonAdminSettingsRoutes(
        [
          {
            path: 'tickets',
            lazy: () => import('@app/admin/settings/tickets-settings'),
          },
          {
            path: 'search',
            lazy: () =>
              import('@common/admin/settings/pages/search-settings/search-settings'),
          },
          {
            path: 'hc',
            lazy: () => import('@app/admin/settings/hc/hc-settings'),
          },
          {
            path: 'email/incoming',
            lazy: () =>
              import('@common/admin/settings/pages/email-settings/incoming-email/incoming-email-settings'),
          },
          {
            path: 'livechat',
            lazy: () => import('@livechat/admin/settings/livechat-settings'),
          },
          {
            path: 'ai',
            lazy: () => import('@ai/admin/settings/ai-settings-page'),
          },
        ],
        {
          captcha: {
            lazy: () => import('@app/admin/settings/captcha-settings'),
          },
          system: {
            lazy: () =>
              import('@common/admin/settings/pages/system-settings/system-settings'),
          },
        },
      ),

      // attributes
      {
        path: 'attributes',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () =>
          import('@app/attributes/datatable/attributes-datatable-page'),
      },
      {
        path: 'attributes/new',
        lazy: () => import('@app/attributes/crupdate/create-attribute-page'),
      },
      {
        path: 'attributes/:id/edit',
        lazy: () => import('@app/attributes/crupdate/update-attribute-page'),
      },

      // triggers
      {
        path: 'triggers',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('@app/triggers/triggers-datatable-page'),
        loader: async ({request}) => {
          const redirect = authGuard({permission: 'triggers.update'});
          if (redirect) return redirect;
          return await queryClient.ensureQueryData(
            adminQueries.triggers.index(searchParamsFromUrl(request.url)),
          );
        },
      },
      {
        path: 'triggers/new',
        lazy: () => import('@app/triggers/create-trigger-page'),
        loader: async () => {
          const redirect = authGuard({permission: 'triggers.update'});
          if (redirect) return redirect;
          return await queryClient.ensureQueryData(
            adminQueries.triggers.config(),
          );
        },
      },
      {
        path: 'triggers/:triggerId/edit',
        lazy: () => import('@app/triggers/update-trigger-page'),
        loader: async ({params}) => {
          const redirect = authGuard({permission: 'triggers.update'});
          if (redirect) return redirect;
          return await Promise.allSettled([
            queryClient.ensureQueryData(
              adminQueries.triggers.get(params.triggerId!),
            ),
            queryClient.ensureQueryData(adminQueries.triggers.config()),
          ]);
        },
      },
    ],
  },
];
