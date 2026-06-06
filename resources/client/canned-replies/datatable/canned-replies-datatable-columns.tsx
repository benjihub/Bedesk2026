import {CannedReply} from '@app/canned-replies/canned-reply';
import {useDeleteCannedReplies} from '@app/canned-replies/requests/use-delete-canned-replies';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {TableContext} from '@common/ui/tables/table-context';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useContext} from 'react';
import {Link} from 'react-router';

export const CannedRepliesDatatableColumns: ColumnConfig<CannedReply>[] = [
  {
    key: 'name',
    width: 'flex-2 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Saved reply" />,
    body: reply => <CannedReplyColumn reply={reply} />,
  },
  {
    key: 'shortcut',
    width: 'w-120 flex-shrink-0',
    header: () => <Trans message="Shortcut" />,
    body: reply => (reply.shortcut ? <span>{reply.shortcut}</span> : null),
  },
  {
    key: 'user_id',
    allowsSorting: true,
    width: 'w-180',
    header: () => <Trans message="Owner" />,
    body: reply =>
      reply.user ? (
        <NameWithAvatar
          image={reply.user.image}
          label={reply.user.name}
          avatarCircle
        />
      ) : null,
  },
  {
    key: 'shared',
    allowsSorting: true,
    width: 'w-80 flex-shrink-0',
    header: () => <Trans message="Shared" />,
    body: reply =>
      reply.shared ? (
        <CheckIcon size="md" className="text-positive" />
      ) : (
        <CloseIcon size="md" className="text-danger" />
      ),
  },
  {
    key: 'updatedAt',
    allowsSorting: true,
    width: 'w-124',
    header: () => <Trans message="Last updated" />,
    body: reply => (
      <time>
        <FormattedDate date={reply.updated_at} />
      </time>
    ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    width: 'w-84 flex-shrink-0',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    body: reply => (
      <div className="text-muted">
        <Tooltip label={<Trans message="Edit reply" />}>
          <IconButton size="md" elementType={Link} to={`${reply.id}/update`}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <DialogTrigger type="modal">
          <Tooltip label={<Trans message="Delete reply" />}>
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <DeleteCannedReplyDialog reply={reply} />
        </DialogTrigger>
      </div>
    ),
  },
];

interface CannedReplyColumnProps {
  reply: CannedReply;
}
function CannedReplyColumn({reply}: CannedReplyColumnProps) {
  const {isCollapsedMode} = useContext(TableContext);
  return (
    <div className="min-w-0">
      <div
        className={clsx(
          isCollapsedMode
            ? 'line-clamp-2'
            : 'overflow-hidden overflow-ellipsis whitespace-nowrap font-medium',
        )}
      >
        {reply.name}
      </div>
      <p className="mt-4 max-w-850 whitespace-normal text-xs text-muted">
        {reply.description}
      </p>
    </div>
  );
}

interface DeleteCannedReplyDialogProps {
  reply: CannedReply;
}
export function DeleteCannedReplyDialog({reply}: DeleteCannedReplyDialogProps) {
  const deleteReplies = useDeleteCannedReplies();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteReplies.isPending}
      title={<Trans message="Delete saved reply" />}
      body={
        <Trans message="Are you sure you want to delete this saved reply?" />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => {
        deleteReplies.mutate({ids: [reply.id]}, {onSuccess: () => close()});
      }}
    />
  );
}
