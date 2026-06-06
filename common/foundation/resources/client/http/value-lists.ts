import {MenuItemCategory} from '@common/menus/menu-item-category';
import {keepPreviousData, queryOptions, useQuery} from '@tanstack/react-query';
import {FontConfig} from '@ui/fonts/font-picker/font-config';
import {Localization} from '@ui/i18n/localization';
import {CssTheme} from '@ui/themes/css-theme';
import {CustomPage} from '../admin/custom-pages/custom-page';
import {Role} from '../auth/role';
import {CustomDomain} from '../custom-domains/custom-domain';
import {BackendResponse} from './backend-response/backend-response';
import {apiClient, queryClient} from './query-client';

export interface FetchValueListsResponse extends BackendResponse {
  countries?: CountryListItem[];
  timezones?: {[key: string]: Timezone[]};
  languages?: LanguageListItem[];
  localizations?: Localization[];
  currencies?: {[key: string]: Currency};
  domains?: CustomDomain[];
  pages?: CustomPage[];
  themes?: CssTheme[];
  roles?: Role[];
  menuItemCategories?: MenuItemCategory[];
  googleFonts?: FontConfig[];
  workspaceRoles?: Role[];
}

export interface CountryListItem {
  name: string;
  code: string;
}

export interface LanguageListItem {
  name: string;
  nativeName?: string;
  code: string;
}

export interface Currency {
  name: string;
  decimal_digits: number;
  symbol: string;
  code: string;
}

export interface Timezone {
  text: string;
  value: string;
}

interface Options {
  disabled?: boolean;
}

export function useValueLists(
  names: (keyof FetchValueListsResponse)[],
  params?: Record<string, any>,
  options: Options = {},
) {
  return useQuery({
    ...valueListsQueryOptions(names, params),
    ...options,
  });
}

export function valueListsQueryOptions(
  names: (keyof FetchValueListsResponse)[],
  params?: Record<string, string | number | undefined | null>,
) {
  return queryOptions<FetchValueListsResponse>({
    queryKey: ['value-lists', names, params],
    queryFn: () =>
      apiClient
        .get(`value-lists/${names}`, {params})
        .then(response => response.data),
    // if there are params, make sure we update lists when they change
    staleTime: !params ? Infinity : undefined,
    placeholderData: keepPreviousData,
    initialData: () => {
      // check if we have already fetched value lists for all specified names previously,
      // if so, return cached response for this query, as there's no need to fetch it again
      const previousData = queryClient
        .getQueriesData<FetchValueListsResponse>({queryKey: ['value-lists']})
        .find(([, response]) => {
          if (response && names.every(n => response[n])) {
            return response;
          }
          return null;
        });
      if (previousData) {
        return previousData[1];
      }
    },
  });
}

export function prefetchValueLists(
  names: (keyof FetchValueListsResponse)[],
  params?: Record<string, string | number | undefined>,
) {
  return queryClient.ensureQueryData(valueListsQueryOptions(names, params));
}
