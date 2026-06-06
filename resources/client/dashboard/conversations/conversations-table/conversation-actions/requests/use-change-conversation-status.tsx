import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';

interface Payload {
  conversationIds: (number | string)[];
  statusId?: number;
  statusName?: 'open' | 'closed';
}

type Options = {
  onSuccessAction?: () => Promise<unknown>;
};
export function useChangeConversationStatus({onSuccessAction}: Options = {}) {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient
        .post<BackendResponse>(
          `helpdesk/agent/conversations/status/change`,
          payload,
        )
        .then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.views.invalidateKey,
      });
      await Promise.allSettled([
        onSuccessAction?.(),
        queryClient.invalidateQueries({
          queryKey: helpdeskQueries.conversations.invalidateKey,
        }),
      ]);
    },
    onError: err => showHttpErrorToast(err),
  });
}
