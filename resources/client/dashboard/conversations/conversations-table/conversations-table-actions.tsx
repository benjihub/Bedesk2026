import {AddTagToConversationsButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/add-tag-to-conversations-button';
import {ChangeStatusButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/change-status-button';
import {DeleteConversationsButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/delete-conversations-button';
import {TransferConversationsButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/transfer-conversations-button';
import clsx from 'clsx';

interface Props {
  conversationIds: number[];
  onActionCompleted: () => void;
  className?: string;
}
export function ConversationsTableActions({
  conversationIds,
  onActionCompleted,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        'flex w-max items-center justify-center gap-12',
        className,
      )}
    >
      <TransferConversationsButton
        conversationIds={conversationIds}
        onSuccess={onActionCompleted}
      />
      <ChangeStatusButton
        conversationIds={conversationIds}
        onSuccess={onActionCompleted}
      />
      <AddTagToConversationsButton
        conversationIds={conversationIds}
        onSuccess={onActionCompleted}
      />
      <DeleteConversationsButton
        conversationIds={conversationIds}
        onSuccess={onActionCompleted}
      />
    </div>
  );
}
