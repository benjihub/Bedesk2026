import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';

interface Payload {
  ids: number[];
}

export function useDeleteCannedReplies() {
  return useMutation({
    mutationFn: (payload: Payload) => deleteReplies(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.cannedReplies.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}

function deleteReplies(payload: Payload) {
  return apiClient
    .delete(`helpdesk/canned-replies/${payload.ids.join(',')}`)
    .then(r => r.data);
}
