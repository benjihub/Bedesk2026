import {MessageActionsDialog} from '@app/dashboard/conversations/conversation-page/messages/actions/message-actions-dialog';
import {FormattedMessageBody} from '@app/dashboard/conversations/conversation-page/messages/formatted-message-body';
import {ListViewDivider} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-divider';
import {ListViewEventItem} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-event-item';
import {ListViewSubmittedFormData} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-submitted-form-data';
import {MessageAttachments} from '@app/dashboard/conversations/conversation-page/messages/list/message-attachments';
import {MessageListItemLayout} from '@app/dashboard/conversations/conversation-page/messages/list/message-list-item-layout';
import {MessageButtonsPreview} from '@app/dashboard/conversations/conversation-page/messages/message-buttons-preview';
import {IconButton} from '@ui/buttons/icon-button';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Fragment} from 'react';
import {
  ConversationContentItem,
  ConversationMessage,
  PlaceholderConversationMessage,
} from '../conversation-message';

interface Props {
  message: ConversationContentItem;
  messages: ConversationContentItem[];
  index: number;
}
export function ListContentItem({message, messages, index}: Props) {
  switch (message.type) {
    case 'event':
    case 'collectDetailsForm':
    case 'cards':
      return (
        <ListViewEventItem
          className="px-24"
          message={message}
          messages={messages}
          index={index}
          variant="agent"
        />
      );
    case 'submittedFormData':
      return (
        <ListViewSubmittedFormData
          message={message}
          messages={messages}
          index={index}
          className="px-24"
        />
      );
    default:
      return (
        <MessageItem
          message={message}
          messages={messages}
          index={index}
          className="px-24"
        />
      );
  }
}

interface MessageItemProps {
  message: ConversationMessage | PlaceholderConversationMessage;
  messages: ConversationContentItem[];
  index: number;
  className?: string;
}
function MessageItem({message, messages, index, className}: MessageItemProps) {
  const isPlaceholder = 'is_placeholder' in message;
  return (
    <Fragment>
      <MessageListItemLayout
        className={className}
        message={message}
        actions={
          !isPlaceholder && (
            <DialogTrigger type="modal">
              <IconButton size="xs" iconSize="sm" className="text-muted">
                <MoreHorizIcon />
              </IconButton>
              <MessageActionsDialog message={message} />
            </DialogTrigger>
          )
        }
      >
        <FormattedMessageBody
          className="mr-24 text-sm"
          addParagraphSpacing={message.author === 'bot'}
        >
          {message.body}
        </FormattedMessageBody>
        {!!message.data?.buttons?.length && (
          <MessageButtonsPreview
            className="mt-12"
            buttons={message.data?.buttons}
          />
        )}
        <MessageAttachments
          replyId={!isPlaceholder ? message.id : undefined}
          attachments={message.attachments}
        />
      </MessageListItemLayout>
      <ListViewDivider messages={messages} index={index} />
    </Fragment>
  );
}
