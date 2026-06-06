import {useMutation} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {NormalizedModel} from '@ui/types/normalized-model';
import {Channel} from '@common/channels/channel';

interface Response extends BackendResponse {
  channel: Channel<NormalizedModel>;
}

interface Payload {
  channelId: number | string;
  modelType: string;
  ids: (number | string)[];
}

export function useReorderChannelContent() {
  return useMutation({
    mutationFn: (payload: Payload) => reorderContent(payload),
    onError: err => showHttpErrorToast(err),
  });
}

function reorderContent({channelId, ids, modelType}: Payload) {
  return apiClient
    .post<Response>(`channel/${channelId}/reorder-content`, {
      modelType,
      ids,
    })
    .then(r => r.data);
}
