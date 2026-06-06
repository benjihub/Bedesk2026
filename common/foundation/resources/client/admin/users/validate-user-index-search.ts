import {DatatableSearchParams} from '@common/datatable/filters/utils/validate-datatable-search';
import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type UserIndexSearchParams = {
  roleId: string;
} & DatatableSearchParams;

export const validateUserIndexSearch = (
  search: Record<string, unknown>,
): UserIndexSearchParams => {
  return castObjectValuesToString({
    page: search.page || '1',
    perPage: search.perPage || '15',
    orderBy: search.orderBy || '',
    orderDir: search.orderDir || '',
    query: search.query || '',
    filters: search.filters || '',
    roleId: search.roleId || '',
    with: search.with || '',
    paginate: search.paginate || 'preferLengthAware',
  });
};
