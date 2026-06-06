import {
  ConversationContentItem,
  SubmittedFormDataMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {ListViewDivider} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-divider';
import {MessageListItemLayout} from '@app/dashboard/conversations/conversation-page/messages/list/message-list-item-layout';
import {SubmittedFormData} from '@app/dashboard/conversations/conversation-page/messages/submitted-form-data';
import {Fragment} from 'react';

interface Props {
  message: SubmittedFormDataMessage;
  messages: ConversationContentItem[];
  index: number;
  className?: string;
}
export function ListViewSubmittedFormData({
  message,
  messages,
  index,
  className,
}: Props) {
  return (
    <Fragment>
      <MessageListItemLayout message={message} className={className}>
        <SubmittedFormData
          message={message}
          className="w-max rounded-panel border p-12 text-sm"
        />
      </MessageListItemLayout>
      <ListViewDivider messages={messages} index={index} />
    </Fragment>
  );
}
