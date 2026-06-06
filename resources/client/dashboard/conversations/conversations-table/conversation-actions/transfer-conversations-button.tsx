import {TransferConversationDialog} from '@app/dashboard/conversations/conversation-page/transfer-conversation-dialog/transfer-conversation-dialog';
import {ConversationActionButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/conversation-action-button';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {SupervisorAccountIcon} from '@ui/icons/material/SupervisorAccount';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {useState} from 'react';

interface Props {
  conversationIds: number[];
  onSuccess?: () => void;
  isCompact?: boolean;
}
export function TransferConversationsButton({
  conversationIds,
  onSuccess,
  isCompact,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  useKeybind('window', 'a', () => setIsOpen(true));

  return (
    <DialogTrigger type="modal" isOpen={isOpen} onOpenChange={setIsOpen}>
      <ConversationActionButton
        isCompact={isCompact}
        startIcon={<SupervisorAccountIcon />}
        endIcon={<KeyboardArrowDownIcon />}
      >
        <Trans message="Assign (a)" />
      </ConversationActionButton>
      <TransferConversationDialog
        conversationIds={conversationIds}
        onTransfer={onSuccess}
      />
    </DialogTrigger>
  );
}
