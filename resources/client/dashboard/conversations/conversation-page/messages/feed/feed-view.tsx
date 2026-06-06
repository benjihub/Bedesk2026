import {FullConversationResponse} from '@app/dashboard/conversation';
import {FeedContentItem} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-content-item';
import {isLastItemInGroup} from '@app/dashboard/conversations/conversation-page/messages/feed/is-last-item-in-group';
import {MessagesInfiniteScrollContainer} from '@app/dashboard/conversations/conversation-page/messages/messages-infinite-scroll-container';
import {useConversationMessages} from '@app/dashboard/conversations/conversation-page/requests/use-conversation-messages';

interface Props {
  data: FullConversationResponse;
}
export function FeedView({data}: Props) {
  const query = useConversationMessages(data.conversation.id);
  return (
    <div className="compact-scrollbar flex-auto overflow-y-auto px-16 py-16">
      <MessagesInfiniteScrollContainer query={query}>
        {query.data?.items.map((message, index) => (
          <FeedContentItem
            key={message.id}
            message={message}
            {...isLastItemInGroup(index, message, query.data?.items ?? [])}
          />
        ))}
      </MessagesInfiniteScrollContainer>
    </div>
  );
}
