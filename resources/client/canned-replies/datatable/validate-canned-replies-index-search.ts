import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type CannedRepliesIndexSearchParams = {
  page: string;
  perPage: string;
  orderBy: string;
  orderDir: string;
  query: string;
  filters: string;
  forCurrentUser: string;
};

export const validateCannedRepliesIndexSearch = (
  search: Record<string, unknown>,
): CannedRepliesIndexSearchParams => {
  return castObjectValuesToString({
    page: search.page || '1',
    perPage: search.perPage || '30',
    orderBy: search.orderBy || '',
    orderDir: search.orderDir || '',
    query: search.query || '',
    filters: search.filters || '',
    forCurrentUser: search.forCurrentUser || '',
  });
};
