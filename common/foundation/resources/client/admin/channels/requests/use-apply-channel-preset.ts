import {useMutation} from '@tanstack/react-query';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {apiClient, queryClient} from '@common/http/query-client';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

interface Response extends BackendResponse {}

interface Payload {
  preset: string;
}

export function useApplyChannelPreset() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: Payload) => resetChannels(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey('channel'),
      });
      toast(trans(message('Channel preset applied')));
    },
    onError: err => showHttpErrorToast(err),
  });
}

function resetChannels(payload: Payload) {
  return apiClient
    .post<Response>('channel/apply-preset', payload)
    .then(r => r.data);
}
