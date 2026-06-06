import {AdminDocsUrls} from '@app/admin/admin-config';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CreateStatusDialog} from '@app/dashboard/statuses/crupdate/create-status-dialog';
import {UpdateStatusDialog} from '@app/dashboard/statuses/crupdate/update-status-dialog';
import {statusesDatatableColumns} from '@app/dashboard/statuses/datatable/statuses-datatable-columns';
import {Status} from '@app/dashboard/statuses/status';
import searchImage from '@app/help-center/search/search.svg';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Table} from '@common/ui/tables/table';
import {Trans} from '@ui/i18n/trans';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {openDialog} from '@ui/overlays/store/dialog-store';

export function Component() {
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);
  const query = useDatatableQuery(helpdeskQueries.statuses.index(searchParams));

  return (
    <DatatablePageWithHeaderLayout>
      <StaticPageTitle>
        <Trans message="Statuses" />
      </StaticPageTitle>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Statuses" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.statuses}
            size="xs"
          />
        }
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={
            <DialogTrigger type="modal">
              <DataTableAddItemButton>
                <Trans message="Add status" />
              </DataTableAddItemButton>
              <CreateStatusDialog />
            </DialogTrigger>
          }
        />

        <DatatablePageScrollContainer>
          <Table
            columns={statusesDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            cellHeight="h-64"
            onAction={(row: Status) =>
              openDialog(UpdateStatusDialog, {status: row})
            }
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={searchImage}
              title={
                <Trans message="No conversation statuses have been created yet" />
              }
              filteringTitle={
                <Trans message="No matching conversation statuses" />
              }
            />
          )}
          <DataTablePaginationFooter
            hideIfOnlyOnePage
            query={query}
            onPageChange={page => mergeIntoSearchParams({page})}
            onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}
