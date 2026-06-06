import {ConversationListItemType} from '@app/dashboard/conversation';
import {validateSearchConversationsParams} from '@app/dashboard/conversations/agent-conversations-search-schema';
import {ConversationsListItem} from '@app/dashboard/conversations/conversations-list/conversations-list-item';
import {ColumnSelector} from '@app/dashboard/conversations/conversations-table/columns/column-selector';
import {useConversationListFilters} from '@app/dashboard/conversations/conversations-table/conversations-table-filters';
import {defaultConversationsTableColumns} from '@app/dashboard/conversations/conversations-table/converstions-table-available-columns';
import {GenericConversationsTable} from '@app/dashboard/conversations/conversations-table/generic-conversations-table';
import {getConversationPageLink} from '@app/dashboard/conversations/utils/get-conversation-page-link';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {queryClient} from '@common/http/query-client';
import searchImage from '@app/help-center/search/search.svg';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
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
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {SortDescriptor} from '@common/ui/tables/types/sort-descriptor';
import {keepPreviousData} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {Fragment, useContext} from 'react';
import {useActiveColumns} from './conversations-table/columns/use-active-columns';

const pinnedFilters = [
  'assignee_id',
  'group_id',
  'tags',
  'user_id',
  'status_category',
  'created_at',
];

export function Component() {
  const {isMobileMode} = useContext(DashboardLayoutContext);
  const navigate = useNavigate();

  const {searchParams, sortDescriptor, mergeIntoSearchParams, setSearchQuery} =
    useDatatableSearchParams(validateSearchConversationsParams);

  const filters = useConversationListFilters();
  const isFiltering = !!(searchParams.query || searchParams.filters);
  const filtersLoading = !filters.length;

  const query = useDatatableQuery({
    ...helpdeskQueries.conversations.search(searchParams),
    enabled: isFiltering,
    placeholderData: keepPreviousData,
  });

  const isEmpty = query.isEmpty || !isFiltering;

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Search tickets" />}
        showSidebarToggleButton={true}
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          filters={filters}
          filtersLoading={filtersLoading}
          actions={
            <ColumnSelector
              variant="outline"
              color="primary"
              tableName="searchPage"
            />
          }
        />
        <DatatableFilters
          filters={filters}
          pinnedFilters={pinnedFilters}
          isLoading={filtersLoading}
        />
        <DatatablePageScrollContainer>
          {isEmpty ? (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={searchImage}
              title={
                <Trans message="Enter your query or select filters to find conversations" />
              }
              filteringTitle={<Trans message="No matching conversations" />}
            />
          ) : (
            <Fragment>
              {isMobileMode ? (
                <MobileList items={query.items} />
              ) : (
                <DesktopTable
                  sortDescriptor={sortDescriptor}
                  onSortChange={mergeIntoSearchParams}
                  items={query.items}
                  onNavigate={conversation => {
                    // If this conversation needs human support, prefetch fast/full data and messages
                    // so the conversation page loads the fresh data immediately.
                    const needsHuman = (conversation as any).needs_human_support;
                    if (needsHuman) {
                      const fastOpts = helpdeskQueries.conversations.getFast(
                        conversation.id,
                      );
                      const msgOpts = helpdeskQueries.conversations.messages(
                        conversation.id,
                      );
                      queryClient.prefetchQuery(
                        fastOpts.queryKey,
                        fastOpts.queryFn as any,
                      );
                      queryClient.prefetchInfiniteQuery(
                        msgOpts.queryKey,
                        msgOpts.queryFn as any,
                      );
                      // also prefetch the full conversation in background
                      const fullOpts = helpdeskQueries.conversations.get(
                        conversation.id,
                      );
                      queryClient.prefetchQuery(
                        fullOpts.queryKey,
                        fullOpts.queryFn as any,
                      );
                    }

                    navigate(getConversationPageLink(conversation));
                  }}
                />
              )}
              <DataTablePaginationFooter
                hideIfOnlyOnePage
                query={query}
                onPageChange={page => mergeIntoSearchParams({page})}
              />
            </Fragment>
          )}
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}

interface DesktopTableProps {
  sortDescriptor: SortDescriptor;
  onSortChange: (sortDescriptor: SortDescriptor) => void;
  items: ConversationListItemType[];
  onNavigate: (conversation: ConversationListItemType) => void;
}
function DesktopTable({
  sortDescriptor,
  onSortChange,
  items,
  onNavigate,
}: DesktopTableProps) {
  const [activeColumns] = useActiveColumns(
    'searchPage',
    defaultConversationsTableColumns,
  );

  return (
    <GenericConversationsTable
      data={items}
      activeColumns={activeColumns}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      onRowAction={conversation => {
        onNavigate(conversation);
      }}
    />
  );
}

interface MobileListProps {
  items: ConversationListItemType[];
}
function MobileList({items}: MobileListProps) {
  return (
    <div>
      {items.map(item => (
        <ConversationsListItem key={item.id} conversation={item} />
      ))}
    </div>
  );
}
