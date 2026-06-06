import {FullConversationResponse} from '@app/dashboard/conversation';
import {ListContentItem} from '@app/dashboard/conversations/conversation-page/messages/list/list-content-item';
import {MessagesInfiniteScrollContainer} from '@app/dashboard/conversations/conversation-page/messages/messages-infinite-scroll-container';
import {useConversationMessages} from '@app/dashboard/conversations/conversation-page/requests/use-conversation-messages';

interface Props {
  data: FullConversationResponse;
}
export function ListView({data: {conversation}}: Props) {
  const query = useConversationMessages(conversation.id);
  const messages = query.data?.items ?? [];

  return (
    <div className="compact-scrollbar flex-auto overflow-y-auto">
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
    </div>
  );
}
