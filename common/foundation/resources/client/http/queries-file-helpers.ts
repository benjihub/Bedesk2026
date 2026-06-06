import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {apiClient} from '@common/http/query-client';
import {keepPreviousData, queryOptions} from '@tanstack/react-query';

export const get = async <T>(
  url: string,
  params?: Record<string, string | number | null | boolean>,
  signal?: AbortSignal,
): Promise<T> => {
  if (params?.query) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return (await apiClient.get(url, {params, signal})).data;
};

export const paginate = <
  R,
  S extends Record<string, string> = Record<string, string>,
>(
  uri: string,
  search: S = {} as S,
) => {
  const params = validateDatatableSearch(search);
  return queryOptions({
    placeholderData: keepPreviousData,
    queryKey: [uri, params],
    queryFn: () => get<PaginatedBackendResponse<R>>(uri, params),
  });
};
