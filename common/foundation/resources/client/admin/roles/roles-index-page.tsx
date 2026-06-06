import {AdminDocsUrls} from '@app/admin/admin-config';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {validateRolesDatatableSearch} from '@common/admin/roles/requests/validate-roles-datatable-search';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {Role} from '@common/auth/role';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTableExportCsvButton} from '@common/datatable/csv-export/data-table-export-csv-button';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Table} from '@common/ui/tables/table';
import {useMutation} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {Fragment, useContext, useState} from 'react';
import {Link} from 'react-router';
import teamSvg from './team.svg';

const columnConfig: ColumnConfig<Role>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    header: () => <Trans message="Role" />,
    body: role => (
      <div>
        <div>
          <Trans message={role.name} />
        </div>
        <div className="overflow-x-hidden overflow-ellipsis text-xs text-muted">
          {role.description ? <Trans message={role.description} /> : undefined}
        </div>
      </div>
    ),
  },
  {
    key: 'updated_at',
    maxWidth: 'max-w-100',
    allowsSorting: true,
    header: () => <Trans message="Last updated" />,
    body: role => <FormattedDate date={role.updated_at} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-84 flex-shrink-0',
    body: role => <ActionsColumn role={role} />,
  },
];

export function Component() {
  const navigate = useNavigate();
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateRolesDatatableSearch);

  const query = useDatatableQuery(commonAdminQueries.roles.index(searchParams));

  const actions = (
    <Fragment>
      <DataTableExportCsvButton endpoint="roles/csv/export" />
      <DataTableAddItemButton
        elementType={Link}
        to={`new?type=${searchParams.type ?? 'users'}`}
      >
        <Trans message="Add new role" />
      </DataTableAddItemButton>
    </Fragment>
  );

  const siteConfig = useContext(SiteConfigContext);
  const roleTypes = siteConfig.roles?.types;

  const selectedTab = searchParams.type
    ? roleTypes?.findIndex(type => type.type === searchParams.type)
    : 0;

  const roleTypeTabs = !!roleTypes?.length ? (
    <Tabs
      selectedTab={selectedTab}
      onTabChange={newTab => {
        mergeIntoSearchParams({
          type: roleTypes[newTab].type,
        });
      }}
    >
      <TabList className="mx-24">
        {roleTypes.map(type => (
          <Tab key={type.type} className="min-w-100">
            <Trans {...type.label} />
          </Tab>
        ))}
      </TabList>
    </Tabs>
  ) : null;

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Roles" />}
        showSidebarToggleButton
        border={roleTypeTabs ? 'border-none' : undefined}
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.roles}
            size="xs"
          />
        }
      />
      {roleTypeTabs}
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
        />
        <DatatablePageScrollContainer>
          <Table
            columns={columnConfig}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            onAction={role => navigate(`${role.id}/edit`)}
            cellHeight="h-64"
          />
          {query.isEmpty ? (
            <DataTableEmptyStateMessage
              image={teamSvg}
              isFiltering={isFiltering}
              title={<Trans message="No roles have been created yet" />}
              filteringTitle={<Trans message="No matching roles" />}
            />
          ) : null}
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

interface ActionsColumnProps {
  role: Role;
}
function ActionsColumn({role}: ActionsColumnProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DeleteRoleDialog roleId={role.id} />
      </DialogTrigger>
      <MenuTrigger>
        <IconButton size="md" className="text-muted">
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <Item
            value="edit"
            elementType={Link}
            to={`${role.id}/edit`}
            startIcon={<EditIcon />}
          >
            <Trans message="Edit" />
          </Item>
          {!role.internal && (
            <Item
              value="delete"
              onSelected={() => setDeleteDialogOpen(true)}
              startIcon={<DeleteIcon />}
            >
              <Trans message="Delete" />
            </Item>
          )}
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}

interface DeleteRoleDialogProps {
  roleId: number;
}
function DeleteRoleDialog({roleId}: DeleteRoleDialogProps) {
  const {close} = useDialogContext();
  const deleteRoles = useMutation({
    mutationFn: () => {
      return apiClient.delete(`roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.roles.invalidateKey,
      });
      close();
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <ConfirmationDialog
      isDanger
      title={<Trans message="Delete role" />}
      body={<Trans message="Are you sure you want to delete this role?" />}
      confirm={<Trans message="Delete" />}
      isLoading={deleteRoles.isPending}
      onConfirm={() => {
        deleteRoles.mutate();
      }}
    />
  );
}
