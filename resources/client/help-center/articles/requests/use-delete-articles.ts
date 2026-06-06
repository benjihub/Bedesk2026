import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

interface Response extends BackendResponse {}

interface Payload {
  ids: (number | string)[];
}

export function useDeleteArticles() {
  return useMutation({
    mutationFn: (payload: Payload) => deleteArticle(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.articles.invalidateKey,
      });
      toast(message('Article deleted'));
    },
    onError: err => showHttpErrorToast(err),
  });
}

function deleteArticle({ids}: Payload) {
  return apiClient
    .delete<Response>(`hc/articles/${ids.join(',')}`)
    .then(r => r.data);
}
