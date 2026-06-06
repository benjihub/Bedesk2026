import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {ScheduleDatatableColumns} from '@common/admin/logging/schedule/schedule-datatable-columns';
import timelineImage from '@common/admin/logging/schedule/timeline.svg';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {Table} from '@common/ui/tables/table';
import {Trans} from '@ui/i18n/trans';
import {DownloadIcon} from '@ui/icons/material/Download';

export function Component() {
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery({
    ...commonAdminQueries.logs.cron(searchParams),
  });

  const actions = (
    <DataTableAddItemButton
      elementType="a"
      href="api/v1/logs/schedule/download"
      download
      icon={<DownloadIcon />}
    >
      <Trans message="Download log" />
    </DataTableAddItemButton>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
        />
        <DatatablePageScrollContainer>
          <Table
            columns={ScheduleDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={timelineImage}
              title={<Trans message="No scheduled commands have ran yet" />}
              filteringTitle={
                <Trans message="No matching scheduled commands" />
              }
            />
          )}
          <DataTablePaginationFooter
            query={query}
            onPageChange={page => mergeIntoSearchParams({page})}
            onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}
