import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {
  EMPTY_PAGINATION_RESPONSE,
  PaginatedBackendResponse,
} from '@common/http/backend-response/pagination-response';
import {queryClient} from '@common/http/query-client';
import {InfiniteData} from '@tanstack/react-query';

export function updateDashboardMessagesQueryData(
  queryKey: unknown[],
  callback: (oldData: ConversationContentItem[]) => ConversationContentItem[],
) {
  queryClient.setQueryData<
    InfiniteData<PaginatedBackendResponse<ConversationContentItem>>
  >(queryKey, old => {
    if (!old) {
      old = {
        pages: [EMPTY_PAGINATION_RESPONSE],
        pageParams: [],
      };
    }

    const oldPages = old.pages;
    const oldData = oldPages[0].pagination.data;

    const newData = callback(oldData);

    const newPages = [...oldPages];
    newPages[0] = {
      ...oldPages[0],
      pagination: {
        ...oldPages[0].pagination,
        data: [...newData],
      },
    };

    return {
      ...old,
      pages: newPages,
    };
  });
}
