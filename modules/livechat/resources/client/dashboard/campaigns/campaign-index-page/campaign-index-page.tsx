import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
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
import {Table} from '@common/ui/tables/table';
import {CampaignDatatableColumns} from '@livechat/dashboard/campaigns/campaign-index-page/campaign-datatable-columns';
import campaignSvg from '@livechat/dashboard/campaigns/campaign-index-page/email-campaign.svg';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';

export function Component() {
  const {searchParams, sortDescriptor, mergeIntoSearchParams, setSearchQuery} =
    useDatatableSearchParams(validateDatatableSearch);
  const isFiltering = !!(searchParams.query || searchParams.filters);

  const query = useDatatableQuery(
    helpdeskQueries.campaigns.index(searchParams),
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Campaigns" />}
        showSidebarToggleButton
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={
            <DataTableAddItemButton elementType={Link} to="templates">
              <Trans message="New campaign" />
            </DataTableAddItemButton>
          }
        />

        <DatatablePageScrollContainer>
          <Table
            columns={CampaignDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            cellHeight="h-64"
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={campaignSvg}
              title={<Trans message="No campaigns have been created yet" />}
              filteringTitle={<Trans message="No matching campaigns" />}
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
