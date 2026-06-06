import {AdminDocsUrls} from '@app/admin/admin-config';
import {AgentsTableItem} from '@app/dashboard/agents/agent-index-page/agents-table-item';
import {TeamIndexPageTabs} from '@app/dashboard/agents/agent-index-page/team-index-page-tabs';
import {CreateAgentDialog} from '@app/dashboard/agents/create-agent-dialog';
import {InviteAgentsDialog} from '@app/dashboard/agents/invites/invite-agents-dialog';
import {
  canEditAgent,
  useCanEditAgent,
} from '@app/dashboard/agents/use-agent-permissions';
import {
  useAgentWasActiveRecently,
  useCompactAgents,
} from '@app/dashboard/agents/use-compact-agents';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useIsModuleInstalled} from '@app/use-is-module-installed';
import teamSvg from '@common/admin/roles/team.svg';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {BanUsersDialog} from '@common/admin/users/ban-users-dialog';
import {useUnbanUsers} from '@common/admin/users/requests/use-unban-users';
import {DeleteUserDialog} from '@common/admin/users/update-user-page/update-user-page-actions';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
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
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Table} from '@common/ui/tables/table';
import {OnlineStatusCircle} from '@ui/badge/online-status-circle';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Item} from '@ui/forms/listbox/item';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Fragment, ReactNode, useState} from 'react';
import {Link} from 'react-router';

const columnConfig: ColumnConfig<AgentsTableItem>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    sortingKey: 'email',
    header: () => <Trans message="Teammate" />,
    body: (agent, row) => (
      <NameWithAvatar
        label={agent.name}
        alwaysShowAvatar
        description={agent.email}
        avatarCircle
      />
    ),
  },
  {
    key: 'role',
    header: () => <Trans message="Role" />,
    body: agent => (
      <Chip className="w-max capitalize" radius="rounded-panel" size="sm">
        {agent.role}
      </Chip>
    ),
  },
  {
    key: 'last_active_at',
    header: () => <Trans message="Status" />,
    allowsSorting: true,
    body: agent => <AgentStatusColumn agent={agent} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-42 flex-shrink-0',
    body: agent => <AgentOptionsTrigger agent={agent} />,
  },
];

interface AgentStatusColumnProps {
  agent: AgentsTableItem;
}
function AgentStatusColumn({agent}: AgentStatusColumnProps) {
  const livechatEnabled = useIsModuleInstalled('livechat');
  const {isLoading} = useCompactAgents();
  const isAgentOnline = useAgentWasActiveRecently(agent.id);

  if (isLoading) {
    return <Skeleton className="max-w-100" />;
  }

  if (agent.banned_at) {
    return (
      <StatusMessage color="bg-danger">
        <Trans message="Suspended" />
      </StatusMessage>
    );
  }

  if (!isAgentOnline) {
    return (
      <StatusMessage color="bg-chip">
        <Trans
          message="Last seen: :date"
          values={{date: <FormattedRelativeTime date={agent.last_active_at} />}}
        />
      </StatusMessage>
    );
  } else if (!livechatEnabled) {
    return (
      <StatusMessage color="bg-positive">
        <Trans message="Online" />
      </StatusMessage>
    );
  }
  if (agent.accepts_conversations) {
    return (
      <StatusMessage color="bg-positive">
        <Trans message="Accepting conversations" />
      </StatusMessage>
    );
  }
  return (
    <StatusMessage color="bg-danger">
      <Trans message="Not accepting conversations" />
    </StatusMessage>
  );
}

interface StatusMessageProps {
  color: string;
  children: ReactNode;
}
const StatusMessage = ({color, children}: StatusMessageProps) => (
  <div className="flex items-center gap-6">
    <OnlineStatusCircle color={color} />
    {children}
  </div>
);

interface AgentOptionsTriggerProps {
  agent: AgentsTableItem;
}
function AgentOptionsTrigger({agent}: AgentOptionsTriggerProps) {
  const unban = useUnbanUsers([agent.id]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const canEditAgent = useCanEditAgent(agent.id);

  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DeleteUserDialog userId={agent.id} />
      </DialogTrigger>
      <DialogTrigger
        type="modal"
        isOpen={banDialogOpen}
        onOpenChange={setBanDialogOpen}
      >
        <BanUsersDialog userIds={[agent.id]} />
      </DialogTrigger>
      <MenuTrigger>
        <IconButton size="md" className="text-muted">
          <MoreHorizIcon />
        </IconButton>
        <Menu>
          {canEditAgent && (
            <Item value="edit" elementType={Link} to={`${agent.id}/details`}>
              <Trans message="Edit" />
            </Item>
          )}
          <Item
            value="reports"
            elementType={Link}
            to={`/dashboard/reports/agents/${agent.id}`}
          >
            <Trans message="View reports" />
          </Item>
          {canEditAgent &&
            (agent.banned_at ? (
              <Item value="suspend" onSelected={() => unban.mutate()}>
                <Trans message="Reactivate" />
              </Item>
            ) : (
              <Item value="suspend" onSelected={() => setBanDialogOpen(true)}>
                <Trans message="Suspend" />
              </Item>
            ))}
          {canEditAgent && (
            <Item
              value="delete"
              className="text-danger"
              onSelected={() => setDeleteDialogOpen(true)}
            >
              <Trans message="Delete" />
            </Item>
          )}
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}

export function Component() {
  const navigate = useNavigate();

  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(helpdeskQueries.agents.index(searchParams));

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Team - Agents" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={<Trans message="Team" />}
        showSidebarToggleButton
        border="border-none"
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.team}
            size="xs"
          />
        }
      />
      <TeamIndexPageTabs />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={<Actions />}
        />
        <DatatablePageScrollContainer>
          <Table
            columns={columnConfig}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            cellHeight="h-70"
            onAction={agent => {
              if (canEditAgent(agent.id)) {
                navigate(`${agent.id}/details`);
              }
            }}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              className="mt-44"
              image={teamSvg}
              title={<Trans message="No agents have been created yet" />}
              filteringTitle={<Trans message="No matching agents" />}
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
    <div className="flex items-center gap-12">
      <DialogTrigger type="modal">
        <DataTableAddItemButton>
          <Trans message="Invite teammates" />
        </DataTableAddItemButton>
        <InviteAgentsDialog />
      </DialogTrigger>
      <DialogTrigger type="modal">
        <DataTableAddItemButton>
          <Trans message="Create agent" />
        </DataTableAddItemButton>
        <CreateAgentDialog />
      </DialogTrigger>
    </div>
  );
}
