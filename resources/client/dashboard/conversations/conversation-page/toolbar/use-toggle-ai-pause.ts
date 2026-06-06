import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';

interface Payload {
  conversationIds: (number | string)[];
  pause: boolean;
}

export function useToggleAiPause() {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient
        .post<BackendResponse>(
          'helpdesk/agent/conversations/ai/pause',
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
    },
    onError: err => showHttpErrorToast(err),
  });
}
