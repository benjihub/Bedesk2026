import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {
  DefaultError,
  QueryKey,
  useQuery,
  UseQueryOptions,
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';

export function useDatatableQuery<
  T = unknown,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  D = unknown,
>(
  options: UseQueryOptions<
    PaginatedBackendResponse<T> & D,
    TError,
    PaginatedBackendResponse<T> & D,
    TQueryKey
  >,
) {
  const query = useQuery(options);

  return {
    ...query,
    items: query.data?.pagination.data ?? [],
    isEmpty:
      (query.isFetched ||
        query.isPlaceholderData ||
        options.enabled === false) &&
      !query.data?.pagination.data.length,
  };
}

export function useSuspenseDatatableQuery<
  T = unknown,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  D = unknown,
>(
  options: UseSuspenseQueryOptions<
    PaginatedBackendResponse<T> & D,
    TError,
    PaginatedBackendResponse<T> & D,
    TQueryKey
  >,
) {
  const query = useSuspenseQuery(options);

  return {
    ...query,
    items: query.data?.pagination.data ?? [],
    isEmpty: query.isFetched && !query.data.pagination.data.length,
  };
}
