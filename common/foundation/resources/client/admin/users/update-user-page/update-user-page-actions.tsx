import {BanUsersDialog} from '@common/admin/users/ban-users-dialog';
import {useDeleteUser} from '@common/admin/users/requests/use-delete-user';
import {useUnbanUsers} from '@common/admin/users/requests/use-unban-users';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {openDialog} from '@ui/overlays/store/dialog-store';
import {Fragment, ReactNode, useState} from 'react';

interface Props {
  user: {id: number; banned_at?: string | null};
  children?: ReactNode;
}
export function UpdateUserPageActions({user, children}: Props) {
  const unban = useUnbanUsers([user.id]);
  const isSuspended = user.banned_at !== null;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DeleteUserDialog userId={user.id} />
      </DialogTrigger>
      <MenuTrigger>
        <Button
          className="ml-auto"
          variant="outline"
          size="sm"
          endIcon={<KeyboardArrowDownIcon />}
        >
          <Trans message="Actions" />
        </Button>
        <Menu>
          {children}
          <Item
            value="toggleSuspension"
            onSelected={() => {
              if (isSuspended) {
                unban.mutate();
              } else {
                openDialog(BanUsersDialog, {userIds: [user.id]});
              }
            }}
          >
            {isSuspended ? (
              <Trans message="Unsuspend user" />
            ) : (
              <Trans message="Suspend user" />
            )}
          </Item>
          <Item
            value="delete"
            onSelected={() => {
              setDeleteDialogOpen(true);
            }}
          >
            <Trans message="Delete user" />
          </Item>
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}

interface DeleteUserDialogProps {
  userId: number;
}
export function DeleteUserDialog({userId}: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();
  const {close} = useDialogContext();
  const navigate = useNavigate();
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteUser.isPending}
      title={<Trans message="Delete user" />}
      confirm={<Trans message="Delete" />}
      body={<Trans message="Are you sure you want to delete this user?" />}
      onConfirm={() => {
        deleteUser.mutate(
          {userId},
          {
            onSuccess: () => {
              close();
              navigate('..', {relative: 'path'});
            },
          },
        );
      }}
    />
  );
}
