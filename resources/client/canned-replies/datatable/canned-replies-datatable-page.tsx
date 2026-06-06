import {AdminDocsUrls} from '@app/admin/admin-config';
import {CannedRepliesDatatableColumns} from '@app/canned-replies/datatable/canned-replies-datatable-columns';
import {CannedRepliesDatatableFilters} from '@app/canned-replies/datatable/canned-replies-datatable-filters';
import {validateCannedRepliesIndexSearch} from '@app/canned-replies/datatable/validate-canned-replies-index-search';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import onlineArticlesImg from '@app/help-center/articles/article-datatable/online-articles.svg';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {DatatableFilters} from '@common/datatable/page/datatable-filters';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Table} from '@common/ui/tables/table';
import {Trans} from '@ui/i18n/trans';
import {Link, useMatches} from 'react-router';

export function Component() {
  const navigate = useNavigate();
  const matches = useMatches();
  const forCurrentUser = matches.some(
    match => !!(match.handle as any)?.forCurrentUser,
  );

  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateCannedRepliesIndexSearch);

  const query = useDatatableQuery({
    ...helpdeskQueries.cannedReplies.index({...searchParams, forCurrentUser}),
  });

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Saved replies" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.savedReplies}
            size="xs"
          />
        }
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          actions={<Actions />}
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          filters={CannedRepliesDatatableFilters}
        />
        <DatatableFilters filters={CannedRepliesDatatableFilters} />
        <DatatablePageScrollContainer>
          <Table
            columns={CannedRepliesDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            cellHeight="h-80"
            onAction={reply => {
              navigate(`${reply.id}/update`);
            }}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              image={onlineArticlesImg}
              isFiltering={isFiltering}
              title={<Trans message="No saved replies have been created yet" />}
              filteringTitle={<Trans message="No matching replies" />}
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

function Actions() {
  return (
    <DataTableAddItemButton elementType={Link} to="new">
      <Trans message="Add reply" />
    </DataTableAddItemButton>
  );
}
