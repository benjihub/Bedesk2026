import {ConversationListLayoutToggle} from '@app/dashboard/conversations/conversation-list-layout-toggle';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {ConversationsListItem} from '@app/dashboard/conversations/conversations-list/conversations-list-item';
import {ColumnSelector} from '@app/dashboard/conversations/conversations-table/columns/column-selector';
import {ConversationsTableActions} from '@app/dashboard/conversations/conversations-table/conversations-table-actions';
import {GenericConversationsTable} from '@app/dashboard/conversations/conversations-table/generic-conversations-table';
import {useActiveViewConversations} from '@app/dashboard/conversations/utils/use-active-view-converstions';
import {useActiveViewName} from '@app/dashboard/conversations/utils/use-active-view-name';
import {useNavigateToConversationPage} from '@app/dashboard/conversations/utils/use-navigate-to-conversation-page';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {InboxViewsPanel} from '@app/dashboard/inbox/inbox-views-panel';
import {InboxViewsSidebar} from '@app/dashboard/inbox/inbox-views-sidebar';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {queryClient} from '@common/http/query-client';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {MessagesSquareIcon} from '@ui/icons/lucide/messages-square-icon';
import {DashboardIcon} from '@ui/icons/material/Dashboard';
import {ToggleLeftSidebarIcon} from '@ui/icons/toggle-left-sidebar-icon';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {Fragment, useContext, useState} from 'react';
import {useActiveColumns} from './columns/use-active-columns';

export function Component() {
  const {isMobileMode} = useContext(DashboardLayoutContext);
  const view = isMobileMode ? (
    <ConversationsMobileView />
  ) : (
    <ConversationsDesktopView />
  );

  return (
    <Fragment>
      <InboxViewsSidebar location="conversationsTable" />
      {view}
    </Fragment>
  );
}

function ConversationsDesktopView() {
  const navigateToConversation = useNavigateToConversationPage();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const {query, items, isEmpty, mergeIntoSearchParams, sortDescriptor} =
    useActiveViewConversations();

  const tableName = 'conversationsPage';
  const defaultColumns = query.data?.columns;

  const [activeColumns] = useActiveColumns(tableName, defaultColumns);

  return (
    <div className="dashboard-rounded-panel dashboard-grid-content flex flex-col lg:ml-8">
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<ViewName />}
        toggleButton={<ToggleViewsSidebarButton />}
        padding="p-12"
        rightContent={
          <div>
            <ColumnSelector
              tableName={tableName}
              defaultColumns={defaultColumns}
            />
            <ConversationListLayoutToggle size="sm" />
          </div>
        }
        leftContent={
          selectedIds.length ? (
            <ConversationsTableActions
              className="ml-12"
              conversationIds={selectedIds}
              onActionCompleted={() => {
                setSelectedIds([]);
                queryClient.invalidateQueries({
                  queryKey: helpdeskQueries.conversations.invalidateKey,
                });
              }}
            />
          ) : null
        }
      />
      <div
        className={clsx(
          'flex-auto overflow-y-auto',
          isEmpty && 'flex items-center justify-center',
        )}
      >
        {isEmpty ? (
          <EmptyStateMessage />
        ) : (
          <GenericConversationsTable
            data={items}
            activeColumns={activeColumns}
            selectedTickets={selectedIds}
            onSelectionChange={setSelectedIds}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            onRowAction={conversation => {
              navigateToConversation(conversation.id);
            }}
          />
        )}
      </div>
      <DataTablePaginationFooter
        hideIfOnlyOnePage
        className="flex-shrink-0"
        onPageChange={page => mergeIntoSearchParams({page})}
        query={query}
      />
    </div>
  );
}

function ConversationsMobileView() {
  const {query, items, isEmpty, mergeIntoSearchParams} =
    useActiveViewConversations();

  return (
    <div className="dashboard-grid-content flex min-h-0 flex-col">
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<ViewName />}
        showSidebarToggleButton
        padding="p-12"
        rightContent={<ViewsTriggerButton />}
      />
      <div className="space-y-4 overflow-y-auto px-8">
        {items.map(conversation => (
          <ConversationsListItem
            key={conversation.id}
            conversation={conversation}
          />
        ))}
      </div>
      {isEmpty && <EmptyStateMessage />}
      <DataTablePaginationFooter
        hideIfOnlyOnePage
        className="flex-shrink-0"
        onPageChange={page => mergeIntoSearchParams({page})}
        query={query}
      />
    </div>
  );
}

function ViewsTriggerButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DialogTrigger type="modal" isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" startIcon={<DashboardIcon />} size="xs">
        <Trans message="Views" />
      </Button>
      <Dialog
        onClick={e => {
          if (e.target instanceof HTMLElement && e.target.closest('button,a')) {
            setIsOpen(false);
          }
        }}
      >
        <InboxViewsPanel />
      </Dialog>
    </DialogTrigger>
  );
}

function EmptyStateMessage() {
  return (
    <IllustratedMessage
      size="sm"
      image={<MessagesSquareIcon size="xl" />}
      imageMargin="mb-12"
      imageHeight="h-auto"
      title={<Trans message="There are no conversations in this view" />}
    />
  );
}

function ViewName() {
  const viewName = useActiveViewName();
  const label = viewName ? (
    <Trans message={viewName} />
  ) : (
    <Trans message="All" />
  );
  return (
    <Fragment>
      {label}
      <StaticPageTitle>{label}</StaticPageTitle>
    </Fragment>
  );
}

function ToggleViewsSidebarButton() {
  const {
    conversationsTableViewsSidebarOpen,
    toggleConversationsTableViewsSidebar,
  } = useAgentInboxLayout();
  return (
    <Tooltip
      placement="bottom"
      label={
        conversationsTableViewsSidebarOpen ? (
          <Trans message="Hide views sidebar" />
        ) : (
          <Trans message="Show views sidebar" />
        )
      }
    >
      <IconButton
        size="xs"
        onClick={() => toggleConversationsTableViewsSidebar()}
      >
        <ToggleLeftSidebarIcon />
      </IconButton>
    </Tooltip>
  );
}
