import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type DatatableSearchParams = {
  page: string;
  perPage: string;
  orderBy: string;
  orderDir: string;
  query: string;
  filters: string;
  with: string;
  paginate: string;
};

export const validateDatatableSearch = (
  search: Record<string, unknown>,
): DatatableSearchParams => {
  return castObjectValuesToString({
    page: search.page || '1',
    perPage: search.perPage || '15',
    orderBy: search.orderBy || '',
    orderDir: search.orderDir || '',
    query: search.query || '',
    filters: search.filters || '',
    with: search.with || '',
    paginate: search.paginate || 'preferLengthAware',
  });
};

export const validateDatatableSearchWithSimplePagination = (
  search: Record<string, unknown>,
): DatatableSearchParams => {
  const validated = validateDatatableSearch(search);
  validated.paginate = 'simple';
  return validated;
};
