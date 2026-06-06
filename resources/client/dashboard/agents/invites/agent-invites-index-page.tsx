import {AdminDocsUrls} from '@app/admin/admin-config';
import {TeamIndexPageTabs} from '@app/dashboard/agents/agent-index-page/team-index-page-tabs';
import {AgentInvite} from '@app/dashboard/agents/invites/agent-invite';
import {InviteAgentsDialog} from '@app/dashboard/agents/invites/invite-agents-dialog';
import {useResendAgentInvite} from '@app/dashboard/agents/invites/requests/use-resend-agent-invite';
import {useRevokeAgentInvite} from '@app/dashboard/agents/invites/requests/use-revoke-agent-invite';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import teamSvg from '@common/admin/roles/team.svg';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {useAuth} from '@common/auth/use-auth';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {
  NameWithAvatar,
  NameWithAvatarPlaceholder,
} from '@common/datatable/column-templates/name-with-avatar';
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
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {Skeleton} from '@ui/skeleton/skeleton';
import {toast} from '@ui/toast/toast';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {Fragment, useState} from 'react';

const columnConfig: ColumnConfig<AgentInvite>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    sortingKey: 'email',
    header: () => <Trans message="Email" />,
    body: (invite, row) =>
      row.isPlaceholder ? (
        <NameWithAvatarPlaceholder showDescription className="max-w-100" />
      ) : (
        <NameWithAvatar
          label={invite.email.split('@')[0]}
          alwaysShowAvatar
          description={invite.email}
          avatarCircle
        />
      ),
  },
  {
    key: 'role',
    header: () => <Trans message="Role" />,
    body: (invite, row) => {
      return row.isPlaceholder ? (
        <Skeleton variant="rect" className="max-w-80" />
      ) : invite.role ? (
        <Chip className="w-max capitalize" radius="rounded-panel" size="sm">
          {invite.role}
        </Chip>
      ) : null;
    },
  },
  {
    key: 'status',
    header: () => <Trans message="Status" />,
    hideHeader: true,
    body: agent => <InviteStatusColumn invite={agent} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-42 flex-shrink-0',
    body: (agent, row) =>
      row.isPlaceholder ? (
        <Skeleton variant="rect" size="w-24 h-24" />
      ) : (
        <InviteOptionsTrigger invite={agent} />
      ),
  },
];

export function Component() {
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(
    helpdeskQueries.agentInvites.index(searchParams),
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Team - Invites" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={<Trans message="Team" />}
        showSidebarToggleButton
        border="border-none"
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.agentInvites}
            size="xs"
          />
        }
      />
      <TeamIndexPageTabs />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={
            <DialogTrigger type="modal">
              <DataTableAddItemButton>
                <Trans message="Invite teammates" />
              </DataTableAddItemButton>
              <InviteAgentsDialog />
            </DialogTrigger>
          }
        />
        <DatatablePageScrollContainer>
          <Table
            columns={columnConfig}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            cellHeight="h-70"
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              className="mt-44"
              image={teamSvg}
              title={<Trans message="No invites have been sent yet" />}
              filteringTitle={<Trans message="No matching invites" />}
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

interface InviteStatusColumnProps {
  invite: AgentInvite;
}
function InviteStatusColumn({invite}: InviteStatusColumnProps) {
  const resendInvite = useResendAgentInvite();
  return (
    <Button
      variant="outline"
      color="primary"
      size="xs"
      disabled={resendInvite.isPending}
      onClick={() => {
        resendInvite.mutate({inviteId: invite.id});
      }}
    >
      <Trans message="Resend" />
    </Button>
  );
}

interface InviteOptionsTriggerProps {
  invite: AgentInvite;
}
function InviteOptionsTrigger({invite}: InviteOptionsTriggerProps) {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const {hasPermission} = useAuth();
  const {base_url} = useSettings();
  const [, copyLink] = useClipboard(
    `${base_url}/join/agents/${invite.id}?email=${encodeURIComponent(
      invite.email,
    )}`,
  );
  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
      >
        <RevokeInviteDialog inviteId={invite.id} />
      </DialogTrigger>
      <MenuTrigger>
        <IconButton size="md" className="text-muted">
          <MoreHorizIcon />
        </IconButton>
        <Menu>
          <Item
            value="copy"
            onSelected={() => {
              copyLink();
              toast({message: 'Link copied'});
            }}
          >
            <Trans message="Copy invite link" />
          </Item>
          {hasPermission('users.create') && (
            <Item
              value="delete"
              className="text-danger"
              onSelected={() => {
                setRevokeDialogOpen(true);
              }}
            >
              <Trans message="Revoke" />
            </Item>
          )}
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}

interface RevokeInviteDialogProps {
  inviteId: number;
}
function RevokeInviteDialog({inviteId}: RevokeInviteDialogProps) {
  const revokeInvite = useRevokeAgentInvite();
  return (
    <ConfirmationDialog
      isDanger
      title={<Trans message="Revoke invite" />}
      body={<Trans message="Are you sure you want to revoke this invite?" />}
      confirm={<Trans message="Revoke" />}
      isLoading={revokeInvite.isPending}
      onConfirm={() => {
        revokeInvite.mutate({inviteId});
      }}
    />
  );
}
