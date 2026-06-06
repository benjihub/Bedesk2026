import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';

interface Payload {
  conversationIds: number[];
  groupId: number;
  shouldSummarize?: boolean;
  privateNote?: string;
}

export function useTransferConversationsToGroup() {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient
        .post(`helpdesk/agent/conversations/group/change`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      return await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}
