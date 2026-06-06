import {ConversationActionButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/conversation-action-button';
import {useDeleteConversations} from '@app/dashboard/conversations/conversations-table/conversation-actions/requests/use-delete-conversations';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {useState} from 'react';

interface Props {
  conversationIds: number[];
  onSuccess?: () => void;
  isCompact?: boolean;
}
export function DeleteConversationsButton({
  conversationIds,
  onSuccess,
  isCompact,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  useKeybind('window', 'd', () => setIsOpen(true));

  return (
    <DialogTrigger type="modal" isOpen={isOpen} onOpenChange={setIsOpen}>
      <ConversationActionButton
        startIcon={<DeleteIcon />}
        color="danger"
        isCompact={isCompact}
      >
        <Trans message="Delete (d)" />
      </ConversationActionButton>
      <DeleteConversationsDialog
        conversationIds={conversationIds}
        onDeleted={onSuccess}
      />
    </DialogTrigger>
  );
}

interface DeleteConversationsButtonProps {
  conversationIds: number[];
  onDeleted?: () => void;
}
function DeleteConversationsDialog({
  conversationIds,
  onDeleted,
}: DeleteConversationsButtonProps) {
  const deleteConversations = useDeleteConversations();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteConversations.isPending}
      onConfirm={() => {
        deleteConversations.mutate(
          {ids: conversationIds},
          {
            onSuccess: () => {
              close();
              onDeleted?.();
            },
          },
        );
      }}
      title={<Trans message="Delete conversations" />}
      body={
        <Trans message="Are you sure you want to delete selected conversations?" />
      }
      confirm={<Trans message="delete" />}
    />
  );
}
