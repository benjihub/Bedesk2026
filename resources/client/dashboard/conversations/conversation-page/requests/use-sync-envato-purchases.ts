import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

export function useSyncEnvatoPurchases() {
  return useMutation({
    mutationFn: (payload: {userId: number | string}) =>
      apiClient
        .post(`users/${payload.userId}/envato/sync-purchases`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.envato.invalidateKey,
      });
      toast(message('Imported purchases from envato'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
