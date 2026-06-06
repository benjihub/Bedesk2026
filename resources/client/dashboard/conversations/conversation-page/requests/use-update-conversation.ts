import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export interface UpdateConversationPayload {
  user_id?: number;
  subject?: string;
  attributes?: Record<string, any>;
}

export function useUpdateConversation(
  conversationId: number | string,
  form?: UseFormReturn<UpdateConversationPayload>,
) {
  return useMutation({
    mutationFn: (payload: UpdateConversationPayload) =>
      apiClient
        .put(`helpdesk/agent/conversations/${conversationId}`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
    },
    onError: err =>
      form ? onFormQueryError(err, form) : showHttpErrorToast(err),
  });
}
