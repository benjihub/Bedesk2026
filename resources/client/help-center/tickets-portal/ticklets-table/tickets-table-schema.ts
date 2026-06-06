import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type TicketsTableSearchParams = {
  page: string;
  orderBy: string;
  orderDir: string;
  query: string;
  statusId: string;
};

export const validateTicketsTableSearch = (
  search: Record<string, unknown>,
): TicketsTableSearchParams => {
  return castObjectValuesToString({
    page: search.page || '1',
    orderBy: search.orderBy || '',
    orderDir: search.orderDir || '',
    query: search.query || '',
    statusId: search.statusId || '',
  });
};
