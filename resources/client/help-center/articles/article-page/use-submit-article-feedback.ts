import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';

interface Payload {
  wasHelpful: boolean;
  comment?: string;
}

export function useSubmitArticleFeedback(articleId: number) {
  return useMutation({
    mutationFn: (payload: Payload) => submitFeedback(articleId, payload),
    onError: err => showHttpErrorToast(err),
  });
}

function submitFeedback(articleId: number, payload: Payload) {
  return apiClient
    .post<BackendResponse>(`hc/articles/${articleId}/feedback`, payload)
    .then(r => r.data);
}
