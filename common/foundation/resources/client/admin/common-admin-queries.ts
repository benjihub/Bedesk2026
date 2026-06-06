import {CustomPage} from '@common/admin/custom-pages/custom-page';
import {ErrorLogsPageData} from '@common/admin/logging/error/error-log-item';
import {validateErrorLogDatatableSearch} from '@common/admin/logging/error/validate-error-log-datatable-search';
import {OutgoingEmailLogItem} from '@common/admin/logging/outgoing-email/outgoing-email-log-item';
import {ScheduleLogItem} from '@common/admin/logging/schedule/schedule-log-item';
import {validateRolesDatatableSearch} from '@common/admin/roles/requests/validate-roles-datatable-search';
import {FetchAdminSettingsResponse} from '@common/admin/settings/requests/use-admin-settings';
import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {
  UserIndexSearchParams,
  validateUserIndexSearch,
} from '@common/admin/users/validate-user-index-search';
import {Permission} from '@common/auth/permission';
import {Role} from '@common/auth/role';
import {Product} from '@common/billing/product';
import {Subscription} from '@common/billing/subscription';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {get} from '@common/http/queries-file-helpers';
import {MenuItemCategory} from '@common/menus/menu-item-category';
import {Tag} from '@common/tags/tag';
import {FileEntry} from '@common/uploads/file-entry';
import {keepPreviousData, queryOptions} from '@tanstack/react-query';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {Localization} from '@ui/i18n/localization';
import {User} from '@ui/types/user';

export const commonAdminQueries = {
  users: {
    invalidateKey: ['users'],
    index: (search: Record<string, string> = {}) => {
      const params = validateUserIndexSearch(
        search,
      ) as UserIndexSearchParams & {with: string};
      params.with = 'subscriptions,bans,latestUserSession';
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['users', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<User>>('users', params, signal),
      });
    },
    get: (id: number | string) => {
      const params = {with: 'subscriptions,roles,permissions,bans'};
      return queryOptions({
        queryKey: ['users', `${id}`, params],
        queryFn: () => get<{user: UpdateUserPageUser}>(`users/${id}`, params),
      });
    },
  },

  roles: {
    invalidateKey: ['roles'],
    index: (search: Record<string, string> = {}) => {
      const params = validateRolesDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['roles', params],
        queryFn: () => get<PaginatedBackendResponse<Role>>('roles', params),
      });
    },
    get: (id: number | string) =>
      queryOptions({
        queryKey: ['roles', id],
        queryFn: () => get<{role: Role}>(`roles/${id}`),
      }),
  },

  permissions: {
    invalidateKey: ['roles'],
    index: () =>
      queryOptions({
        queryKey: ['roles', 'permissions'],
        queryFn: () => get<{permissions: Permission[]}>('permissions'),
      }),
  },

  tags: {
    invalidateKey: ['tags'],
    index: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['tags', params],
        queryFn: () => get<PaginatedBackendResponse<Tag>>('tags', params),
      });
    },
  },

  localizations: {
    invalidateKey: ['localizations'],
    index: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['localizations', params],
        queryFn: () =>
          get<PaginatedBackendResponse<Localization>>('localizations', params),
      });
    },
    get: (id: number | string) =>
      queryOptions({
        queryKey: ['localizations', `${id}`],
        queryFn: () => get<{localization: Localization}>(`localizations/${id}`),
      }),
  },

  fileEntries: {
    invalidateKey: ['file-entries'],
    index: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['file-entries', params],
        queryFn: () =>
          get<PaginatedBackendResponse<FileEntry>>('file-entries', params),
      });
    },
  },

  subscriptions: {
    invalidateKey: ['subscriptions'],
    index: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['subscriptions', params],
        queryFn: () =>
          get<PaginatedBackendResponse<Subscription>>(
            'billing/subscriptions?with=product',
            params,
          ),
      });
    },
  },
  products: {
    invalidateKey: ['products'],
    index: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['products', params],
        queryFn: () =>
          get<PaginatedBackendResponse<Product>>('billing/products', params),
      });
    },
    get: (id: number | string) =>
      queryOptions({
        queryKey: ['products', `${id}`],
        queryFn: () => get<{product: Product}>(`billing/products/${id}`),
      }),
  },

  customPages: {
    invalidateKey: ['custom-pages'],
    index: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      params.with = 'user';
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['custom-pages', params],
        queryFn: () =>
          get<PaginatedBackendResponse<CustomPage>>('custom-pages', params),
      });
    },
    get: (id: number | string) =>
      queryOptions({
        queryKey: ['custom-pages', id],
        queryFn: () =>
          get<BackendResponse & {page: CustomPage}>(`custom-pages/${id}`),
        initialData: () => {
          const data = getBootstrapData().loaders?.customPage;
          if (data?.page && (data.page.id == id || data.page.slug == id)) {
            return data;
          }
        },
      }),
  },

  settings: {
    invalidateKey: ['admin-settings'],
    index: queryOptions({
      queryKey: ['admin-settings'],
      staleTime: Infinity,
      queryFn: () => get<FetchAdminSettingsResponse>('settings'),
    }),
    seoTags: () =>
      queryOptions<{
        tags: Record<
          string,
          {
            custom: string | null;
            original: string;
          }
        >;
      }>({
        queryKey: ['admin-settings', 'seo-tags'],
        staleTime: Infinity,
        queryFn: () => get(`settings/seo-tags`),
      }),
    menuEditorConfig: () =>
      queryOptions<{
        config: {
          positions: {
            name: string;
            label: string;
            route: string;
          }[];
          available_routes: string[];
        };
        categories: MenuItemCategory[];
      }>({
        queryKey: ['admin-settings', 'menu-editor-config'],
        staleTime: Infinity,
        queryFn: () => get(`settings/menu-editor-config`),
      }),
  },

  logs: {
    invalidateKey: ['logs'],
    cron: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['logs', 'cron', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<ScheduleLogItem>>(
            'logs/schedule',
            params,
            signal,
          ),
      });
    },
    error: (search: Record<string, string> = {}) => {
      const params = validateErrorLogDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['logs', 'error', params],
        queryFn: ({signal}) =>
          get<ErrorLogsPageData>('logs/error', params, signal),
      });
    },
    email: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['logs', 'email', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<OutgoingEmailLogItem>>(
            'logs/outgoing-email',
            params,
            signal,
          ),
      });
    },
  },
};
