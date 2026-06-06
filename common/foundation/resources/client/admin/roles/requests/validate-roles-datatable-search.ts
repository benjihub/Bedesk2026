import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type RolesDatatableSearchParams = {
  page: string;
  perPage: string;
  orderBy: string;
  orderDir: string;
  query: string;
  type: string;
};

export const validateRolesDatatableSearch = (
  search: Record<string, unknown>,
): RolesDatatableSearchParams => {
  return castObjectValuesToString({
    page: search.page || '1',
    perPage: search.perPage || '15',
    orderBy: search.orderBy || '',
    orderDir: search.orderDir || '',
    query: search.query || '',
    type: search.type || 'users',
  });
};
