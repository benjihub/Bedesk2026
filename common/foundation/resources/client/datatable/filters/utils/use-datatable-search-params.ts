import {SortDescriptor} from '@common/ui/tables/types/sort-descriptor';
import {useCallback, useMemo} from 'react';
import {useSearchParams} from 'react-router';

export function useDatatableSearchParams<
  S extends Record<string, string> = Record<string, string>,
>(validateFn?: (params: Record<string, string>) => S) {
  const [searchParams, _setSearchParams] = useSearchParams();
  const parsedParams = useMemo(() => {
    return validateFn
      ? validateFn(Object.fromEntries(searchParams))
      : (Object.fromEntries(searchParams) as S);
  }, [searchParams, validateFn]);

  const mergeIntoSearchParams = useCallback(
    (newParams: Partial<Record<keyof S, string | number>>) => {
      const merged = {...Object.fromEntries(searchParams), ...newParams};

      // parse params with schema, if schema is provided
      const parsed = validateFn ? validateFn(merged) : merged;

      _setSearchParams(
        prev => {
          for (const key in parsed) {
            // remove empty values (query='', orderBy='', etc.) and default page from the url
            if (
              parsed[key] === '' ||
              (key === 'page' && parsed[key] == '1') ||
              (key === 'perPage' && parsed[key] == '15')
            ) {
              prev.delete(key);
            } else {
              prev.set(key, parsed[key]);
            }
          }
          return prev;
        },
        {replace: true},
      );
    },
    [validateFn, searchParams, _setSearchParams],
  );

  // when setting only search term, remove page so we start from 1st page always on new search
  const setSearchQuery = useCallback(
    (query?: string) => {
      _setSearchParams(
        prev => {
          prev.delete('page');
          prev.delete('perPage');
          if (query) {
            prev.set('query', query);
          } else {
            prev.delete('query');
          }
          return prev;
        },
        {replace: true},
      );
    },
    [_setSearchParams],
  );

  const sortDescriptor: SortDescriptor = useMemo(() => {
    return {
      orderBy: parsedParams.orderBy,
      orderDir: parsedParams.orderDir as 'asc' | 'desc' | undefined,
    };
  }, [parsedParams]);

  return {
    searchParams: parsedParams,
    mergeIntoSearchParams,
    setSearchQuery,
    sortDescriptor,
    isFiltering: !!(parsedParams.query || parsedParams.filters),
  };
}
