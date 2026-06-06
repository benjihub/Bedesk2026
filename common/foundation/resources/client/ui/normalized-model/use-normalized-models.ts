import {
  keepPreviousData,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import {NormalizedModel} from '@ui/types/normalized-model';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {apiClient, queryClient} from '../../http/query-client';

interface Response extends BackendResponse {
  results: NormalizedModel[];
}

interface Params {
  query?: string;
  perPage?: number;
  with?: string;
  modelIds?: string;
}

export function useNormalizedModels(
  endpoint: string,
  queryParams?: Params,
  queryOptions?: Omit<
    UseQueryOptions<Response, unknown, Response, any[]>,
    'queryKey' | 'queryFn'
  > | null,
) {
  const {queryKey, params} = buildQueryKeyAndParams(endpoint, queryParams);
  return useQuery({
    queryKey,
    queryFn: () => fetchModels(endpoint, params),
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
}

export function prefetchNormalizedModels(
  endpoint: string,
  queryParams?: Params,
) {
  const {queryKey, params} = buildQueryKeyAndParams(endpoint, queryParams);
  return queryClient.ensureQueryData({
    queryKey,
    queryFn: () => fetchModels(endpoint, params),
  });
}

async function fetchModels(endpoint: string, params?: Params) {
  return apiClient.get<Response>(endpoint, {params}).then(r => {
    if ('results' in r.data) {
      return r.data;
    } else {
      const results = Object.values(r.data).find(v => Array.isArray(v));
      return {results} as Response;
    }
  });
}

function buildQueryKeyAndParams(endpoint: string, queryParams?: Params) {
  // normalize query params, so different query keys are not generated
  if (queryParams && queryParams.query === '') {
    delete queryParams.query;
  }

  const endpointParts = endpoint.split('/');
  // last part will be resource name most like (eg. 'normalized-models/users')
  // we will want to put 'users' as first part of query key so that doing
  // queryClient.invalidate(['users']) will invalidate normalzied models as well
  const resourceName = endpointParts.pop() as string;

  const queryKey: (string | Params)[] = [resourceName, ...endpointParts];

  if (queryParams && Object.keys(queryParams).length) {
    queryKey.push(queryParams);
  }

  return {queryKey, params: queryParams};
}
