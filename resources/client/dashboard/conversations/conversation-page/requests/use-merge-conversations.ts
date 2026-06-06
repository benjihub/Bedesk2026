import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

interface Payload {
  conversationId: number | string;
  toMerge: number[];
}

export function useMergeConversations() {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient
        .post(`helpdesk/agent/conversations/merge`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
      toast(message('Merged conversations'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
