import {commonAdminQueries} from '@common/admin/common-admin-queries';
import teamSvg from '@common/admin/roles/team.svg';
import {CreateUserDialog} from '@common/admin/users/create-user-dialog';
import {userDatatableColumns} from '@common/admin/users/user-datatable-columns';
import {UserDatatableFilters} from '@common/admin/users/user-datatable-filters';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableExportCsvButton} from '@common/datatable/csv-export/data-table-export-csv-button';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {DatatableFilters} from '@common/datatable/page/datatable-filters';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Table} from '@common/ui/tables/table';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {toast} from '@ui/toast/toast';
import {Fragment, useState} from 'react';

export function Component() {
  const {billing} = useSettings();
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const filteredColumns = !billing.enable
    ? userDatatableColumns.filter(c => c.key !== 'subscribed')
    : userDatatableColumns;

  const query = useDatatableQuery(commonAdminQueries.users.index(searchParams));

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteUsersDialog
        selectedIds={selectedIds}
        onDelete={() => setSelectedIds([])}
      />
    </DialogTrigger>
  );

  const actions = (
    <Fragment>
      <DataTableExportCsvButton endpoint="users/csv/export" />
      <DialogTrigger type="modal">
        <DataTableAddItemButton>
          <Trans message="Add new user" />
        </DataTableAddItemButton>
        <CreateUserDialog />
      </DialogTrigger>
    </Fragment>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Users" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={<Trans message="Users" />}
        showSidebarToggleButton
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
          selectedItems={selectedIds}
          selectedActions={selectedActions}
          filters={UserDatatableFilters}
        />
        <DatatableFilters filters={UserDatatableFilters} />
        <DatatablePageScrollContainer>
          <Table
            columns={filteredColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection
            selectedRows={selectedIds}
            onSelectionChange={setSelectedIds}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={teamSvg}
              title={<Trans message="No users have been created yet" />}
              filteringTitle={<Trans message="No matching users" />}
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

interface DeleteUsersDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
export function DeleteUsersDialog({
  selectedIds,
  onDelete,
}: DeleteUsersDialogProps) {
  const {close} = useDialogContext();
  const deleteSelectedUsers = useMutation({
    mutationFn: () => apiClient.delete(`users/${selectedIds.join(',')}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commonAdminQueries.users.invalidateKey,
      });
      toast(message('Users deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteSelectedUsers.isPending}
      title={<Trans message="Delete users" />}
      body={
        <Trans
          message="Are you sure you want to delete selected users?"
          values={{count: selectedIds.length}}
        />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteSelectedUsers.mutate()}
    />
  );
}
