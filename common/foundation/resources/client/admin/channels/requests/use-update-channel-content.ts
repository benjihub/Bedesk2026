import {useMutation} from '@tanstack/react-query';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {apiClient, queryClient} from '@common/http/query-client';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {NormalizedModel} from '@ui/types/normalized-model';
import {Channel, ChannelConfig} from '@common/channels/channel';
import {channelQueryKey} from '@common/channels/requests/use-channel';

interface Response extends BackendResponse {
  channel: Channel<NormalizedModel>;
}

interface Payload {
  channelConfig?: Partial<ChannelConfig>;
}

export function useUpdateChannelContent(channelId: number | string) {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: Payload) => updateChannel(channelId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: channelQueryKey(channelId),
      });
      toast(trans(message('Channel content updated')));
    },
    onError: err => showHttpErrorToast(err),
  });
}

function updateChannel(channelId: number | string, payload: Payload) {
  return apiClient
    .post<Response>(`channel/${channelId}/update-content`, {
      ...payload,
      normalizeContent: true,
    })
    .then(r => r.data);
}
