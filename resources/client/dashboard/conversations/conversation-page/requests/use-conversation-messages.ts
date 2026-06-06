import {reverseConversationMessages} from '@app/dashboard/conversations/utils/reverse-conversation-messages';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useInfiniteQuery} from '@tanstack/react-query';

export function useConversationMessages(conversationId: number | string) {
  return useInfiniteQuery({
    ...helpdeskQueries.conversations.messages(conversationId),
    // @ts-ignore
    select: reverseConversationMessages,
  });
}
