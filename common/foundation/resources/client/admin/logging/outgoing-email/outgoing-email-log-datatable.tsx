import {commonAdminQueries} from '@common/admin/common-admin-queries';
import openedImage from '@common/admin/logging/outgoing-email/opened.svg';
import {OutgoingEmailLogDatatableColumns} from '@common/admin/logging/outgoing-email/outgoing-email-log-datatable-columns';
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
    ...commonAdminQueries.logs.email(searchParams),
  });

  const actions = (
    <DataTableAddItemButton
      elementType="a"
      href="api/v1/logs/outgoing-email/download"
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
            columns={OutgoingEmailLogDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={openedImage}
              title={
                <Trans message="No outgoing emails have been logged yet" />
              }
              filteringTitle={<Trans message="No matching emails" />}
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
