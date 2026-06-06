import {TriggerConfig} from '@app/triggers/requests/trigger-config';
import {Trigger} from '@app/triggers/trigger';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {get} from '@common/http/queries-file-helpers';
import {keepPreviousData, queryOptions} from '@tanstack/react-query';

export const adminQueries = {
  ...commonAdminQueries,
  triggers: {
    invalidateKey: ['triggers'],
    index: (search: Record<string, string> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['triggers', params],
        queryFn: () =>
          get<PaginatedBackendResponse<Trigger>>('triggers', params),
      });
    },
    get: (id: number | string) =>
      queryOptions({
        queryKey: ['triggers', id],
        queryFn: () => get<{trigger: Trigger}>(`triggers/${id}`),
      }),
    config: () =>
      queryOptions({
        queryKey: ['triggers', 'config'],
        queryFn: () => get<TriggerConfig>('triggers/config'),
      }),
  },
};
