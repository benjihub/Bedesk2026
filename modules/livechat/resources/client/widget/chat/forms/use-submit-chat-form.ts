import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useMutation} from '@tanstack/react-query';

interface SubmitChatFormPayload {
  type: string;
  values: Record<string, unknown>;
}
export function useSubmitChatForm(chatId: number | string) {
  return useMutation({
    mutationFn: (payload: SubmitChatFormPayload) => {
      return apiClient
        .post(`lc/widget/chats/${chatId}/submit-form-data`, payload)
        .then(r => r.data);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: widgetQueries.conversations.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}
