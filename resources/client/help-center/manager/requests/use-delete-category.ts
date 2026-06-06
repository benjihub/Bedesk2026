import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

interface Response extends BackendResponse {}

interface Payload {
  id: number | string;
}

export function useDeleteCategory() {
  return useMutation({
    mutationFn: ({id}: Payload) =>
      apiClient.delete<Response>(`hc/categories/${id}`).then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.manager.invalidateKey,
      });
      toast(message('Category deleted'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
