import {AdminDocsUrls} from '@app/admin/admin-config';
import {TeamIndexPageTabs} from '@app/dashboard/agents/agent-index-page/team-index-page-tabs';
import {DeleteGroupDialog} from '@app/dashboard/groups/delete-group-dialog';
import {GroupsTableItem} from '@app/dashboard/groups/groups-index-page/groups-table-item';
import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useEchoStore} from '@app/dashboard/websockets/echo-store';
import teamSvg from '@common/admin/roles/team.svg';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
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
import {Avatar} from '@ui/avatar/avatar';
import {AvatarGroup} from '@ui/avatar/avatar-group';
import {OnlineStatusCircle} from '@ui/badge/online-status-circle';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Fragment, useState} from 'react';
import {Link} from 'react-router';

const columnConfig: ColumnConfig<GroupsTableItem>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    header: () => <Trans message="Group" />,
    body: group => (
      <NameWithAvatar
        label={<Trans message={group.name} />}
        avatarLabel={group.name}
        alwaysShowAvatar
        description={
          <Trans
            message="[one 1 member|other :count members]"
            values={{count: group.users?.length || 0}}
          />
        }
      />
    ),
  },
  {
    key: 'members',
    header: () => <Trans message="Members" />,
    body: group => (
      <AvatarGroup className="min-h-40">
        {group.users?.map(user => (
          <Avatar
            key={user.id}
            src={user.image}
            label={user.name}
            link={`/users/${user.id}`}
            fallback="initials"
          />
        ))}
      </AvatarGroup>
    ),
  },
  {
    key: 'status',
    header: () => <Trans message="Status" />,
    body: group =>
      getBootstrapData().settings.websockets_setup ? (
        <GroupStatusColumn group={group} />
      ) : (
        <Trans
          message="[one 1 member|other :count members]"
          values={{count: group.users?.length ?? 1}}
        />
      ),
  },
  {
    key: 'default',
    header: () => <Trans message="Default" />,
    hideHeader: true,
    body: group =>
      group.default ? (
        <Chip className="w-max" radius="rounded-panel" size="sm">
          <Trans message="Default" />
        </Chip>
      ) : null,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-42 flex-shrink-0',
    body: group => <GroupOptionsTrigger group={group} />,
  },
];

interface GroupStatusColumnProps {
  group: GroupsTableItem;
}
function GroupStatusColumn({group}: GroupStatusColumnProps) {
  const presence = useEchoStore(s => s.presence);
  const onlineUsers = presence[helpdeskChannel.name];

  // have not connected to presence channel yet
  if (!onlineUsers) {
    return <Skeleton className="max-w-200" />;
  }

  const onlineAgentCount =
    group.users?.filter(user =>
      onlineUsers.find(u => u.isAgent && u.modelId === user.id),
    ).length || 0;

  return (
    <div className="flex items-center gap-6">
      <OnlineStatusCircle isOnline={!!onlineAgentCount} />
      <Trans
        message=":count of :total online"
        values={{
          count: onlineAgentCount,
          total: group.users?.length || 0,
        }}
      />
    </div>
  );
}

interface GroupOptionsTriggerProps {
  group: GroupsTableItem;
}
function GroupOptionsTrigger({group}: GroupOptionsTriggerProps) {
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={deleteGroupDialogOpen}
        onOpenChange={setDeleteGroupDialogOpen}
      >
        <DeleteGroupDialog groupId={group.id} />
      </DialogTrigger>
      <MenuTrigger>
        <IconButton size="md" className="text-muted">
          <MoreHorizIcon />
        </IconButton>
        <Menu>
          <Item value="edit" elementType={Link} to={`${group.id}/edit`}>
            <Trans message="Edit" />
          </Item>
          <Item
            value="reports"
            elementType={Link}
            to={`/dashboard/reports/groups/${group.id}`}
          >
            <Trans message="View reports" />
          </Item>
          {!group.default && (
            <Item
              value="delete"
              className="text-danger"
              onSelected={() => {
                setDeleteGroupDialogOpen(true);
              }}
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

  const query = useDatatableQuery(helpdeskQueries.groups.index(searchParams));

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Team - Groups" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={<Trans message="Team" />}
        showSidebarToggleButton
        border="border-none"
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.groups}
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
            onAction={group => {
              navigate(`${group.id}/edit`);
            }}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              className="mt-44"
              image={teamSvg}
              title={<Trans message="No groups have been created yet" />}
              filteringTitle={<Trans message="No matching groups" />}
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
      <Trans message="Add new group" />
    </DataTableAddItemButton>
  );
}
