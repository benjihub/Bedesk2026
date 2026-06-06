import {useMutation} from '@tanstack/react-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {NormalizedModel} from '@ui/types/normalized-model';
import {channelQueryKey} from '@common/channels/requests/use-channel';

interface Payload {
  channelId: number | string;
  item: NormalizedModel;
}

export function useRemoveFromChannel() {
  return useMutation({
    mutationFn: (payload: Payload) => removeFromChannel(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: channelQueryKey(payload.channelId),
      });
    },
    onError: r => showHttpErrorToast(r),
  });
}

function removeFromChannel({channelId, item}: Payload) {
  return apiClient
    .post(`channel/${channelId}/remove`, {
      itemId: item.id,
      itemType: item.model_type,
    })
    .then(r => r.data);
}
