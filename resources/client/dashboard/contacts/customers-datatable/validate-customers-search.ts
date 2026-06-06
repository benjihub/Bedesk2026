import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type CustomersSearchParams = {
  page: string;
  perPage: string;
  orderBy: string;
  orderDir: string;
  query: string;
  filters: string;
  type: string;
};

export const validateCustomersSearch = (
  search: Record<string, unknown>,
): CustomersSearchParams => {
  return castObjectValuesToString({
    page: search.page || '1',
    perPage: search.perPage || '15',
    orderBy: search.orderBy || '',
    orderDir: search.orderDir || '',
    query: search.query || '',
    filters: search.filters || '',
    type: search.type || '',
  });
};
