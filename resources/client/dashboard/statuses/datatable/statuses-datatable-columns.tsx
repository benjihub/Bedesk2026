import {DeleteStatusDialog} from '@app/dashboard/statuses/crupdate/delete-status-dialog';
import {UpdateStatusDialog} from '@app/dashboard/statuses/crupdate/update-status-dialog';
import {useUpdateStatus} from '@app/dashboard/statuses/crupdate/use-update-status';
import {Status} from '@app/dashboard/statuses/status';
import {StatusCategoryName} from '@app/dashboard/statuses/status-category';
import {ColumnConfig} from '@common/datatable/column-config';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {Fragment, useState} from 'react';

export const statusesDatatableColumns: ColumnConfig<Status>[] = [
  {
    key: 'label',
    header: () => <Trans message="Label" />,
    visibleInMode: 'all',
    body: status => status.label,
  },
  {
    key: 'user_label',
    header: () => <Trans message="User label" />,
    body: status => status.user_label || '-',
  },
  {
    key: 'category',
    allowsSorting: true,
    header: () => <Trans message="Category" />,
    body: status => <StatusCategoryName category={status.category} />,
  },
  {
    key: 'active',
    allowsSorting: true,
    header: () => <Trans message="Active" />,
    body: status =>
      status.active ? <CheckIcon className="text-muted" /> : null,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    header: () => <Trans message="Last updated" />,
    body: status => <FormattedRelativeTime date={status.updated_at} />,
  },
  {
    key: 'actions',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    header: () => <Trans message="Actions" />,
    body: status => <ActionsButton status={status} />,
    width: 'w-44 flex-shrink-0',
  },
];

interface ActionsButtonProps {
  status: Status;
}
function ActionsButton({status}: ActionsButtonProps) {
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  const [updateDialogIsOpen, setUpdateDialogIsOpen] = useState(false);
  const updateStatus = useUpdateStatus(status);

  const activateStatus = () =>
    updateStatus.mutate(
      {active: true},
      {onSuccess: () => toast(message('Activated status'))},
    );

  const deactivateStatus = () =>
    updateStatus.mutate(
      {active: false},
      {onSuccess: () => toast(message('Deactivated status'))},
    );

  return (
    <Fragment>
      {deleteDialogIsOpen && (
        <DialogTrigger
          type="modal"
          isOpen={deleteDialogIsOpen}
          onOpenChange={setDeleteDialogIsOpen}
        >
          <DeleteStatusDialog status={status} />
        </DialogTrigger>
      )}
      {updateDialogIsOpen && (
        <DialogTrigger
          type="modal"
          isOpen={updateDialogIsOpen}
          onOpenChange={setUpdateDialogIsOpen}
        >
          <UpdateStatusDialog status={status} />
        </DialogTrigger>
      )}
      <MenuTrigger>
        <IconButton className="text-muted" disabled={updateStatus.isPending}>
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <MenuItem value="edit" onSelected={() => setUpdateDialogIsOpen(true)}>
            <Trans message="Edit" />
          </MenuItem>
          {!status.active && (
            <MenuItem value="activate" onSelected={() => activateStatus()}>
              <Trans message="Activate" />
            </MenuItem>
          )}
          {status.active && (
            <MenuItem
              value="deactivate"
              onSelected={() => deactivateStatus()}
              isDisabled={status.internal}
            >
              <Trans message="Deactivate" />
            </MenuItem>
          )}
          <MenuItem
            value="delete"
            className="text-danger"
            onSelected={() => setDeleteDialogIsOpen(true)}
            isDisabled={status.internal}
          >
            <Trans message="Delete" />
          </MenuItem>
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}
