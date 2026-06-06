import {Channel} from '@common/channels/channel';
import {useParams, useSearchParams} from 'react-router';
import {useBackendFilterUrlParams} from '@common/datatable/filters/backend-filter-url-params';
import {BackendFiltersUrlKey} from '@common/datatable/filters/backend-filters-url-key';

export function useChannelQueryParams(
  channel?: Channel,
  userParams?: Record<string, string | null> | null,
): Record<string, string | number | null> {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const {encodedFilters} = useBackendFilterUrlParams();

  const queryParams = {
    ...userParams,
    restriction: params.restriction || '',
    order: searchParams.get('order'),
    [BackendFiltersUrlKey]: encodedFilters,
  };

  // always set default channel order to keep query key stable
  if (!queryParams.order && channel) {
    queryParams.order = channel.config.contentOrder || 'popularity:desc';
  }

  return queryParams;
}
