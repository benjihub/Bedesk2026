import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useRef } from 'react';
import { PaginatedBackendResponse } from '../../http/backend-response/pagination-response';
import { apiClient } from '../../http/query-client';

export interface GetDatatableDataParams {
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  filters?: string | null;
  query?: string;
  with?: string;
  perPage?: number | string | null;
  page?: number | string | null;
  paginate?: 'simple' | 'lengthAware' | 'preferLengthAware' | 'cursor';
  [key: string]: string | number | boolean | undefined | null;
}

export const DatatableDataQueryKey = (
  endpoint: string,
  params?: GetDatatableDataParams | Record<string, string | number | boolean>,
  baseQueryKey?: string[],
) => {
  // split endpoint by slash, so we can clear cache from the root later,
  // for example, 'link-group' will clear 'link-group/1/links' endpoint
  const key: (string | GetDatatableDataParams)[] = baseQueryKey
    ? [...baseQueryKey]
    : endpoint.split('/');
  if (params) {
    key.push(params);
  }
  return key;
};

export function useDatatableData<T = object>(
  endpoint: string,
  params: GetDatatableDataParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedBackendResponse<T>,
      unknown,
      PaginatedBackendResponse<T>,
      any[]
    >,
    'queryKey' | 'queryFn'
  > & {baseQueryKey?: string[]},
  onLoad?: (data: PaginatedBackendResponse<T>) => void,
) {
  if (!params.paginate) {
    params.paginate = 'preferLengthAware';
  }
  // having queryKey in option will cause unnecessary re-fetching
  const optionsQueryKey = options?.baseQueryKey;
  delete options?.baseQueryKey;
  const previousData = useRef<PaginatedBackendResponse<T> | undefined>(undefined);
  const query = useQuery({
    ...options,
    queryKey: DatatableDataQueryKey(endpoint, params, optionsQueryKey),
    queryFn: ({signal}) => paginate<T>(endpoint, params, onLoad, signal),
    // keepPreviousData ignores hits to cache, so it returns previous
    // data from most recent fetch and not most recently show data
    placeholderData: options?.enabled ? () => previousData.current : undefined,
  });
  previousData.current = query.data;
  return query;
}

async function paginate<T>(
  endpoint: string,
  params: GetDatatableDataParams,
  onLoad?: (data: PaginatedBackendResponse<T>) => void,
  signal?: AbortSignal,
): Promise<PaginatedBackendResponse<T>> {
  if (params.query) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  const response = await apiClient
    .get(endpoint, {params, signal: params.query ? signal : undefined})
    .then(response => response.data);
  onLoad?.(response);
  return response;
}
