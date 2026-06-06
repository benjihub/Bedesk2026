import {Group, GroupUser} from '@app/dashboard/groups/group';
import {CreateGroupPayload} from '@app/dashboard/groups/requests/use-create-group';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import teamSvg from '@common/admin/roles/team.svg';
import {UserAvatar} from '@common/auth/user-avatar';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {Table} from '@common/ui/tables/table';
import {SortDescriptor} from '@common/ui/tables/types/sort-descriptor';
import {usePrefetchQuery, useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useFilter} from '@ui/i18n/use-filter';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {SearchIcon} from '@ui/icons/material/Search';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {sortArrayOfObjects} from '@ui/utils/array/sort-array-of-objects';
import {Fragment, useMemo, useState} from 'react';
import {useFormContext} from 'react-hook-form';

const tableConfig: ColumnConfig<GroupUser>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    sortingKey: 'description',
    header: () => <Trans message="Agent" />,
    body: user => (
      <NameWithAvatar
        image={user.image}
        label={user.name}
        description={user.description}
        alwaysShowAvatar
      />
    ),
  },
  {
    key: 'role',
    allowsSorting: true,
    sortingKey: 'role.name',
    header: () => <Trans message="Role" />,
    body: user =>
      user.role ? (
        <Chip className="w-max capitalize" radius="rounded-button" size="sm">
          {user.role.name}
        </Chip>
      ) : null,
  },
  {
    key: 'conversation_priority',
    allowsSorting: true,
    header: () => <Trans message="Conversation priority" />,
    body: (user, row) => (
      <FormSelect
        name={`users[${row.index}].conversation_priority`}
        selectionMode="single"
        size="sm"
        className="h-46 max-w-180 p-4"
        floatingWidth="auto"
        placement="top-start"
      >
        <Item
          value="primary"
          description={
            <Trans message="Conversations will be assigned to this agent first." />
          }
        >
          <Trans message="Primary agent" />
        </Item>
        <Item
          value="backup"
          description={
            <Trans message="Conversations will be assigned to this agent only if primary agent is not available or over their conversation limit." />
          }
        >
          <Trans message="Backup agent" />
        </Item>
      </FormSelect>
    ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-42 flex-shrink-0',
    body: (user, row) => {
      return <RemoveUserButton index={row.index} />;
    },
  },
];

interface RemoveUserButtonProps {
  index: number;
}
function RemoveUserButton({index}: RemoveUserButtonProps) {
  const {setValue, getValues} = useFormContext<CreateGroupPayload>();
  return (
    <IconButton
      size="md"
      className="text-muted"
      onClick={() => {
        setValue(
          'users',
          getValues('users').filter((_, i) => i !== index),
          {shouldDirty: true},
        );
      }}
    >
      <CloseIcon />
    </IconButton>
  );
}

interface CrupdateGroupMembersTableProps {
  group?: Group;
}
export function CrupdateGroupMembersTable({
  group,
}: CrupdateGroupMembersTableProps) {
  // preload agents for add member dropdown
  usePrefetchQuery(helpdeskQueries.agents.normalizedList);
  const {trans} = useTrans();
  const {contains} = useFilter();
  const {setValue, formState, clearErrors} =
    useFormContext<CreateGroupPayload>();
  const [sortDescriptor, onSortChange] = useState<SortDescriptor>({
    orderBy: 'name',
    orderDir: 'asc',
  });
  const [query, setQuery] = useState('');

  const {watch} = useFormContext<CreateGroupPayload>();
  const formUsers = watch('users');
  const users = useMemo(() => {
    // sort array by specified key and direction
    const sortedArray = sortDescriptor.orderBy
      ? sortArrayOfObjects(
          formUsers,
          sortDescriptor.orderBy,
          sortDescriptor.orderDir,
        )
      : formUsers;

    return sortedArray.filter(user => contains(user.name, query));
  }, [sortDescriptor, formUsers, contains, query]);

  const filteredConfig = useMemo(() => {
    return tableConfig.filter(c => {
      // hide delete button if it's a default group
      if (c.key === 'actions' && group?.default) {
        return false;
      }
      return true;
    });
  }, [group]);

  return (
    <Fragment>
      <div className="mb-24 flex items-center justify-between gap-14">
        <TextField
          size="sm"
          className="mr-auto min-w-180 max-w-350 flex-auto"
          inputWrapperClassName="mr-24 md:mr-0"
          placeholder={trans(message('Type to search...'))}
          startAdornment={<SearchIcon size="sm" />}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {!group?.default && (
          <AddMemberButton
            onSelected={agent => {
              clearErrors('users');
              if (!formUsers.find(f => f.id === agent.id)) {
                setValue(
                  'users',
                  [
                    ...formUsers,
                    {
                      ...agent,
                      conversation_priority: 'backup',
                    },
                  ],
                  {
                    shouldDirty: true,
                  },
                );
              }
            }}
          />
        )}
      </div>
      <Table
        columns={filteredConfig}
        data={users}
        enableSelection={false}
        collapseOnMobile
        sortDescriptor={sortDescriptor}
        onSortChange={onSortChange}
        cellHeight="h-70"
      />
      {!users.length && (
        <DataTableEmptyStateMessage
          className="mt-40"
          image={teamSvg}
          isFiltering={!!query}
          title={<Trans message="This group has no members yet" />}
          filteringTitle={<Trans message="No matching members" />}
        />
      )}
      {formState.errors.users?.message && (
        <div className="text-center text-danger">
          {formState.errors.users?.message}
        </div>
      )}
    </Fragment>
  );
}

interface AddMemberButtonProps {
  onSelected: (agent: GroupUser) => void;
}
function AddMemberButton({onSelected}: AddMemberButtonProps) {
  const query = useQuery(helpdeskQueries.agents.normalizedList);
  return (
    <MenuTrigger>
      <Button variant="outline" color="primary" startIcon={<AddIcon />}>
        <Trans message="Add member" />
      </Button>
      <Menu>
        {query.data?.agents.map(agent => (
          <Item
            key={agent.id}
            value={agent.id}
            startIcon={<UserAvatar user={agent} size="sm" />}
            onSelected={() => onSelected(agent)}
          >
            {agent.name}
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
