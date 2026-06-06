import {useMutation} from '@tanstack/react-query';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

interface Response extends BackendResponse {}

interface Props {
  id: number;
}

function deleteAccessToken({id}: Props): Promise<Response> {
  return apiClient.delete(`access-tokens/${id}`).then(r => r.data);
}

export function useDeleteAccessToken() {
  return useMutation({
    mutationFn: (props: Props) => deleteAccessToken(props),
    onSuccess: () => {
      toast(message('Token deleted'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
