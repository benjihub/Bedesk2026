import {
  ConversationAttachmentListLayout,
  FileEntryAttachmentLayout,
} from '@app/dashboard/conversation-attachment-list-layout';
import {
  ConversationContentItem,
  ConversationMessage,
  PlaceholderConversationMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {FormattedMessageBody} from '@app/dashboard/conversations/conversation-page/messages/formatted-message-body';
import {ListViewDivider} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-divider';
import {ListViewEventItem} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-event-item';
import {ListViewSubmittedFormData} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-submitted-form-data';
import {MessageListItemLayout} from '@app/dashboard/conversations/conversation-page/messages/list/message-list-item-layout';
import {MessagesInfiniteScrollContainer} from '@app/dashboard/conversations/conversation-page/messages/messages-infinite-scroll-container';
import {useConversationMessages} from '@app/dashboard/conversations/conversation-page/requests/use-conversation-messages';
import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {echoStore} from '@app/dashboard/websockets/echo-store';
import {WebsocketConversationEvent} from '@app/dashboard/websockets/websocket-conversation-event';
import {TicketsPortalConversationResponse} from '@app/help-center/tickets-portal/ticket-page/conversation-response';
import {queryClient} from '@common/http/query-client';
import {Fragment, useEffect} from 'react';

interface Props {
  data: TicketsPortalConversationResponse;
}
export function ReplyList({data}: Props) {
  const query = useConversationMessages(data.conversation.id);
  const messages = query.data?.items ?? [];

  // invalidate messages query when new message is created on backend for this ticket
  useEffect(() => {
    return echoStore().listen<WebsocketConversationEvent>({
      channel: helpdeskChannel.name,
      events: [helpdeskChannel.events.conversations.newMessage],
      type: 'presence',
      callback: e => {
        if (e.conversations.every(c => c.id === data.conversation.id)) {
          queryClient.invalidateQueries({
            queryKey: helpdeskQueries.conversations.messages(
              data.conversation.id,
            ).queryKey,
          });
        }
      },
    });
  }, [data.conversation.id]);

  return (
    <MessagesInfiniteScrollContainer query={query}>
      {messages.map((message, index) => (
        <ListContentItem
          key={message.id}
          message={message}
          messages={messages}
          index={index}
        />
      ))}
    </MessagesInfiniteScrollContainer>
  );
}

interface ItemProps {
  message: ConversationContentItem;
  messages: ConversationContentItem[];
  index: number;
}
function ListContentItem({message, messages, index}: ItemProps) {
  switch (message.type) {
    case 'event':
    case 'collectDetailsForm':
      return (
        <ListViewEventItem
          key={message.id}
          message={message}
          messages={messages}
          index={index}
          variant="customer"
        />
      );
    case 'submittedFormData':
      return (
        <ListViewSubmittedFormData
          message={message}
          messages={messages}
          index={index}
        />
      );
    // won't exist in tickets, only chats
    case 'cards':
      return null;
    default:
      return (
        <MessageItem message={message} messages={messages} index={index} />
      );
  }
}

interface MessageItemProps {
  message: ConversationMessage | PlaceholderConversationMessage;
  messages: ConversationContentItem[];
  index: number;
}
function MessageItem({message, messages, index}: MessageItemProps) {
  return (
    <Fragment>
      <MessageListItemLayout message={message}>
        <FormattedMessageBody
          addParagraphSpacing={message.author === 'bot'}
          className="mr-24 text-sm"
        >
          {message.body}
        </FormattedMessageBody>
        {!!message.attachments?.length && (
          <AttachmentList attachments={message.attachments} />
        )}
      </MessageListItemLayout>
      <ListViewDivider messages={messages} index={index} />
    </Fragment>
  );
}

interface AttachmentListProps {
  attachments: ConversationAttachment[];
}
function AttachmentList({attachments}: AttachmentListProps) {
  return (
    <ConversationAttachmentListLayout className="mt-20 w-max">
      {attachments.map((attachment, index) => (
        <FileEntryAttachmentLayout
          key={attachment.id}
          attachments={attachments}
          index={index}
        />
      ))}
    </ConversationAttachmentListLayout>
  );
}
