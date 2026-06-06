import {useMutation} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {invalidateTaggableTagsQuery} from '@common/tags/use-taggable-tags';

interface Payload {
  tagId: number;
  taggableIds: (number | string)[];
  taggableType: string;
}

export function useDetachTagFromTaggables() {
  return useMutation({
    mutationFn: (payload: Payload) => detachTag(payload),
    onSuccess: (_, payload) => {
      invalidateTaggableTagsQuery(payload);
    },
    onError: err => showHttpErrorToast(err),
  });
}

function detachTag(payload: Payload): Promise<BackendResponse> {
  return apiClient.post(`taggable/detach-tag`, payload).then(r => r.data);
}
