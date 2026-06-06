import {
  ActionMenuDataWithId,
  ActionMenuDialog,
} from '@app/dashboard/conversations/agent-reply-composer/action-menu-dialog';
import {ConfirmDeleteMessageDialog} from '@app/dashboard/conversations/conversation-page/messages/actions/confirm-delete-message-dialog';
import {OriginalEmailPreviewDialog} from '@app/dashboard/conversations/conversation-page/messages/actions/original-email-preview-dialog';
import {UpdateMessageDialog} from '@app/dashboard/conversations/conversation-page/messages/actions/update-message-dialog';
import {message as transMessage} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {MailSearchIcon} from '@ui/icons/lucide/mail-search-icon';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {openDialog} from '@ui/overlays/store/dialog-store';
import {useState} from 'react';
import {ConversationMessage} from '../conversation-message';

interface Props {
  message: ConversationMessage;
}
export function MessageActionsDialog({message}: Props) {
  const {close} = useDialogContext();
  const [searchTerm, setSearchTerm] = useState('');

  const actions: ActionMenuDataWithId[] = [
    {
      id: 'edit',
      title: <Trans message="Edit" />,
      startIcon: <EditIcon size="sm" />,
      onSelected: () => {
        close();
        openDialog(UpdateMessageDialog, {message});
      },
    },
    {
      id: 'showOriginal',
      title: <Trans message="Show original email" />,
      startIcon: <MailSearchIcon size="sm" />,
      onSelected: () => {
        close();
        openDialog(OriginalEmailPreviewDialog, {replyId: message.id});
      },
    },
    {
      id: 'delete',
      title: <Trans message="Delete" />,
      startIcon: <DeleteIcon size="sm" />,
      onSelected: () => {
        close();
        openDialog(ConfirmDeleteMessageDialog, {message});
      },
    },
  ].filter(action => {
    if (action.id === 'showOriginal' && message.source !== 'email') {
      return false;
    }
    if (
      searchTerm &&
      !action.title.props.message
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <ActionMenuDialog
      data={actions}
      height="h-[208px]"
      placeholder={transMessage('Search actions...')}
      query={searchTerm}
      onQueryChange={setSearchTerm}
    />
  );
}
