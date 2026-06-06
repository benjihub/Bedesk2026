import {useMutation} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {Tag} from '@common/tags/tag';
import {invalidateTaggableTagsQuery} from '@common/tags/use-taggable-tags';

interface Response extends BackendResponse {
  tag: Tag;
}

interface Payload {
  tagName: string;
  tagType?: string;
  taggableIds: number[];
  taggableType: string;
  userId?: number;
}

export function useAttachTagToTaggables() {
  return useMutation({
    mutationFn: (payload: Payload) => attachTag(payload),
    onSuccess: async (_, payload) => {
      invalidateTaggableTagsQuery(payload);
    },
    onError: err => showHttpErrorToast(err),
  });
}

function attachTag(payload: Payload): Promise<Response> {
  return apiClient.post(`taggable/attach-tag`, payload).then(r => r.data);
}
