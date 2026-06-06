import {BackendFiltersUrlKey} from '@common/datatable/filters/backend-filters-url-key';
import {DatatableFilters} from '@common/datatable/page/datatable-filters';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useTrans} from '@ui/i18n/use-trans';
import {ProgressBar} from '@ui/progress/progress-bar';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import clsx from 'clsx';
import {nanoid} from 'nanoid';
import {
  cloneElement,
  ComponentProps,
  ReactElement,
  ReactNode,
  useRef,
  useState,
} from 'react';
import {useSearchParams} from 'react-router';
import {Table, TableProps} from '../ui/tables/table';
import {TableDataItem} from '../ui/tables/types/table-data-item';
import {ColumnConfig} from './column-config';
import {DataTableHeader} from './data-table-header';
import {DataTablePaginationFooter} from './data-table-pagination-footer';
import {BackendFilter} from './filters/backend-filter';
import {useBackendFilterUrlParams} from './filters/backend-filter-url-params';
import {DataTableContext} from './page/data-table-context';
import {
  GetDatatableDataParams,
  useDatatableData,
} from './requests/paginated-resources';

export interface DataTableProps<T extends TableDataItem> {
  filters?: BackendFilter[];
  pinnedFilters?: string[];
  filtersLoading?: boolean;
  columns: ColumnConfig<T>[];
  searchPlaceholder?: MessageDescriptor;
  queryParams?: Record<string, string | number | undefined | null>;
  endpoint: string;
  baseQueryKey?: string[];
  skeletonsWhileLoading?: number;
  resourceName?: ReactNode;
  emptyStateMessage: ReactElement<{isFiltering: boolean}>;
  actions?: ReactNode;
  enableSelection?: boolean;
  selectionStyle?: TableProps<T>['selectionStyle'];
  selectedActions?: ReactNode;
  onRowAction?: TableProps<T>['onAction'];
  tableDomProps?: ComponentProps<'table'>;
  children?: ReactNode;
  collapseTableOnMobile?: boolean;
  cellHeight?: string;
  border?: string;
  scrollContainerVertically?: boolean;
  disableQueryIfNoFilters?: boolean;
  renderRowAs?: TableProps<T>['renderRowAs'];
}
export function DataTable<T extends TableDataItem>({
  filters,
  pinnedFilters,
  filtersLoading,
  columns,
  searchPlaceholder,
  queryParams,
  endpoint,
  baseQueryKey: baseQueryKeyProp,
  actions,
  selectedActions,
  emptyStateMessage,
  tableDomProps,
  onRowAction,
  enableSelection = true,
  selectionStyle = 'checkbox',
  children,
  cellHeight,
  collapseTableOnMobile = true,
  skeletonsWhileLoading,
  border,
  scrollContainerVertically,
  disableQueryIfNoFilters,
  renderRowAs,
}: DataTableProps<T>) {
  const baseQueryKey = useRef(baseQueryKeyProp);
  const isMobile = useIsMobileMediaQuery();
  const {trans} = useTrans();
  const {encodedFilters, decodedFilters} = useBackendFilterUrlParams(filters);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const [params, setParams] = useState<GetDatatableDataParams>({
    perPage: 15,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  if (searchParams.get('page')) {
    params.page = searchParams.get('page');
  }
  if (searchParams.get('perPage')) {
    params.perPage = searchParams.get('perPage');
  }

  const isFiltering = !!(params.query || params.filters || encodedFilters);
  const isQueryDisabled = disableQueryIfNoFilters ? !isFiltering : false;

  const query = useDatatableData<T>(
    endpoint,
    {
      ...params,
      ...queryParams,
      [BackendFiltersUrlKey]: encodedFilters,
    },
    {
      baseQueryKey: baseQueryKey.current,
      enabled: !isQueryDisabled,
    },
    () => setSelectedRows([]),
  );

  const pagination = query.data?.pagination;
  const data =
    pagination?.data ||
    (query.isLoading && skeletonsWhileLoading
      ? Array.from({length: skeletonsWhileLoading}).map(() => {
          return {
            id: nanoid(),
            isPlaceholder: true,
          };
        })
      : []);

  const setParamInUrl = (
    key: keyof GetDatatableDataParams,
    value: string | number,
  ) => {
    setParams({...params, [key]: value});
    setSearchParams(prev => {
      prev.set(key as string, value.toString());
      if (key === 'query') {
        prev.delete('page');
      }
      if (key === 'page' && value == 1) {
        prev.delete('page');
      }
      return prev;
    });
  };

  return (
    <DataTableContext.Provider
      value={{
        selectedRows,
        setSelectedRows,
        endpoint,
        params,
        setParams,
        query,
        baseQueryKey: baseQueryKey.current,
      }}
    >
      {children}

      <DataTableHeader
        searchPlaceholder={searchPlaceholder}
        searchValue={params.query}
        onSearchChange={query => setParamInUrl('query', query)}
        actions={actions}
        filters={filters}
        filtersLoading={filtersLoading}
        selectedItems={selectedRows}
        selectedActions={selectedActions}
      />

      {filters ? (
        <DatatableFilters
          filters={filters}
          pinnedFilters={pinnedFilters}
          isLoading={filtersLoading}
        />
      ) : null}

      <div
        className={clsx(
          'relative flex-auto rounded-panel',
          scrollContainerVertically && 'overflow-y-auto',
          border ? border : (!isMobile || !collapseTableOnMobile) && 'border',
        )}
      >
        {query.isFetching && !skeletonsWhileLoading && (
          <ProgressBar
            isIndeterminate
            className="absolute left-0 top-0 z-10 w-full"
            aria-label={trans({message: 'Loading'})}
            size="xs"
          />
        )}

        <div className="relative overflow-x-auto md:overflow-hidden">
          <Table
            {...tableDomProps}
            columns={columns}
            data={data as T[]}
            sortDescriptor={params}
            onSortChange={descriptor => {
              setParams({...params, ...descriptor});
            }}
            renderRowAs={renderRowAs}
            selectedRows={selectedRows}
            enableSelection={enableSelection}
            selectionStyle={selectionStyle}
            onSelectionChange={setSelectedRows}
            onAction={onRowAction}
            collapseOnMobile={collapseTableOnMobile}
            cellHeight={cellHeight}
          />
        </div>

        {(query.isFetched || query.isPlaceholderData || isQueryDisabled) &&
        !pagination?.data.length ? (
          <div className="pt-50">
            {cloneElement(emptyStateMessage, {
              isFiltering: isQueryDisabled ? false : isFiltering,
            })}
          </div>
        ) : undefined}

        <DataTablePaginationFooter
          query={query as any}
          onPageChange={page => setParamInUrl('page', page)}
          onPerPageChange={perPage => setParamInUrl('perPage', perPage)}
        />
      </div>
    </DataTableContext.Provider>
  );
}
