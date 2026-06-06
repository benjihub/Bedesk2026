import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

interface Payload {
  conversationIds: (number | string)[];
  userId: number | string;
  shouldSummarize?: boolean;
  privateNote?: string;
}

export function useTransferConversationsToAgent() {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient
        .post<BackendResponse>(
          `helpdesk/agent/conversations/assignee/change`,
          payload,
        )
        .then(r => r.data),
    onSuccess: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: helpdeskQueries.views.invalidateKey,
        }),
        queryClient.invalidateQueries({
          queryKey: helpdeskQueries.conversations.invalidateKey,
        }),
      ]);
      toast(message('Tickets reassigned'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
