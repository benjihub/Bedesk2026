import {useMutation} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {ConversationSummary} from './conversation-summary';

interface Payload {
  conversationId: number | string;
}

export function useGenerateConversationSummary() {
  return useMutation({
    mutationFn: ({conversationId}: Payload) =>
      apiClient
        .post<{
          summary: ConversationSummary;
        }>(`helpdesk/conversations/${conversationId}/summary/generate`)
        .then(r => r.data),
    onError: err => showHttpErrorToast(err),
  });
}
