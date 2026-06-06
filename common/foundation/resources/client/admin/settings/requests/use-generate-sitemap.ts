import {useMutation} from '@tanstack/react-query';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

interface Response extends BackendResponse {}

export function useGenerateSitemap() {
  return useMutation({
    mutationFn: () => generate(),
    onSuccess: () => {
      toast(message('Sitemap generated'));
    },
    onError: err => showHttpErrorToast(err),
  });
}

function generate(): Promise<Response> {
  return apiClient.post('sitemap/generate').then(r => r.data);
}
