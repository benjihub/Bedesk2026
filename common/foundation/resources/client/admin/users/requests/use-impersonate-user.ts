import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {User} from '@ui/types/user';

interface Response extends BackendResponse {
  user: User;
}

interface Payload {
  userId: string | number;
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (payload: Payload) => impersonateUser(payload),
    onSuccess: async response => {
      toast(message(`Impersonating user "${response.user.name}"`));
      window.location.href = '/';
    },
    onError: r => showHttpErrorToast(r),
  });
}

function impersonateUser(payload: Payload) {
  return apiClient
    .post<Response>(`admin/users/impersonate/${payload.userId}`, payload)
    .then(r => r.data);
}
