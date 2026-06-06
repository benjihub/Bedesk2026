import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

interface Payload {
  ids: (number | string)[];
}

export function useDeleteConversations() {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient
        .delete<BackendResponse>(
          `helpdesk/agent/conversations/${payload.ids.join(',')}`,
        )
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.views.invalidateKey,
      });
      toast(message('Conversations deleted'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
