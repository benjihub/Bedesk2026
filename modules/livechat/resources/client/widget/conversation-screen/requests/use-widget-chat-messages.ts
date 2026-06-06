import {reverseConversationMessages} from '@app/dashboard/conversations/utils/reverse-conversation-messages';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useInfiniteQuery} from '@tanstack/react-query';

export function useWidgetChatMessages(
  conversationId: number | string | undefined,
) {
  return useInfiniteQuery({
    ...widgetQueries.conversations.messages(conversationId!),
    // @ts-ignore
    select: reverseConversationMessages,
    enabled: !!conversationId,
  });
}
