// We will fetch more messages when scrolling to the top, so we need to reverse the

import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {CursorPaginationResponse} from '@common/http/backend-response/pagination-response';
import {InfiniteData} from '@tanstack/react-query';

// order of pages and params, otherwise newly fetched pages would be added to the end
export function reverseConversationMessages(
  data: InfiniteData<{
    pagination: CursorPaginationResponse<ConversationContentItem>;
  }>,
) {
  const reversedData = [...data.pages].reverse();
  return {
    ...data,
    pages: reversedData,
    pageParams: [...data.pageParams].reverse(),
    items: reversedData.flatMap(p => p.pagination.data) || [],
  };
}
