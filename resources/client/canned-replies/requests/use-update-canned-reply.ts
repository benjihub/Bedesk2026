import {CannedReply} from '@app/canned-replies/canned-reply';
import {
  CreateCannedReplyPayload,
  prepareCannedReplyPayload,
} from '@app/canned-replies/requests/use-create-canned-reply';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

interface Response {
  reply: CannedReply;
}

export function useUpdateCannedReply(
  form: UseFormReturn<CreateCannedReplyPayload>,
  id: number,
) {
  return useMutation({
    mutationFn: (payload: CreateCannedReplyPayload) =>
      updateCannedReply(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.cannedReplies.invalidateKey,
      });
      toast(message('Reply updated'));
    },
    onError: err => onFormQueryError(err, form),
  });
}

function updateCannedReply(id: number, payload: CreateCannedReplyPayload) {
  return apiClient
    .put<Response>(
      `helpdesk/canned-replies/${id}`,
      prepareCannedReplyPayload(payload),
    )
    .then(r => r.data);
}
