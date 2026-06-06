import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {ConversationMessage} from '../messages/conversation-message';

interface Payload {
  messageId: number | string;
  body?: string | null;
  attachments?: number[];
}

export function useUpdateMessage() {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient
        .put<{
          message: ConversationMessage;
        }>(`helpdesk/agent/messages/${payload.messageId}`, payload)
        .then(r => r.data),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.messages(
          response.message.conversation_id,
        ).queryKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}
