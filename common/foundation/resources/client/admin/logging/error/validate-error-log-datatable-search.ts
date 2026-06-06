import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type ErrorLogDatatableSearchParams = {
  page: string;
  perPage: string;
  orderBy: string;
  orderDir: string;
  query: string;
  file: string;
};

export const validateErrorLogDatatableSearch = (
  search: Record<string, unknown>,
): ErrorLogDatatableSearchParams => {
  return castObjectValuesToString({
    page: search.page || '1',
    perPage: search.perPage || '15',
    orderBy: search.orderBy || '',
    orderDir: search.orderDir || '',
    query: search.query || '',
    file: search.file || '',
  });
};
