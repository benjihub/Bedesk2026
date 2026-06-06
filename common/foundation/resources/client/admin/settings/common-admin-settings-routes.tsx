import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {auth} from '@common/auth/use-auth';
import {queryClient} from '@common/http/query-client';
import {valueListsQueryOptions} from '@common/http/value-lists';
import {redirect, RouteObject} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

interface Overrides {
  general?: Partial<RouteObject>;
  captcha?: Partial<RouteObject>;
  system?: Partial<RouteObject>;
  uploading?: Partial<RouteObject>;
}

export const commonAdminSettingsRoutes = (
  appRoutes: RouteObject[],
  overrides?: Overrides,
): RouteObject => {
  return {
    path: 'settings',
    handle: {customDashboardLayout: true},
    loader: () => {
      const redirectResponse = authGuard();
      if (redirectResponse) return redirectResponse;
      const isOwner =
        auth.getPermission('superAdmin') != null ||
        auth.getPermission('admin') != null;
      if (!isOwner) return redirect('/404');
      return queryClient.ensureQueryData(commonAdminQueries.settings.index);
    },
    lazy: () => import('@common/admin/settings/admin-settings-page'),
    children: [
      {
        index: true,
        loader: () => redirect('general'),
        element: <Fragment />,
      },
      ...appRoutes,
      {
        path: 'general',
        lazy: () => import('@common/admin/settings/pages/general-settings'),
        ...overrides?.general,
      },
      {
        path: 'captcha',
        lazy: () =>
          import('@common/admin/settings/pages/base-captcha-settings'),
        ...overrides?.captcha,
      },
      {
        path: 'themes',
        lazy: () =>
          import(
            '@common/admin/settings/pages/themes-settings/themes-settings-page'
          ),
      },
      {
        path: 'menus',
        lazy: () =>
          import('@common/admin/settings/pages/menu-settings/menu-settings'),
        loader: () =>
          queryClient.ensureQueryData(
            commonAdminQueries.settings.menuEditorConfig(),
          ),
      },
      {
        path: 'subscriptions',
        lazy: () =>
          import('@common/admin/settings/pages/subscription-settings'),
      },
      {
        path: 'localization',
        lazy: () =>
          import('@common/admin/settings/pages/localization-settings'),
        loader: async () =>
          queryClient.ensureQueryData(
            valueListsQueryOptions(['timezones', 'localizations']),
          ),
      },
      {
        path: 'authentication',
        lazy: () =>
          import('@common/admin/settings/pages/authentication-settings'),
      },
      {
        path: 'uploading',
        lazy: () =>
          import(
            '@common/admin/settings/pages/uploading-settings/uploading-settings'
          ),
        ...overrides?.uploading,
      },
      {
        path: 'email',
        loader: () => redirect('/admin/settings/email/outgoing'),
        element: <Fragment />,
      },
      {
        path: 'email/outgoing',
        lazy: () =>
          import(
            '@common/admin/settings/pages/email-settings/outgoing-email/outgoing-email-settings'
          ),
      },
      {
        path: 'custom-code',
        lazy: () => import('@common/admin/settings/pages/custom-code-settings'),
      },
      {
        path: 'seo',
        lazy: () => import('@common/admin/settings/pages/seo-settings'),
        loader: () =>
          queryClient.ensureQueryData(commonAdminQueries.settings.seoTags()),
      },
      {
        path: 'system',
        lazy: () =>
          import(
            '@common/admin/settings/pages/system-settings/system-settings'
          ),
        ...overrides?.system,
      },
      {
        path: 'analytics',
        lazy: () => import('@common/admin/settings/pages/reports-settings'),
      },
      {
        path: 'gdpr',
        lazy: () => import('@common/admin/settings/pages/gdpr-settings'),
        loader: async () =>
          queryClient.ensureQueryData(
            valueListsQueryOptions(['menuItemCategories']),
          ),
      },
    ],
  };
};
