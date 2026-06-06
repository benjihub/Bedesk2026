import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {validateUserIndexSearch} from '@common/admin/users/validate-user-index-search';
import {Role} from '@common/auth/role';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {DatatablePageScrollContainer} from '@common/datatable/page/datatable-page-with-header-layout';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {queryClient} from '@common/http/query-client';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Table} from '@common/ui/tables/table';
import {SelectUserDialog} from '@common/users/select-user-dialog';
import {keepPreviousData, useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {User} from '@ui/types/user';
import {useState} from 'react';
import {useAddUsersToRole} from '../requests/use-add-users-to-role';
import {useRemoveUsersFromRole} from '../requests/use-remove-users-from-role';
import teamSvg from '../team.svg';

const columns: ColumnConfig<User>[] = [
  {
    key: 'email',
    allowsSorting: true,
    sortingKey: 'email',
    visibleInMode: 'all',
    header: () => <Trans message="User" />,
    body: user => {
      return (
        <NameWithAvatar
          image={user.image}
          label={user.name ?? <Trans message="Visitor" />}
          description={user.email}
          alwaysShowAvatar
          avatarLabel="Visitor"
        />
      );
    },
  },
  {
    key: 'created_at',
    allowsSorting: true,
    header: () => <Trans message="Assigned at" />,
    body: user => <FormattedDate date={user.created_at} />,
  },
];

export function Component() {
  const {roleId} = useRequiredParams(['roleId']);
  const roleQuery = useSuspenseQuery(commonAdminQueries.roles.get(roleId));

  if (roleQuery.data.role.guests || roleQuery.data.role.type === 'workspace') {
    return (
      <div className="pb-10 pt-30">
        <DataTableEmptyStateMessage
          image={teamSvg}
          title={<Trans message="Users can't be assigned to this role" />}
        />
      </div>
    );
  }

  return <UsersTable role={roleQuery.data.role} />;
}

interface UsersTableProps {
  role: Role;
}
function UsersTable({role}: UsersTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateUserIndexSearch);

  const query = useDatatableQuery({
    ...commonAdminQueries.users.index({...searchParams, roleId: `${role.id}`}),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <GlobalLoadingProgress query={query} />
      <DataTableHeader
        searchValue={searchParams.query}
        onSearchChange={setSearchQuery}
        actions={<AssignUserAction role={role} />}
        selectedItems={selectedIds}
        selectedActions={
          <RemoveUsersAction role={role} selectedIds={selectedIds} />
        }
      />
      <DatatablePageScrollContainer>
        <Table
          columns={columns}
          data={query.items}
          sortDescriptor={sortDescriptor}
          onSortChange={mergeIntoSearchParams}
          enableSelection
          selectedRows={selectedIds}
          onSelectionChange={ids => setSelectedIds(ids as number[])}
        />
        {query.isEmpty ? (
          <DataTableEmptyStateMessage
            image={teamSvg}
            isFiltering={isFiltering}
            title={
              <Trans message="No users have been assigned to this role yet" />
            }
            filteringTitle={<Trans message="No matching users" />}
          />
        ) : null}
        <DataTablePaginationFooter
          query={query}
          onPageChange={page => mergeIntoSearchParams({page})}
          onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
        />
      </DatatablePageScrollContainer>
    </div>
  );
}

interface AssignUserActionProps {
  role: Role;
}
function AssignUserAction({role}: AssignUserActionProps) {
  const addUsers = useAddUsersToRole(role);
  return (
    <DialogTrigger
      type="modal"
      onClose={user => {
        if (user) {
          addUsers.mutate(
            {userIds: [user.id as number]},
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: DatatableDataQueryKey('users', {
                    roleId: `${role.id}`,
                  }),
                });
              },
            },
          );
        }
      }}
    >
      <Button variant="flat" color="primary" disabled={addUsers.isPending}>
        <Trans message="Assign user" />
      </Button>
      <SelectUserDialog />
    </DialogTrigger>
  );
}

type RemoveUsersActionProps = {
  role: Role;
  selectedIds: number[];
};
export function RemoveUsersAction({role, selectedIds}: RemoveUsersActionProps) {
  const removeUsers = useRemoveUsersFromRole(role);

  return (
    <DialogTrigger
      type="modal"
      onClose={isConfirmed => {
        if (isConfirmed) {
          removeUsers.mutate(
            {userIds: selectedIds},
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: commonAdminQueries.users.invalidateKey,
                });
              },
            },
          );
        }
      }}
    >
      <Button variant="flat" color="danger" disabled={removeUsers.isPending}>
        <Trans message="Remove users" />
      </Button>
      <ConfirmationDialog
        title={<Trans message="Remove users from role?" />}
        body={
          <Trans message="This will permanently remove the users from this role." />
        }
        confirm={<Trans message="Remove" />}
        isDanger
      />
    </DialogTrigger>
  );
}
