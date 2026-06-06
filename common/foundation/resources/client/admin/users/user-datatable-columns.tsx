import {BanUsersDialog} from '@common/admin/users/ban-users-dialog';
import {ImpersonateUserDialog} from '@common/admin/users/impersonate-user-dialog';
import {useUnbanUsers} from '@common/admin/users/requests/use-unban-users';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {EditIcon} from '@ui/icons/material/Edit';
import {LoginIcon} from '@ui/icons/material/Login';
import {PersonOffIcon} from '@ui/icons/material/PersonOff';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import {User} from '@ui/types/user';
import clsx from 'clsx';
import {Link} from 'react-router';

export const userDatatableColumns: ColumnConfig<User>[] = [
  {
    key: 'name',
    allowsSorting: true,
    sortingKey: 'email',
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="User" />,
    body: user => (
      <NameWithAvatar
        image={user.image}
        label={user.name}
        description={user.email}
        alwaysShowAvatar
        avatarCircle
      />
    ),
  },
  {
    key: 'roles',
    header: () => <Trans message="Roles" />,
    body: user => (
      <ChipList radius="rounded" size="xs">
        {user?.roles?.map(role => (
          <Chip key={role.id} selectable>
            <Link
              className={clsx('capitalize')}
              target="_blank"
              to={`/admin/roles/${role.id}/edit`}
            >
              <Trans message={role.name} />
            </Link>
          </Chip>
        ))}
      </ChipList>
    ),
  },
  {
    key: 'subscribed',
    header: () => <Trans message="Subscribed" />,
    width: 'w-96',
    body: user =>
      user.subscriptions?.filter(s => s.valid).length ? (
        <CheckIcon className="text-positive icon-md" />
      ) : (
        <CloseIcon className="text-danger icon-md" />
      ),
  },
  {
    key: 'banned_at',
    allowsSorting: true,
    header: () => <Trans message="Suspended" />,
    width: 'w-96',
    body: user =>
      user.banned_at ? <CheckIcon className="text-danger icon-md" /> : null,
  },
  {
    key: 'latest_active_session',
    width: 'w-110',
    header: () => <Trans message="Last active" />,
    body: user =>
      user.latest_active_session ? (
        <time>
          <FormattedDate date={user.latest_active_session.updated_at} />
        </time>
      ) : (
        '-'
      ),
  },
  {
    key: 'created_at',
    allowsSorting: true,
    width: 'w-110',
    header: () => <Trans message="Created at" />,
    body: user => (
      <time>
        <FormattedDate date={user.created_at} />
      </time>
    ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    width: 'w-128 flex-shrink-0',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    body: user => (
      <div className="text-muted">
        <Link to={`${user.id}/details`}>
          <Tooltip label={<Trans message="Edit user" />}>
            <IconButton size="md">
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Link>
        {user.banned_at ? (
          <UnbanButton user={user} />
        ) : (
          <DialogTrigger type="modal">
            <Tooltip label={<Trans message="Suspend user" />}>
              <IconButton size="md">
                <PersonOffIcon />
              </IconButton>
            </Tooltip>
            <BanUsersDialog userIds={[user.id]} />
          </DialogTrigger>
        )}
        <ImpersonateButton user={user} />
      </div>
    ),
  },
];

interface UnbanButtonProps {
  user: User;
}
function UnbanButton({user}: UnbanButtonProps) {
  const unban = useUnbanUsers([user.id]);
  return (
    <DialogTrigger
      type="modal"
      onClose={confirmed => {
        if (confirmed) {
          unban.mutate();
        }
      }}
    >
      <Tooltip label={<Trans message="Remove suspension" />}>
        <IconButton size="md" color="danger">
          <PersonOffIcon />
        </IconButton>
      </Tooltip>
      <ConfirmationDialog
        isDanger
        title={<Trans message="Suspend “:name“" values={{name: user.name}} />}
        body={
          <Trans message="Are you sure you want to remove suspension from this user?" />
        }
        confirm={<Trans message="Unsuspend" />}
      />
    </DialogTrigger>
  );
}

interface ImpersonateButtonProps {
  user: User;
}
function ImpersonateButton({user}: ImpersonateButtonProps) {
  return (
    <DialogTrigger type="modal">
      <Tooltip label={<Trans message="Login as user" />}>
        <IconButton size="md">
          <LoginIcon />
        </IconButton>
      </Tooltip>
      <ImpersonateUserDialog user={user} />
    </DialogTrigger>
  );
}
