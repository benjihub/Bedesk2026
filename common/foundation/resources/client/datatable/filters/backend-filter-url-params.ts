import { Key, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { BackendFilter } from './backend-filter';
import { BackendFiltersUrlKey } from './backend-filters-url-key';
import { decodeBackendFilters } from './utils/decode-backend-filters';
import {
  FilterListValue,
  encodeBackendFilters,
} from './utils/encode-backend-filters';

export function useBackendFilterUrlParams(
  filters?: BackendFilter[],
  pinnedFilters?: string[],
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const encodedFilters = searchParams.get(BackendFiltersUrlKey);

  const decodedFilters: FilterListValue[] = useMemo(() => {
    if (!filters) return [];
    const decoded = decodeBackendFilters(encodedFilters);

    // if filter is pinned, and it is not applied yet, add a placeholder
    (pinnedFilters || []).forEach(key => {
      if (!decoded.find(f => f.key === key)) {
        const config = filters.find(f => f.key === key)!;
        decoded.push({
          key,
          value: config.control.defaultValue,
          operator: config.defaultOperator,
          isInactive: true,
        });
      }
    });

    // preserve original filter order from configuration
    decoded.sort(
      (a, b) =>
        filters.findIndex(f => f.key === a.key) -
        filters.findIndex(f => f.key === b.key),
    );

    return decoded;
  }, [encodedFilters, pinnedFilters, filters]);

  const getDecodedWithoutKeys = useCallback(
    (values: (FilterListValue | Key)[]) => {
      const newFilters = [...decodedFilters];
      values.forEach(value => {
        const key = typeof value === 'object' ? value.key : value;
        const index = newFilters.findIndex(f => f.key === key);
        if (index > -1) {
          newFilters.splice(index, 1);
        }
      });
      return newFilters;
    },
    [decodedFilters],
  );

  const replaceAll = useCallback(
    (filterValues: FilterListValue[]) => {
      const encodedFilters = encodeBackendFilters(filterValues, filters);
      if (encodedFilters) {
        setSearchParams(prev => {
          prev.delete('page');
          prev.delete('perPage');
          prev.set(BackendFiltersUrlKey, encodedFilters);
          return prev;
        }, {replace: true});
      } else {
        searchParams.delete(BackendFiltersUrlKey);
        setSearchParams(searchParams, {replace: true});
      }
    },
    [filters, searchParams, setSearchParams],
  );

  const add = useCallback(
    (filterValues: FilterListValue[]) => {
      const existing = getDecodedWithoutKeys(filterValues);
      const decodedFilters = [...existing, ...filterValues];
      replaceAll(decodedFilters);
    },
    [getDecodedWithoutKeys, replaceAll],
  );

  const remove = useCallback(
    (key: Key) => replaceAll(getDecodedWithoutKeys([key])),
    [getDecodedWithoutKeys, replaceAll],
  );

  return {
    add,
    remove,
    replaceAll,
    decodedFilters,
    encodedFilters,
  };
}
