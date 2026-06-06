import {BackendResponse} from '@common/http/backend-response/backend-response';
import {useMutation} from '@tanstack/react-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {NormalizedModel} from '@ui/types/normalized-model';
import {channelQueryKey} from '@common/channels/requests/use-channel';

interface Response extends BackendResponse {}

interface Payload {
  channelId: number | string;
  item: NormalizedModel;
}

export function useAddToChannel() {
  return useMutation({
    mutationFn: (payload: Payload) => addToChannel(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: channelQueryKey(payload.channelId),
      });
    },
    onError: r => showHttpErrorToast(r),
  });
}

function addToChannel({channelId, item}: Payload): Promise<Response> {
  return apiClient
    .post(`channel/${channelId}/add`, {
      itemId: item.id,
      itemType: item.model_type,
    })
    .then(r => r.data);
}
